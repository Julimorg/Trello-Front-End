import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Button, Card, Col, Descriptions, Empty, Flex, Progress, Result, Row, Space, Statistic, Table, Tag, Timeline, Typography } from 'antd'
import { ArrowLeftOutlined, EnvironmentOutlined } from '@ant-design/icons'
import PatientInfoCard from '../nurse/PatientInfoCard'
import { usePageCrumbs } from '../../components/crumbs'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listNursesByHospital } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL } from '../../lib/constants'
import { formatDuration } from '../booking/booking-shared'
import { frequencyText, sessionWork } from '../nurse/nurse-shared'
import { SESSION_META, SHIFT_PATH, dayPhase, minutesOf } from './dispatch-utils'
import { SOS_STATUS_META } from './admin-shared'

const { Text, Title } = Typography

const STATUS_COLOR = {
  created: 'default',
  matching: 'processing',
  matched: 'blue',
  nurse_pending: 'gold',
  no_match: 'orange',
  cancelled: 'default',
  completed: 'green',
}

// Everything about one care request: what was asked, who was matched, the visit schedule, and what happened.
export default function HospitalRequestDetail() {
  const { id } = useParams()
  const { session: auth } = useAuth()
  const state = useDb()
  const request = getCareRequest(state, id)
  const hospitalNurseIds = new Set(listNursesByHospital(state, auth.id).map((n) => n.id))
  const booking = request ? state.bookings.find((b) => b.careRequestId === request.id || b.id === request.bookingId) : null
  const related =
    request &&
    (request.createdBy === 'hospital' ||
      request.matchedNurseIds.some((n) => hospitalNurseIds.has(n)) ||
      (request.selectedNurseId && hospitalNurseIds.has(request.selectedNurseId)) ||
      booking?.sessions.some((s) => hospitalNurseIds.has(s.nurseId)))

  usePageCrumbs(related ? [{ label: `Yêu cầu #${request.id}` }] : [])

  if (!related) {
    return (
      <Result
        status="404"
        title="Không tìm thấy yêu cầu"
        subTitle="Yêu cầu không tồn tại hoặc không liên quan tới bệnh viện."
        extra={
          <Link to="/hospital/admin/dispatch">
            <Button type="primary">Về điều phối lịch</Button>
          </Link>
        }
      />
    )
  }

  const patient = getPatient(state, request.patientId)
  const nurseName = (nurseId) => getNurse(state, nurseId)?.name || 'Điều dưỡng'
  const sessions = booking ? [...booking.sessions].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)) : []
  const cancelledSessions = booking?.cancelledSessions || []
  const today = dayjs().format('YYYY-MM-DD')
  const isDone = (s) => s.status === 'completed' || (s.status === 'reassigned' && s.date < today)
  const done = sessions.filter(isDone).length
  const percent = sessions.length ? Math.round((done / sessions.length) * 100) : 0
  const totalMinutes = sessions.reduce((sum, s) => sum + minutesOf(s), 0)
  const handovers = sessions.reduce((sum, s) => sum + (s.history?.length || 0), 0)
  const sos = booking ? state.sosEvents.filter((e) => e.bookingId === booking.id) : []
  const next = sessions.find((s) => s.date >= today && !isDone(s) && s.status !== 'cannot_perform')

  // Newest replacement nurses (sessions handed over to someone else).
  const replacements = [...new Set(sessions.filter((s) => s.status === 'reassigned' && s.nurseId !== s.history?.[s.history.length - 1]?.nurseId).map((s) => s.nurseId))]

  const events = [
    {
      at: request.createdAt,
      color: 'gray',
      text: request.createdBy === 'hospital' ? 'Bệnh viện tạo yêu cầu thay bệnh nhân' : 'Bệnh nhân tạo yêu cầu chăm sóc',
    },
    ...(request.matchedNurseIds.length
      ? [
          {
            at: request.lastMatchedAt || request.createdAt,
            color: 'blue',
            text: `Hệ thống gợi ý ${request.matchedNurseIds.length} điều dưỡng: ${request.matchedNurseIds.map(nurseName).join(', ')}`,
          },
        ]
      : []),
    ...(request.selectedNurseId
      ? [
          {
            at: request.selectedAt || request.createdAt,
            color: 'gold',
            text: `Gửi yêu cầu tới ${nurseName(request.selectedNurseId)}`,
          },
        ]
      : []),
    ...(request.declineReasons || []).map((d) => ({
      at: d.at,
      color: 'red',
      text: `${nurseName(d.nurseId)} từ chối${d.reason ? ` · ${d.reason}` : ''}`,
    })),
    ...(booking
      ? [
          {
            at: booking.createdAt,
            color: 'green',
            text: `${nurseName(booking.nurseId)} nhận ca · lịch ${sessions.length + cancelledSessions.length} buổi được tạo`,
          },
        ]
      : []),
    ...sessions.flatMap((s) =>
      (s.history || []).map((h) => ({
        at: h.reportedAt,
        color: 'red',
        text: `${nurseName(h.nurseId)} báo không thể thực hiện buổi ${formatDate(s.date)}${h.reason ? ` · ${h.reason}` : ''}`,
      })),
    ),
    ...cancelledSessions.map((c) => ({
      at: c.cancelledAt,
      color: 'orange',
      text: `Bệnh nhân hủy buổi ${formatDate(c.date)} (${c.start}–${c.end})${c.reason ? ` · ${c.reason}` : ''}`,
    })),
    ...sos.map((e) => ({
      at: e.createdAt,
      color: 'red',
      text: `Cảnh báo SOS${e.note ? ` · ${e.note}` : ''}`,
    })),
    ...(done > 0 && done === sessions.length
      ? [
          {
            at: sessions[sessions.length - 1].completedAt || `${sessions[sessions.length - 1].date}T${sessions[sessions.length - 1].end}:00`,
            color: 'green',
            text: 'Hoàn thành toàn bộ liệu trình',
          },
        ]
      : []),
    ...(request.cancelledAt ? [{ at: request.cancelledAt, color: 'red', text: 'Yêu cầu đã bị hủy' }] : []),
  ].sort((a, b) => (a.at || '').localeCompare(b.at || ''))

  const sessionColumns = [
    { title: '#', key: 'n', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Ngày', key: 'date', render: (_, s) => `${formatDate(s.date)}` },
    { title: 'Giờ', key: 'time', render: (_, s) => `${s.start}–${s.end}` },
    {
      title: 'Điều dưỡng',
      key: 'nurse',
      render: (_, s) => <Link to={`/hospital/admin/roster/${s.nurseId}`}>{nurseName(s.nurseId)}</Link>,
    },
    {
      title: 'Công việc',
      key: 'work',
      render: (_, s) => {
        const w = sessionWork(s, request.careType)
        return <Progress percent={w.percent} size="small" style={{ minWidth: 90 }} strokeColor="#0b6b68" />
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, s) => (
        <Tag color={SESSION_META[s.status]?.color} style={{ marginInlineEnd: 0 }}>
          {SESSION_META[s.status]?.label}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'go',
      align: 'right',
      render: (_, s) => (
        <Link to={SHIFT_PATH(s.id)}>
          <Button size="small">Chi tiết</Button>
        </Link>
      ),
    },
  ]

  return (
    <>
      <Link to="/hospital/admin/dispatch" className="back-link">
        <ArrowLeftOutlined /> Yêu cầu & điều phối lịch
      </Link>

      <Card className="session-hero">
        <Flex justify="space-between" align="flex-start" gap={16} wrap>
          <div style={{ flex: '1 1 320px' }}>
            <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
              YÊU CẦU CHĂM SÓC · #{request.id}
            </Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              {careTypeLabel(request.careType)} · {patient?.name}
            </Title>
            <Space size={6} wrap>
              <Tag color={STATUS_COLOR[request.status]}>{CARE_REQUEST_STATUS_LABEL[request.status]?.label || request.status}</Tag>
              <Tag color={request.createdBy === 'hospital' ? 'purple' : undefined}>{request.createdBy === 'hospital' ? 'Bệnh viện tạo thay' : 'Bệnh nhân tạo'}</Tag>
              <Text type="secondary">
                Tạo {formatDateTime(request.createdAt)} ({dayjs(request.createdAt).fromNow()})
              </Text>
            </Space>
          </div>
          {next && (
            <Link to={SHIFT_PATH(next.id)} className="session-when" style={{ color: 'inherit' }}>
              <div>
                <span>Buổi tiếp theo · {dayPhase(next.date).label}</span>
                <b>
                  {formatDate(next.date)} · {next.start}–{next.end}
                </b>
                <span>{nurseName(next.nurseId)}</span>
              </div>
            </Link>
          )}
        </Flex>
        <Flex className="session-address" align="center" gap={10} wrap>
          <Text>
            <EnvironmentOutlined /> {patient?.address} {request.district ? `· ${request.district}` : ''}
          </Text>
        </Flex>
        {request.status === 'cancelled' && (
          <Alert
            style={{ marginTop: 14 }}
            type="warning"
            showIcon
            title="Yêu cầu đã bị hủy"
            description={request.cancelledAt ? `Hủy lúc ${formatDateTime(request.cancelledAt)}` : undefined}
          />
        )}
        {request.status === 'no_match' && <Alert style={{ marginTop: 14 }} type="warning" showIcon title="Chưa có điều dưỡng nhận — bệnh nhân đang chọn người thay thế" />}
      </Card>

      <div className="dispatch-kpis" style={{ marginTop: 16 }}>
        <Card size="small">
          <Statistic title="Buổi đã hoàn thành" value={done} suffix={`/ ${sessions.length}`} />
        </Card>
        <Card size="small">
          <Statistic title="Tiến độ liệu trình" value={percent} suffix="%" />
        </Card>
        <Card size="small">
          <Statistic title="Tổng thời lượng" value={sessions.length ? formatDuration(totalMinutes) : '—'} styles={{ content: { fontSize: 22 } }} />
        </Card>
        <Card size="small" className={handovers || cancelledSessions.length ? 'is-warn' : undefined}>
          <Statistic title="Đổi điều dưỡng / buổi hủy" value={`${handovers} / ${cancelledSessions.length}`} styles={{ content: { fontSize: 22 } }} />
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card title="Nội dung yêu cầu">
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'care',
                  label: 'Loại chăm sóc',
                  children: careTypeLabel(request.careType),
                },
                {
                  key: 'freq',
                  label: 'Tần suất',
                  children: frequencyText(request),
                },
                {
                  key: 'start',
                  label: 'Bắt đầu từ',
                  children: formatDate(request.desiredStartDate),
                },
                {
                  key: 'slot',
                  label: 'Khung giờ',
                  children: request.timeSlot ? `${request.timeSlot.start}–${request.timeSlot.end}` : '—',
                },
                {
                  key: 'district',
                  label: 'Khu vực',
                  children: request.district,
                },
                {
                  key: 'by',
                  label: 'Người tạo',
                  children: request.createdBy === 'hospital' ? 'Bệnh viện' : 'Bệnh nhân',
                },
                {
                  key: 'notes',
                  label: 'Ghi chú',
                  span: 'filled',
                  children: request.notes || 'Không có ghi chú.',
                },
                ...(request.attachments?.length
                  ? [
                      {
                        key: 'att',
                        label: 'Đính kèm',
                        span: 'filled',
                        children: request.attachments.join(', '),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>

          <Card title={`Lịch chăm sóc (${sessions.length} buổi)`} style={{ marginTop: 16 }} styles={{ body: { padding: 0 } }}>
            {sessions.length === 0 ? (
              <div style={{ padding: 24 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch — yêu cầu chưa được điều dưỡng nhận" />
              </div>
            ) : (
              <Table
                rowKey="id"
                size="small"
                className="nowrap-table"
                columns={sessionColumns}
                dataSource={sessions}
                pagination={sessions.length > 10 ? { pageSize: 10, size: 'small', showSizeChanger: false } : false}
                scroll={{ x: 760 }}
              />
            )}
          </Card>

          {cancelledSessions.length > 0 && (
            <Card title={`Buổi đã hủy (${cancelledSessions.length})`} style={{ marginTop: 16 }} styles={{ body: { padding: 0 } }}>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={cancelledSessions}
                scroll={{ x: 560 }}
                columns={[
                  {
                    title: 'Ngày',
                    key: 'd',
                    render: (_, c) => formatDate(c.date),
                  },
                  {
                    title: 'Giờ',
                    key: 't',
                    render: (_, c) => `${c.start}–${c.end}`,
                  },
                  {
                    title: 'Điều dưỡng',
                    key: 'n',
                    render: (_, c) => nurseName(c.nurseId),
                  },
                  {
                    title: 'Hủy lúc',
                    key: 'a',
                    render: (_, c) => formatDateTime(c.cancelledAt),
                  },
                  {
                    title: 'Lý do',
                    key: 'r',
                    render: (_, c) => c.reason || '—',
                  },
                ]}
              />
            </Card>
          )}

          <Card title="Diễn biến" style={{ marginTop: 16 }}>
            <Timeline
              items={events.map((e, i) => ({
                key: i,
                color: e.color,
                content: (
                  <div>
                    {e.text}
                    {e.at && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(e.at)}
                        </Text>
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <PatientInfoCard patient={patient} />

          <Card title="Điều dưỡng" style={{ marginTop: 16 }}>
            <Descriptions
              size="small"
              column={1}
              items={[
                {
                  key: 'sel',
                  label: 'Điều dưỡng được chọn',
                  children: request.selectedNurseId ? <Link to={`/hospital/admin/roster/${request.selectedNurseId}`}>{nurseName(request.selectedNurseId)}</Link> : '—',
                },
                {
                  key: 'new',
                  label: 'Điều dưỡng mới (thay)',
                  children: replacements.length ? (
                    <Flex gap={4} wrap>
                      {replacements.map((n) => (
                        <Link key={n} to={`/hospital/admin/roster/${n}`}>
                          <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                            {nurseName(n)}
                          </Tag>
                        </Link>
                      ))}
                    </Flex>
                  ) : (
                    '—'
                  ),
                },
              ]}
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', margin: '12px 0 6px' }}>
              Điều dưỡng được gợi ý
            </Text>
            {request.matchedNurseIds.length === 0 ? (
              <Text type="secondary">Chưa có gợi ý.</Text>
            ) : (
              <Flex vertical gap={6}>
                {request.matchedNurseIds.map((nId) => {
                  const declined = request.declineReasons?.find((d) => d.nurseId === nId)
                  const chosen = request.selectedNurseId === nId
                  return (
                    <Flex key={nId} justify="space-between" align="center" gap={8}>
                      <Link to={`/hospital/admin/roster/${nId}`}>{nurseName(nId)}</Link>
                      {declined ? (
                        <Tag color="red" style={{ marginInlineEnd: 0 }} title={declined.reason}>
                          Từ chối
                        </Tag>
                      ) : chosen ? (
                        <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                          Được chọn
                        </Tag>
                      ) : (
                        <Tag style={{ marginInlineEnd: 0 }}>Gợi ý</Tag>
                      )}
                    </Flex>
                  )
                })}
              </Flex>
            )}
          </Card>

          {sos.length > 0 && (
            <Card title="Cảnh báo SOS" style={{ marginTop: 16 }}>
              <Flex vertical gap={8}>
                {sos.map((e) => (
                  <Link key={e.id} to={`/hospital/admin/sos-log?id=${e.id}`} className="attention-link">
                    <span>
                      <b>{formatDateTime(e.createdAt)}</b>
                      <small>{e.note || 'Không có ghi chú'}</small>
                    </span>
                    <Tag color={SOS_STATUS_META[e.status || 'open'].color}>{SOS_STATUS_META[e.status || 'open'].label}</Tag>
                  </Link>
                ))}
              </Flex>
            </Card>
          )}
        </Col>
      </Row>
    </>
  )
}
