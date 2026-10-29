import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Avatar, Button, Card, Col, Descriptions, Empty, Flex, Progress, Result, Row, Space, Statistic, Tag, Timeline, Typography } from 'antd'
import { ArrowLeftOutlined, CalendarOutlined, EnvironmentOutlined, FileTextOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import PatientInfoCard from '../nurse/PatientInfoCard'
import { usePageCrumbs } from '../../components/crumbs'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { findSession, getCareRequest, getHospital, getNurse, getPatient, listNursesByHospital } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { VITAL_METRICS, formatDuration, inRange } from '../booking/booking-shared'
import { sessionWork } from '../nurse/nurse-shared'
import { REQUEST_PATH, SESSION_META, SHIFT_PATH, WEEKDAY_LONG, dayPhase, minutesOf } from './dispatch-utils'
import { SOS_STATUS_META, initials } from './admin-shared'

const { Text, Title, Paragraph } = Typography

// Read-only, everything-in-one-place view of a single visit for the hospital coordinator.
export default function HospitalShiftDetail() {
  const { sessionId } = useParams()
  const { session: auth } = useAuth()
  const state = useDb()
  const found = findSession(state, sessionId)
  const hospitalNurseIds = new Set(listNursesByHospital(state, auth.id).map((n) => n.id))
  const involved = found ? [found.session.nurseId, ...(found.session.history || []).map((h) => h.nurseId)] : []
  const allowed = found && involved.some((id) => hospitalNurseIds.has(id))

  usePageCrumbs(
    allowed
      ? [
          {
            label: `Ca ${formatDate(found.session.date)} · ${found.session.start}`,
          },
        ]
      : [],
  )

  if (!allowed) {
    return (
      <Result
        status="404"
        title="Không tìm thấy ca chăm sóc"
        subTitle="Ca không tồn tại hoặc không thuộc điều dưỡng của bệnh viện."
        extra={
          <Link to="/hospital/admin/dispatch">
            <Button type="primary">Về điều phối lịch</Button>
          </Link>
        }
      />
    )
  }

  const { booking, session } = found
  const patient = getPatient(state, booking.patientId)
  const careRequest = getCareRequest(state, booking.careRequestId)
  const nurse = getNurse(state, session.nurseId)
  const hospital = getHospital(state, nurse?.hospitalId)
  const date = dayjs(session.date)
  const meta = SESSION_META[session.status] || SESSION_META.confirmed
  const phase = dayPhase(session.date)
  const duration = minutesOf(session)
  const sessions = [...booking.sessions].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const index = sessions.findIndex((s) => s.id === session.id)
  const prev = sessions[index - 1]
  const next = sessions[index + 1]
  const work = sessionWork(session, careRequest?.careType)
  const obs = session.observation
  const sos = state.sosEvents.filter((e) => e.sessionId === session.id)
  const cancelled = careRequest?.status === 'cancelled'

  const vitalRows = obs ? VITAL_METRICS.map((m) => ({ metric: m, value: m.get(obs) })).filter((r) => r.value !== undefined && r.value !== null) : []
  const history = (session.history || []).map((h) => ({
    ...h,
    nurse: getNurse(state, h.nurseId),
  }))

  return (
    <>
      <Link to="/hospital/admin/dispatch" className="back-link">
        <ArrowLeftOutlined /> Yêu cầu & điều phối lịch
      </Link>

      <Card className="session-hero">
        <Flex justify="space-between" align="flex-start" gap={16} wrap>
          <div style={{ flex: '1 1 320px' }}>
            <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
              CA CHĂM SÓC · BUỔI {index + 1}/{sessions.length}
            </Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              {careTypeLabel(careRequest?.careType)} · {patient?.name}
            </Title>
            <Space size={6} wrap>
              <Tag color={meta.color}>{meta.label}</Tag>
              <Tag color={phase.color}>{phase.label}</Tag>
              {careRequest && (
                <Link to={REQUEST_PATH(careRequest.id)}>
                  <Tag icon={<FileTextOutlined />}>Yêu cầu #{careRequest.id}</Tag>
                </Link>
              )}
              <Tag>Lịch {booking.id}</Tag>
            </Space>
          </div>
          <div className="session-when">
            <CalendarOutlined />
            <div>
              <b>
                {WEEKDAY_LONG[date.day()]}, {date.format('DD/MM/YYYY')}
              </b>
              <span>
                {session.start} – {session.end} · {formatDuration(duration)}
              </span>
            </div>
          </div>
        </Flex>
        <Flex className="session-address" justify="space-between" align="center" gap={10} wrap>
          <Text>
            <EnvironmentOutlined /> {patient?.address}
          </Text>
          <Space wrap>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient?.address || '')}`} target="_blank" rel="noreferrer">
              <Button icon={<EnvironmentOutlined />}>Mở bản đồ</Button>
            </a>
            <Link to={prev ? SHIFT_PATH(prev.id) : '#'} aria-disabled={!prev}>
              <Button icon={<LeftOutlined />} disabled={!prev}>
                Buổi trước
              </Button>
            </Link>
            <Link to={next ? SHIFT_PATH(next.id) : '#'} aria-disabled={!next}>
              <Button iconPlacement="end" icon={<RightOutlined />} disabled={!next}>
                Buổi sau
              </Button>
            </Link>
          </Space>
        </Flex>
        {session.needsManualReassignment && (
          <Alert
            style={{ marginTop: 14 }}
            type="error"
            showIcon
            title="Buổi này chưa có điều dưỡng thực hiện"
            description={history.length ? `Lý do: ${history[history.length - 1].reason}` : undefined}
            action={
              <Link to="/hospital/admin/dispatch#reassign-panel">
                <Button size="small" danger>
                  Chọn người thay
                </Button>
              </Link>
            }
          />
        )}
        {cancelled && <Alert style={{ marginTop: 14 }} type="warning" showIcon title="Bệnh nhân đã hủy yêu cầu chăm sóc này" />}
        {sos.length > 0 && (
          <Alert
            style={{ marginTop: 14 }}
            type="error"
            showIcon
            title={`${sos.length} cảnh báo SOS trong ca này`}
            action={
              <Link to={`/hospital/admin/sos-log?id=${sos[0].id}`}>
                <Button size="small" danger>
                  Xem SOS
                </Button>
              </Link>
            }
          />
        )}
      </Card>

      <div className="dispatch-kpis" style={{ marginTop: 16 }}>
        <Card size="small">
          <Statistic title="Tiến độ công việc" value={work.percent} suffix="%" />
        </Card>
        <Card size="small">
          <Statistic title="Công việc đã làm" value={work.done.length} suffix={`/ ${work.tasks.length}`} />
        </Card>
        <Card size="small">
          <Statistic title="Chỉ số ghi nhận" value={vitalRows.length} suffix="chỉ số" />
        </Card>
        <Card size="small">
          <Statistic title="Hoàn thành lúc" value={session.completedAt ? dayjs(session.completedAt).format('HH:mm DD/MM') : session.status === 'completed' ? 'Đã hoàn thành' : '—'} styles={{ content: { fontSize: 20 } }} />
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            title="Công việc trong buổi"
            extra={
              <Text type="secondary">
                {work.done.length}/{work.tasks.length} việc
              </Text>
            }
          >
            <Progress percent={work.percent} strokeColor="#0b6b68" style={{ marginBottom: 12 }} />
            <div className="task-list">
              {work.tasks.map((t) => {
                const done = work.done.includes(t.id)
                return (
                  <div key={t.id} className={`task-item is-readonly${done ? ' is-done' : ''}`}>
                    <span className="task-text">
                      <b>{t.label}</b>
                      {t.hint && <small>{t.hint}</small>}
                    </span>
                    <Tag color={done ? 'green' : 'default'}>{done ? 'Đã làm' : 'Chưa làm'}</Tag>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card title="Chỉ số & theo dõi" style={{ marginTop: 16 }}>
            {!obs ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={session.date > dayjs().format('YYYY-MM-DD') ? 'Chưa đến ngày thực hiện' : 'Chưa ghi nhận chỉ số cho buổi này'}
              />
            ) : (
              <>
                {vitalRows.length > 0 && (
                  <Descriptions
                    size="small"
                    bordered
                    column={{ xs: 1, sm: 2 }}
                    items={vitalRows.map(({ metric, value }) => ({
                      key: metric.key,
                      label: metric.label,
                      children: (
                        <Space size={6}>
                          <b>
                            {value} {metric.unit}
                          </b>
                          {metric.normal && <Tag color={inRange(metric, value) ? 'green' : 'orange'}>{inRange(metric, value) ? 'Bình thường' : 'Ngoài ngưỡng'}</Tag>}
                        </Space>
                      ),
                    }))}
                  />
                )}
                {obs.extras?.length > 0 && (
                  <Descriptions
                    size="small"
                    bordered
                    column={{ xs: 1, sm: 2 }}
                    style={{ marginTop: 12 }}
                    items={obs.extras.map((e, i) => ({
                      key: i,
                      label: e.label,
                      children: e.value,
                    }))}
                  />
                )}
                {obs.summary && (
                  <>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 14 }}>
                      Nhận định của điều dưỡng
                    </Text>
                    <Paragraph style={{ marginTop: 4 }}>{obs.summary}</Paragraph>
                  </>
                )}
              </>
            )}
          </Card>

          <Card title="Ghi chú" style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Yêu cầu từ bệnh nhân
            </Text>
            <Paragraph style={{ marginTop: 4 }}>{careRequest?.notes || 'Không có ghi chú.'}</Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Ghi chú của điều dưỡng
            </Text>
            <Paragraph style={{ marginTop: 4, marginBottom: 0 }} type={session.nurseNote ? undefined : 'secondary'}>
              {session.nurseNote || 'Chưa có ghi chú.'}
            </Paragraph>
          </Card>

          <Card title="Lịch sử điều dưỡng của buổi" style={{ marginTop: 16 }}>
            <Timeline
              items={[
                ...history.map((h, i) => ({
                  key: `h${i}`,
                  color: 'red',
                  content: (
                    <div>
                      <b>{h.nurse?.name || 'Điều dưỡng'}</b> báo không thể thực hiện
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(h.reportedAt)}
                          {h.reason ? ` · ${h.reason}` : ''}
                        </Text>
                      </div>
                    </div>
                  ),
                })),
                {
                  key: 'now',
                  color: session.needsManualReassignment ? 'gray' : 'green',
                  content: session.needsManualReassignment ? (
                    'Đang chờ bệnh viện chọn điều dưỡng thay thế'
                  ) : (
                    <div>
                      {history.length ? 'Giao cho ' : 'Điều dưỡng phụ trách: '}
                      <b>{nurse?.name}</b>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title="Điều dưỡng phụ trách">
            {nurse ? (
              <>
                <Flex gap={12} align="center" style={{ marginBottom: 12 }}>
                  <Avatar
                    size={48}
                    style={{
                      background: '#e7f5f2',
                      color: '#0b6b68',
                      fontWeight: 800,
                    }}
                  >
                    {initials(nurse.name)}
                  </Avatar>
                  <div>
                    <Link to={`/hospital/admin/roster/${nurse.id}`}>
                      <Text strong style={{ fontSize: 16 }}>
                        {nurse.name}
                      </Text>
                    </Link>
                    <div>
                      <Text type="secondary">
                        {nurse.rank} · {hospital?.name}
                      </Text>
                    </div>
                  </div>
                </Flex>
                <Descriptions
                  size="small"
                  column={1}
                  items={[
                    {
                      key: 'phone',
                      label: 'Điện thoại',
                      children: nurse.phone,
                    },
                    {
                      key: 'exp',
                      label: 'Kinh nghiệm',
                      children: `${nurse.experienceYears} năm`,
                    },
                    {
                      key: 'spec',
                      label: 'Chuyên môn',
                      children: (
                        <Flex gap={4} wrap>
                          {nurse.specialties.map((s) => (
                            <Tag key={s} color="cyan" style={{ marginInlineEnd: 0 }}>
                              {careTypeLabel(s)}
                            </Tag>
                          ))}
                        </Flex>
                      ),
                    },
                    {
                      key: 'areas',
                      label: 'Khu vực',
                      children: nurse.serviceAreas.join(', '),
                    },
                  ]}
                />
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có điều dưỡng" />
            )}
          </Card>

          <div style={{ marginTop: 16 }}>
            <PatientInfoCard patient={patient} />
          </div>

          <Card title={`Các buổi trong liệu trình (${sessions.length})`} style={{ marginTop: 16 }}>
            <div className="shift-session-list">
              {sessions.map((s, i) => (
                <Link key={s.id} to={SHIFT_PATH(s.id)} className={`shift-session-item${s.id === session.id ? ' is-current' : ''}`} ref={s.id === session.id ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}>
                  <span>
                    <b>Buổi {i + 1}</b> · {formatDate(s.date)} · {s.start}–{s.end}
                  </span>
                  <Tag color={SESSION_META[s.status]?.color} style={{ marginInlineEnd: 0 }}>
                    {SESSION_META[s.status]?.label}
                  </Tag>
                </Link>
              ))}
            </div>
          </Card>

          {sos.length > 0 && (
            <Card title="Cảnh báo SOS trong ca" style={{ marginTop: 16 }}>
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
