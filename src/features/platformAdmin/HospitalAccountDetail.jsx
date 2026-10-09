import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Flex,
  Input,
  Modal,
  Result,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  LinkOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import HospitalFormModal from './HospitalFormModal'
import StatusControl from './StatusControl'
import NurseDrawer, { StatusTag } from './NurseDrawer'
import { useDb } from '../../lib/store'
import { getHospital, setHospitalStatus, setNurseAccountStatus, setStaffStatus, updateHospital } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { CARE_TYPES } from '../../lib/constants'
import { PLATFORM_STATUS_META, contractState } from './platform-shared'
import { AUTH_META, certificateStatus, compareByGivenName, compareText, formatFileSize, initials } from '../hospitalAdmin/admin-shared'

const { Text, Title } = Typography

function TeamTab({ hospital }) {
  const state = useDb()
  const [view, setView] = useState('nurses')
  const [search, setSearch] = useState('')
  const [auth, setAuth] = useState(null)
  const [account, setAccount] = useState(null)
  const [care, setCare] = useState(null)
  const [openNurse, setOpenNurse] = useState(null)

  const nurses = state.nurses
    .filter((n) => n.hospitalId === hospital.id)
    .filter(
      (n) =>
        (!auth || n.authStatus === auth) &&
        (!account || (n.accountStatus || 'active') === account) &&
        (!care || n.specialties.includes(care)) &&
        (!search.trim() || `${n.name} ${n.phone} ${n.id}`.toLowerCase().includes(search.trim().toLowerCase())),
    )
  const staff = (hospital.staff || []).filter(
    (m) => (!account || m.status === account) && (!search.trim() || `${m.name} ${m.email} ${m.role}`.toLowerCase().includes(search.trim().toLowerCase())),
  )

  const nurseColumns = [
    {
      title: 'Điều dưỡng',
      key: 'name',
      sorter: (a, b) => compareByGivenName(a.name, b.name),
      defaultSortOrder: 'ascend',
      render: (_, n) => (
        <Flex gap={8} align="center">
          <Avatar size="small" style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>
            {initials(n.name)}
          </Avatar>
          <span>
            <Text strong>{n.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {n.rank} · {n.phone}
              </Text>
            </div>
          </span>
        </Flex>
      ),
    },
    { title: 'Chuyên môn', key: 'sp', render: (_, n) => n.specialties.map(careTypeLabel).join(', ') },
    { title: 'Kinh nghiệm', key: 'exp', sorter: (a, b) => a.experienceYears - b.experienceYears, render: (_, n) => `${n.experienceYears} năm` },
    {
      title: 'Chứng chỉ',
      key: 'cert',
      render: (_, n) => {
        const bad = n.certificates.filter((c) => certificateStatus(c).key === 'expired').length
        return n.certificates.length === 0 ? <Tag color="red">Thiếu</Tag> : bad ? <Tag color="red">{bad} hết hạn</Tag> : <Tag color="green">Hợp lệ</Tag>
      },
    },
    { title: 'Cấp phép', key: 'auth', render: (_, n) => <Tag color={AUTH_META[n.authStatus].color}>{AUTH_META[n.authStatus].label}</Tag> },
    { title: 'Tài khoản', key: 'acc', render: (_, n) => <StatusTag status={n.accountStatus} reason={n.accountStatusReason} /> },
    {
      title: 'Hoạt động',
      key: 'actions',
      align: 'right',
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

  const staffColumns = [
    { title: 'Họ tên', dataIndex: 'name', sorter: (a, b) => compareByGivenName(a.name, b.name), defaultSortOrder: 'ascend', render: (v) => <Text strong>{v}</Text> },
    { title: 'Vai trò', dataIndex: 'role', sorter: (a, b) => compareText(a.role, b.role) },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Điện thoại', dataIndex: 'phone' },
    { title: 'Trạng thái', key: 'st', render: (_, m) => <StatusTag status={m.status} /> },
    {
      title: 'Hoạt động',
      key: 'actions',
      align: 'right',
      render: (_, m) => <StatusControl status={m.status} entityName={m.name} onChange={(next) => setStaffStatus(hospital.id, m.id, next)} />,
    },
  ]

  return (
    <>
      <Flex gap={10} wrap style={{ marginBottom: 14 }}>
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'nurses', label: `Điều dưỡng (${state.nurses.filter((n) => n.hospitalId === hospital.id).length})` },
            { value: 'staff', label: `Nhân sự quản lý (${hospital.staff?.length || 0})` },
          ]}
        />
        <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm tên, điện thoại, email" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 220px' }} />
        {view === 'nurses' && (
          <>
            <Select allowClear placeholder="Cấp phép" value={auth} onChange={setAuth} options={Object.entries(AUTH_META).map(([value, m]) => ({ value, label: m.label }))} style={{ width: 150 }} />
            <Select allowClear placeholder="Chuyên môn" value={care} onChange={setCare} options={CARE_TYPES.filter((c) => c.id !== 'other').map((c) => ({ value: c.id, label: c.label }))} style={{ width: 200 }} />
          </>
        )}
        <Select allowClear placeholder="Trạng thái tài khoản" value={account} onChange={setAccount} options={Object.entries(PLATFORM_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} style={{ width: 180 }} />
      </Flex>
      {view === 'nurses' ? (
        <Table rowKey="id" columns={nurseColumns} dataSource={nurses} pagination={{ pageSize: 8, hideOnSinglePage: true }} scroll={{ x: 1100 }} locale={{ emptyText: 'Bệnh viện chưa có điều dưỡng trên CareShift' }} />
      ) : (
        <Table rowKey="id" columns={staffColumns} dataSource={staff} pagination={false} scroll={{ x: 900 }} locale={{ emptyText: 'Chưa có nhân sự quản lý' }} />
      )}
      {openNurse && <NurseDrawer nurse={state.nurses.find((n) => n.id === openNurse)} onClose={() => setOpenNurse(null)} />}
    </>
  )
}

function ContractTab({ hospital, warningDays }) {
  const { message } = App.useApp()
  const [renewOpen, setRenewOpen] = useState(false)
  const [newEnd, setNewEnd] = useState(null)
  const c = hospital.contract || {}
  const info = contractState(c, warningDays)
  const pdfUrl = c.file?.url

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={11}>
        <Card size="small" title="Thông tin hợp đồng" extra={<Button size="small" onClick={() => (setNewEnd(dayjs(c.endDate).add(1, 'year')), setRenewOpen(true))}>Gia hạn</Button>}>
          <Descriptions
            size="small"
            column={1}
            items={[
              { key: 'no', label: 'Số hợp đồng', children: <Text code>{c.number}</Text> },
              { key: 'signed', label: 'Ngày ký', children: formatDate(c.signedAt) || '—' },
              {
                key: 'term',
                label: 'Thời hạn hai bên',
                children: (
                  <span>
                    {formatDate(c.startDate)} → {formatDate(c.endDate)} <Tag color={info.color}>{info.label}</Tag>
                  </span>
                ),
              },
              { key: 'scope', label: 'Phạm vi', children: (c.scope || []).map((s) => <Tag key={s}>{s}</Tag>) },
              { key: 'rep', label: 'Đại diện bệnh viện', children: `${hospital.representative?.name} — ${hospital.representative?.title}` },
            ]}
          />
        </Card>
        <Card size="small" title="Chữ ký số" style={{ marginTop: 16 }}>
          {(c.signatures || []).length === 0 ? (
            <Alert type="warning" showIcon title="Hợp đồng chưa được ký số" />
          ) : (
            <Flex vertical gap={10}>
              {c.signatures.map((s) => {
                const valid = dayjs(s.certificate.validTo).isAfter(dayjs(s.signedAt))
                return (
                  <div key={s.party} className="signature-card">
                    <Flex justify="space-between" align="flex-start" gap={8} wrap>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {s.party === 'hospital' ? 'BÊN A · Bệnh viện' : 'BÊN B · CareShift'}
                        </Text>
                        <div>
                          <Text strong>{s.name}</Text> · <Text type="secondary">{s.title}</Text>
                        </div>
                      </div>
                      {valid ? (
                        <Tag color="green" icon={<CheckCircleFilled />}>
                          Chữ ký hợp lệ
                        </Tag>
                      ) : (
                        <Tag color="red">Chứng thư hết hạn</Tag>
                      )}
                    </Flex>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ký lúc {formatDateTime(s.signedAt)} · {s.certificate.issuer} · Serial {s.certificate.serial} · chứng thư đến {formatDate(s.certificate.validTo)}
                    </Text>
                  </div>
                )
              })}
            </Flex>
          )}
        </Card>
      </Col>
      <Col xs={24} xl={13}>
        <Card
          size="small"
          title={
            <span>
              <FilePdfOutlined style={{ color: '#cf3c43' }} /> {c.file?.name || 'File hợp đồng'}
              {c.file?.size ? <Text type="secondary"> · {formatFileSize(c.file.size)}</Text> : null}
            </span>
          }
          extra={
            pdfUrl && (
              <Space>
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <Button size="small" icon={<LinkOutlined />}>
                    Mở tab mới
                  </Button>
                </a>
                <a href={pdfUrl} download={c.file.name}>
                  <Button size="small" icon={<DownloadOutlined />}>
                    Tải PDF
                  </Button>
                </a>
              </Space>
            )
          }
        >
          {pdfUrl ? <iframe className="contract-viewer" src={pdfUrl} title={c.file.name} /> : <Empty description="Chưa có file hợp đồng (PDF)" />}
        </Card>
      </Col>
      <Modal
        open={renewOpen}
        title={`Gia hạn hợp đồng ${c.number}`}
        okText="Gia hạn"
        cancelText="Hủy"
        okButtonProps={{ disabled: !newEnd }}
        onCancel={() => setRenewOpen(false)}
        onOk={() => {
          updateHospital(hospital.id, { contract: { ...c, endDate: newEnd.format('YYYY-MM-DD') } }, { auditAction: `Gia hạn hợp đồng đến ${newEnd.format('DD/MM/YYYY')}` })
          setRenewOpen(false)
          message.success('Đã gia hạn hợp đồng')
        }}
      >
        <Text>Hiệu lực hiện tại đến {formatDate(c.endDate)}. Chọn ngày hết hạn mới:</Text>
        <DatePicker style={{ width: '100%', marginTop: 10 }} format="DD/MM/YYYY" value={newEnd} onChange={setNewEnd} disabledDate={(d) => d.isBefore(dayjs(c.endDate), 'day')} />
      </Modal>
    </Row>
  )
}

