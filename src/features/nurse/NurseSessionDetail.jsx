import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Flex,
  Input,
  Popconfirm,
  Progress,
  Result,
  Row,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import PatientInfoCard from './PatientInfoCard'
import ObservationCard from './ObservationCard'
import CancelVisitModal from './CancelVisitModal'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { completeSession, findSession, getCareRequest, getNurse, getPatient, updateSessionWork } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS, SESSION_STATUS } from '../../lib/constants'
import { CANCEL_NOTICE_TEXT, SESSION_STATUS_META, canCancelVisit, frequencyText, isCancellableStatus, sessionWork } from './nurse-shared'

const { Text, Title, Paragraph } = Typography
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const minutesBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

import { usePageCrumbs } from '../../components/crumbs'

// One visit as the nurse sees it: who, when, where, and the work to do.
export default function NurseSessionDetail() {
  const { sessionId } = useParams()
  const { session: auth } = useAuth()
  const state = useDb()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [noteDraft, setNoteDraft] = useState(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  const found = findSession(state, sessionId)
  usePageCrumbs(found ? [{ label: `Buổi ${formatDate(found.session.date)} · ${found.session.start}` }] : [])
  if (!found || found.session.nurseId !== auth.id) {
    return (
      <Result
        status="404"
        title="Không tìm thấy ca chăm sóc"
        subTitle="Ca này không tồn tại hoặc đã được giao cho điều dưỡng khác."
        extra={
          <Link to="/hospital/nurse/schedule">
            <Button type="primary">Về lịch làm việc</Button>
          </Link>
        }
      />
    )
  }

  const { booking, session } = found
  const patient = getPatient(state, booking.patientId)
  const careRequest = getCareRequest(state, booking.careRequestId)
  const meta = SESSION_STATUS_META[session.status] || SESSION_STATUS_META.confirmed
  const today = dayjs().format('YYYY-MM-DD')
  const date = dayjs(session.date)
  const duration = minutesBetween(session.start, session.end)

  const isCompleted = session.status === SESSION_STATUS.COMPLETED
  const isOff = session.status === SESSION_STATUS.CANNOT_PERFORM
  const isCancelled = careRequest?.status === CARE_REQUEST_STATUS.CANCELLED
  // Completed, cancelled or handed-off visits are view-only: what was / wasn't done.
  const isActive = !isCompleted && !isOff && !isCancelled
  const { tasks, done, percent: progress } = sessionWork(session, careRequest?.careType)
  const canComplete = isActive && session.date <= today
  const showCancel = isCancellableStatus(session, careRequest, today)
  const canCancel = canCancelVisit(session, careRequest, today)
  // The visit can only be worked on once its day has come; before that everything is read-only.
  const notYet = isActive && session.date > today
  const canWork = isActive && !notYet

  const toggleTask = (id, checked) => {
    updateSessionWork(booking.id, session.id, { checklist: checked ? [...done, id] : done.filter((x) => x !== id) })
  }
  const saveNote = () => {
    updateSessionWork(booking.id, session.id, { nurseNote: noteDraft.trim() })
    setNoteDraft(null)
    message.success('Đã lưu ghi chú buổi chăm sóc')
  }
  const complete = () => {
    completeSession(booking.id, session.id)
    message.success(`Đã hoàn thành buổi chăm sóc. ${patient?.name} đã được thông báo.`)
  }
  const sessionIndex = booking.sessions.findIndex((s) => s.id === session.id)
  const frequency = careRequest ? frequencyText(careRequest) : null

  return (
    <>
      <Link to={`/hospital/nurse/schedule?date=${session.date}`} className="back-link">
        <ArrowLeftOutlined /> Lịch làm việc
      </Link>

      <Card className="session-hero">
        <Flex justify="space-between" align="flex-start" gap={16} wrap>
          <div style={{ flex: '1 1 320px' }}>
            <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
              CA CHĂM SÓC · BUỔI {sessionIndex + 1}/{booking.sessions.length}
            </Text>
            <Title level={3} style={{ margin: '4px 0' }}>
              {careTypeLabel(careRequest?.careType)} · {patient?.name}
            </Title>
            <Space size={6} wrap>
              <Tag color={meta.color}>{meta.label}</Tag>
              {session.date === today && <Tag color="magenta">Hôm nay</Tag>}
              {careRequest && (
                <Link to={`/hospital/nurse/requests/${careRequest.id}`}>
                  <Tag icon={<FileTextOutlined />}>#{careRequest.id}</Tag>
                </Link>
              )}
            </Space>
          </div>
          <div className="session-when">
            <CalendarOutlined />
            <div>
              <b>
                {WEEKDAY_LONG[date.day()]}, {date.format('DD/MM/YYYY')}
              </b>
              <span>
                {session.start} – {session.end} · {duration >= 60 ? `${Math.floor(duration / 60)} giờ ${duration % 60 ? `${duration % 60} phút` : ''}` : `${duration} phút`}
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
              <Button icon={<EnvironmentOutlined />}>Chỉ đường</Button>
            </a>
            <a href={`tel:${(patient?.phone || '').replace(/[^\d+]/g, '')}`}>
              <Button icon={<PhoneOutlined />}>Gọi bệnh nhân</Button>
            </a>
            {showCancel && (
              <Tooltip title={canCancel ? undefined : CANCEL_NOTICE_TEXT}>
                <span>
                  <Button danger disabled={!canCancel} onClick={() => setCancelOpen(true)}>
                    Hủy buổi
                  </Button>
                </span>
              </Tooltip>
            )}
            {canComplete && (
              <Popconfirm
                title="Hoàn thành buổi chăm sóc?"
                description={progress < 100 ? `Mới hoàn thành ${progress}% công việc. Vẫn kết thúc buổi?` : 'Bệnh nhân sẽ nhận được thông báo.'}
                okText="Hoàn thành"
                cancelText="Chưa"
                onConfirm={complete}
              >
                <Button type="primary" icon={<CheckOutlined />}>
                  Hoàn thành buổi
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Flex>
        {notYet && (
          <Alert
            style={{ marginTop: 14 }}
            type="info"
            showIcon
            title={`Ca diễn ra vào ${WEEKDAY_LONG[date.day()]}, ${date.format('DD/MM/YYYY')}`}
            description="Danh sách công việc, chỉ số và ghi chú chỉ chỉnh sửa được từ ngày thực hiện. Hiện tại bạn chỉ xem được."
          />
        )}
        {isOff && (
          <Alert
            style={{ marginTop: 14 }}
            type="error"
            showIcon
            title="Bạn đã hủy buổi này — bệnh viện đang tìm người thay"
            description={session.history?.slice(-1)[0]?.reason ? `Lý do: ${session.history.slice(-1)[0].reason}` : undefined}
          />
        )}
        {isCompleted && (
          <Alert
            style={{ marginTop: 14 }}
            type="success"
            showIcon
            title={session.completedAt ? `Đã hoàn thành lúc ${dayjs(session.completedAt).format('HH:mm DD/MM/YYYY')}` : 'Buổi chăm sóc đã hoàn thành'}
            description="Chế độ xem lại — công việc và ghi chú không thể chỉnh sửa."
          />
        )}
        {isCancelled && !isCompleted && (
          <Alert
            style={{ marginTop: 14 }}
            type="warning"
            showIcon
            title="Bệnh nhân đã hủy yêu cầu chăm sóc này"
            description="Chế độ xem lại — công việc và ghi chú không thể chỉnh sửa."
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card
            title="Công việc trong buổi"
            extra={
              <Text type="secondary">
                {done.length}/{tasks.length} việc
              </Text>
            }
          >
            <Progress percent={progress} strokeColor="#0b6b68" style={{ marginBottom: 12 }} />
            <div className="task-list">
              {tasks.map((t) => (
                <label key={t.id} className={`task-item${done.includes(t.id) ? ' is-done' : ''}${canWork ? '' : ' is-readonly'}`}>
                  <Checkbox checked={done.includes(t.id)} disabled={!canWork} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                  <span className="task-text">
                    <b>{t.label}</b>
                    {t.hint && <small>{t.hint}</small>}
                  </span>
                  {!isActive && <Tag color={done.includes(t.id) ? 'green' : 'default'}>{done.includes(t.id) ? 'Đã làm' : 'Chưa làm'}</Tag>}
                </label>
              ))}
            </div>
          </Card>

          <ObservationCard key={session.id} booking={booking} session={session} editable={canWork} />

          <Card title="Ghi chú" style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Yêu cầu từ bệnh nhân
            </Text>
            <Paragraph style={{ marginTop: 4 }}>{careRequest?.notes || 'Không có ghi chú.'}</Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Ghi chú buổi chăm sóc của bạn
            </Text>
            {noteDraft === null ? (
              <Flex justify="space-between" align="flex-start" gap={10} style={{ marginTop: 4 }}>
                <Paragraph style={{ margin: 0 }} type={session.nurseNote ? undefined : 'secondary'}>
                  {session.nurseNote || 'Chưa có ghi chú.'}
                </Paragraph>
                {canWork && (
                  <Button size="small" onClick={() => setNoteDraft(session.nurseNote || '')}>
                    {session.nurseNote ? 'Sửa' : 'Thêm ghi chú'}
                  </Button>
                )}
              </Flex>
            ) : (
              <div style={{ marginTop: 6 }}>
                <Input.TextArea
                  rows={3}
                  autoFocus
                  value={noteDraft}
                  placeholder="Diễn biến, chỉ số bất thường, dặn dò…"
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
                <Space style={{ marginTop: 8 }}>
                  <Button type="primary" onClick={saveNote}>
                    Lưu
                  </Button>
                  <Button onClick={() => setNoteDraft(null)}>Hủy</Button>
                </Space>
              </div>
            )}
          </Card>

          <Card title={`Các buổi trong liệu trình (${booking.sessions.length})`} style={{ marginTop: 16 }}>
            <Timeline
              items={booking.sessions.map((s) => {
                const m = SESSION_STATUS_META[s.status] || SESSION_STATUS_META.confirmed
                const current = s.id === session.id
                const mine = s.nurseId === auth.id
                return {
                  key: s.id,
                  color: current ? 'blue' : s.status === SESSION_STATUS.COMPLETED ? 'gray' : s.status === SESSION_STATUS.CANNOT_PERFORM ? 'red' : 'green',
                  content: (
                    <Flex justify="space-between" gap={8} wrap className={current ? 'timeline-current' : ''}>
                      {mine && !current ? (
                        <Link to={`/hospital/nurse/sessions/${s.id}`}>
                          {formatDate(s.date)} · {s.start}–{s.end}
                        </Link>
                      ) : (
                        <Text strong={current}>
                          {formatDate(s.date)} · {s.start}–{s.end}
                          {current ? ' (buổi này)' : ''}
                          {!mine ? ` · ${getNurse(state, s.nurseId)?.name}` : ''}
                        </Text>
                      )}
                      <Tag color={m.color}>{m.label}</Tag>
                    </Flex>
                  ),
                }
              })}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <PatientInfoCard patient={patient} />

          <Card title="Liệu trình" style={{ marginTop: 16 }}>
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'type', label: 'Loại ca', children: careTypeLabel(careRequest?.careType) },
                { key: 'freq', label: 'Tần suất', children: frequency || '—' },
                { key: 'start', label: 'Bắt đầu', children: formatDate(careRequest?.desiredStartDate) },
                { key: 'count', label: 'Số buổi', children: `${booking.sessions.length} buổi` },
                {
                  key: 'time',
                  label: 'Thời lượng',
                  children: (
                    <span>
                      <ClockCircleOutlined /> {duration} phút/buổi
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>


      <CancelVisitModal open={cancelOpen} booking={booking} session={session} patientName={patient?.name} onCancel={() => setCancelOpen(false)} onDone={() => navigate('/hospital/nurse/schedule')} />
    </>
  )
}
