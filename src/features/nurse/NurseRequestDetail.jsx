import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Button, Card, Col, Descriptions, Flex, Progress, Result, Row, Space, Statistic, Tag, Timeline, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EnvironmentOutlined, StopOutlined } from '@ant-design/icons'
import NurseRequestActions from './NurseRequestActions'
import PatientInfoCard from './PatientInfoCard'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getBooking, getCareRequest, getNurse, getPatient, getPricing, listNurseRequests } from '../../lib/db'
import { careTypeLabel, formatCurrency, formatDate, formatDateTime } from '../../lib/format'
import { SESSION_STATUS } from '../../lib/constants'
import { tasksFor } from '../../Data/nurse/session-data'
import { CLOSED_REASON, SESSION_STATUS_META, frequencyText, requestStage, sessionWork } from './nurse-shared'

const { Text, Title, Paragraph } = Typography

const READ_ONLY_COPY = {
  completed: { type: 'success', title: 'Liệu trình đã hoàn thành', text: 'Chế độ xem lại: những việc đã làm và chưa làm trong từng buổi.' },
  cancelled: { type: 'warning', title: 'Bệnh nhân đã hủy yêu cầu', text: 'Chế độ xem lại, không còn thao tác nào trên yêu cầu này.' },
  declined: { type: 'info', title: 'Bạn đã từ chối yêu cầu này', text: 'Chế độ xem lại, không còn thao tác nào trên yêu cầu này.' },
  closed: { type: 'info', title: 'Yêu cầu đã đóng', text: 'Chế độ xem lại, không còn thao tác nào trên yêu cầu này.' },
}

// What happened to the request, from this nurse's point of view.
function buildHistory(state, careRequest, nurseId, booking) {
  const items = [{ at: careRequest.createdAt, color: 'gray', text: 'Bệnh nhân tạo yêu cầu chăm sóc' }]
  const position = careRequest.matchedNurseIds.indexOf(nurseId)
  if (position >= 0) items.push({ at: careRequest.lastMatchedAt || careRequest.createdAt, color: 'blue', text: `Bạn được đề xuất (lựa chọn ${position + 1}/${careRequest.matchedNurseIds.length})` })
  const declined = careRequest.declineReasons?.find((d) => d.nurseId === nurseId)
  if (careRequest.selectedNurseId === nurseId) items.push({ at: careRequest.selectedAt || careRequest.createdAt, color: 'gold', text: 'Bệnh nhân chọn bạn' })
  if (declined) items.push({ at: declined.at, color: 'red', text: `Bạn đã từ chối${declined.reason ? ` · ${declined.reason}` : ''}` })
  if (booking) {
    items.push({ at: booking.createdAt, color: 'green', text: `Bạn đã nhận ca · lịch ${booking.sessions.length} buổi được tạo` })
    const finished = booking.sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED)
    if (finished.length === booking.sessions.length) {
      const last = booking.sessions[booking.sessions.length - 1]
      items.push({ at: last.completedAt || `${last.date}T${last.end}:00`, color: 'green', text: 'Hoàn thành toàn bộ liệu trình' })
    }
  }
  if (careRequest.cancelledAt) items.push({ at: careRequest.cancelledAt, color: 'red', text: 'Bệnh nhân hủy yêu cầu' })
  if (!booking && !declined && !careRequest.cancelledAt && careRequest.selectedNurseId && careRequest.selectedNurseId !== nurseId) {
    items.push({ at: null, color: 'gray', text: `Yêu cầu được chuyển cho ${getNurse(state, careRequest.selectedNurseId)?.name}` })
  }
  return items.sort((a, b) => (a.at && b.at ? a.at.localeCompare(b.at) : a.at ? -1 : 1))
}

