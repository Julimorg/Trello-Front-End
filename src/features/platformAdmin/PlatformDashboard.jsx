import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Card, Col, Empty, Progress, Row, Space, Statistic, Table, Tag, Timeline, Tooltip, Typography } from 'antd'
import { AlertOutlined, ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { computeNorthStarMetrics } from '../../lib/db'
import { CARE_REQUEST_STATUS } from '../../lib/constants'
import { formatDateTime } from '../../lib/format'
import { DEFAULT_SETTINGS } from '../../Data/admin/settings-data'
import { PLATFORM_STATUS_META, contractState } from './platform-shared'
import { certificateStatus } from '../hospitalAdmin/admin-shared'

const { Text } = Typography
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// "Tổng quan hệ thống": network health plus everything that needs the admin's attention.
export default function PlatformDashboard() {
  const state = useDb()
  const metrics = computeNorthStarMetrics(state)
  const settings = { ...DEFAULT_SETTINGS, ...state.settings }

  const chart = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => dayjs().subtract(13 - i, 'day'))
    const counts = days.map((d) => {
      const iso = d.format('YYYY-MM-DD')
      return { label: d.format('DD/MM'), weekday: WEEKDAY_SHORT[d.day()], value: state.careRequests.filter((r) => r.createdAt.slice(0, 10) === iso).length, today: d.isSame(dayjs(), 'day') }
    })
    return { counts, max: Math.max(1, ...counts.map((c) => c.value)), total: counts.reduce((s, c) => s + c.value, 0) }
  }, [state.careRequests])

  const nonCancelled = state.careRequests.filter((r) => r.status !== CARE_REQUEST_STATUS.CANCELLED)
  const successRate = nonCancelled.length ? Math.round((metrics.completed / nonCancelled.length) * 100) : 0

  // Items the admin should act on, most urgent first.
  const attention = useMemo(() => {
    const items = []
    const overdueSos = (state.sosEvents || []).filter((e) => (e.status || 'open') === 'open' && dayjs().diff(dayjs(e.createdAt), 'minute') >= settings.sosEscalationMinutes)
    if (overdueSos.length) items.push({ key: 'sos', level: 'error', title: `${overdueSos.length} cảnh báo SOS chưa xử lý quá ${settings.sosEscalationMinutes} phút`, hint: 'Liên hệ bệnh viện phụ trách ngay', to: '/admin/operations' })
    const reports = (state.reports || []).filter((r) => r.status === 'open')
    const highReports = reports.filter((r) => r.severity === 'high')
    if (reports.length) items.push({ key: 'reports', level: highReports.length ? 'error' : 'warning', title: `${reports.length} báo cáo vi phạm mới${highReports.length ? ` (${highReports.length} mức cao)` : ''}`, hint: 'Cần xem xét và phản hồi', to: '/admin/compliance' })
    state.hospitals.forEach((h) => {
      const c = contractState(h.contract, settings.contractWarningDays)
      if (c.key === 'expired') items.push({ key: `c-${h.id}`, level: 'error', title: `Hợp đồng ${h.name} đã hết hạn ${-c.daysLeft} ngày`, hint: h.status === 'active' ? 'Vẫn đang hoạt động — gia hạn hoặc khóa' : 'Gia hạn để kích hoạt lại', to: `/admin/hospitals/${h.id}` })
      else if (c.key === 'expiring') items.push({ key: `c-${h.id}`, level: 'warning', title: `Hợp đồng ${h.name} còn ${c.daysLeft} ngày`, hint: 'Chuẩn bị gia hạn', to: `/admin/hospitals/${h.id}` })
      if (h.status === 'suspended') items.push({ key: `s-${h.id}`, level: 'warning', title: `${h.name} đang tạm ngưng`, hint: h.statusReason, to: `/admin/hospitals/${h.id}` })
    })
    const expiredCerts = state.nurses.filter((n) => n.certificates.some((c) => certificateStatus(c).key === 'expired'))
    if (expiredCerts.length) items.push({ key: 'certs', level: 'warning', title: `${expiredCerts.length} điều dưỡng có chứng chỉ hết hạn`, hint: expiredCerts.map((n) => n.name).join(', '), to: '/admin/nurses' })
    const sla = settings.supportSlaHours * 3600000
    const lateTickets = (state.tickets || []).filter((t) => t.status !== 'resolved' && !t.messages.some((m) => m.from === 'admin') && Date.now() - new Date(t.createdAt).getTime() > sla)
    const newTickets = (state.tickets || []).filter((t) => t.status === 'open')
    if (newTickets.length) items.push({ key: 'tickets', level: lateTickets.length ? 'error' : 'warning', title: `${newTickets.length} yêu cầu hỗ trợ mới${lateTickets.length ? ` (${lateTickets.length} quá hạn trả lời)` : ''}`, hint: 'Trả lời để giữ trải nghiệm người dùng', to: '/admin/support' })
    const noNurseRequests = state.careRequests.filter((c) => c.status === 'no_match')
    if (noNurseRequests.length) items.push({ key: 'nomatch', level: 'warning', title: `${noNurseRequests.length} yêu cầu đang chờ bệnh nhân chọn điều dưỡng thay thế`, hint: 'Mở Trung tâm vận hành để nhắc', to: '/admin/operations' })
    const unverified = state.patients.filter((p) => !p.account?.verified)
    if (unverified.length) items.push({ key: 'kyc', level: 'info', title: `${unverified.length} bệnh nhân chưa xác minh danh tính`, hint: 'Nên hoàn tất xác minh trước khi nhận ca', to: '/admin/accounts' })
    const restricted = state.patients.filter((p) => (p.account?.status || 'active') !== 'active')
    if (restricted.length) items.push({ key: 'restricted', level: 'info', title: `${restricted.length} tài khoản bệnh nhân đang bị hạn chế`, hint: restricted.map((p) => p.name).join(', '), to: '/admin/accounts' })
    const rank = { error: 0, warning: 1, info: 2 }
    return items.sort((a, b) => rank[a.level] - rank[b.level])
  }, [state, settings.sosEscalationMinutes, settings.contractWarningDays, settings.supportSlaHours])

  const perHospital = state.hospitals.map((h) => {
    const nurses = state.nurses.filter((n) => n.hospitalId === h.id)
    const ids = new Set(nurses.map((n) => n.id))
    const monthPrefix = dayjs().format('YYYY-MM')
    return {
      ...h,
      nurseCount: nurses.length,
      ready: nurses.filter((n) => n.authStatus === 'authorized' && (n.accountStatus || 'active') === 'active').length,
      sessions: state.bookings.flatMap((b) => b.sessions).filter((s) => ids.has(s.nurseId) && s.date.startsWith(monthPrefix)).length,
      contract: contractState(h.contract, settings.contractWarningDays),
    }
  })

  const recent = [...(state.auditLogs || [])].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6)
  const levelColor = { error: '#cf3c43', warning: '#b96b08', info: '#2b69c9' }

  return (
    <>
      <PageHead eyebrow="CareShift Operations" title="Tổng quan hệ thống" description="Sức khỏe mạng lưới đối tác, cung–cầu chăm sóc và các việc cần quản trị viên xử lý." />

      {settings.maintenanceMode && <Alert style={{ marginBottom: 16 }} type="warning" showIcon title="Chế độ bảo trì đang bật" description="Người dùng đang thấy banner bảo trì. Tắt trong Cấu hình hệ thống khi hoàn tất." action={<Link to="/admin/settings">Mở cấu hình</Link>} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Bệnh viện đối tác" value={state.hospitals.filter((h) => h.status === 'active').length} suffix={`/ ${state.hospitals.length}`} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Điều dưỡng sẵn sàng" value={metrics.authorizedNurseCount} suffix={`/ ${state.nurses.length}`} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Bệnh nhân" value={state.patients.length} suffix={<Text type="secondary" style={{ fontSize: 13 }}>· {state.bookings.filter((b) => b.sessions.some((s) => s.status !== 'completed')).length} lịch đang chạy</Text>} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Yêu cầu chăm sóc" value={metrics.totalRequests} suffix={<Text type="secondary" style={{ fontSize: 13 }}>· {chart.total} trong 14 ngày</Text>} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={
              <Space>
                <AlertOutlined /> Cần xử lý
                {attention.length > 0 && <Tag color="red">{attention.length}</Tag>}
              </Space>
            }
          >
            {attention.length ? (
              <div className="attention-list">
                {attention.map((a) => (
                  <Link key={a.key} to={a.to} className="attention-link" style={{ borderLeft: `3px solid ${levelColor[a.level]}` }}>
                    <span>
                      <b>{a.title}</b>
                      {a.hint && <small>{a.hint}</small>}
                    </span>
                    <ArrowRightOutlined />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty image={<CheckCircleFilled style={{ fontSize: 40, color: '#21845b' }} />} description="Không có việc nào cần xử lý" />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Tỷ lệ hoàn thành yêu cầu (North Star)">
            <Space size={24} align="center" wrap>
              <Progress type="circle" percent={successRate} strokeColor="#0b6b68" size={110} />
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {metrics.completed} / {nonCancelled.length}
                </Text>
                <div>
                  <Text type="secondary">yêu cầu đã được điều dưỡng chấp nhận</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Điều dưỡng chưa có ca: </Text>
                  <Text strong>{metrics.dormantNurseCount}</Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Yêu cầu chăm sóc · 14 ngày gần nhất">
            <div className="health-chart">
              <div className="bars" style={{ height: 150, gap: 6 }}>
                {chart.counts.map((c) => (
                  <Tooltip key={c.label} title={`${c.weekday} ${c.label}: ${c.value} yêu cầu`}>
                    <div className="bar" style={{ height: `${Math.max(6, (c.value / chart.max) * 100)}%`, opacity: c.today ? 1 : 0.7 }} data-value={c.value} />
                  </Tooltip>
                ))}
              </div>
              <div className="bar-labels" style={{ gap: 6 }}>
                {chart.counts.map((c) => (
                  <span key={c.label}>{c.label.slice(0, 2)}</span>
                ))}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Hoạt động quản trị gần đây" extra={<Link to="/admin/audit">Xem tất cả</Link>}>
            {recent.length ? (
              <Timeline
                items={recent.map((l) => ({
                  key: l.id,
                  content: (
                    <>
                      <Text strong>{l.action}</Text> · {l.targetName}
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(l.at)} · {l.actor}
                        </Text>
                      </div>
                    </>
                  ),
                }))}
              />
            ) : (
              <Empty description="Chưa có hoạt động" />
            )}
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Bệnh viện đối tác" extra={<Link to="/admin/hospitals">Quản lý</Link>} styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="id"
              size="middle"
              pagination={false}
              dataSource={perHospital}
              scroll={{ x: 800 }}
              columns={[
                { title: 'Bệnh viện', key: 'name', render: (_, h) => <Link to={`/admin/hospitals/${h.id}`}>{h.name}</Link> },
                { title: 'Điều dưỡng sẵn sàng', key: 'nurses', width: 190, render: (_, h) => <Progress percent={h.nurseCount ? Math.round((h.ready / h.nurseCount) * 100) : 0} format={() => `${h.ready}/${h.nurseCount}`} size="small" /> },
                { title: 'Ca trong tháng', dataIndex: 'sessions', width: 130, sorter: (a, b) => a.sessions - b.sessions },
                { title: 'Hợp đồng', key: 'contract', width: 150, render: (_, h) => <Tag color={h.contract.color}>{h.contract.label}</Tag> },
                { title: 'Trạng thái', key: 'status', width: 120, render: (_, h) => <Tag color={PLATFORM_STATUS_META[h.status].color}>{PLATFORM_STATUS_META[h.status].label}</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}
