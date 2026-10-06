import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, App, Badge, Button, Card, Col, Descriptions, Drawer, Empty, Flex, Input, Row, Segmented, Select, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd'
import { CheckOutlined, EyeOutlined, SearchOutlined, StopOutlined, WarningOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { getBooking, getCareRequest, getHospital, getNurse, getPatient, updateNurse, updateReport } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { NURSE_AUTH_STATUS } from '../../lib/constants'
import { REPORT_CATEGORIES } from '../../Data/admin/compliance-data'
import { AUTH_META, certificateStatus, compareText } from '../hospitalAdmin/admin-shared'

const { Text, Paragraph } = Typography

const STATUS_META = {
  open: { label: 'Mới', color: 'red' },
  investigating: { label: 'Đang xem xét', color: 'gold' },
  resolved: { label: 'Đã xử lý', color: 'green' },
  dismissed: { label: 'Bác bỏ', color: 'default' },
}
const SEVERITY_META = {
  high: { label: 'Nghiêm trọng', color: 'red' },
  medium: { label: 'Trung bình', color: 'orange' },
  low: { label: 'Thấp', color: 'blue' },
}
const REPORTER_LABEL = { patient: 'Bệnh nhân', family: 'Người nhà', hospital: 'Bệnh viện', system: 'Hệ thống tự động' }
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

// Who / what a report is about, resolved to display names.
function describe(state, report) {
  const nurse = report.subjectType === 'nurse' ? getNurse(state, report.subjectId) : null
  const hospital = nurse ? getHospital(state, nurse.hospitalId) : getHospital(state, report.subjectId)
  const reporter =
    report.reporterRole === 'system'
      ? REPORTER_LABEL.system
      : report.reporterRole === 'hospital'
        ? getHospital(state, report.reporterId)?.name
        : `${getPatient(state, report.reporterId)?.name || '—'} (${REPORTER_LABEL[report.reporterRole]})`
  return { nurse, hospital, subjectName: nurse ? nurse.name : hospital?.name, reporter }
}

function ReportDrawer({ report, onClose }) {
  const state = useDb()
  const { message } = App.useApp()
  const [note, setNote] = useState('')
  useEffect(() => setNote(report?.resolution || ''), [report?.id, report?.resolution])
  if (!report) return null

  const { nurse, hospital, subjectName, reporter } = describe(state, report)
  const booking = report.bookingId ? getBooking(state, report.bookingId) : null
  const careRequest = booking ? getCareRequest(state, booking.careRequestId) : null
  const closed = report.status === 'resolved' || report.status === 'dismissed'

  const setStatus = (status) => {
    if ((status === 'resolved' || status === 'dismissed') && !note.trim()) {
      message.warning('Nhập ghi chú xử lý trước khi đóng báo cáo')
      return
    }
    updateReport(report.id, { status, resolution: note.trim() || report.resolution })
    message.success(`Đã chuyển báo cáo sang “${STATUS_META[status].label}”`)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      size={560}
      title={
        <Space>
          <span>Báo cáo {report.id}</span>
          <Tag color={STATUS_META[report.status].color}>{STATUS_META[report.status].label}</Tag>
        </Space>
      }
    >
      <Alert type={report.severity === 'high' ? 'error' : report.severity === 'medium' ? 'warning' : 'info'} showIcon title={report.title} description={report.description} />
      <Descriptions
        size="small"
        bordered
        column={1}
        style={{ marginTop: 16 }}
        items={[
          { key: 'subject', label: 'Đối tượng', children: `${report.subjectType === 'nurse' ? 'Điều dưỡng' : 'Bệnh viện'} ${subjectName || '—'}` },
          {
            key: 'hospital',
            label: 'Bệnh viện',
            children: hospital ? <Link to={`/admin/hospitals/${hospital.id}`}>{hospital.name}</Link> : '—',
          },
          ...(nurse ? [{ key: 'license', label: 'Trạng thái cấp phép', children: <Tag color={AUTH_META[nurse.authStatus].color}>{AUTH_META[nurse.authStatus].label}</Tag> }] : []),
          { key: 'cat', label: 'Danh mục', children: report.category },
          { key: 'sev', label: 'Mức độ', children: <Tag color={SEVERITY_META[report.severity].color}>{SEVERITY_META[report.severity].label}</Tag> },
          { key: 'reporter', label: 'Người báo cáo', children: reporter },
          { key: 'time', label: 'Thời điểm', children: `${formatDateTime(report.createdAt)} (${dayjs(report.createdAt).fromNow()})` },
          ...(booking ? [{ key: 'booking', label: 'Liệu trình liên quan', children: `${booking.id} · ${careTypeLabel(careRequest?.careType)} · bắt đầu ${formatDate(booking.sessions[0]?.date)}` }] : []),
          ...(report.updatedAt ? [{ key: 'updated', label: 'Cập nhật lần cuối', children: formatDateTime(report.updatedAt) }] : []),
        ]}
      />
      <Text strong style={{ display: 'block', margin: '18px 0 8px' }}>
        Ghi chú xử lý
      </Text>
      <Input.TextArea rows={4} value={note} onChange={(e) => setNote(e.target.value)} disabled={closed} placeholder="Đã liên hệ ai, kết luận, biện pháp…" />
      <Flex gap={8} wrap style={{ marginTop: 14 }}>
        {report.status === 'open' && <Button onClick={() => setStatus('investigating')}>Bắt đầu xem xét</Button>}
        {!closed && (
          <>
            <Button type="primary" icon={<CheckOutlined />} onClick={() => setStatus('resolved')}>
              Đã xử lý
            </Button>
            <Button icon={<StopOutlined />} onClick={() => setStatus('dismissed')}>
              Bác bỏ
            </Button>
          </>
        )}
        {closed && <Button onClick={() => setStatus('investigating')}>Mở lại</Button>}
      </Flex>
    </Drawer>
  )
}

export default function Compliance() {
  const state = useDb()
  const reports = useMemo(() => state.reports || [], [state.reports])
  const [status, setStatus] = useState('active')
  const [severity, setSeverity] = useState(null)
  const [category, setCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)

  const rows = reports
    .map((r) => ({ ...r, ...describe(state, r) }))
    .filter((r) => {
      if (status === 'active' && (r.status === 'resolved' || r.status === 'dismissed')) return false
      if (status !== 'active' && status !== 'all' && r.status !== status) return false
      if (severity && r.severity !== severity) return false
      if (category && r.category !== category) return false
      const q = search.trim().toLowerCase()
      return !q || `${r.title} ${r.description} ${r.subjectName} ${r.hospital?.name}`.toLowerCase().includes(q)
    })
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.createdAt.localeCompare(a.createdAt))

  const active = reports.filter((r) => r.status === 'open' || r.status === 'investigating')
  const certIssues = state.nurses
    .map((n) => ({ nurse: n, issues: n.certificates.map((c) => ({ cert: c, st: certificateStatus(c) })).filter((x) => x.st.key === 'expired' || x.st.key === 'expiring') }))
    .filter((x) => x.nurse.certificates.length === 0 || x.issues.length)
  const unspotChecked = state.nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && !n.spotCheckedAt)

  const columns = [
    { title: 'Thời điểm', key: 'time', width: 130, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), render: (_, r) => <span title={formatDateTime(r.createdAt)}>{dayjs(r.createdAt).fromNow()}</span> },
    {
      title: 'Đối tượng bị báo cáo',
      key: 'subject',
      width: 230,
      sorter: (a, b) => compareText(a.subjectName, b.subjectName),
      render: (_, r) => (
        <div>
          <Text strong>{r.subjectName}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.subjectType === 'nurse' ? `Điều dưỡng · ${r.hospital?.name || ''}` : 'Bệnh viện'}
            </Text>
          </div>
        </div>
      ),
    },
    { title: 'Nội dung', key: 'title', width: 280, render: (_, r) => <Text ellipsis={{ tooltip: r.description }} style={{ maxWidth: 260 }}>{r.title}</Text> },
    { title: 'Danh mục', dataIndex: 'category', width: 150 },
    { title: 'Mức độ', key: 'sev', width: 130, render: (_, r) => <Tag color={SEVERITY_META[r.severity].color}>{SEVERITY_META[r.severity].label}</Tag> },
    { title: 'Người báo cáo', key: 'reporter', width: 200, render: (_, r) => <Text type="secondary">{r.reporter}</Text> },
    { title: 'Trạng thái', key: 'status', width: 130, render: (_, r) => <Tag color={STATUS_META[r.status].color}>{STATUS_META[r.status].label}</Tag> },
    {
      key: 'actions',
      align: 'right',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => setOpenId(r.id)}>
          Xem chi tiết
        </Button>
      ),
    },
  ]

  const reportsTab = (
    <>
      <Flex gap={10} wrap style={{ marginBottom: 14 }}>
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: <span>Cần xử lý <Badge count={active.length} size="small" /></span> },
            { value: 'resolved', label: 'Đã xử lý' },
            { value: 'dismissed', label: 'Bác bỏ' },
            { value: 'all', label: 'Tất cả' },
          ]}
        />
        <Select allowClear placeholder="Mức độ" value={severity} onChange={setSeverity} options={Object.entries(SEVERITY_META).map(([value, m]) => ({ value, label: m.label }))} style={{ width: 150 }} />
        <Select allowClear placeholder="Danh mục" value={category} onChange={setCategory} options={REPORT_CATEGORIES.map((c) => ({ value: c, label: c }))} style={{ width: 190 }} />
        <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm nội dung, điều dưỡng, bệnh viện" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 240px' }} />
      </Flex>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 1400 }}
        onRow={(r) => ({ onClick: () => setOpenId(r.id), style: { cursor: 'pointer' } })}
        locale={{ emptyText: 'Không có báo cáo nào' }}
      />
    </>
  )

  const certTab = certIssues.length ? (
    <Table
      rowKey={(x) => x.nurse.id}
      pagination={false}
      dataSource={certIssues}
      scroll={{ x: 720 }}
      columns={[
        { title: 'Điều dưỡng', key: 'n', render: (_, x) => <Text strong>{x.nurse.name}</Text> },
        { title: 'Bệnh viện', key: 'h', render: (_, x) => getHospital(state, x.nurse.hospitalId)?.name },
        {
          title: 'Vấn đề',
          key: 'i',
          render: (_, x) =>
            x.nurse.certificates.length === 0 ? (
              <Tag color="red">Thiếu chứng chỉ</Tag>
            ) : (
              x.issues.map(({ cert, st }) => (
                <Tag key={cert.id} color={st.color} icon={<WarningOutlined />}>
                  {cert.number}: {st.label} ({formatDate(cert.expiresAt)})
                </Tag>
              ))
            ),
        },
        { title: 'Trạng thái cấp phép', key: 's', render: (_, x) => <Tag color={AUTH_META[x.nurse.authStatus].color}>{AUTH_META[x.nurse.authStatus].label}</Tag> },
      ]}
    />
  ) : (
    <Empty description="Không có hồ sơ thiếu hoặc hết hạn chứng chỉ" />
  )

  const spotTab = unspotChecked.length ? (
    <Table
      rowKey="id"
      pagination={false}
      dataSource={unspotChecked}
      columns={[
        { title: 'Điều dưỡng', dataIndex: 'name' },
        { title: 'Bệnh viện', key: 'h', render: (_, n) => getHospital(state, n.hospitalId)?.name },
        {
          key: 'a',
          align: 'right',
          render: (_, n) => (
            <Button size="small" onClick={() => updateNurse(n.id, { spotCheckedAt: new Date().toISOString() })}>
              Đánh dấu đã kiểm tra
            </Button>
          ),
        },
      ]}
    />
  ) : (
    <Empty description="Tất cả điều dưỡng đã cấp phép đều đã được spot-check" />
  )

  return (
    <>
      <PageHead eyebrow="CareShift" title="Tuân thủ & chính sách" description="Các báo cáo vi phạm từ bệnh nhân, người nhà, bệnh viện và hệ thống — cùng kiểm tra chứng chỉ và spot-check định kỳ." />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Báo cáo cần xử lý" value={active.length} styles={{ content: { color: '#cf3c43' } }} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Mức độ nghiêm trọng" value={active.filter((r) => r.severity === 'high').length} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Chứng chỉ có vấn đề" value={certIssues.length} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Chưa spot-check" value={unspotChecked.length} />
          </Card>
        </Col>
      </Row>
      <Card>
        <Tabs
          items={[
            { key: 'reports', label: `Báo cáo vi phạm (${reports.length})`, children: reportsTab },
            { key: 'certs', label: `Chứng chỉ (${certIssues.length})`, children: certTab },
            {
              key: 'spot',
              label: `Spot-check (${unspotChecked.length})`,
              children: (
                <>
                  <Paragraph type="secondary">Đội vận hành kiểm tra chéo ngẫu nhiên, không xác minh lại từng hồ sơ.</Paragraph>
                  {spotTab}
                </>
              ),
            },
          ]}
        />
      </Card>
      {openId && <ReportDrawer report={reports.find((r) => r.id === openId)} onClose={() => setOpenId(null)} />}
    </>
  )
}
