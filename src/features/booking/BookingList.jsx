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
import { computeBookingStatus, getCareRequest, getNurse, listBookingsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
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
                return (
                  <div className="day-session" key={s.id}>
                    <div className="day-session-time">
                      <b>{s.start}</b>
                      <small>{s.end}</small>
                    </div>
                    <div>
                      <h3>{s.careRequest ? careTypeLabel(s.careRequest.careType) : 'Buổi chăm sóc'}</h3>
                      <p>
                        {nurse ? <Link to={`/patient/nurses/${nurse.id}`}>{nurse.name}</Link> : '—'} · {s.careRequest?.district} ·{' '}
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
          const request = getCareRequest(state, b.careRequestId)
          const first = b.sessions[0]
          const last = b.sessions[b.sessions.length - 1]
          return (
            <Link key={b.id} to={`/patient/bookings/${b.id}`} className="shift-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="shift-date">
                <small>{first?.date ? `THÁNG ${dayjs(first.date).format('MM')}` : ''}</small>
                <b>{first?.date ? dayjs(first.date).format('DD') : '—'}</b>
              </div>
              <div>
                <h3>
                  {request ? careTypeLabel(request.careType) : 'Lịch chăm sóc'} · {nurse?.name}
                </h3>
                <p>
                  {first?.start}–{first?.end} · {b.sessions.length} buổi · {formatDate(first?.date)}
                  {last && last.date !== first?.date ? ` → ${formatDate(last.date)}` : ''}
                </p>
              </div>
              <StatusBadge status={computeBookingStatus(b)} labelMap={BOOKING_STATUS_LABEL} />
            </Link>
          )
        })
      )}
    </>
  )
}
