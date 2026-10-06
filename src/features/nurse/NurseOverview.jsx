import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Button, Card, Col, Empty, Flex, Row, Space, Statistic, Tag, Timeline, Typography } from 'antd'
import { BellOutlined, CalendarOutlined, CheckCircleOutlined, StarFilled } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import NurseRequestCard from './NurseRequestCard'
import NurseSos from './NurseSos'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listBookingsByNurse, listNurseRequests } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { SESSION_STATUS } from '../../lib/constants'
import { SESSION_STATUS_META } from './nurse-shared'

const { Text } = Typography

function greeting() {
  const hour = dayjs().hour()
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 14) return 'Chào buổi trưa'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function MetricCard({ to, title, value, suffix, icon, hint, color }) {
  return (
    <Link to={to} className="nurse-metric-link">
      <Card size="small" hoverable>
        <Flex justify="space-between" align="flex-start">
          <Statistic title={title} value={value} suffix={suffix} />
          <span className="nurse-metric-icon" style={{ color, background: `${color}1a` }}>
            {icon}
          </span>
        </Flex>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Text>
      </Card>
    </Link>
  )
}

export default function NurseOverview() {
  const { session } = useAuth()
  const state = useDb()
  const nurse = getNurse(state, session.id)
  const today = dayjs().format('YYYY-MM-DD')

  const requests = useMemo(() => listNurseRequests(state, session.id), [state, session.id])
  const pending = requests.filter((r) => r.relation === 'pending')
  const latest = requests
    .filter((r) => r.relation === 'pending' || r.relation === 'suggested')
    .sort((a, b) => (b.careRequest.selectedAt || b.careRequest.createdAt).localeCompare(a.careRequest.selectedAt || a.careRequest.createdAt))
    .slice(0, 3)

  const sessions = useMemo(
    () =>
      listBookingsByNurse(state, session.id).flatMap((b) =>
        b.sessions.filter((s) => s.nurseId === session.id).map((s) => ({ ...s, booking: b, patient: getPatient(state, b.patientId) })),
      ),
    [state, session.id],
  )
  const todaySessions = sessions.filter((s) => s.date === today).sort((a, b) => a.start.localeCompare(b.start))
  const monthPrefix = dayjs().format('YYYY-MM')
  const completedThisMonth = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED && s.date.startsWith(monthPrefix)).length
  const todayActive = todaySessions.find((s) => s.status === SESSION_STATUS.CONFIRMED || s.status === SESSION_STATUS.REASSIGNED)
  const nextToday = todaySessions.find((s) => s.end >= dayjs().format('HH:mm'))

  return (
    <>
      <PageHead
        eyebrow="Ca trực ngoài giờ"
        title={`${greeting()}, ${nurse?.name?.split(' ').pop() || ''}.`}
        description={`Bạn có ${pending.length ? `${pending.length} yêu cầu cần phản hồi` : 'không có yêu cầu chờ phản hồi'} và ${todaySessions.length} ca hôm nay.`}
        action={
          <Link to="/hospital/nurse/schedule">
            <Button icon={<CalendarOutlined />}>Xem lịch</Button>
          </Link>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <MetricCard to="/hospital/nurse/requests" title="Chờ phản hồi" value={pending.length} icon={<BellOutlined />} color="#b96b08" hint="Phản hồi trong 15 phút" />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard
            to={`/hospital/nurse/schedule?date=${today}`}
            title="Ca hôm nay"
            value={todaySessions.length}
            icon={<CalendarOutlined />}
            color="#0b6b68"
            hint={nextToday ? `Ca tiếp theo lúc ${nextToday.start}` : 'Đã xong các ca hôm nay'}
          />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard to="/hospital/nurse/schedule" title="Hoàn thành tháng này" value={completedThisMonth} icon={<CheckCircleOutlined />} color="#21845b" hint="Buổi chăm sóc đã xong" />
        </Col>
        <Col xs={12} lg={6}>
          <MetricCard to="/hospital/nurse/profile" title="Đánh giá" value={nurse?.rating ?? '—'} icon={<StarFilled />} color="#d4880f" hint={`${nurse?.reviewCount || 0} lượt từ bệnh nhân`} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card title="Yêu cầu mới nhất" extra={<Link to="/hospital/nurse/requests">Xem tất cả ({requests.length})</Link>}>
            {latest.length === 0 ? (
              <Empty description="Chưa có yêu cầu mới. Yêu cầu sẽ hiện ngay khi bệnh nhân gửi." />
            ) : (
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                {latest.map(({ careRequest, relation }) => (
                  <NurseRequestCard key={careRequest.id} careRequest={careRequest} relation={relation} nurseId={session.id} compact />
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title={`Lịch hôm nay · ${dayjs().format('DD/MM')}`} extra={<Link to={`/hospital/nurse/schedule?date=${today}`}>Mở lịch</Link>}>
            {todaySessions.length === 0 ? (
              <Empty description="Không có ca nào hôm nay" />
            ) : (
              <Timeline
                items={todaySessions.map((s) => {
                  const meta = SESSION_STATUS_META[s.status]
                  const careRequest = getCareRequest(state, s.booking.careRequestId)
                  return {
                    key: s.id,
                    color: s.status === SESSION_STATUS.COMPLETED ? 'gray' : s.status === SESSION_STATUS.CANNOT_PERFORM ? 'red' : 'green',
                    content: (
                      <>
                        <Flex justify="space-between" gap={6} wrap>
                          <Link to={`/hospital/nurse/sessions/${s.id}`}>
                            <Text strong>
                              {s.start}–{s.end} · {s.patient?.name}
                            </Text>
                          </Link>
                          <Tag color={meta.color}>{meta.label}</Tag>
                        </Flex>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {careTypeLabel(careRequest?.careType)} · {s.patient?.address}
                        </Text>
                      </>
                    ),
                  }
                })}
              />
            )}
          </Card>
        </Col>
      </Row>

      {todayActive && <NurseSos bookingId={todayActive.booking.id} sessionId={todayActive.id} nurseId={session.id} />}
    </>
  )
}
