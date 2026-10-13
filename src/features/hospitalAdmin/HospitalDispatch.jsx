import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Alert, Avatar, Button, Card, DatePicker, Flex, Input, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import { LeftOutlined, PlusOutlined, RightOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import CareRequestWizardModal from '../careRequest/CareRequestWizardModal'
import HospitalPatientPickerModal from './HospitalPatientPickerModal'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listNursesByHospital, manualReassignSession } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL, NURSE_AUTH_STATUS } from '../../lib/constants'
import { compareByGivenName, initials } from './admin-shared'

const { Text, Title } = Typography
const ISO = 'YYYY-MM-DD'
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const REQUEST_STATUS_COLOR = {
  created: 'default',
  matching: 'processing',
  matched: 'blue',
  nurse_pending: 'gold',
  no_match: 'orange',
  cancelled: 'default',
  completed: 'green',
}

const SESSION_META = {
  confirmed: { label: 'Đã xác nhận', color: 'cyan' },
  completed: { label: 'Hoàn thành', color: 'default' },
  reassigned: { label: 'Đã đổi điều dưỡng', color: 'purple' },
  cannot_perform: { label: 'Cần người thay', color: 'red' },
}

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

function ReassignCard({ booking, sessionItem, candidates }) {
  const state = useDb()
  const { message } = App.useApp()
  const [pick, setPick] = useState(null)
  const careRequest = getCareRequest(state, booking.careRequestId)
  const patient = getPatient(state, booking.patientId)
  const last = sessionItem.history?.[sessionItem.history.length - 1]
  const original = getNurse(state, last?.nurseId)
  return (
    <Card size="small">
      <Flex justify="space-between" gap={12} wrap>
        <div style={{ flex: '1 1 320px' }}>
          <Text strong>
            {patient?.name} · {careTypeLabel(careRequest?.careType)}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Buổi {formatDate(sessionItem.date)} · {sessionItem.start}–{sessionItem.end} · Điều dưỡng cũ: {original?.name || '—'}
            </Text>
          </div>
          {last?.reason && <Alert type="warning" showIcon title={`Lý do: ${last.reason}`} style={{ marginTop: 8 }} />}
        </div>
        <Space wrap align="start">
          <Select
            placeholder="Chọn điều dưỡng mới"
            value={pick}
            onChange={setPick}
            options={candidates.map((n) => ({ value: n.id, label: n.name }))}
            style={{ width: 230 }}
            notFoundContent="Không có điều dưỡng phù hợp"
          />
          <Button
            type="primary"
            icon={<SwapOutlined />}
            disabled={!pick}
            onClick={() => {
              manualReassignSession({ bookingId: booking.id, sessionId: sessionItem.id, nurseId: pick })
              message.success(`Đã giao buổi chăm sóc cho ${getNurse(state, pick)?.name}`)
            }}
          >
            Xác nhận đổi
          </Button>
        </Space>
      </Flex>
    </Card>
  )
}

// Week calendar: one row per nurse, one column per day.
function WeekCalendar({ nurses, shifts, weekStart }) {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const today = dayjs().format(ISO)
  const byCell = useMemo(() => {
    const map = new Map()
    shifts.forEach((s) => {
      const key = `${s.nurseId}|${s.date}`
      map.set(key, [...(map.get(key) || []), s])
    })
    return map
  }, [shifts])

  const columns = [
    {
      title: 'Điều dưỡng',
      key: 'nurse',
      width: 170,
      fixed: 'left',
      render: (_, n) => (
        <Flex gap={8} align="center">
          <Avatar size={30} style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>
            {initials(n.name)}
          </Avatar>
          <Link to={`/hospital/admin/roster/${n.id}`}>
            <Text strong>{n.name}</Text>
          </Link>
        </Flex>
      ),
    },
    ...days.map((d) => {
      const iso = d.format(ISO)
      return {
        title: (
          <div className={`dispatch-day${iso === today ? ' is-today' : ''}`}>
            <b>{WEEKDAY[d.day()]}</b>
            <span>{d.format('DD/MM')}</span>
          </div>
        ),
        key: iso,
        width: 100,
        render: (_, n) => {
          const list = (byCell.get(`${n.id}|${iso}`) || []).sort((a, b) => a.start.localeCompare(b.start))
          return list.length ? (
            <Flex vertical gap={4}>
              {list.map((s) => (
                <Tooltip
                  key={s.id}
                  title={`${s.patient?.name} · ${careTypeLabel(s.careRequest?.careType)} · ${s.careRequest?.district || ''} · ${SESSION_META[s.status]?.label}`}
                >
                  <div className={`dispatch-chip is-${s.status}`}>
                    <b>
                      {s.start}–{s.end}
                    </b>
                    <span>{s.patient?.name}</span>
                  </div>
                </Tooltip>
              ))}
            </Flex>
          ) : (
            <span className="dispatch-empty">—</span>
          )
        },
      }
    }),
  ]

  return (
    <Table
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={nurses}
      pagination={false}
      scroll={{ x: 170 + 100 * 7 }}
      locale={{ emptyText: 'Không có điều dưỡng nào khớp bộ lọc' }}
    />
  )
}