export default function NurseRequestDetail() {
  const { id } = useParams()
  const { session: auth } = useAuth()
  const state = useDb()
  const careRequest = getCareRequest(state, id)
  const entry = careRequest ? listNurseRequests(state, auth.id).find((r) => r.careRequest.id === id) : null

  if (!careRequest || !entry) {
    return (
      <Result
        status="404"
        title="Không tìm thấy yêu cầu"
        subTitle="Yêu cầu không tồn tại hoặc không liên quan tới bạn."
        extra={
          <Link to="/hospital/nurse/requests">
            <Button type="primary">Về ca chăm sóc mới</Button>
          </Link>
        }
      />
    )
  }

  const { relation } = entry
  const stage = requestStage(state, careRequest, relation)
  const patient = getPatient(state, careRequest.patientId)
  const nurse = getNurse(state, auth.id)
  const booking = relation === 'accepted' && careRequest.bookingId ? getBooking(state, careRequest.bookingId) : null
  const price = getPricing(state, nurse?.hospitalId, careRequest.careType)
  const history = buildHistory(state, careRequest, auth.id, booking)
  const readOnlyCopy = READ_ONLY_COPY[stage.key]
  const today = dayjs().format('YYYY-MM-DD')

  const mySessions = booking ? booking.sessions.filter((s) => s.nurseId === auth.id) : []
  const sessionRows = mySessions.map((s) => ({ session: s, work: sessionWork(s, careRequest.careType) }))
  const doneSessions = mySessions.filter((s) => s.status === SESSION_STATUS.COMPLETED).length
  const tasksDone = sessionRows.reduce((sum, r) => sum + r.work.done.length, 0)
  const tasksTotal = sessionRows.reduce((sum, r) => sum + r.work.tasks.length, 0)

  return (
    <>
      <Link to={`/hospital/nurse/requests?id=${careRequest.id}`} className="back-link">
        <ArrowLeftOutlined /> Ca chăm sóc mới
      </Link>

      <Card className="session-hero">
        <Flex justify="space-between" align="flex-start" gap={16} wrap>
          <div style={{ flex: '1 1 320px' }}>
            <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
              YÊU CẦU CHĂM SÓC · #{careRequest.id}
            </Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              {careTypeLabel(careRequest.careType)} · {patient?.name}
            </Title>
            <Space size={6} wrap>
              <Tag color={stage.color}>{stage.label}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tạo {dayjs(careRequest.createdAt).fromNow()} · {formatDateTime(careRequest.createdAt)}
              </Text>
            </Space>
          </div>
          <div className="session-when">
            <ClockCircleOutlined />
            <div>
              <b>
                Từ {formatDate(careRequest.desiredStartDate)} · {careRequest.timeSlot?.start}–{careRequest.timeSlot?.end}
              </b>
              <span>{frequencyText(careRequest)}</span>
            </div>
          </div>
        </Flex>
        <Flex className="session-address" justify="space-between" align="center" gap={10} wrap>
          <Text>
            <EnvironmentOutlined /> {patient?.address}
          </Text>
          {stage.key === 'pending' && <NurseRequestActions careRequest={careRequest} patientName={patient?.name} />}
          {stage.key === 'suggested' && (
            <Text type="secondary">Bạn đang trong danh sách đề xuất. Nút nhận / từ chối xuất hiện khi bệnh nhân chọn bạn.</Text>
          )}
        </Flex>
        {readOnlyCopy && (
          <Alert
            style={{ marginTop: 14 }}
            type={readOnlyCopy.type}
            showIcon
            title={readOnlyCopy.title}
            description={stage.key === 'closed' ? CLOSED_REASON[careRequest.status] || readOnlyCopy.text : readOnlyCopy.text}
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          {booking ? (
            <Card title={`Các buổi chăm sóc của bạn (${mySessions.length})`}>
              <Row gutter={12} style={{ marginBottom: 14 }}>
                <Col span={8}>
                  <Statistic title="Buổi đã xong" value={doneSessions} suffix={`/ ${mySessions.length}`} />
                </Col>
                <Col span={8}>
                  <Statistic title="Việc đã làm" value={tasksDone} suffix={`/ ${tasksTotal}`} />
                </Col>
                <Col span={8}>
                  <Statistic title="Đơn giá" value={price ? formatCurrency(price.price) : '—'} />
                </Col>
              </Row>
              <div className="request-sessions">
                {sessionRows.map(({ session: s, work }) => {
                  const meta = SESSION_STATUS_META[s.status] || SESSION_STATUS_META.confirmed
                  const future = s.date > today && s.status === SESSION_STATUS.CONFIRMED
                  return (
                    <Link key={s.id} to={`/hospital/nurse/sessions/${s.id}`} className="request-session-row">
                      <span className="request-session-date">
                        <b>{dayjs(s.date).format('DD/MM')}</b>
                        <small>
                          {s.start}–{s.end}
                        </small>
                      </span>
                      <span className="request-session-work">
                        {future ? (
                          <Text type="secondary">Chưa diễn ra</Text>
                        ) : (
                          <>
                            <Progress percent={work.percent} size="small" strokeColor={work.percent === 100 ? '#21845b' : '#0b6b68'} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Đã làm {work.done.length}/{work.tasks.length} việc
                              {work.done.length < work.tasks.length ? ` · chưa làm ${work.tasks.length - work.done.length}` : ''}
                            </Text>
                          </>
                        )}
                      </span>
                      <Tag color={meta.color}>{meta.label}</Tag>
                    </Link>
                  )
                })}
              </div>
            </Card>
          ) : (
            <Card
              title="Công việc dự kiến mỗi buổi"
              extra={
                <Text type="secondary">
                  {stage.key === 'cancelled' || stage.key === 'declined' || stage.key === 'closed' ? 'Không thực hiện' : 'Chưa bắt đầu'}
                </Text>
              }
            >
              <div className="task-list">
                {tasksFor(careRequest.careType).map((t) => (
                  <div key={t.id} className="task-item is-readonly">
                    {stage.readOnly ? <CloseCircleOutlined style={{ color: '#a7b5b8', marginTop: 3 }} /> : <CheckCircleOutlined style={{ color: '#a9d8d2', marginTop: 3 }} />}
                    <span className="task-text">
                      <b>{t.label}</b>
                      {t.hint && <small>{t.hint}</small>}
                    </span>
                    {stage.readOnly && <Tag>Chưa làm</Tag>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Diễn biến yêu cầu" style={{ marginTop: 16 }}>
            <Timeline
              items={history.map((h, i) => ({
                key: i,
                color: h.color,
                icon: h.text.startsWith('Bệnh nhân hủy') ? <StopOutlined /> : undefined,
                content: (
                  <>
                    <Text>{h.text}</Text>
                    {h.at && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(h.at)}
                        </Text>
                      </div>
                    )}
                  </>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <PatientInfoCard patient={patient} showFamily={relation === 'accepted'} />
          <Card title="Yêu cầu" style={{ marginTop: 16 }}>
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'type', label: 'Loại ca', children: careTypeLabel(careRequest.careType) },
                { key: 'start', label: 'Bắt đầu', children: formatDate(careRequest.desiredStartDate) },
                { key: 'time', label: 'Khung giờ', children: `${careRequest.timeSlot?.start}–${careRequest.timeSlot?.end}` },
                { key: 'freq', label: 'Tần suất', children: frequencyText(careRequest) },
                { key: 'area', label: 'Khu vực', children: careRequest.district },
                { key: 'price', label: 'Đơn giá', children: price ? `${formatCurrency(price.price)}/${price.unit}` : '—' },
              ]}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Ghi chú của bệnh nhân
            </Text>
            <Paragraph style={{ margin: '4px 0 0' }}>{careRequest.notes || 'Không có ghi chú.'}</Paragraph>
          </Card>
        </Col>
      </Row>
    </>
  )
}
