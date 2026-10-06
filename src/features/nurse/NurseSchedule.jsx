import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Badge, Button, Calendar, Card, Col, Empty, Flex, Input, Modal, Row, Segmented, Select, Space, Statistic, Tag, Typography } from 'antd'
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import NurseSos from './NurseSos'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getPatient, listBookingsByNurse, reportCannotPerform } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { SESSION_STATUS } from '../../lib/constants'
import { MAX_SHIFTS_PER_DAY_CELL } from '../../Data/nurse/schedule-data'
import { SESSION_STATUS_META, shortName } from './nurse-shared'

const { Text, Title } = Typography
const ISO = 'YYYY-MM-DD'
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const mondayOf = (d) => d.subtract((d.day() + 6) % 7, 'day').startOf('day')
const minutesBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}
const dayTitle = (d) => `${WEEKDAY_LONG[d.day()]}, ${d.format('DD/MM/YYYY')}`

function ShiftList({ shifts, today, onReport }) {
  if (!shifts.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có ca nào trong ngày này" />
  return (
    <div className="shift-list">
      {shifts.map((s) => {
        const meta = SESSION_STATUS_META[s.status] || SESSION_STATUS_META.confirmed
        const canReport = s.status === SESSION_STATUS.CONFIRMED && s.date >= today
        return (
          <div className={`shift-row is-${s.status}`} key={s.id}>
            <div className="shift-row-time">
              <b>{s.start}</b>
              <small>{s.end}</small>
            </div>
            <div className="shift-row-body">
              <Flex justify="space-between" gap={8} wrap align="flex-start">
                <div>
                  <Text strong>{s.patient?.name}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {careTypeLabel(s.careRequest?.careType)} · <Link to={`/hospital/nurse/requests?id=${s.careRequest?.id}`}>#{s.careRequest?.id}</Link>
                    </Text>
                  </div>
                </div>
                <Tag color={meta.color}>{meta.label}</Tag>
              </Flex>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <EnvironmentOutlined /> {s.patient?.address}
              </Text>
              {canReport && (
                <div>
                  <Button size="small" type="link" danger style={{ padding: 0 }} onClick={() => onReport(s)}>
                    Báo không thể thực hiện
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ScheduleHeader({ value, mode, onChange, onModeChange }) {
  const thisYear = dayjs().year()
  const years = Array.from({ length: 7 }, (_, i) => thisYear - 3 + i)
  const unit = mode === 'year' ? 'year' : 'month'
  return (
    <Flex className="schedule-header" justify="space-between" align="center" wrap gap={10}>
      <Title level={4} style={{ margin: 0 }}>
        {mode === 'year' ? `Năm ${value.year()}` : `Tháng ${value.month() + 1}, ${value.year()}`}
      </Title>
      <Space wrap>
        <Button aria-label="Trước" icon={<LeftOutlined />} onClick={() => onChange(value.subtract(1, unit))} />
        <Button onClick={() => onChange(dayjs())}>Hôm nay</Button>
        <Button aria-label="Sau" icon={<RightOutlined />} onClick={() => onChange(value.add(1, unit))} />
        {mode === 'month' && (
          <Select
            aria-label="Chọn tháng"
            value={value.month()}
            onChange={(m) => onChange(value.month(m))}
            options={Array.from({ length: 12 }, (_, m) => ({ value: m, label: `Tháng ${m + 1}` }))}
            style={{ width: 112 }}
          />
        )}
        <Select aria-label="Chọn năm" value={value.year()} onChange={(y) => onChange(value.year(y))} options={years.map((y) => ({ value: y, label: y }))} style={{ width: 92 }} />
        <Segmented value={mode} onChange={onModeChange} options={[{ value: 'month', label: 'Tháng' }, { value: 'year', label: 'Năm' }]} />
      </Space>
    </Flex>
  )
}

export default function NurseSchedule() {
  const { session } = useAuth()
  const state = useDb()
  const { message } = App.useApp()
  const [params] = useSearchParams()
  const initialDate = params.get('date')
  const [value, setValue] = useState(() => (initialDate && dayjs(initialDate).isValid() ? dayjs(initialDate) : dayjs()))
  const [mode, setMode] = useState('month')
  const [dayModal, setDayModal] = useState(null)
  const [report, setReport] = useState(null)
  const [reason, setReason] = useState('')
  const today = dayjs().format(ISO)

  const shifts = useMemo(
    () =>
      listBookingsByNurse(state, session.id)
        .flatMap((b) =>
          b.sessions
            .filter((s) => s.nurseId === session.id)
            .map((s) => ({ ...s, booking: b, patient: getPatient(state, b.patientId), careRequest: getCareRequest(state, b.careRequestId) })),
        )
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [state, session.id],
  )

  const byDate = useMemo(() => {
    const map = new Map()
    shifts.forEach((s) => map.set(s.date, [...(map.get(s.date) || []), s]))
    return map
  }, [shifts])

  const selectedIso = value.format(ISO)
  const dayShifts = byDate.get(selectedIso) || []
  const weekStart = mondayOf(value)
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))
  const weekShifts = weekDays.flatMap((d) => byDate.get(d.format(ISO)) || [])
  const weekMinutes = weekShifts.reduce((sum, s) => sum + minutesBetween(s.start, s.end), 0)
  const todayActive = (byDate.get(today) || []).find((s) => s.status === SESSION_STATUS.CONFIRMED || s.status === SESSION_STATUS.REASSIGNED)

  const openDay = (d) => {
    setValue(d)
    setDayModal(d.format(ISO))
  }

  const cellRender = (current, info) => {
    if (info.type === 'month') {
      const prefix = current.format('YYYY-MM')
      const count = shifts.filter((s) => s.date.startsWith(prefix)).length
      return count ? <Badge count={`${count} ca`} color="#0b6b68" /> : null
    }
    if (info.type !== 'date') return info.originNode
    const list = byDate.get(current.format(ISO)) || []
    if (!list.length) return null
    return (
      <div className="shift-cell">
        {list.slice(0, MAX_SHIFTS_PER_DAY_CELL).map((s) => (
          <span key={s.id} className={`shift-chip is-${s.status}`} title={`${s.start}–${s.end} · ${s.patient?.name}`}>
            <b>{s.start}</b>
            <span className="shift-chip-name"> {shortName(s.patient?.name)}</span>
          </span>
        ))}
        {list.length >= MAX_SHIFTS_PER_DAY_CELL && (
          <button
            type="button"
            className="shift-more"
            onClick={(e) => {
              e.stopPropagation()
              openDay(current)
            }}
          >
            {list.length > MAX_SHIFTS_PER_DAY_CELL ? `+${list.length - MAX_SHIFTS_PER_DAY_CELL} more` : 'more'}
          </button>
        )}
      </div>
    )
  }

  const submitReport = () => {
    reportCannotPerform({ bookingId: report.booking.id, sessionId: report.id, reason })
    message.info('Đã báo không thể thực hiện. Bệnh viện và bệnh nhân đã được thông báo.')
    setReport(null)
  }

  return (
    <>
      <PageHead
        eyebrow={`Tháng ${dayjs().format('MM / YYYY')}`}
        title="Lịch làm việc"
        description="Toàn bộ ca CareShift trong tháng. Mỗi ngày hiển thị tối đa 3 ca — bấm “more” để xem đủ danh sách ca của ngày đó."
      />

      <Card className="schedule-calendar-card">
        <Calendar
          value={value}
          mode={mode}
          onPanelChange={(d, m) => {
            setValue(d)
            setMode(m)
          }}
          onSelect={(d, info) => {
            setValue(d)
            if (info?.source === 'month') setMode('month')
          }}
          headerRender={({ value: v, onChange }) => (
            <ScheduleHeader
              value={v}
              mode={mode}
              onChange={(d) => {
                onChange(d)
                setValue(d)
              }}
              onModeChange={setMode}
            />
          )}
          cellRender={cellRender}
        />
        <Flex gap={14} wrap className="schedule-legend">
          {Object.entries(SESSION_STATUS_META).map(([key, meta]) => (
            <span key={key}>
              <i className={`shift-chip-dot is-${key}`} /> {meta.label}
            </span>
          ))}
        </Flex>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span>
                <CalendarOutlined /> {dayTitle(value)}
                {selectedIso === today && (
                  <Tag color="cyan" style={{ marginLeft: 8 }}>
                    Hôm nay
                  </Tag>
                )}
              </span>
            }
            extra={<Text type="secondary">{dayShifts.length} ca</Text>}
          >
            <ShiftList shifts={dayShifts} today={today} onReport={(s) => {
                setReason('')
                setReport(s)
              }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={`Tuần ${weekStart.format('DD/MM')} – ${weekStart.add(6, 'day').format('DD/MM')}`}>
            <Row gutter={8}>
              <Col span={8}>
                <Statistic title="Số ca" value={weekShifts.length} />
              </Col>
              <Col span={8}>
                <Statistic title="Giờ làm" value={Math.round((weekMinutes / 60) * 10) / 10} suffix="h" />
              </Col>
              <Col span={8}>
                <Statistic title="Bệnh nhân" value={new Set(weekShifts.map((s) => s.patient?.id)).size} />
              </Col>
            </Row>
            <div className="week-strip">
              {weekDays.map((d) => {
                const iso = d.format(ISO)
                const count = (byDate.get(iso) || []).length
                return (
                  <button
                    type="button"
                    key={iso}
                    className={`week-strip-day${iso === selectedIso ? ' is-selected' : ''}${iso === today ? ' is-today' : ''}`}
                    onClick={() => setValue(d)}
                  >
                    <small>{WEEKDAY_SHORT[d.day()]}</small>
                    <b>{d.format('DD')}</b>
                    <span className={count ? 'has-shifts' : ''}>{count ? `${count} ca` : '—'}</span>
                  </button>
                )
              })}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        open={Boolean(dayModal)}
        onCancel={() => setDayModal(null)}
        footer={null}
        title={
          dayModal && (
            <span>
              <ClockCircleOutlined /> Ca ngày {dayjs(dayModal).format('DD/MM/YYYY')} · {(byDate.get(dayModal) || []).length} ca
            </span>
          )
        }
        width={560}
      >
        {dayModal && (
          <ShiftList
            shifts={byDate.get(dayModal) || []}
            today={today}
            onReport={(s) => {
              setDayModal(null)
              setReason('')
              setReport(s)
            }}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(report)}
        title="Báo không thể thực hiện ca"
        okText="Gửi báo cáo"
        okButtonProps={{ danger: true, disabled: !reason.trim() }}
        cancelText="Hủy"
        onCancel={() => setReport(null)}
        onOk={submitReport}
        destroyOnHidden
      >
        {report && (
          <Text type="secondary">
            Ca {report.start}–{report.end} ngày {dayjs(report.date).format('DD/MM/YYYY')} với {report.patient?.name}. Hệ thống sẽ tự tìm điều dưỡng thay thế nếu có.
          </Text>
        )}
        <Input.TextArea rows={3} autoFocus style={{ marginTop: 12 }} placeholder="Lý do (ốm, việc đột xuất…)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>

      {todayActive && <NurseSos bookingId={todayActive.booking.id} sessionId={todayActive.id} nurseId={session.id} />}
    </>
  )
}