// "Yêu cầu chăm sóc" + "Điều phối lịch" in one page: a single week calendar, then the requests behind it.
export default function HospitalDispatch() {
  const { session } = useAuth()
  const state = useDb()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [wizardPatientId, setWizardPatientId] = useState(null)
  const [weekStart, setWeekStart] = useState(monday(dayjs()))
  const [nurseIds, setNurseIds] = useState([])
  const [sessionStatus, setSessionStatus] = useState(null)
  const [requestStatus, setRequestStatus] = useState(null)
  const [search, setSearch] = useState('')

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

  const calendarNurses = nurses.filter((n) => (!nurseIds.length || nurseIds.includes(n.id)) && (!(sessionStatus || q) || shifts.some((s) => s.nurseId === n.id)))

  const requests = useMemo(() => {
    const hospitalIds = new Set(nurses.map((n) => n.id))
    return state.careRequests
      .filter((r) => r.matchedNurseIds.some((id) => hospitalIds.has(id)) || (r.selectedNurseId && hospitalIds.has(r.selectedNurseId)) || r.createdBy === 'hospital')
      .map((r) => {
        const booking = state.bookings.find((b) => b.careRequestId === r.id || b.id === r.bookingId)
        return { ...r, booking, patient: getPatient(state, r.patientId), nurse: r.selectedNurseId ? getNurse(state, r.selectedNurseId) : null, newNurses: replacementNurses(state, booking) }
      })
      .filter((r) => (!requestStatus || r.status === requestStatus) && (!q || `${r.id} ${r.patient?.name} ${r.nurse?.name} ${r.newNurses.map((n) => n.name).join(' ')} ${careTypeLabel(r.careType)}`.toLowerCase().includes(q)))
  }, [state, nurses, requestStatus, q])

  const columns = [
    { title: 'Mã', dataIndex: 'id', render: (id) => <Text strong>#{id}</Text> },
    { title: 'Bệnh nhân', key: 'patient', sorter: (a, b) => compareByGivenName(a.patient?.name, b.patient?.name), render: (_, r) => r.patient?.name },
    { title: 'Nhu cầu', key: 'care', render: (_, r) => careTypeLabel(r.careType) },
    { title: 'Bắt đầu', key: 'start', sorter: (a, b) => a.desiredStartDate.localeCompare(b.desiredStartDate), render: (_, r) => `${formatDate(r.desiredStartDate)} · ${r.timeSlot?.start}` },
    { title: 'Điều dưỡng', key: 'nurse', render: (_, r) => r.nurse?.name || <Text type="secondary">—</Text> },
    {
      title: 'Điều dưỡng mới',
      key: 'newNurse',
      render: (_, r) =>
        r.newNurses.length ? (
          <Flex gap={4} wrap>
            {r.newNurses.map((n) => (
              <Link key={n.id} to={`/hospital/admin/roster/${n.id}`}>
                <Tag color="purple">{n.name}</Tag>
              </Link>
            ))}
          </Flex>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    { title: 'Tạo bởi', key: 'by', render: (_, r) => (r.createdBy === 'hospital' ? <Tag color="purple">Bệnh viện</Tag> : <Tag>Bệnh nhân</Tag>) },
    { title: 'Tạo lúc', key: 'created', sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), defaultSortOrder: 'descend', render: (_, r) => formatDateTime(r.createdAt) },
    { title: 'Trạng thái', key: 'status', render: (_, r) => <Tag color={REQUEST_STATUS_COLOR[r.status]}>{CARE_REQUEST_STATUS_LABEL[r.status]?.label || r.status}</Tag> },
  ]

  const weekLabel = `${weekStart.format('DD/MM')} – ${weekStart.add(6, 'day').format('DD/MM/YYYY')}`
  const isThisWeek = weekStart.isSame(monday(dayjs()), 'day')

  return (
    <>
      <PageHead
        eyebrow="Care requests & scheduling"
        title="Yêu cầu & điều phối lịch"
        description="Một lịch tuần cho toàn bộ điều dưỡng của bệnh viện, kèm các yêu cầu chăm sóc liên quan và điều dưỡng được giao thay."
        action={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
            Tạo thay bệnh nhân
          </Button>
        }
      />

      {cannotPerform.length > 0 && (
        <>
          <Title level={5}>Ca cần hỗ trợ đổi điều dưỡng ({cannotPerform.length})</Title>
          <Flex vertical gap={10} style={{ marginBottom: 20 }}>
            {cannotPerform.map(({ booking, sessionItem }) => (
              <ReassignCard key={sessionItem.id} booking={booking} sessionItem={sessionItem} candidates={candidatesFor(getCareRequest(state, booking.careRequestId)?.careType)} />
            ))}
          </Flex>
        </>
      )}

      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex vertical gap={12}>
          <Flex gap={8} wrap align="center">
            <Button icon={<LeftOutlined />} onClick={() => setWeekStart((w) => w.subtract(7, 'day'))}>
              Tuần trước
            </Button>
            <DatePicker
              picker="week"
              allowClear={false}
              value={weekStart}
              onChange={(d) => d && setWeekStart(monday(d))}
              format={() => weekLabel}
              style={{ flex: '0 1 230px' }}
            />
            <Button iconPlacement="end" icon={<RightOutlined />} onClick={() => setWeekStart((w) => w.add(7, 'day'))}>
              Tuần sau
            </Button>
            <Button disabled={isThisWeek} onClick={() => setWeekStart(monday(dayjs()))}>
              Tuần này
            </Button>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>
              {shifts.length} ca trong tuần
            </Text>
          </Flex>
          <Flex gap={10} wrap>
            <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm bệnh nhân, điều dưỡng, mã yêu cầu" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 240px' }} />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="Lọc theo điều dưỡng"
              value={nurseIds}
              onChange={setNurseIds}
              optionFilterProp="label"
              options={nurses.map((n) => ({ value: n.id, label: n.name }))}
              style={{ flex: '1 1 220px' }}
            />
            <Select allowClear placeholder="Trạng thái ca" value={sessionStatus} onChange={setSessionStatus} options={Object.entries(SESSION_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 170px' }} />
          </Flex>
        </Flex>
      </Card>

      <Card styles={{ body: { padding: 0 } }} title="Lịch điều phối" style={{ marginBottom: 20 }}>
        <WeekCalendar nurses={calendarNurses} shifts={shifts} weekStart={weekStart} />
      </Card>

      <Card
        title={`Yêu cầu chăm sóc (${requests.length})`}
        styles={{ body: { padding: 0 } }}
        extra={<Select allowClear placeholder="Trạng thái yêu cầu" value={requestStatus} onChange={setRequestStatus} options={Object.entries(CARE_REQUEST_STATUS_LABEL).map(([value, m]) => ({ value, label: m.label }))} style={{ width: 230 }} />}
      >
        <Table rowKey="id" columns={columns} dataSource={requests} pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 1400 }} locale={{ emptyText: 'Chưa có yêu cầu liên quan' }} />
      </Card>

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
