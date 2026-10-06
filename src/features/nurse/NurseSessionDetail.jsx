import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Result,
  Row,
  Space,
  Tag,
  Timeline,
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
  TeamOutlined,
} from '@ant-design/icons'
import NurseSos from './NurseSos'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { completeSession, findSession, getCareRequest, getNurse, getPatient, getPricing, reportCannotPerform, updateSessionWork } from '../../lib/db'
import { careTypeLabel, formatCurrency, formatDate } from '../../lib/format'
import { FREQUENCIES, SESSION_STATUS } from '../../lib/constants'
import { tasksFor } from '../../Data/nurse/session-data'
import { SESSION_STATUS_META, initials } from './nurse-shared'

const { Text, Title, Paragraph } = Typography
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const minutesBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

// One visit as the nurse sees it: who, when, where, and the work to do.
export default function NurseSessionDetail() {
  const { sessionId } = useParams()
  const { session: auth } = useAuth()
  const state = useDb()
  const { message } = App.useApp()
  const [noteDraft, setNoteDraft] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')

  const found = findSession(state, sessionId)
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
  const nurse = getNurse(state, session.nurseId)
  const price = careRequest ? getPricing(state, nurse?.hospitalId, careRequest.careType) : null
  const meta = SESSION_STATUS_META[session.status] || SESSION_STATUS_META.confirmed
  const today = dayjs().format('YYYY-MM-DD')
  const date = dayjs(session.date)
  const duration = minutesBetween(session.start, session.end)
  const age = patient?.dateOfBirth ? dayjs().diff(dayjs(patient.dateOfBirth), 'year') : null
  const family = (patient?.familyContacts || []).filter((c) => c.status === 'Đã liên kết')

  const isCompleted = session.status === SESSION_STATUS.COMPLETED
  const isOff = session.status === SESSION_STATUS.CANNOT_PERFORM
  const isActive = !isCompleted && !isOff
  const tasks = tasksFor(careRequest?.careType || 'other')
  // Seeded past visits have no recorded checklist; a completed visit counts as fully done.
  const done = isCompleted && !session.checklist ? tasks.map((t) => t.id) : session.checklist || []
  const progress = Math.round((done.filter((id) => tasks.some((t) => t.id === id)).length / tasks.length) * 100)
  const canComplete = isActive && session.date <= today
  const canReport = session.status === SESSION_STATUS.CONFIRMED && session.date >= today

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
  const submitReport = () => {
    reportCannotPerform({ bookingId: booking.id, sessionId: session.id, reason })
    setReportOpen(false)
    message.info('Đã báo không thể thực hiện. Bệnh viện và bệnh nhân đã được thông báo.')
  }

  const sessionIndex = booking.sessions.findIndex((s) => s.id === session.id)
  const frequency = FREQUENCIES.find((f) => f.id === careRequest?.frequency)?.label?.replace(' (chọn thứ)', '')

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
                <Link to={`/hospital/nurse/requests?id=${careRequest.id}`}>
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
            {canReport && (
              <Button
                danger
                onClick={() => {
                  setReason('')
                  setReportOpen(true)
                }}
              >
                Báo không thể thực hiện
              </Button>
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
        {isOff && (
          <Alert
            style={{ marginTop: 14 }}
            type="error"
            showIcon
            title="Bạn đã báo không thể thực hiện ca này"
            description={session.history?.slice(-1)[0]?.reason ? `Lý do: ${session.history.slice(-1)[0].reason}` : undefined}
          />
        )}
        {isCompleted && session.completedAt && (
          <Alert style={{ marginTop: 14 }} type="success" showIcon title={`Đã hoàn thành lúc ${dayjs(session.completedAt).format('HH:mm DD/MM/YYYY')}`} />
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
                <label key={t.id} className={`task-item${done.includes(t.id) ? ' is-done' : ''}`}>
                  <Checkbox checked={done.includes(t.id)} disabled={!isActive} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                  <span>
                    <b>{t.label}</b>
                    {t.hint && <small>{t.hint}</small>}
                  </span>
                </label>
              ))}
            </div>
          </Card>

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
                <Button size="small" onClick={() => setNoteDraft(session.nurseNote || '')}>
                  {session.nurseNote ? 'Sửa' : 'Thêm ghi chú'}
                </Button>
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
          <Card title="Thông tin bệnh nhân">
            <Flex gap={12} align="center" style={{ marginBottom: 14 }}>
              <Avatar size={52} style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800 }}>
                {initials(patient?.name)}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {patient?.name}
                </Text>
                <div>
                  <Text type="secondary">
                    {patient?.gender}
                    {age !== null ? ` · ${age} tuổi` : ''}
                  </Text>
                </div>
              </div>
            </Flex>
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'dob', label: 'Ngày sinh', children: formatDate(patient?.dateOfBirth) || '—' },
                { key: 'phone', label: 'Điện thoại', children: patient?.phone },
                { key: 'district', label: 'Khu vực', children: patient?.district },
                { key: 'blood', label: 'Nhóm máu', children: patient?.bloodType || '—' },
                {
                  key: 'allergy',
                  label: 'Dị ứng',
                  children:
                    patient?.allergies && patient.allergies !== 'Không' ? <Tag color="red">{patient.allergies}</Tag> : <Text type="secondary">Không</Text>,
                },
                { key: 'cond', label: 'Bệnh nền', children: patient?.conditions || '—' },
                { key: 'bhyt', label: 'BHYT', children: <Text code>{patient?.insuranceNumber || '—'}</Text> },
              ]}
            />
          </Card>

          <Card
            title={
              <span>
                <TeamOutlined /> Người thân liên hệ
              </span>
            }
            style={{ marginTop: 16 }}
          >
            {family.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có người thân liên kết" />
            ) : (
              family.map((c) => (
                <Flex key={c.id} justify="space-between" align="center" className="cert-row" gap={8}>
                  <div>
                    <Text strong>{c.name}</Text>
                    {c.primary && (
                      <Tag color="green" style={{ marginLeft: 6 }}>
                        Ưu tiên
                      </Tag>
                    )}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {c.relation} · {c.phone}
                      </Text>
                    </div>
                  </div>
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label={`Gọi ${c.name}`}>
                    <Button shape="circle" icon={<PhoneOutlined />} />
                  </a>
                </Flex>
              ))
            )}
          </Card>

          <Card title="Liệu trình" style={{ marginTop: 16 }}>
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: 'type', label: 'Loại ca', children: careTypeLabel(careRequest?.careType) },
                { key: 'freq', label: 'Tần suất', children: frequency || '—' },
                { key: 'start', label: 'Bắt đầu', children: formatDate(careRequest?.desiredStartDate) },
                { key: 'count', label: 'Số buổi', children: `${booking.sessions.length} buổi` },
                { key: 'price', label: 'Đơn giá', children: price ? `${formatCurrency(price.price)}/${price.unit}` : '—' },
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

      <Modal
        open={reportOpen}
        title="Báo không thể thực hiện ca"
        okText="Gửi báo cáo"
        okButtonProps={{ danger: true, disabled: !reason.trim() }}
        cancelText="Hủy"
        onCancel={() => setReportOpen(false)}
        onOk={submitReport}
        destroyOnHidden
      >
        <Text type="secondary">Hệ thống sẽ tự tìm điều dưỡng thay thế nếu có và thông báo cho bệnh nhân.</Text>
        <Input.TextArea rows={3} autoFocus style={{ marginTop: 12 }} placeholder="Lý do (ốm, việc đột xuất…)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      {session.date === today && isActive && <NurseSos bookingId={booking.id} sessionId={session.id} nurseId={auth.id} />}
    </>
  )
}
