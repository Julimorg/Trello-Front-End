import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Avatar, Card, DatePicker, Flex, Input, Segmented, Select, Statistic, Table, Tag, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getPatient, listNursesByHospital } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { compareByGivenName, compareText, initials } from './admin-shared'

const { Text } = Typography
const ISO = 'YYYY-MM-DD'
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const SESSION_META = {
  confirmed: { label: 'Đã xác nhận', color: 'cyan' },
  completed: { label: 'Hoàn thành', color: 'default' },
  reassigned: { label: 'Đã đổi điều dưỡng', color: 'purple' },
  cannot_perform: { label: 'Cần người thay', color: 'red' },
}

const monday = (d) => d.subtract((d.day() + 6) % 7, 'day').startOf('day')
const minutes = (s) => {
  const [sh, sm] = s.start.split(':').map(Number)
  const [eh, em] = s.end.split(':').map(Number)
  return eh * 60 + em - sh * 60 - sm
}

const RANGE_PRESETS = [
  { label: 'Hôm nay', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: 'Tuần này', value: [monday(dayjs()), monday(dayjs()).add(6, 'day')] },
  { label: 'Tháng này', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: '30 ngày tới', value: [dayjs().startOf('day'), dayjs().add(30, 'day')] },
]

export default function HospitalSchedule() {
  const { session } = useAuth()
  const state = useDb()
  const [view, setView] = useState('nurse')
  const [range, setRange] = useState([monday(dayjs()), monday(dayjs()).add(6, 'day')])
  const [nurseIds, setNurseIds] = useState([])
  const [status, setStatus] = useState(null)
  const [search, setSearch] = useState('')

  const nurses = useMemo(() => [...listNursesByHospital(state, session.id)].sort((a, b) => compareByGivenName(a.name, b.name)), [state, session.id])
  const nurseById = useMemo(() => new Map(nurses.map((n) => [n.id, n])), [nurses])

  const shifts = useMemo(() => {
    const from = range?.[0]?.format(ISO)
    const to = range?.[1]?.format(ISO)
    const q = search.trim().toLowerCase()
    return state.bookings
      .flatMap((b) =>
        b.sessions
          .filter((s) => nurseById.has(s.nurseId))
          .map((s) => ({ ...s, key: s.id, booking: b, nurse: nurseById.get(s.nurseId), patient: getPatient(state, b.patientId), careRequest: getCareRequest(state, b.careRequestId) })),
      )
      .filter(
        (s) =>
          (!from || s.date >= from) &&
          (!to || s.date <= to) &&
          (!nurseIds.length || nurseIds.includes(s.nurseId)) &&
          (!status || s.status === status) &&
          (!q || `${s.patient?.name} ${s.patient?.address} ${s.nurse?.name}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => compareByGivenName(a.nurse.name, b.nurse.name) || (a.date + a.start).localeCompare(b.date + b.start))
  }, [state, nurseById, range, nurseIds, status, search])

  const shiftColumns = (withNurse) => [
    ...(withNurse
      ? [
          {
            title: 'Điều dưỡng',
            key: 'nurse',
            sorter: (a, b) => compareByGivenName(a.nurse.name, b.nurse.name),
            defaultSortOrder: 'ascend',
            render: (_, s) => <Link to={`/hospital/admin/roster/${s.nurseId}`}>{s.nurse.name}</Link>,
          },
        ]
      : []),
    { title: 'Bệnh nhân', key: 'patient', sorter: (a, b) => compareByGivenName(a.patient?.name, b.patient?.name), render: (_, s) => s.patient?.name },
    {
      title: 'Ngày',
      key: 'date',
      sorter: (a, b) => (a.date + a.start).localeCompare(b.date + b.start),
      render: (_, s) => `${WEEKDAY[dayjs(s.date).day()]}, ${formatDate(s.date)}`,
    },
    { title: 'Giờ', key: 'time', render: (_, s) => `${s.start}–${s.end}` },
    { title: 'Loại ca', key: 'care', sorter: (a, b) => compareText(careTypeLabel(a.careRequest?.careType), careTypeLabel(b.careRequest?.careType)), render: (_, s) => careTypeLabel(s.careRequest?.careType) },
    { title: 'Khu vực', key: 'area', render: (_, s) => s.careRequest?.district },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, s) => <Tag color={SESSION_META[s.status]?.color}>{SESSION_META[s.status]?.label}</Tag>,
    },
  ]

  const byNurse = useMemo(() => {
    const groups = new Map()
    shifts.forEach((s) => groups.set(s.nurseId, [...(groups.get(s.nurseId) || []), s]))
    const ids = nurseIds.length ? nurseIds : nurses.map((n) => n.id)
    return ids
      .map((id) => nurseById.get(id))
      .filter(Boolean)
      .map((n) => {
        const list = groups.get(n.id) || []
        const upcoming = list.find((s) => s.date >= dayjs().format(ISO) && s.status === 'confirmed')
        return { key: n.id, nurse: n, shifts: list, hours: Math.round((list.reduce((sum, s) => sum + minutes(s), 0) / 60) * 10) / 10, upcoming }
      })
      .filter((g) => g.shifts.length || (!status && !search.trim()))
  }, [shifts, nurses, nurseById, nurseIds, status, search])

  const nurseColumns = [
    {
      title: 'Điều dưỡng',
      key: 'nurse',
      sorter: (a, b) => compareByGivenName(a.nurse.name, b.nurse.name),
      defaultSortOrder: 'ascend',
      render: (_, g) => (
        <Flex gap={10} align="center">
          <Avatar style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>{initials(g.nurse.name)}</Avatar>
          <div>
            <Link to={`/hospital/admin/roster/${g.nurse.id}`}>
              <Text strong>{g.nurse.name}</Text>
            </Link>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {g.nurse.rank}
              </Text>
            </div>
          </div>
        </Flex>
      ),
    },
    { title: 'Số ca', key: 'count', sorter: (a, b) => a.shifts.length - b.shifts.length, render: (_, g) => <Text strong>{g.shifts.length}</Text> },
    { title: 'Giờ làm', key: 'hours', sorter: (a, b) => a.hours - b.hours, render: (_, g) => `${g.hours} h` },
    { title: 'Ca gần nhất sắp tới', key: 'next', render: (_, g) => (g.upcoming ? `${formatDate(g.upcoming.date)} · ${g.upcoming.start} · ${g.upcoming.patient?.name}` : <Text type="secondary">—</Text>) },
    {
      title: 'Cần người thay',
      key: 'issues',
      render: (_, g) => {
        const n = g.shifts.filter((s) => s.status === 'cannot_perform').length
        return n ? <Tag color="red">{n} ca</Tag> : <Text type="secondary">—</Text>
      },
    },
  ]

  const totalHours = Math.round((shifts.reduce((sum, s) => sum + minutes(s), 0) / 60) * 10) / 10

  return (
    <>
      <PageHead eyebrow="Workforce scheduling" title="Điều phối lịch" description="Ca CareShift của toàn bộ điều dưỡng bệnh viện — xem theo từng điều dưỡng hoặc tất cả ca, sắp xếp theo tên A→Z." />

      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex vertical gap={12}>
          <Flex gap={10} wrap justify="space-between" align="center">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'nurse', label: 'Theo điều dưỡng' },
                { value: 'all', label: 'Tất cả ca' },
              ]}
            />
            <Flex gap={24}>
              <Statistic title="Ca trong kỳ" value={shifts.length} />
              <Statistic title="Tổng giờ" value={totalHours} suffix="h" />
              <Statistic title="Điều dưỡng có ca" value={new Set(shifts.map((s) => s.nurseId)).size} />
            </Flex>
          </Flex>
          <Flex gap={10} wrap>
            <DatePicker.RangePicker value={range} onChange={setRange} presets={RANGE_PRESETS} format="DD/MM/YYYY" allowClear style={{ flex: '0 1 280px' }} />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="Lọc theo tên điều dưỡng"
              value={nurseIds}
              onChange={setNurseIds}
              optionFilterProp="label"
              options={nurses.map((n) => ({ value: n.id, label: n.name }))}
              style={{ flex: '1 1 240px' }}
            />
            <Select allowClear placeholder="Trạng thái ca" value={status} onChange={setStatus} options={Object.entries(SESSION_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 180px' }} />
            <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm bệnh nhân, địa chỉ" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
          </Flex>
        </Flex>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        {view === 'all' ? (
          <Table rowKey="key" columns={shiftColumns(true)} dataSource={shifts} pagination={{ pageSize: 15, hideOnSinglePage: true, showSizeChanger: false }} scroll={{ x: 900 }} locale={{ emptyText: 'Không có ca nào trong khoảng thời gian này' }} />
        ) : (
          <Table
            rowKey="key"
            columns={nurseColumns}
            dataSource={byNurse}
            pagination={false}
            scroll={{ x: 820 }}
            expandable={{
              expandedRowRender: (g) => (
                <Table
                  size="small"
                  rowKey="key"
                  columns={shiftColumns(false)}
                  dataSource={g.shifts}
                  pagination={g.shifts.length > 10 ? { pageSize: 10, size: 'small' } : false}
                  locale={{ emptyText: 'Không có ca trong kỳ' }}
                />
              ),
              rowExpandable: (g) => g.shifts.length > 0,
            }}
            locale={{ emptyText: 'Không có điều dưỡng nào khớp bộ lọc' }}
          />
        )}
      </Card>
    </>
  )
}
