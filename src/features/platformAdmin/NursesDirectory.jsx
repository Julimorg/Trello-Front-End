import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Avatar, Button, Card, Col, Flex, Input, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import NurseDrawer, { StatusTag } from './NurseDrawer'
import StatusControl from './StatusControl'
import { useDb } from '../../lib/store'
import { getHospital, setNurseAccountStatus } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { CARE_TYPES, DISTRICTS, SESSION_STATUS } from '../../lib/constants'
import { PLATFORM_STATUS_META, normalize } from './platform-shared'
import { AUTH_META, certificateStatus, compareByGivenName, initials } from '../hospitalAdmin/admin-shared'

const { Text } = Typography

const CERT_META = {
  missing: { label: 'Thiếu chứng chỉ', color: 'red' },
  expired: { label: 'Đã hết hạn', color: 'red' },
  expiring: { label: 'Sắp hết hạn', color: 'orange' },
  valid: { label: 'Còn hiệu lực', color: 'green' },
}

// Worst certificate state of a nurse + the soonest expiry date.
function certSummary(nurse) {
  if (!nurse.certificates.length) return { key: 'missing', days: null }
  const states = nurse.certificates.map((c) => certificateStatus(c))
  const withDays = states.filter((s) => typeof s.days === 'number')
  const days = withDays.length ? Math.min(...withDays.map((s) => s.days)) : null
  if (states.some((s) => s.key === 'expired')) return { key: 'expired', days }
  if (states.some((s) => s.key === 'expiring')) return { key: 'expiring', days }
  return { key: 'valid', days }
}

