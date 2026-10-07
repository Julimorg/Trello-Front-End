import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { PickerDay } from '@mui/x-date-pickers/PickerDay'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getCareRequest, getHospital, getNurse, listBookingsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { bookingSummary, formatDuration, frequencyText, minutesBetween, relativeDay, visitWork, weekdayLong } from './booking-shared'
import { BOOKING_STATUS_LABEL, SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const DOT_COLORS = { upcoming: '#0b6b68', past: '#94a4a7', issue: '#cf3c43' }

function SessionDay({ sessionIndex = {}, day, outsideCurrentMonth, ...other }) {
  const info = sessionIndex[day.format('YYYY-MM-DD')]
  return (
    <Badge
      overlap="circular"
      variant="dot"
      invisible={!info || outsideCurrentMonth}
      sx={{ '& .MuiBadge-badge': { backgroundColor: info ? DOT_COLORS[info.tone] : undefined, top: 6, right: 6 } }}
    >
      <PickerDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />
    </Badge>
  )
}

export default function BookingList() {
  const { session } = useAuth()
  const state = useDb()
  const [selected, setSelected] = useState(() => dayjs())
  const listRef = useRef(null)
  const today = dayjs().format('YYYY-MM-DD')

  const bookings = listBookingsByPatient(state, session.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const sessions = useMemo(
    () =>
      bookings
        .flatMap((b) => b.sessions.map((s) => ({ ...s, booking: b, careRequest: getCareRequest(state, b.careRequestId) })))
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)),
    [bookings, state],
  )

  const sessionIndex = useMemo(() => {
    const index = {}
    sessions.forEach((s) => {
      const entry = index[s.date] || { count: 0, tone: 'past' }
      entry.count += 1
      if (s.status === SESSION_STATUS.CANNOT_PERFORM) entry.tone = 'issue'
      else if (s.date >= today && entry.tone !== 'issue') entry.tone = 'upcoming'
      index[s.date] = entry
    })
    return index
  }, [sessions, today])

  const selectedIso = selected.format('YYYY-MM-DD')
  const daySessions = sessions.filter((s) => s.date === selectedIso)
  const nextDate = sessions.find((s) => s.date > selectedIso)?.date
  const prevDate = [...sessions].reverse().find((s) => s.date < selectedIso)?.date

  useStaggerIn(listRef, '.day-session', [selectedIso, daySessions.length])

  return (
    <>
      <PageHead eyebrow="Booking & scheduling" title="Lịch chăm sóc của bạn" description="Chọn một ngày trên lịch để xem các ca chăm sóc trong ngày — cả ca đã qua và ca sắp tới." />

      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <DateCalendar
            value={selected}
            onChange={(v) => v && setSelected(v)}
            dayOfWeekFormatter={(d) => d.format('dd')}
            slots={{ day: SessionDay }}
            slotProps={{ day: { sessionIndex } }}
          />
          <div className="calendar-legend">
            <span>
              <i style={{ background: DOT_COLORS.upcoming }} /> Sắp tới
            </span>
            <span>
              <i style={{ background: DOT_COLORS.past }} /> Đã qua
            </span>
            <span>
              <i style={{ background: DOT_COLORS.issue }} /> Cần đổi điều dưỡng
            </span>
          </div>
          <div className="calendar-actions">
            <Button size="small" variant="outlined" onClick={() => setSelected(dayjs())}>
              Hôm nay
            </Button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Ca chăm sóc ngày {selected.format('DD/MM/YYYY')}</h2>
              <p>
                {daySessions.length ? `${daySessions.length} ca trong ngày` : 'Không có ca nào'}
                {selectedIso === today ? ' · Hôm nay' : ''}
              </p>
            </div>
            <div className="panel-head-actions">
              <Button size="small" disabled={!prevDate} onClick={() => setSelected(dayjs(prevDate))}>
                ← Ngày có lịch trước
              </Button>
              <Button size="small" disabled={!nextDate} onClick={() => setSelected(dayjs(nextDate))}>
                Ngày có lịch sau →
              </Button>
            </div>
          </div>
          {daySessions.length === 0 ? (
            <EmptyState icon={<Icon.calendar />} title="Không có ca chăm sóc trong ngày này" description="Các ngày có chấm màu trên lịch là ngày có ca chăm sóc." />
          ) : (
            <div className="day-session-list" ref={listRef}>
              {daySessions.map((s) => {
                const nurse = getNurse(state, s.nurseId)
                const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
                const careType = s.careRequest?.careType
                const index = s.booking.sessions.findIndex((x) => x.id === s.id)
                const work = visitWork(s, careType)
                const finished = s.status === SESSION_STATUS.COMPLETED
                return (
                  <div className="day-session day-session-rich" key={s.id}>
                    <div className="day-session-time">
                      <b>{s.start}</b>
                      <small>{s.end}</small>
                    </div>
                    <div>
                      <h3>{careType ? careTypeLabel(careType) : 'Buổi chăm sóc'}</h3>
                      <p>
                        {nurse ? <Link to={`/patient/nurses/${nurse.id}`}>{nurse.name}</Link> : '—'}
                        {hospital ? ` · ${hospital.name}` : ''}
                      </p>
                      <div className="session-meta">
                        <span>
                          <Icon.clock /> {formatDuration(minutesBetween(s.start, s.end))}
                        </span>
                        <span>
                          <Icon.calendar /> Buổi {index + 1}/{s.booking.sessions.length}
                          {s.booking.sessions.length > 1 && s.careRequest ? ` · ${frequencyText(s.careRequest)}` : ''}
                        </span>
                        <span>
                          <Icon.pin /> {s.careRequest?.district}
                        </span>
                        {finished && (
                          <span>
                            <Icon.check /> {work.done.length}/{work.tasks.length} đầu việc
                          </span>
                        )}
                      </div>
                      {s.careRequest?.notes && <p className="session-note">“{s.careRequest.notes}”</p>}
                      <p className="session-link">
                        <Link to={`/patient/request/${s.booking.careRequestId}`}>#{s.booking.careRequestId}</Link>
                      </p>
                    </div>
                    <div className="day-session-side">
                      <StatusBadge status={s.status} labelMap={SESSION_STATUS_LABEL} />
                      <Button size="small" component={Link} to={`/patient/bookings/${s.booking.id}`}>
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <h2 className="section-title">Tất cả liệu trình</h2>
      {bookings.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.calendar />} title="Chưa có lịch được xác nhận" description="Sau khi điều dưỡng chấp nhận, lịch chăm sóc sẽ xuất hiện tại đây." />
        </section>
      ) : (
        bookings.map((b) => {
          const nurse = getNurse(state, b.nurseId)
          const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
          const request = getCareRequest(state, b.careRequestId)
          const sum = bookingSummary(b, today)
          const status = computeBookingStatus(b)
          return (
            <Link key={b.id} to={`/patient/bookings/${b.id}`} className="booking-card">
              <div className="booking-card-head">
                <div className="shift-date">
                  <small>{sum.first?.date ? `THÁNG ${dayjs(sum.first.date).format('MM')}` : ''}</small>
                  <b>{sum.first?.date ? dayjs(sum.first.date).format('DD') : '—'}</b>
                </div>
                <div className="booking-card-title">
                  <h3>{request ? careTypeLabel(request.careType) : 'Lịch chăm sóc'}</h3>
                  <p>
                    {nurse?.name}
                    {hospital ? ` · ${hospital.name}` : ''}
                  </p>
                </div>
                <StatusBadge status={status} labelMap={BOOKING_STATUS_LABEL} />
              </div>
              <div className="booking-card-facts">
                <span>
                  <Icon.calendar /> {formatDate(sum.first?.date)}
                  {sum.last && sum.last.date !== sum.first?.date ? ` → ${formatDate(sum.last.date)}` : ''}
                  <em>{sum.spanDays} ngày</em>
                </span>
                <span>
                  <Icon.clock /> {sum.first?.start}–{sum.first?.end}
                  <em>{formatDuration(sum.perSessionMinutes)}/buổi</em>
                </span>
                <span>
                  <Icon.refresh /> {request ? frequencyText(request) : '—'}
                  <em>{sum.total} buổi · tổng {formatDuration(sum.totalMinutes)}</em>
                </span>
                <span>
                  <Icon.pin /> {request?.district}
                </span>
              </div>
              <div className="booking-card-progress">
                <div className="progress-line">
                  <span style={{ width: `${sum.percent}%` }} />
                </div>
                <small>
                  {sum.done}/{sum.total} buổi hoàn thành
                  {sum.next ? ` · Tiếp theo: ${weekdayLong(sum.next.date)} ${dayjs(sum.next.date).format('DD/MM')} lúc ${sum.next.start} (${relativeDay(sum.next.date, today).toLowerCase()})` : ''}
                  {sum.needsNurse > 0 ? ` · ${sum.needsNurse} buổi cần điều dưỡng thay thế` : ''}
                </small>
              </div>
            </Link>
          )
        })
      )}
    </>
  )
}
