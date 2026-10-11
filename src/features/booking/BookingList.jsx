import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getHospital, getNurse, listBookingsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { bookingSummary, formatDuration, frequencyText, minutesBetween, relativeDay, visitBadge, visitWork, weekdayLong } from './booking-shared'
import { Icon } from '../../lib/icons'

const MAX_STRIP_DAYS = 14
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const mondayOf = (d) => d.startOf('day').subtract((d.day() + 6) % 7, 'day')

// "Lịch chăm sóc": one week at a time (From / To), a day strip, and the visits in that range as detailed cards.
export default function BookingList() {
  const { session } = useAuth()
  const state = useDb()
  const today = dayjs().format('YYYY-MM-DD')
  const [from, setFrom] = useState(() => mondayOf(dayjs()))
  const [to, setTo] = useState(() => mondayOf(dayjs()).add(6, 'day'))
  const [picked, setPicked] = useState(today)

  const bookings = listBookingsByPatient(state, session.id)
  const allSessions = useMemo(
    () =>
      bookings
        .flatMap((b) => b.sessions.map((s) => ({ ...s, booking: b, careRequest: getCareRequest(state, b.careRequestId) })))
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [bookings, state],
  )

  const fromIso = from.format('YYYY-MM-DD')
  const toIso = to.format('YYYY-MM-DD')
  const spanDays = Math.max(1, to.diff(from, 'day') + 1)
  const days = Array.from({ length: Math.min(spanDays, MAX_STRIP_DAYS) }, (_, i) => from.add(i, 'day'))
  const inRange = allSessions.filter((s) => s.date >= fromIso && s.date <= toIso)
  const countByDay = inRange.reduce((acc, s) => ({ ...acc, [s.date]: (acc[s.date] || 0) + 1 }), {})
  const pickedActive = picked && picked >= fromIso && picked <= toIso ? picked : null
  const visible = pickedActive ? inRange.filter((s) => s.date === pickedActive) : inRange

  // Moving the range by its own length keeps "this week → next week" natural for 7-day ranges.
  const shift = (direction) => {
    setFrom(from.add(direction * spanDays, 'day'))
    setTo(to.add(direction * spanDays, 'day'))
    setPicked(null)
  }
  const changeFrom = (v) => {
    if (!v || !v.isValid()) return
    setFrom(v)
    if (to.isBefore(v, 'day')) setTo(v.add(6, 'day'))
    setPicked(null)
  }
  const changeTo = (v) => {
    if (!v || !v.isValid()) return
    setTo(v)
    if (from.isAfter(v, 'day')) setFrom(v.subtract(6, 'day'))
    setPicked(null)
  }
  const thisWeek = () => {
    setFrom(mondayOf(dayjs()))
    setTo(mondayOf(dayjs()).add(6, 'day'))
    setPicked(today)
  }

  const heading = pickedActive ? `Ca chăm sóc ngày ${dayjs(pickedActive).format('DD/MM/YYYY')}` : `Ca chăm sóc ngày ${from.format('DD/MM')} – ${to.format('DD/MM/YYYY')}`

  return (
    <>
      <PageHead eyebrow="Booking & scheduling" title="Lịch chăm sóc của bạn" description="Chọn khoảng ngày và bấm vào một ngày để xem các ca chăm sóc, cả ca đã qua và ca sắp tới." />

      <div className="week-range">
        <DatePicker label="Từ ngày" value={from} onChange={changeFrom} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small' } }} />
        <DatePicker label="Đến ngày" value={to} onChange={changeTo} format="DD/MM/YYYY" minDate={from} slotProps={{ textField: { size: 'small' } }} />
        <Button variant="outlined" size="small" onClick={thisWeek}>
          Tuần này
        </Button>
      </div>

      <div className="week-nav">
        <button type="button" className="week-nav-btn" onClick={() => shift(-1)} aria-label="Khoảng trước">
          <span aria-hidden="true">‹</span>
          <b>Trước</b>
        </button>
        <div className="week-strip-box" role="group" aria-label="Chọn ngày">
          {days.map((d) => {
            const iso = d.format('YYYY-MM-DD')
            const count = countByDay[iso] || 0
            return (
              <button
                key={iso}
                type="button"
                className={`day-circle${pickedActive === iso ? ' is-picked' : ''}${iso === today ? ' is-today' : ''}${count ? ' has-visits' : ''}`}
                aria-pressed={pickedActive === iso}
                onClick={() => setPicked(pickedActive === iso ? null : iso)}
              >
                <span className="day-circle-label">{d.format('D/M')}</span>
                <small>{WEEKDAY_SHORT[d.day()]}</small>
                {count > 0 && <i className="day-circle-count">{count}</i>}
              </button>
            )
          })}
        </div>
        <button type="button" className="week-nav-btn" onClick={() => shift(1)} aria-label="Khoảng sau">
          <b>Sau</b>
          <span aria-hidden="true">›</span>
        </button>
      </div>
      {spanDays > MAX_STRIP_DAYS && <p className="detail-text" style={{ marginBottom: 10 }}>Thanh ngày hiển thị {MAX_STRIP_DAYS} ngày đầu; danh sách bên dưới gồm cả khoảng.</p>}

      <div className="week-list-head">
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            {heading}
          </h2>
          <small>
            {visible.length ? `${visible.length} ca` : 'Không có ca nào'}
            {pickedActive === today ? ' · Hôm nay' : ''}
            {pickedActive ? ' · bấm lại ngày đang chọn để xem cả khoảng' : ''}
          </small>
        </div>
      </div>

      {visible.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.calendar />} title="Không có ca chăm sóc trong khoảng này" description="Chọn ngày hoặc khoảng ngày khác, hoặc tạo yêu cầu chăm sóc mới." />
        </section>
      ) : (
        visible.map((s) => {
          const nurse = getNurse(state, s.nurseId)
          const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
          const request = s.careRequest
          const sum = bookingSummary(s.booking, today)
          const index = sum.sessions.findIndex((x) => x.id === s.id)
          const work = visitWork(s, request?.careType)
          const badge = visitBadge(s, today)
          const finished = badge.label === 'Hoàn tất'
          return (
            <Link key={s.id} to={`/patient/bookings/${s.booking.id}`} className="booking-card">
              <div className="booking-card-head">
                <div className="shift-date">
                  <small>{weekdayLong(s.date).replace('Thứ ', 'T').replace('Chủ nhật', 'CN')}</small>
                  <b>{dayjs(s.date).format('DD')}</b>
                </div>
                <div className="booking-card-title">
                  <h3>{request ? careTypeLabel(request.careType) : 'Buổi chăm sóc'}</h3>
                  <p>
                    {nurse?.name}
                    {hospital ? ` · ${hospital.name}` : ''}
                  </p>
                </div>
                <StatusBadge label={badge.label} tone={badge.tone} />
              </div>
              <div className="booking-card-facts">
                <span>
                  <Icon.calendar /> {weekdayLong(s.date)}, {formatDate(s.date)}
                  <em>{relativeDay(s.date, today)}</em>
                </span>
                <span>
                  <Icon.clock /> {s.start}–{s.end}
                  <em>{formatDuration(minutesBetween(s.start, s.end))}</em>
                </span>
                <span>
                  <Icon.refresh /> Buổi {index + 1}/{sum.total}
                  <em>{request ? frequencyText(request) : '—'}</em>
                </span>
                <span>
                  <Icon.pin /> {request?.district}
                  <em>{finished ? `${work.done.length}/${work.tasks.length} đầu việc đã làm` : `${work.tasks.length} đầu việc dự kiến`}</em>
                </span>
              </div>
              {request?.notes && <p className="session-note">“{request.notes}”</p>}
              <div className="booking-card-progress">
                <div className="progress-line">
                  <span style={{ width: `${sum.percent}%` }} />
                </div>
                <small>
                  Liệu trình {formatDate(sum.first?.date)}
                  {sum.last?.date !== sum.first?.date ? ` → ${formatDate(sum.last?.date)}` : ''} · {sum.done}/{sum.total} buổi hoàn thành
                  {sum.next ? ` · Tiếp theo: ${weekdayLong(sum.next.date)} ${dayjs(sum.next.date).format('DD/MM')} lúc ${sum.next.start}` : ''}
                </small>
              </div>
            </Link>
          )
        })
      )}
    </>
  )
}
