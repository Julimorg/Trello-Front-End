import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import SosButton from '../sos/SosButton'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getPatient, listBookingsByNurse, reportCannotPerform } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function NurseSchedule() {
  const { session } = useAuth()
  const state = useDb()
  const bookings = listBookingsByNurse(state, session.id)
  const [cannotPerform, setCannotPerform] = useState(null)
  const [reason, setReason] = useState('')
  const today = dayjs().format('YYYY-MM-DD')

  const rows = bookings
    .flatMap((b) => b.sessions.filter((s) => s.nurseId === session.id).map((s) => ({ booking: b, sessionItem: s })))
    .sort((a, b) => a.sessionItem.date.localeCompare(b.sessionItem.date))

  const weekDays = useMemo(() => {
    const start = dayjs().startOf('week').add(1, 'day') // Monday
    return Array.from({ length: 7 }).map((_, i) => {
      const date = start.add(i, 'day')
      const iso = date.format('YYYY-MM-DD')
      const slots = rows.filter((r) => r.sessionItem.date === iso)
      return { date, iso, slots }
    })
  }, [rows])

  const todaySession = rows.find((r) => r.sessionItem.date === today && r.sessionItem.status !== SESSION_STATUS.CANNOT_PERFORM)

  return (
    <>
      <PageHead eyebrow={dayjs().format('[Tháng] MM / YYYY')} title="Lịch làm việc" description="Lịch bệnh viện và các khung giờ nhận ca CareShift." />

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h2>Tuần {weekDays[0]?.date.format('DD')}–{weekDays[6]?.date.format('DD/MM')}</h2>
            <p>Khung giờ CareShift được hiển thị màu xanh</p>
          </div>
        </div>
        <div className="schedule-grid" style={{ padding: 16 }}>
          {weekDays.map((d) => (
            <div className={`day${d.slots.length ? ' has-shift' : ''}`} key={d.iso}>
              <span>{WEEKDAY_SHORT[d.date.day()]}</span>
              <strong>{d.date.format('DD')}</strong>
              {d.slots.map((s) => (
                <div className="slot" key={s.sessionItem.id}>
                  {s.sessionItem.start} · Ca
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.calendar />} title="Chưa có ca chăm sóc nào được giao" />
        </section>
      ) : (
        rows.map(({ booking, sessionItem }) => {
          const careRequest = getCareRequest(state, booking.careRequestId)
          const patient = getPatient(state, booking.patientId)
          const canReport = sessionItem.status === SESSION_STATUS.CONFIRMED && sessionItem.date >= today
          return (
            <div className="shift-card" key={sessionItem.id}>
              <div className="shift-date">
                <small>TH {dayjs(sessionItem.date).format('MM')}</small>
                <b>{dayjs(sessionItem.date).format('DD')}</b>
              </div>
              <div>
                <h3>
                  {careRequest ? careTypeLabel(careRequest.careType) : ''} · {patient?.name}
                </h3>
                <p>
                  {formatDate(sessionItem.date)} · {sessionItem.start}–{sessionItem.end}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={sessionItem.status} labelMap={SESSION_STATUS_LABEL} />
                {canReport && (
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => {
                      setCannotPerform({ booking, sessionItem })
                      setReason('')
                    }}
                  >
                    Không thể thực hiện
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      <p className="form-hint">Nếu phát hiện dấu hiệu bất thường trong ca đang diễn ra, nhấn nút SOS ở góc màn hình.</p>

      {todaySession && <SosButton bookingId={todaySession.booking.id} sessionId={todaySession.sessionItem.id} role="nurse" />}

      <ConfirmDialog
        open={!!cannotPerform}
        title="Báo không thể thực hiện ca"
        description="Dùng khi có sự cố bất khả kháng (ốm, việc phát sinh...). Hệ thống sẽ tự tìm người thay thế nếu có."
        confirmLabel="Gửi báo cáo"
        confirmTone="danger"
        confirmDisabled={!reason.trim()}
        onClose={() => setCannotPerform(null)}
        onConfirm={() => {
          reportCannotPerform({ bookingId: cannotPerform.booking.id, sessionId: cannotPerform.sessionItem.id, reason })
          setCannotPerform(null)
        }}
      >
        <label>
          <span className="field-label">Lý do</span>
          <textarea rows={3} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </ConfirmDialog>
    </>
  )
}