export default function HospitalAccountDetail() {
  const { id } = useParams()
  const state = useDb()
  const hospital = getHospital(state, id)
  const [editOpen, setEditOpen] = useState(false)
  const warningDays = state.settings?.contractWarningDays ?? 60

  const stats = useMemo(() => {
    if (!hospital) return null
    const nurses = state.nurses.filter((n) => n.hospitalId === hospital.id)
    const nurseIds = new Set(nurses.map((n) => n.id))
    const monthPrefix = dayjs().format('YYYY-MM')
    const sessions = state.bookings.flatMap((b) => b.sessions.filter((s) => nurseIds.has(s.nurseId)))
    return {
      nurses: nurses.length,
      authorized: nurses.filter((n) => n.authStatus === 'authorized' && (n.accountStatus || 'active') === 'active').length,
      sessionsThisMonth: sessions.filter((s) => s.date.startsWith(monthPrefix)).length,
      openReports: (state.reports || []).filter(
        (r) => ['open', 'investigating'].includes(r.status) && ((r.subjectType === 'hospital' && r.subjectId === hospital.id) || (r.subjectType === 'nurse' && nurseIds.has(r.subjectId))),
      ).length,
      nurseIds,
    }
  }, [state, hospital])

  if (!hospital) {
    return (
      <Result
        status="404"
        title="Không tìm thấy bệnh viện"
        extra={
          <Link to="/admin/hospitals">
            <Button type="primary">Về danh sách đối tác</Button>
          </Link>
        }
      />
    )
  }

  const info = contractState(hospital.contract, warningDays)
  const logs = (state.auditLogs || [])
    .filter((l) => l.targetId === hospital.id || stats.nurseIds.has(l.targetId) || (hospital.staff || []).some((m) => m.id === l.targetId))
    .sort((a, b) => b.at.localeCompare(a.at))

  return (
    <>
      <Link to="/admin/hospitals" className="back-link">
        <ArrowLeftOutlined /> Bệnh viện đối tác
      </Link>
      <Card className="session-hero">
        <Flex justify="space-between" gap={16} wrap>
          <Flex gap={14} align="center" style={{ flex: '1 1 380px' }}>
            <Avatar shape="square" size={60} style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, fontSize: 20, flex: '0 0 auto' }}>
              {initials(hospital.name.replace('Bệnh viện', '')) || 'BV'}
            </Avatar>
            <div>
              <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
                ĐỐI TÁC · {hospital.region?.toUpperCase()}
              </Text>
              <Title level={3} style={{ margin: '2px 0' }}>
                {hospital.name}
              </Title>
              <Space size={6} wrap>
                <StatusTag status={hospital.status} reason={hospital.statusReason} />
                <Tag>{hospital.type}</Tag>
                <Tag color={info.color}>Hợp đồng: {info.label}</Tag>
              </Space>
            </div>
          </Flex>
          <Space wrap>
            <StatusControl size="middle" status={hospital.status} entityName={hospital.name} onChange={(next, reason) => setHospitalStatus(hospital.id, next, reason)} />
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              Thay đổi thông tin
            </Button>
          </Space>
        </Flex>
        {hospital.status !== 'active' && (
          <Alert
            style={{ marginTop: 14 }}
            type={hospital.status === 'locked' ? 'error' : 'warning'}
            showIcon
            title={`${PLATFORM_STATUS_META[hospital.status].label}: ${PLATFORM_STATUS_META[hospital.status].hint}`}
            description={hospital.statusReason ? `Lý do: ${hospital.statusReason}${hospital.statusChangedAt ? ` · từ ${formatDateTime(hospital.statusChangedAt)}` : ''}` : undefined}
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ margin: '16px 0' }}>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Điều dưỡng" value={stats.nurses} suffix={<Text type="secondary" style={{ fontSize: 13 }}>· {stats.authorized} sẵn sàng</Text>} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Ca trong tháng" value={stats.sessionsThisMonth} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Chi nhánh" value={hospital.branches?.length || 0} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Báo cáo đang mở" value={stats.openReports} styles={{ content: { color: stats.openReports ? '#cf3c43' : undefined } }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: 'info',
              label: 'Thông tin chung',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={14}>
                    <Descriptions
                      bordered
                      size="small"
                      column={1}
                      items={[
                        { key: 'addr', label: 'Địa chỉ', children: hospital.address },
                        { key: 'region', label: 'Khu vực', children: `${hospital.region} · ${hospital.district}` },
                        { key: 'phone', label: 'Điện thoại', children: hospital.phone },
                        { key: 'email', label: 'Email', children: hospital.email || '—' },
                        { key: 'web', label: 'Website', children: hospital.website || '—' },
                        { key: 'license', label: 'Giấy phép hoạt động', children: hospital.licenseNumber || '—' },
                        { key: 'tax', label: 'Mã số thuế', children: hospital.taxCode || '—' },
                        { key: 'beds', label: 'Quy mô', children: hospital.beds ? `${hospital.beds.toLocaleString('vi-VN')} giường` : '—' },
                        { key: 'created', label: 'Tham gia CareShift', children: formatDate(hospital.createdAt) },
                      ]}
                    />
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card size="small" title="Người đại diện">
                      <Flex gap={12} align="center">
                        <Avatar size={48} style={{ background: '#eaf1fc', color: '#2b69c9', fontWeight: 800 }}>
                          {initials(hospital.representative?.name)}
                        </Avatar>
                        <div>
                          <Text strong>{hospital.representative?.name}</Text>
                          <div>
                            <Text type="secondary">{hospital.representative?.title}</Text>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {hospital.representative?.phone} · {hospital.representative?.email}
                          </Text>
                        </div>
                      </Flex>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            { key: 'contract', label: 'Hợp đồng & chữ ký số', children: <ContractTab hospital={hospital} warningDays={warningDays} /> },
            {
              key: 'branches',
              label: `Chi nhánh (${hospital.branches?.length || 0})`,
              children: (
                <Table
                  rowKey="id"
                  size="middle"
                  pagination={false}
                  dataSource={hospital.branches || []}
                  scroll={{ x: 760 }}
                  locale={{ emptyText: 'Chưa có chi nhánh' }}
                  columns={[
                    { title: 'Chi nhánh', dataIndex: 'name', render: (v) => <Text strong>{v}</Text> },
                    { title: 'Địa chỉ', dataIndex: 'address' },
                    { title: 'Điện thoại', dataIndex: 'phone' },
                    { title: 'Phụ trách', dataIndex: 'manager' },
                  ]}
                />
              ),
            },
            { key: 'team', label: 'Đội ngũ & nhân lực', children: <TeamTab hospital={hospital} /> },
            {
              key: 'log',
              label: (
                <span>
                  Nhật ký <Badge count={logs.length} size="small" color="#94a4a7" />
                </span>
              ),
              children: logs.length ? (
                <Timeline
                  items={logs.map((l) => ({
                    key: l.id,
                    content: (
                      <>
                        <Text strong>{l.action}</Text> · {l.targetName}
                        {l.detail && <div><Text type="secondary">{l.detail}</Text></div>}
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
              ),
            },
          ]}
        />
      </Card>
      <HospitalFormModal open={editOpen} hospital={hospital} onClose={() => setEditOpen(false)} />
    </>
  )
}
