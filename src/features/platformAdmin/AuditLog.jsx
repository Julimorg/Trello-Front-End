import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Button, Card, DatePicker, Flex, Input, Select, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { formatDateTime } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { AUDIT_TARGET_LABEL } from '../../Data/admin/audit-data'
import { normalize } from './platform-shared'

const { Text } = Typography
const TARGET_COLOR = { hospital: 'geekblue', nurse: 'cyan', patient: 'blue', report: 'volcano', broadcast: 'purple', settings: 'default', staff: 'gold' }

const actionColor = (action) => {
  if (/Khóa/.test(action)) return 'red'
  if (/Tạm ngưng/.test(action)) return 'orange'
  if (/Hoạt động|Ký hợp đồng|Gia hạn|Thêm/.test(action)) return 'green'
  return undefined
}

const targetLink = (l) => {
  if (l.targetType === 'hospital') return `/admin/hospitals/${l.targetId}`
  if (l.targetType === 'patient') return `/admin/accounts/${l.targetId}`
  if (l.targetType === 'report') return '/admin/compliance'
  if (l.targetType === 'broadcast') return '/admin/broadcasts'
  if (l.targetType === 'settings') return '/admin/settings'
  return null
}

// "Nhật ký hoạt động": every admin change on the platform, for accountability and audits.
export default function AuditLog() {
  const state = useDb()
  const [search, setSearch] = useState('')
  const [type, setType] = useState(null)
  const [actor, setActor] = useState(null)
  const [range, setRange] = useState(null)

  const logs = useMemo(() => state.auditLogs || [], [state.auditLogs])
  const actors = [...new Set(logs.map((l) => l.actor))]
  const rows = useMemo(() => {
    const q = normalize(search.trim())
    return logs
      .filter(
        (l) =>
          (!type || l.targetType === type) &&
          (!actor || l.actor === actor) &&
          (!range || (dayjs(l.at).isAfter(range[0].startOf('day')) && dayjs(l.at).isBefore(range[1].endOf('day')))) &&
          (!q || normalize(`${l.action} ${l.targetName} ${l.detail} ${l.targetId}`).includes(q)),
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [logs, search, type, actor, range])

  const exportRows = () =>
    downloadCsv(
      `careshift-nhat-ky-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Thời gian', value: (l) => formatDateTime(l.at) },
        { title: 'Người thực hiện', value: (l) => l.actor },
        { title: 'Hành động', value: (l) => l.action },
        { title: 'Loại đối tượng', value: (l) => AUDIT_TARGET_LABEL[l.targetType] },
        { title: 'Đối tượng', value: (l) => l.targetName },
        { title: 'Chi tiết', value: (l) => l.detail || '' },
      ],
      rows,
    )

  return (
    <>
      <PageHead
        eyebrow="Audit trail"
        title="Nhật ký hoạt động"
        description="Mọi thay đổi của quản trị viên: trạng thái, thông tin, hợp đồng, cấu hình và thông báo — phục vụ truy vết và kiểm toán."
        action={
          <Button icon={<DownloadOutlined />} onClick={exportRows}>
            Xuất CSV
          </Button>
        }
      />
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm hành động, đối tượng, chi tiết" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 260px' }} />
          <Select allowClear placeholder="Loại đối tượng" value={type} onChange={setType} options={Object.entries(AUDIT_TARGET_LABEL).map(([value, label]) => ({ value, label }))} style={{ flex: '0 1 180px' }} />
          <Select allowClear placeholder="Người thực hiện" value={actor} onChange={setActor} options={actors.map((a) => ({ value: a, label: a }))} style={{ flex: '0 1 170px' }} />
          <DatePicker.RangePicker format="DD/MM/YYYY" value={range} onChange={setRange} style={{ flex: '0 1 260px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          dataSource={rows}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          scroll={{ x: 960 }}
          locale={{ emptyText: 'Không có hoạt động nào khớp bộ lọc' }}
          columns={[
            { title: 'Thời gian', dataIndex: 'at', width: 160, render: (v) => <div>{formatDateTime(v)}<div><Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).fromNow()}</Text></div></div> },
            { title: 'Người thực hiện', dataIndex: 'actor', width: 150 },
            { title: 'Hành động', dataIndex: 'action', width: 240, render: (v) => <Tag color={actionColor(v)} className="tag-wrap">{v}</Tag> },
            {
              title: 'Đối tượng',
              key: 'target',
              width: 280,
              render: (_, l) => {
                const to = targetLink(l)
                return (
                  <div>
                    <Tag color={TARGET_COLOR[l.targetType]}>{AUDIT_TARGET_LABEL[l.targetType]}</Tag>
                    {to ? <Link to={to}>{l.targetName}</Link> : <Text>{l.targetName}</Text>}
                  </div>
                )
              },
            },
            { title: 'Chi tiết', dataIndex: 'detail', render: (v) => v || <Text type="secondary">—</Text> },
          ]}
        />
      </Card>
    </>
  )
}
