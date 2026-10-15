import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Badge, Button, Card, DatePicker, Descriptions, Flex, Input, Segmented, Select, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import { LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import CareRequestWizardModal from '../careRequest/CareRequestWizardModal'
import HospitalPatientPickerModal from './HospitalPatientPickerModal'
import { LoadCalendar, ReassignPanel, ShiftDrawer } from './dispatch-parts'
import { ISO, LOAD_LEGEND, SESSION_META, hoursText, minutesOf } from './dispatch-utils'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listNursesByHospital } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL, NURSE_AUTH_STATUS } from '../../lib/constants'
import { frequencyText } from '../nurse/nurse-shared'
import { compareByGivenName } from './admin-shared'

const { Text } = Typography

const REQUEST_STATUS_COLOR = {
  created: 'default',
  matching: 'processing',
  matched: 'blue',
  nurse_pending: 'gold',
  no_match: 'orange',
  cancelled: 'default',
  completed: 'green',
}

// Request tabs: what still needs the coordinator vs. what is settled.
const OPEN_STATUSES = ['created', 'matching', 'matched', 'nurse_pending', 'no_match']
const REQUEST_TABS = [
  { key: 'open', label: 'Đang xử lý', match: (r) => OPEN_STATUSES.includes(r.status) },
  { key: 'done', label: 'Đã chấp nhận', match: (r) => r.status === 'completed' },
  { key: 'cancelled', label: 'Đã hủy', match: (r) => r.status === 'cancelled' },
  { key: 'all', label: 'Tất cả', match: () => true },
]

const monday = (d) => d.subtract((d.day() + 6) % 7, 'day').startOf('day')

// Replacement nurses on a booking: sessions handed over to someone other than the first nurse.
function replacementNurses(state, booking) {
  if (!booking) return []
  const ids = new Set()
  booking.sessions.forEach((s) => {
    const original = s.history?.[s.history.length - 1]?.nurseId
    if (s.status === 'reassigned' && s.nurseId && s.nurseId !== original) ids.add(s.nurseId)
  })
  return [...ids].map((id) => getNurse(state, id)).filter(Boolean)
}

function RequestDetail({ request, state }) {
  const { booking } = request
  const sessions = booking ? [...booking.sessions].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)) : []
  const matched = request.matchedNurseIds.map((id) => getNurse(state, id)?.name).filter(Boolean)
  return (
    <Descriptions
      size="small"
      column={{ xs: 1, md: 2, xl: 3 }}
      items={[
        { key: 'freq', label: 'Tần suất', children: frequencyText(request) },
        { key: 'time', label: 'Khung giờ', children: request.timeSlot ? `${request.timeSlot.start}–${request.timeSlot.end}` : '—' },
        { key: 'area', label: 'Khu vực', children: request.district },
        { key: 'addr', label: 'Địa chỉ', children: request.patient?.address || '—' },
        { key: 'matched', label: 'Điều dưỡng được gợi ý', children: matched.length ? matched.join(', ') : '—' },
        {
          key: 'sessions',
          label: 'Lịch đã đặt',
          children: sessions.length ? `${sessions.length} buổi · ${formatDate(sessions[0].date)} → ${formatDate(sessions[sessions.length - 1].date)}` : 'Chưa có lịch',
        },
        ...(request.notes ? [{ key: 'notes', label: 'Ghi chú', span: 'filled', children: request.notes }] : []),
      ]}
    />
  )
}

