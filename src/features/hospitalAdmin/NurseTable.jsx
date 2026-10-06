import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Card, Flex, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { EyeOutlined, PlusOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import NurseAddModal from './NurseAddModal'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listNursesByHospital } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { CARE_TYPES, DISTRICTS } from '../../lib/constants'
import { AUTH_META, certificateStatus, compareByGivenName, initials } from './admin-shared'

const { Text } = Typography
const normalize = (t) =>
  (t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

export default function NurseTable() {
  const { session } = useAuth()
  const state = useDb()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(null)
  const [careType, setCareType] = useState(null)
  const [area, setArea] = useState(null)

  const nurses = listNursesByHospital(state, session.id)
  const rows = useMemo(() => {
    const q = normalize(search.trim())
    return nurses.filter(
      (n) =>
        (!status || n.authStatus === status) &&
        (!careType || n.specialties.includes(careType)) &&
        (!area || n.serviceAreas.includes(area)) &&
        (!q || normalize(`${n.name} ${n.id} ${n.phone}`).includes(q)),
    )
  }, [nurses, search, status, careType, area])

  const columns = [
    {
      title: 'Điều dưỡng',
      key: 'name',
      width: 240,
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
    {
      title: 'Chuyên môn',
      key: 'specialties',
      width: 250,
      render: (_, n) => (
        <Flex gap={4} wrap>
          {n.specialties.map((s) => (
            <Tag key={s} color="cyan" className="tag-wrap">
              {careTypeLabel(s)}
            </Tag>
          ))}
        </Flex>
      ),
    },
    { title: 'Khu vực', key: 'areas', width: 170, render: (_, n) => n.serviceAreas.join(', ') },
    {
      title: 'Chứng chỉ',
      key: 'certs',
      width: 130,
      sorter: (a, b) => a.certificates.length - b.certificates.length,
      render: (_, n) => {
        const expired = n.certificates.filter((c) => certificateStatus(c).key === 'expired').length
        return (
          <Space size={4}>
            <Text>{n.certificates.length}</Text>
            {n.certificates.length === 0 && <Tag color="red">Thiếu</Tag>}
            {expired > 0 && (
              <Tooltip title={`${expired} chứng chỉ đã hết hạn`}>
                <Tag color="red" icon={<WarningOutlined />}>
                  Hết hạn
                </Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: (_, n) => <Tag color={AUTH_META[n.authStatus].color}>{AUTH_META[n.authStatus].label}</Tag>,
    },
    {
      key: 'actions',
      align: 'right',
      width: 140,
      fixed: 'right',
      render: (_, n) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/hospital/admin/roster/${n.id}`)
          }}
        >
          Xem hồ sơ
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHead
        eyebrow="Hospital roster"
        title="Danh sách điều dưỡng"
        description="Quản lý hồ sơ, chứng chỉ, phạm vi hành nghề và trạng thái cấp phép."
        action={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            Thêm điều dưỡng
          </Button>
        }
      />
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm theo tên, mã nhân sự, số điện thoại" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 260px' }} />
          <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={Object.entries(AUTH_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 170px' }} />
          <Select allowClear placeholder="Chuyên môn" value={careType} onChange={setCareType} options={CARE_TYPES.filter((c) => c.id !== 'other').map((c) => ({ value: c.id, label: c.label }))} style={{ flex: '0 1 210px' }} />
          <Select allowClear placeholder="Khu vực" value={area} onChange={setArea} options={DISTRICTS.map((d) => ({ value: d, label: d }))} style={{ flex: '0 1 150px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1060 }}
          onRow={(n) => ({ onClick: () => navigate(`/hospital/admin/roster/${n.id}`), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Không có điều dưỡng nào khớp bộ lọc' }}
        />
      </Card>
      <NurseAddModal open={addOpen} onClose={() => setAddOpen(false)} hospitalId={session.id} />
    </>
  )
}
