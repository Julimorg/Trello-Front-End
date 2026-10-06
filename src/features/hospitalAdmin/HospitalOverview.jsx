import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Avatar, Button, Card, Col, Flex, Row, Statistic, Table, Tag, Typography } from 'antd'
import { AlertOutlined, CalendarOutlined, PlusOutlined, RightOutlined, SafetyCertificateOutlined, SwapOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, getPatient, getSosNurse, listNursesByHospital, listSosEventsForHospital } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS, SESSION_STATUS } from '../../lib/constants'
import { AUTH_META, certificateStatus, compareByGivenName, initials } from './admin-shared'

const { Text } = Typography

function Metric({ to, title, value, hint, icon, color }) {
  return (
    <Link to={to} className="nurse-metric-link">
      <Card size="small" hoverable>
        <Flex justify="space-between" align="flex-start">
          <Statistic title={title} value={value} />
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

export default function HospitalOverview() {
  const { session } = useAuth()
  const state = useDb()
  const hospital = getHospital(state, session.id)
  const nurses = listNursesByHospital(state, session.id)
  const nurseIds = new Set(nurses.map((n) => n.id))
  const today = dayjs().format('YYYY-MM-DD')

  const authorized = nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED)
  const drafts = nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.DRAFT)
  const sessions = state.bookings.flatMap((b) => b.sessions.filter((s) => nurseIds.has(s.nurseId)).map((s) => ({ ...s, booking: b })))
  const todaySessions = sessions.filter((s) => s.date === today && s.status !== SESSION_STATUS.CANNOT_PERFORM)
  const needsReassign = sessions.filter((s) => s.needsManualReassignment)
  const openSos = listSosEventsForHospital(state, session.id).filter((e) => (e.status || 'open') !== 'resolved')
  const expiredCerts = nurses.filter((n) => n.certificates.some((c) => certificateStatus(c).key !== 'valid' && certificateStatus(c).key !== 'unknown'))

  const attention = [
    { key: 'sos', to: '/hospital/admin/sos-log', icon: <AlertOutlined />, color: '#cf3c43', title: `${openSos.length} cảnh báo SOS chưa xử lý xong`, hint: 'Xem ghi chú và cập nhật xử lý', show: openSos.length > 0 },
    { key: 'reassign', to: '/hospital/admin/requests', icon: <SwapOutlined />, color: '#cf3c43', title: `${needsReassign.length} ca cần người thay thế`, hint: 'Điều dưỡng báo không thể thực hiện', show: needsReassign.length > 0 },
    { key: 'verify', to: '/hospital/admin/verification', icon: <SafetyCertificateOutlined />, color: '#b96b08', title: `${drafts.length} hồ sơ chờ xác minh`, hint: 'Đối chiếu chứng chỉ trước khi cấp phép', show: drafts.length > 0 },
    { key: 'cert', to: '/hospital/admin/roster', icon: <WarningOutlined />, color: '#b96b08', title: `${expiredCerts.length} điều dưỡng có chứng chỉ hết hạn / sắp hết hạn`, hint: 'Cập nhật chứng chỉ trong hồ sơ', show: expiredCerts.length > 0 },
    { key: 'schedule', to: '/hospital/admin/schedule', icon: <CalendarOutlined />, color: '#0b6b68', title: `${todaySessions.length} ca hôm nay`, hint: 'Xem điều phối lịch', show: true },
  ].filter((a) => a.show)

  return (
    <>
      <PageHead
        eyebrow={hospital?.name}
        title="Điều phối nguồn lực chăm sóc"
        description="Theo dõi điều dưỡng được cấp phép, lịch ca, cảnh báo SOS và các việc cần xử lý."
        action={
          <Link to="/hospital/admin/roster">
            <Button type="primary" size="large" icon={<PlusOutlined />}>
              Quản lý điều dưỡng
            </Button>
          </Link>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Metric to="/hospital/admin/roster" title="Điều dưỡng" value={nurses.length} hint={`${authorized.length} đang được cấp phép`} icon={<TeamOutlined />} color="#0b6b68" />
        </Col>
        <Col xs={12} lg={6}>
          <Metric to="/hospital/admin/verification" title="Chờ xác minh" value={drafts.length} hint="Hồ sơ cần đối chiếu" icon={<SafetyCertificateOutlined />} color="#b96b08" />
        </Col>
        <Col xs={12} lg={6}>
          <Metric to="/hospital/admin/schedule" title="Ca hôm nay" value={todaySessions.length} hint={`${sessions.filter((s) => s.date > today).length} ca sắp tới`} icon={<CalendarOutlined />} color="#2b69c9" />
        </Col>
        <Col xs={12} lg={6}>
          <Metric to="/hospital/admin/sos-log" title="SOS cần xử lý" value={openSos.length} hint="Chưa xử lý / đang xử lý" icon={<AlertOutlined />} color="#cf3c43" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={15}>
          <Card title="Điều dưỡng" extra={<Link to="/hospital/admin/roster">Xem tất cả</Link>} styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="id"
              size="middle"
              pagination={false}
              dataSource={[...nurses].sort((a, b) => compareByGivenName(a.name, b.name)).slice(0, 6)}
              scroll={{ x: 520 }}
              columns={[
                {
                  title: 'Điều dưỡng',
                  key: 'name',
                  render: (_, n) => (
                    <Link to={`/hospital/admin/roster/${n.id}`}>
                      <Flex gap={10} align="center">
                        <Avatar size="small" style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800 }}>
                          {initials(n.name)}
                        </Avatar>
                        <Text strong>{n.name}</Text>
                      </Flex>
                    </Link>
                  ),
                },
                { title: 'Chuyên môn', key: 'sp', render: (_, n) => n.specialties.slice(0, 2).map(careTypeLabel).join(', ') },
                { title: 'Trạng thái', key: 'st', render: (_, n) => <Tag color={AUTH_META[n.authStatus].color}>{AUTH_META[n.authStatus].label}</Tag> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title="Cần chú ý">
            {attention.map((a) => (
                <Link key={a.key} to={a.to} className="attention-link">
                  <span className="nurse-metric-icon" style={{ color: a.color, background: `${a.color}1a` }}>
                    {a.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    <Text strong>{a.title}</Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {a.hint}
                      </Text>
                    </div>
                  </span>
                  <RightOutlined style={{ color: '#94a4a7' }} />
                </Link>
              ))}
          </Card>
          {openSos.length > 0 && (
            <Card title="SOS gần nhất" style={{ marginTop: 16 }} extra={<Link to="/hospital/admin/sos-log">Mở nhật ký</Link>}>
              {openSos.slice(0, 3).map((e) => (
                <Link key={e.id} to={`/hospital/admin/sos-log?id=${e.id}`} className="attention-link">
                  <Tag color={(e.status || 'open') === 'open' ? 'red' : 'gold'}>{(e.status || 'open') === 'open' ? 'Chưa xử lý' : 'Đang xử lý'}</Tag>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <Text strong>
                      {getPatient(state, e.patientId)?.name} · {getSosNurse(state, e)?.name}
                    </Text>
                    <div>
                      <Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: '100%' }}>
                        {dayjs(e.createdAt).fromNow()} · {e.note || 'Không có ghi chú'}
                      </Text>
                    </div>
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </Col>
      </Row>
    </>
  )
}
