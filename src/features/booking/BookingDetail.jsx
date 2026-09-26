import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import SosButton from '../sos/SosButton'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getBooking, getHospital, getNurse, getPrimaryFamilyContact, requestReschedule } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { BOOKING_STATUS_LABEL, SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'

export default function BookingDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const state = useDb()
  const booking = getBooking(state, id)
  const [rescheduleSession, setRescheduleSession] = useState(null)
  const [note, setNote] = useState('')

  if (!booking) {
    return (
      <div className="empty-state">
        <h3>Không tìm thấy lịch chăm sóc này</h3>
      </div>
    )
  }

  const nurse = getNurse(state, booking.nurseId)
  const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
  const primaryContact = getPrimaryFamilyContact(state, session.id)
  const today = dayjs().format('YYYY-MM-DD')
  const todaySession = booking.sessions.find((s) => s.date === today && s.status !== SESSION_STATUS.CANNOT_PERFORM)

  return (
    <>
      <PageHead
        eyebrow="Booking & scheduling"
        title={`Lịch chăm sóc với ${nurse?.name || 'điều dưỡng'}`}
        description={hospital?.name}
        action={<StatusBadge status={computeBookingStatus(booking)} labelMap={BOOKING_STATUS_LABEL} />}
      />

      <section className="panel" style={{ marginBottom: 20 }}>
        {booking.sessions.map((s, idx) => (
          <div className="quick-item" key={s.id} style={{ padding: '14px 18px', borderBottom: idx < booking.sessions.length - 1 ? '1px solid #edf2f2' : 'none' }}>
            <span>
              <b>
                {formatDate(s.date)} · {s.start}–{s.end}
              </b>
              <small>
                {s.status === SESSION_STATUS.REASSIGNED
                  ? `Đã đổi điều dưỡng: ${getNurse(state, s.nurseId)?.name || ''}`
                  : s.status === SESSION_STATUS.CANNOT_PERFORM
                    ? 'Đang tìm điều dưỡng thay thế'
                    : ''}
              </small>
            </span>
            <StatusBadge status={s.status} labelMap={SESSION_STATUS_LABEL} />
            {s.date >= today && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setRescheduleSession(s)
                  setNote('')
                }}
              >
                Đổi lịch
              </button>
            )}
          </div>
        ))}
      </section>

      {booking.sessions.some((s) => s.history?.length) && (
        <section className="panel panel-body" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: '.9rem' }}>Lịch sử thay đổi</h3>
          <div className="stack-gap-8">
            {booking.sessions
              .filter((s) => s.history?.length)
              .flatMap((s) =>
                s.history.map((h, i) => (
                  <p key={`${s.id}-${i}`} style={{ margin: 0, fontSize: '.78rem', color: 'var(--muted)' }}>
                    {formatDate(s.date)}: {getNurse(state, h.nurseId)?.name} báo không thể thực hiện — lý do: {h.reason}
                  </p>
                )),
              )}
          </div>
        </section>
      )}

      <p className="form-hint">
        Nếu có bất thường trong lúc chăm sóc, bạn hoặc người thân có thể nhấn nút SOS ở góc màn hình để gọi 115 và báo cho bệnh viện ngay lập tức.
      </p>

      {todaySession && (
        <SosButton
          bookingId={booking.id}
          sessionId={todaySession.id}
          role="patient"
          familyLabel={primaryContact ? `${primaryContact.name} · ${primaryContact.relation}` : ''}
          onNeedFamilyLink={() => navigate('/patient/family')}
        />
      )}

      <ConfirmDialog
        open={!!rescheduleSession}
        title="Yêu cầu đổi lịch"
        description={rescheduleSession ? `Gửi yêu cầu đổi lịch cho buổi ${formatDate(rescheduleSession.date)} tới bệnh viện.` : ''}
        confirmLabel="Gửi yêu cầu"
        onClose={() => setRescheduleSession(null)}
        confirmDisabled={!note.trim()}
        onConfirm={() => {
          requestReschedule({ bookingId: booking.id, sessionId: rescheduleSession.id, note })
          setRescheduleSession(null)
        }}
      >
        <label>
          <span className="field-label">Lý do / thời gian mong muốn</span>
          <textarea rows={3} autoFocus value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </ConfirmDialog>
    </>
  )
}
