import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { Avatar, Button, Card, Col, Flex, Input, Popover, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import { DownloadOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import HospitalFormModal from './HospitalFormModal'
import StatusControl from './StatusControl'
import { useDb } from '../../lib/store'
import { setHospitalStatus } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { PARTNER_REGIONS } from '../../Data/admin/partner-data'
import { CONTRACT_FILTERS, PLATFORM_STATUS_META, contractState } from './platform-shared'
import { compareText, initials } from '../hospitalAdmin/admin-shared'

const { Text } = Typography
const normalize = (t) =>
  (t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

// Portal for every partner hospital in the region: contracts, representatives, branches, status.
export default function HospitalsTable() {
  const state = useDb()
  const navigate = useNavigate()
  const warningDays = state.settings?.contractWarningDays ?? 60
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState(null)
  const [status, setStatus] = useState(null)
  const [contract, setContract] = useState(null)
  const [type, setType] = useState(null)
  const [editing, setEditing] = useState(undefined)

  const rows = useMemo(() => {
    const q = normalize(search.trim())
    return state.hospitals
      .map((h) => ({ ...h, contractInfo: contractState(h.contract, warningDays), nurseCount: state.nurses.filter((n) => n.hospitalId === h.id).length }))
      .filter(
        (h) =>
          (!region || h.region === region) &&
          (!status || h.status === status) &&
          (!contract || h.contractInfo.key === contract) &&
          (!type || h.type === type) &&
          (!q || normalize(`${h.name} ${h.address} ${h.representative?.name} ${h.contract?.number} ${(h.branches || []).map((b) => b.name).join(' ')}`).includes(q)),
      )
  }, [state.hospitals, state.nurses, search, region, status, contract, type, warningDays])

  const all = state.hospitals.map((h) => contractState(h.contract, warningDays))
  const counts = {
    active: state.hospitals.filter((h) => h.status === 'active').length,
    paused: state.hospitals.filter((h) => h.status !== 'active').length,
    expiring: all.filter((c) => c.key === 'expiring').length,
    expired: all.filter((c) => c.key === 'expired').length,
  }

  const columns = [
    {
      title: 'Bệnh viện',
      key: 'name',
      width: 290,
      fixed: 'left',
      sorter: (a, b) => compareText(a.name, b.name),
      defaultSortOrder: 'ascend',
      render: (_, h) => (
        <Flex gap={10} align="center">
          <Avatar shape="square" style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>
            {initials(h.name.replace('Bệnh viện', '')) || 'BV'}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong>{h.name}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {h.type} · {h.region} · {h.nurseCount} điều dưỡng
              </Text>
            </div>
          </div>
        </Flex>
      ),
    },
    {
      title: 'Thời hạn hợp đồng',
      key: 'contract',
      width: 210,
      sorter: (a, b) => (a.contract?.endDate || '').localeCompare(b.contract?.endDate || ''),
      render: (_, h) => (
        <div>
          <Text>
            {formatDate(h.contract?.startDate)} → {formatDate(h.contract?.endDate)}
          </Text>
          <div>
            <Tag color={h.contractInfo.color} style={{ marginTop: 4 }}>
              {h.contractInfo.label}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Người đại diện',
      key: 'rep',
      width: 220,
      sorter: (a, b) => compareText(a.representative?.name, b.representative?.name),
      render: (_, h) => (
        <div>
          <Text>{h.representative?.name}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {h.representative?.title} · {h.representative?.phone}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Chi nhánh',
      key: 'branches',
      width: 120,
      sorter: (a, b) => (a.branches?.length || 0) - (b.branches?.length || 0),
      render: (_, h) => (
        <Popover
          title={`Chi nhánh · ${h.name}`}
          content={
            <div style={{ maxWidth: 320 }}>
              {(h.branches || []).map((b) => (
                <div key={b.id} style={{ marginBottom: 6 }}>
                  <Text strong>{b.name}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {b.address}
                    </Text>
                  </div>
                </div>
              ))}
              {!h.branches?.length && <Text type="secondary">Chưa có chi nhánh</Text>}
            </div>
          }
        >
          <Tag color="blue" style={{ cursor: 'pointer' }}>
            {h.branches?.length || 0} chi nhánh
          </Tag>
        </Popover>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, h) => (
        <Tooltip title={h.statusReason}>
          <Tag color={PLATFORM_STATUS_META[h.status].color}>{PLATFORM_STATUS_META[h.status].label}</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Hoạt động',
      key: 'actions',
      width: 350,
      fixed: 'right',
      render: (_, h) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <StatusControl status={h.status} entityName={h.name} onChange={(next, reason) => setHospitalStatus(h.id, next, reason)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(h)}>
            Sửa
          </Button>
          <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => navigate(`/admin/hospitals/${h.id}`)}>
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ]

  const exportRows = () =>
    downloadCsv(
      `careshift-benh-vien-doi-tac-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Mã', value: (h) => h.id },
        { title: 'Bệnh viện', value: (h) => h.name },
        { title: 'Khu vực', value: (h) => h.region },
        { title: 'Địa chỉ', value: (h) => h.address },
        { title: 'Người đại diện', value: (h) => h.representative?.name },
        { title: 'Số hợp đồng', value: (h) => h.contract?.number },
        { title: 'Hiệu lực từ', value: (h) => formatDate(h.contract?.startDate) },
        { title: 'Hiệu lực đến', value: (h) => formatDate(h.contract?.endDate) },
        { title: 'Chi nhánh', value: (h) => h.branches?.length || 0 },
        { title: 'Điều dưỡng', value: (h) => h.nurseCount },
        { title: 'Trạng thái', value: (h) => PLATFORM_STATUS_META[h.status].label },
      ],
      rows,
    )

  return (
    <>
      <PageHead
        eyebrow="Partner network"
        title="Bệnh viện đối tác"
        description="Cổng quản lý các bệnh viện đối tác trong khu vực: hợp đồng, người đại diện, chi nhánh và trạng thái hoạt động."
        action={
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={exportRows}>
              Xuất CSV
            </Button>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setEditing(null)}>
              Thêm bệnh viện
            </Button>
          </Space>
        }
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Đối tác hoạt động" value={counts.active} suffix={`/ ${state.hospitals.length}`} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Tạm ngưng / khóa" value={counts.paused} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" hoverable onClick={() => setContract('expiring')}>
            <Statistic title={`Hợp đồng sắp hết hạn (≤ ${warningDays} ngày)`} value={counts.expiring} styles={{ content: { color: counts.expiring ? '#b96b08' : undefined } }} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small" hoverable onClick={() => setContract('expired')}>
            <Statistic title="Hợp đồng đã hết hạn" value={counts.expired} styles={{ content: { color: counts.expired ? '#cf3c43' : undefined } }} />
          </Card>
        </Col>
      </Row>
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm tên, địa chỉ, người đại diện, số hợp đồng, chi nhánh" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 280px' }} />
          <Select allowClear placeholder="Khu vực" value={region} onChange={setRegion} options={PARTNER_REGIONS.map((r) => ({ value: r, label: r }))} style={{ flex: '0 1 180px' }} />
          <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={Object.entries(PLATFORM_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 150px' }} />
          <Select allowClear placeholder="Hợp đồng" value={contract} onChange={setContract} options={CONTRACT_FILTERS} style={{ flex: '0 1 170px' }} />
          <Select allowClear placeholder="Loại hình" value={type} onChange={setType} options={['Công lập', 'Tư nhân'].map((v) => ({ value: v, label: v }))} style={{ flex: '0 1 140px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1340 }}
          onRow={(h) => ({ onClick: () => navigate(`/admin/hospitals/${h.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Không có bệnh viện nào khớp bộ lọc' }}
        />
      </Card>
      <HospitalFormModal open={editing !== undefined} hospital={editing || null} onClose={() => setEditing(undefined)} onSaved={(id) => !editing && navigate(`/admin/hospitals/${id}`)} />
    </>
  )
}