// "Yêu cầu chăm sóc" + "Điều phối lịch" in one page. The calendar is a workload overview (count + hours per
// nurse and day) — shifts open in a drawer — and requests sit in a tabbed, paginated table below it.
export default function HospitalDispatch() {
  const { session } = useAuth()
  const state = useDb()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [wizardPatientId, setWizardPatientId] = useState(null)
  const [weekStart, setWeekStart] = useState(monday(dayjs()))
  const [nurseIds, setNurseIds] = useState([])
  const [sessionStatus, setSessionStatus] = useState(null)
  const [requestTab, setRequestTab] = useState('open')
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState(null)

  const nurses = useMemo(() => [...listNursesByHospital(state, session.id)].sort((a, b) => compareByGivenName(a.name, b.name)), [state, session.id])
  const nurseById = useMemo(() => new Map(nurses.map((n) => [n.id, n])), [nurses])
  const q = search.trim().toLowerCase()

  const candidatesFor = (careType) => nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && n.authorizedCareTypes.includes(careType))
  const cannotPerform = state.bookings.flatMap((b) => b.sessions.filter((s) => s.needsManualReassignment && nurseById.has(s.nurseId)).map((s) => ({ booking: b, sessionItem: s })))

  const weekFrom = weekStart.format(ISO)
  const weekTo = weekStart.add(6, 'day').format(ISO)
  const shifts = useMemo(
    () =>
      state.bookings
        .flatMap((b) =>
          b.sessions
            .filter((s) => nurseById.has(s.nurseId) && s.date >= weekFrom && s.date <= weekTo)
            .map((s) => ({ ...s, booking: b, patient: getPatient(state, b.patientId), careRequest: getCareRequest(state, b.careRequestId) })),
        )
        .filter((s) => (!sessionStatus || s.status === sessionStatus) && (!q || `${s.patient?.name} ${s.patient?.address} ${nurseById.get(s.nurseId)?.name}`.toLowerCase().includes(q))),
    [state, nurseById, weekFrom, weekTo, sessionStatus, q],
  )

  const calendarNurses = useMemo(() => {
    const withShifts = new Set(shifts.map((s) => s.nurseId))
    return nurses.filter((n) => (!nurseIds.length || nurseIds.includes(n.id)) && (!(sessionStatus || q) || withShifts.has(n.id)))
  }, [nurses, nurseIds, sessionStatus, q, shifts])

  const allRequests = useMemo(() => {
    return state.careRequests
      .filter((r) => r.matchedNurseIds.some((id) => nurseById.has(id)) || (r.selectedNurseId && nurseById.has(r.selectedNurseId)) || r.createdBy === 'hospital')
      .map((r) => {
        const booking = state.bookings.find((b) => b.careRequestId === r.id || b.id === r.bookingId)
        return { ...r, booking, patient: getPatient(state, r.patientId), nurse: r.selectedNurseId ? getNurse(state, r.selectedNurseId) : null, newNurses: replacementNurses(state, booking) }
      })
  }, [state, nurseById])

  const tabCounts = useMemo(() => Object.fromEntries(REQUEST_TABS.map((t) => [t.key, allRequests.filter(t.match).length])), [allRequests])
  const requests = useMemo(() => {
    const tab = REQUEST_TABS.find((t) => t.key === requestTab)
    return allRequests.filter((r) => tab.match(r) && (!q || `${r.id} ${r.patient?.name} ${r.nurse?.name} ${r.newNurses.map((n) => n.name).join(' ')} ${careTypeLabel(r.careType)}`.toLowerCase().includes(q)))
  }, [allRequests, requestTab, q])

  const waiting = allRequests.filter((r) => r.status === 'nurse_pending' || r.status === 'no_match').length
  const activeNurses = new Set(shifts.map((s) => s.nurseId)).size
  const totalMinutes = shifts.reduce((sum, s) => sum + minutesOf(s), 0)

  const columns = [
    { title: 'Mã', dataIndex: 'id', width: 100, render: (id) => <Text strong>#{id}</Text> },
    { title: 'Bệnh nhân', key: 'patient', width: 150, sorter: (a, b) => compareByGivenName(a.patient?.name, b.patient?.name), render: (_, r) => r.patient?.name },
    { title: 'Nhu cầu', key: 'care', width: 150, render: (_, r) => careTypeLabel(r.careType) },
    { title: 'Bắt đầu', key: 'start', width: 140, sorter: (a, b) => a.desiredStartDate.localeCompare(b.desiredStartDate), render: (_, r) => `${formatDate(r.desiredStartDate)} · ${r.timeSlot?.start}` },
    {
      title: 'Điều dưỡng',
      key: 'nurse',
      width: 170,
      render: (_, r) => (
        <div>
          {r.nurse ? <Text>{r.nurse.name}</Text> : <Text type="secondary">—</Text>}
          {r.newNurses.length > 0 && (
            <div>
              <Tooltip title="Điều dưỡng được giao thay">
                <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                  Mới: {r.newNurses.map((n) => n.name).join(', ')}
                </Tag>
              </Tooltip>
            </div>
          )}
        </div>
      ),
    },
    { title: 'Tạo lúc', key: 'created', width: 120, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), defaultSortOrder: 'descend', render: (_, r) => <span title={r.createdBy === 'hospital' ? 'Bệnh viện tạo thay' : 'Bệnh nhân tạo'}>{dayjs(r.createdAt).format('DD/MM HH:mm')}</span> },
    { title: 'Trạng thái', key: 'status', width: 210, render: (_, r) => <Tag color={REQUEST_STATUS_COLOR[r.status]}>{CARE_REQUEST_STATUS_LABEL[r.status]?.label || r.status}</Tag> },
  ]

  const weekLabel = `${weekStart.format('DD/MM')} – ${weekStart.add(6, 'day').format('DD/MM/YYYY')}`
  const isThisWeek = weekStart.isSame(monday(dayjs()), 'day')

  return (
    <>
      <PageHead
        eyebrow="Care requests & scheduling"
        title="Yêu cầu & điều phối lịch"
        description="Nắm tải làm việc của điều dưỡng theo tuần, xử lý ca cần đổi người và theo dõi các yêu cầu chăm sóc."
        action={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
            Tạo thay bệnh nhân
          </Button>
        }
      />

      <div className="dispatch-kpis">
        <Card size="small">
          <Statistic title="Ca trong tuần" value={shifts.length} suffix={<small>{hoursText(totalMinutes)}</small>} />
        </Card>
        <Card size="small">
          <Statistic title="Điều dưỡng có ca" value={activeNurses} suffix={`/ ${nurses.length}`} />
        </Card>
        <Card size="small" className={cannotPerform.length ? 'is-alert' : undefined} hoverable={cannotPerform.length > 0} onClick={() => cannotPerform.length && document.getElementById('reassign-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          <Statistic title="Ca cần đổi điều dưỡng" value={cannotPerform.length} styles={{ content: cannotPerform.length ? { color: '#cf3c43' } : undefined }} />
        </Card>
        <Card size="small" className={waiting ? 'is-warn' : undefined} hoverable onClick={() => setRequestTab('open')}>
          <Statistic title="Yêu cầu chờ điều dưỡng" value={waiting} styles={{ content: waiting ? { color: '#b96b08' } : undefined }} />
        </Card>
      </div>

      <ReassignPanel items={cannotPerform} candidatesFor={candidatesFor} />

      <Card
        title="Tải làm việc theo tuần"
        styles={{ body: { padding: 0 } }}
        style={{ marginBottom: 20 }}
        extra={
          <Flex gap={6} align="center" className="load-legend" wrap>
            {LOAD_LEGEND.map((l) => (
              <span key={l.level}>
                <i className={`load-swatch level-${l.level}`} /> {l.label}
              </span>
            ))}
          </Flex>
        }
      >
        <div className="dispatch-toolbar">
          <Flex gap={8} wrap align="center">
            <Button icon={<LeftOutlined />} onClick={() => setWeekStart((w) => w.subtract(7, 'day'))} aria-label="Tuần trước" />
            <DatePicker picker="week" allowClear={false} value={weekStart} onChange={(d) => d && setWeekStart(monday(d))} format={() => weekLabel} style={{ width: 210 }} />
            <Button icon={<RightOutlined />} onClick={() => setWeekStart((w) => w.add(7, 'day'))} aria-label="Tuần sau" />
            <Button disabled={isThisWeek} onClick={() => setWeekStart(monday(dayjs()))}>
              Tuần này
            </Button>
          </Flex>
          <Flex gap={8} wrap className="dispatch-filters">
            <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm bệnh nhân, điều dưỡng, mã yêu cầu" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 220px' }} />
            <Select mode="multiple" allowClear maxTagCount="responsive" placeholder="Lọc điều dưỡng" value={nurseIds} onChange={setNurseIds} optionFilterProp="label" options={nurses.map((n) => ({ value: n.id, label: n.name }))} style={{ flex: '1 1 200px' }} />
            <Select allowClear placeholder="Trạng thái ca" value={sessionStatus} onChange={setSessionStatus} options={Object.entries(SESSION_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 160px' }} />
          </Flex>
        </div>
        <LoadCalendar nurses={calendarNurses} shifts={shifts} weekStart={weekStart} onOpenCell={(nurseId, date) => setDrawer({ nurseId, date })} onOpenDay={(date) => setDrawer({ date })} />
      </Card>

      <Card styles={{ body: { padding: 0 } }} title="Yêu cầu chăm sóc" extra={<Text type="secondary">{requests.length} yêu cầu</Text>}>
        <div className="dispatch-toolbar">
          <Segmented
            value={requestTab}
            onChange={setRequestTab}
            options={REQUEST_TABS.map((t) => ({
              value: t.key,
              label: (
                <span className="segmented-label">
                  {t.label}
                  <Badge count={tabCounts[t.key]} showZero color={t.key === 'open' ? '#b96b08' : '#94a4a7'} size="small" />
                </span>
              ),
            }))}
          />
        </div>
        <Table
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={requests}
          pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
          scroll={{ x: 1080 }} className="dispatch-requests"
          expandable={{ expandedRowRender: (r) => <RequestDetail request={r} state={state} />, expandRowByClick: true }}
          locale={{ emptyText: 'Không có yêu cầu nào' }}
        />
      </Card>

      <ShiftDrawer target={drawer} shifts={shifts} nurseById={nurseById} onClose={() => setDrawer(null)} />

      <HospitalPatientPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={(patientId) => {
          setPickerOpen(false)
          setWizardPatientId(patientId)
        }}
      />
      <CareRequestWizardModal open={Boolean(wizardPatientId)} onClose={() => setWizardPatientId(null)} patientId={wizardPatientId} createdBy="hospital" onCreated={() => setWizardPatientId(null)} />
    </>
  )
}