// "Điều dưỡng": every nurse across partner hospitals, with a certificate-expiry radar.
export default function NursesDirectory() {
  const state = useDb()
  const [search, setSearch] = useState('')
  const [hospital, setHospital] = useState(null)
  const [auth, setAuth] = useState(null)
  const [account, setAccount] = useState(null)
  const [cert, setCert] = useState(null)
  const [care, setCare] = useState(null)
  const [area, setArea] = useState(null)
  const [openNurse, setOpenNurse] = useState(null)

  const all = useMemo(() => {
    const monthStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const counts = {}
    state.bookings.forEach((b) => b.sessions.forEach((s) => s.date >= monthStart && s.status !== SESSION_STATUS.CANNOT_PERFORM && (counts[s.nurseId] = (counts[s.nurseId] || 0) + 1)))
    return state.nurses.map((n) => ({ ...n, hospitalName: getHospital(state, n.hospitalId)?.name || '—', cert: certSummary(n), sessions30: counts[n.id] || 0 }))
  }, [state])

  const rows = useMemo(() => {
    const q = normalize(search.trim())
    return all.filter(
      (n) =>
        (!hospital || n.hospitalId === hospital) &&
        (!auth || n.authStatus === auth) &&
        (!account || (n.accountStatus || 'active') === account) &&
        (!cert || n.cert.key === cert) &&
        (!care || n.specialties.includes(care)) &&
        (!area || n.serviceAreas.includes(area)) &&
        (!q || normalize(`${n.name} ${n.id} ${n.phone} ${n.hospitalName}`).includes(q)),
    )
  }, [all, search, hospital, auth, account, cert, care, area])

  const counts = {
    total: all.length,
    ready: all.filter((n) => n.authStatus === 'authorized' && (n.accountStatus || 'active') === 'active' && n.cert.key !== 'expired' && n.cert.key !== 'missing').length,
    expired: all.filter((n) => n.cert.key === 'expired' || n.cert.key === 'missing').length,
    expiring: all.filter((n) => n.cert.key === 'expiring').length,
    idle: all.filter((n) => n.authStatus === 'authorized' && n.sessions30 === 0).length,
  }

  const columns = [
    {
      title: 'Điều dưỡng',
      key: 'name',
      width: 250,
      fixed: 'left',
      sorter: (a, b) => compareByGivenName(a.name, b.name),
      defaultSortOrder: 'ascend',
      render: (_, n) => (
        <Flex gap={10} align="center">
          <Avatar style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>{initials(n.name)}</Avatar>
          <div>
            <Text strong>{n.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {n.rank} · {n.phone}
              </Text>
            </div>
          </div>
        </Flex>
      ),
    },
    { title: 'Bệnh viện', key: 'hospital', width: 210, sorter: (a, b) => a.hospitalName.localeCompare(b.hospitalName, 'vi'), render: (_, n) => <Link to={`/admin/hospitals/${n.hospitalId}`}>{n.hospitalName}</Link> },
    { title: 'Chuyên môn', key: 'sp', width: 230, render: (_, n) => <Flex gap={4} wrap>{n.specialties.map((s) => <Tag key={s} color="cyan" className="tag-wrap">{careTypeLabel(s)}</Tag>)}</Flex> },
    { title: 'Khu vực', key: 'area', width: 160, render: (_, n) => n.serviceAreas.join(', ') },
    {
      title: 'Chứng chỉ',
      key: 'cert',
      width: 170,
      sorter: (a, b) => (a.cert.days ?? -9999) - (b.cert.days ?? -9999),
      render: (_, n) => (
        <div>
          <Tag color={CERT_META[n.cert.key].color}>{CERT_META[n.cert.key].label}</Tag>
          {n.cert.days !== null && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {n.cert.days < 0 ? `Quá hạn ${-n.cert.days} ngày` : `Còn ${n.cert.days} ngày`}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    { title: 'Cấp phép', key: 'auth', width: 120, render: (_, n) => <Tag color={AUTH_META[n.authStatus].color}>{AUTH_META[n.authStatus].label}</Tag> },
    { title: 'Buổi / 30 ngày', dataIndex: 'sessions30', width: 130, sorter: (a, b) => a.sessions30 - b.sessions30 },
    { title: 'Tài khoản', key: 'acc', width: 120, render: (_, n) => <StatusTag status={n.accountStatus} reason={n.accountStatusReason} /> },
    {
      title: 'Hoạt động',
      key: 'act',
      width: 250,
      fixed: 'right',
      render: (_, n) => (
        <Space size={6}>
          <StatusControl status={n.accountStatus || 'active'} entityName={n.name} onChange={(next, reason) => setNurseAccountStatus(n.id, next, reason)} />
          <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => setOpenNurse(n.id)}>
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ]

  const exportRows = () =>
    downloadCsv(
      `careshift-dieu-duong-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Mã', value: (n) => n.id },
        { title: 'Họ tên', value: (n) => n.name },
        { title: 'Bệnh viện', value: (n) => n.hospitalName },
        { title: 'Cấp bậc', value: (n) => n.rank },
        { title: 'Điện thoại', value: (n) => n.phone },
        { title: 'Chuyên môn', value: (n) => n.specialties.map(careTypeLabel).join('; ') },
        { title: 'Khu vực', value: (n) => n.serviceAreas.join('; ') },
        { title: 'Chứng chỉ', value: (n) => CERT_META[n.cert.key].label },
        { title: 'Hạn chứng chỉ gần nhất', value: (n) => (n.certificates.map((c) => c.expiresAt).filter(Boolean).sort()[0] ? formatDate(n.certificates.map((c) => c.expiresAt).filter(Boolean).sort()[0]) : '') },
        { title: 'Cấp phép', value: (n) => AUTH_META[n.authStatus].label },
        { title: 'Tài khoản', value: (n) => PLATFORM_STATUS_META[n.accountStatus || 'active'].label },
        { title: 'Buổi 30 ngày', value: (n) => n.sessions30 },
      ],
      rows,
    )

  const card = (title, value, onClick, color) => (
    <Card size="small" hoverable={Boolean(onClick)} onClick={onClick}>
      <Statistic title={title} value={value} styles={{ content: { color: value && color ? color : undefined } }} />
    </Card>
  )

  return (
    <>
      <PageHead
        eyebrow="Supply side"
        title="Điều dưỡng toàn hệ thống"
        description="Toàn bộ điều dưỡng của các bệnh viện đối tác. Theo dõi chứng chỉ sắp hết hạn, người chưa có ca và khóa tài khoản khi cần."
        action={
          <Button icon={<DownloadOutlined />} onClick={exportRows}>
            Xuất CSV
          </Button>
        }
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>{card('Tổng điều dưỡng', counts.total)}</Col>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>{card('Sẵn sàng nhận ca', counts.ready, () => { setAuth('authorized'); setAccount('active') })}</Col>
        <Col xs={12} md={8} xl={{ flex: '20%' }}>{card('Chứng chỉ hết hạn / thiếu', counts.expired, () => setCert('expired'), '#cf3c43')}</Col>
        <Col xs={12} md={12} xl={{ flex: '20%' }}>{card('Chứng chỉ sắp hết hạn', counts.expiring, () => setCert('expiring'), '#b96b08')}</Col>
        <Col xs={24} md={12} xl={{ flex: '20%' }}>{card('Được cấp phép nhưng chưa có ca (30 ngày)', counts.idle, null, '#b96b08')}</Col>
      </Row>
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm tên, mã, số điện thoại, bệnh viện" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 260px' }} />
          <Select allowClear placeholder="Bệnh viện" value={hospital} onChange={setHospital} options={state.hospitals.map((h) => ({ value: h.id, label: h.name }))} style={{ flex: '0 1 200px' }} />
          <Select allowClear placeholder="Chứng chỉ" value={cert} onChange={setCert} options={Object.entries(CERT_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 160px' }} />
          <Select allowClear placeholder="Cấp phép" value={auth} onChange={setAuth} options={Object.entries(AUTH_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 150px' }} />
          <Select allowClear placeholder="Tài khoản" value={account} onChange={setAccount} options={Object.entries(PLATFORM_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 140px' }} />
          <Select allowClear placeholder="Chuyên môn" value={care} onChange={setCare} options={CARE_TYPES.filter((c) => c.id !== 'other').map((c) => ({ value: c.id, label: c.label }))} style={{ flex: '0 1 200px' }} />
          <Select allowClear placeholder="Khu vực" value={area} onChange={setArea} options={DISTRICTS.map((d) => ({ value: d, label: d }))} style={{ flex: '0 1 140px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1560 }}
          onRow={(n) => ({ onClick: () => setOpenNurse(n.id), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Không có điều dưỡng nào khớp bộ lọc' }}
        />
      </Card>
      {openNurse && <NurseDrawer nurse={state.nurses.find((n) => n.id === openNurse)} onClose={() => setOpenNurse(null)} />}
    </>
  )
}
