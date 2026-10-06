import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { Avatar, Badge, Button, Card, Col, Flex, Input, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import { CheckCircleFilled, DownloadOutlined, EditOutlined, EyeOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import PatientEditModal from './PatientEditModal'
import StatusControl from './StatusControl'
import { useDb } from '../../lib/store'
import { computeBookingStatus, setPatientAccountStatus } from '../../lib/db'
import { formatDate, formatDateTime } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { DISTRICTS } from '../../lib/constants'
import { PLATFORM_STATUS_META, ageOf, normalize } from './platform-shared'
import { compareByGivenName, initials } from '../hospitalAdmin/admin-shared'

const { Text } = Typography

const ACTIVITY_FILTERS = [
  { value: 'care', label: 'Đang có lịch chăm sóc' },
  { value: 'pending', label: 'Có yêu cầu đang chờ' },
  { value: 'sos', label: 'Có SOS chưa xử lý' },
  { value: 'reported', label: 'Đã gửi báo cáo vi phạm' },
  { value: 'idle', label: 'Không hoạt động > 7 ngày' },
]

const PENDING_REQUEST = ['created', 'matching', 'matched', 'nurse_pending', 'no_match']

// Builds the per-patient figures the table, filters and CSV share.
function summarize(state, p) {
  const requests = state.careRequests.filter((c) => c.patientId === p.id)
  const bookings = state.bookings.filter((b) => b.patientId === p.id)
  const sos = (state.sosEvents || []).filter((e) => e.patientId === p.id)
  return {
    ...p,
    requestCount: requests.length,
    pendingRequests: requests.filter((c) => PENDING_REQUEST.includes(c.status)).length,
    activeBookings: bookings.filter((b) => computeBookingStatus(b) !== 'completed').length,
    familyCount: (p.familyContacts || []).length,
    openSos: sos.filter((e) => (e.status || 'open') !== 'resolved').length,
    reportCount: (state.reports || []).filter((r) => r.reporterId === p.id).length,
    idleDays: dayjs().diff(dayjs(p.account?.lastActiveAt), 'day'),
  }
}

// "Tài khoản người dùng": every patient account on the platform.
export default function AccountsTable() {
  const state = useDb()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(null)
  const [district, setDistrict] = useState(null)
  const [verified, setVerified] = useState(null)
  const [activity, setActivity] = useState(null)
  const [editing, setEditing] = useState(null)

  const all = useMemo(() => state.patients.map((p) => summarize(state, p)), [state])

  const rows = useMemo(() => {
    const q = normalize(search.trim())
    return all.filter((p) => {
      if (status && (p.account?.status || 'active') !== status) return false
      if (district && p.district !== district) return false
      if (verified !== null && Boolean(p.account?.verified) !== verified) return false
      if (activity === 'care' && !p.activeBookings) return false
      if (activity === 'pending' && !p.pendingRequests) return false
      if (activity === 'sos' && !p.openSos) return false
      if (activity === 'reported' && !p.reportCount) return false
      if (activity === 'idle' && p.idleDays <= 7) return false
      return !q || normalize(`${p.name} ${p.id} ${p.phone} ${p.email} ${p.insuranceNumber} ${p.address}`).includes(q)
    })
  }, [all, search, status, district, verified, activity])

  const counts = {
    total: all.length,
    active: all.filter((p) => (p.account?.status || 'active') === 'active').length,
    restricted: all.filter((p) => (p.account?.status || 'active') !== 'active').length,
    unverified: all.filter((p) => !p.account?.verified).length,
    inCare: all.filter((p) => p.activeBookings).length,
  }

  const columns = [
    {
      title: 'Bệnh nhân',
      key: 'name',
      width: 250,
      fixed: 'left',
      sorter: (a, b) => compareByGivenName(a.name, b.name),
      defaultSortOrder: 'ascend',
      render: (_, p) => (
        <Flex gap={10} align="center">
          <Avatar style={{ background: '#eaf1fc', color: '#2b69c9', fontWeight: 800, flex: '0 0 auto' }}>{initials(p.name)}</Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong>{p.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {p.gender} · {ageOf(p.dateOfBirth)} tuổi · {p.id}
              </Text>
            </div>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 210,
      render: (_, p) => (
        <div>
          <Text>{p.phone}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {p.email}
            </Text>
          </div>
        </div>
      ),
    },
    { title: 'Khu vực', dataIndex: 'district', width: 120, sorter: (a, b) => a.district.localeCompare(b.district, 'vi') },
    {
      title: 'Xác minh',
      key: 'verified',
      width: 150,
      sorter: (a, b) => Number(Boolean(a.account?.verified)) - Number(Boolean(b.account?.verified)),
      render: (_, p) =>
        p.account?.verified ? (
          <Tooltip title={p.account.verifiedBy}>
            <Tag color="green" icon={<CheckCircleFilled />}>
              Đã xác minh
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="orange" icon={<WarningOutlined />}>
            Chưa xác minh
          </Tag>
        ),
    },
    {
      title: 'Chăm sóc',
      key: 'care',
      width: 170,
      sorter: (a, b) => a.requestCount - b.requestCount,
      render: (_, p) => (
        <Space size={4} wrap>
          <Tooltip title="Tổng yêu cầu đã tạo">
            <Tag>{p.requestCount} yêu cầu</Tag>
          </Tooltip>
          {p.activeBookings > 0 && <Tag color="blue">{p.activeBookings} lịch đang chạy</Tag>}
          {p.openSos > 0 && <Tag color="red">SOS chưa xử lý</Tag>}
        </Space>
      ),
    },
    { title: 'Người thân', key: 'family', width: 110, align: 'center', sorter: (a, b) => a.familyCount - b.familyCount, render: (_, p) => <Badge count={p.familyCount} showZero color={p.familyCount ? '#0b6b68' : '#c3cdcf'} /> },
    {
      title: 'Hoạt động gần nhất',
      key: 'lastActive',
      width: 160,
      sorter: (a, b) => (a.account?.lastActiveAt || '').localeCompare(b.account?.lastActiveAt || ''),
      render: (_, p) => (
        <Tooltip title={formatDateTime(p.account?.lastActiveAt)}>
          <Text type={p.idleDays > 7 ? 'warning' : undefined}>{p.account?.lastActiveAt ? dayjs(p.account.lastActiveAt).fromNow() : '—'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Ngày tham gia',
      key: 'joined',
      width: 130,
      sorter: (a, b) => (a.account?.joinedAt || '').localeCompare(b.account?.joinedAt || ''),
      render: (_, p) => formatDate(p.account?.joinedAt),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, p) => {
        const meta = PLATFORM_STATUS_META[p.account?.status || 'active']
        return (
          <Tooltip title={p.account?.statusReason}>
            <Tag color={meta.color}>{meta.label}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Hoạt động',
      key: 'actions',
      width: 350,
      fixed: 'right',
      render: (_, p) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <StatusControl status={p.account?.status || 'active'} entityName={p.name} onChange={(next, reason) => setPatientAccountStatus(p.id, next, reason)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(p)}>
            Sửa
          </Button>
          <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/admin/accounts/${p.id}`)}>
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ]

  const exportRows = () =>
    downloadCsv(
      `careshift-tai-khoan-benh-nhan-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Mã', value: (p) => p.id },
        { title: 'Họ tên', value: (p) => p.name },
        { title: 'Giới tính', value: (p) => p.gender },
        { title: 'Ngày sinh', value: (p) => formatDate(p.dateOfBirth) },
        { title: 'Điện thoại', value: (p) => p.phone },
        { title: 'Email', value: (p) => p.email },
        { title: 'Khu vực', value: (p) => p.district },
        { title: 'Địa chỉ', value: (p) => p.address },
        { title: 'BHYT', value: (p) => p.insuranceNumber },
        { title: 'Xác minh', value: (p) => (p.account?.verified ? p.account.verifiedBy : 'Chưa') },
        { title: 'Yêu cầu', value: (p) => p.requestCount },
        { title: 'Người thân', value: (p) => p.familyCount },
        { title: 'Tham gia', value: (p) => formatDate(p.account?.joinedAt) },
        { title: 'Hoạt động gần nhất', value: (p) => formatDateTime(p.account?.lastActiveAt) },
        { title: 'Trạng thái', value: (p) => PLATFORM_STATUS_META[p.account?.status || 'active'].label },
      ],
      rows,
    )

  const statCard = (title, value, onClick, color) => (
    <Card size="small" hoverable={Boolean(onClick)} onClick={onClick}>
      <Statistic title={title} value={value} styles={{ content: { color: value && color ? color : undefined } }} />
    </Card>
  )

  return (
    <>
      <PageHead
        eyebrow="Patient accounts"
        title="Tài khoản người dùng"
        description="Kiểm soát toàn bộ tài khoản bệnh nhân: hồ sơ, xác minh danh tính, hoạt động chăm sóc và trạng thái truy cập."
        action={
          <Button icon={<DownloadOutlined />} onClick={exportRows}>
            Xuất CSV
          </Button>
        }
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8} xl={5}>
          {statCard('Tổng tài khoản', counts.total)}
        </Col>
        <Col xs={12} md={8} xl={5}>
          {statCard('Đang hoạt động', counts.active, () => setStatus('active'))}
        </Col>
        <Col xs={12} md={8} xl={5}>
          {statCard('Tạm ngưng / khóa', counts.restricted, () => setStatus('suspended'), '#b96b08')}
        </Col>
        <Col xs={12} md={12} xl={5}>
          {statCard('Chưa xác minh danh tính', counts.unverified, () => setVerified(false), '#b96b08')}
        </Col>
        <Col xs={24} md={12} xl={4}>
          {statCard('Đang được chăm sóc', counts.inCare, () => setActivity('care'))}
        </Col>
      </Row>
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm tên, mã, SĐT, email, số BHYT, địa chỉ" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 280px' }} />
          <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={Object.entries(PLATFORM_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 140px' }} />
          <Select allowClear placeholder="Khu vực" value={district} onChange={setDistrict} options={DISTRICTS.map((d) => ({ value: d, label: d }))} style={{ flex: '0 1 140px' }} />
          <Select
            allowClear
            placeholder="Xác minh"
            value={verified}
            onChange={(v) => setVerified(v ?? null)}
            options={[
              { value: true, label: 'Đã xác minh' },
              { value: false, label: 'Chưa xác minh' },
            ]}
            style={{ flex: '0 1 150px' }}
          />
          <Select allowClear placeholder="Hoạt động" value={activity} onChange={setActivity} options={ACTIVITY_FILTERS} style={{ flex: '0 1 220px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1770 }}
          onRow={(p) => ({ onClick: () => navigate(`/admin/accounts/${p.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Không có tài khoản nào khớp bộ lọc' }}
        />
      </Card>
      <PatientEditModal open={Boolean(editing)} patient={editing && state.patients.find((p) => p.id === editing.id)} onClose={() => setEditing(null)} />
    </>
  )
}
