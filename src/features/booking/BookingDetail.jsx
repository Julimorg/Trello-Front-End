import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import PatientConfirmDialog from '../../patient/PatientConfirmDialog'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getBooking, getCareRequest, getHospital, getNurse, requestReschedule } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { BOOKING_STATUS_LABEL, SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

export default function BookingDetail() {
  const { id } = useParams()
  const toast = useToast()
  const state = useDb()
  const listRef = useRef(null)
  const booking = getBooking(state, id)
  const [rescheduleSession, setRescheduleSession] = useState(null)
  const [note, setNote] = useState('')

  useStaggerIn(listRef, '.day-session', [id])

  if (!booking) {
    return (
      <section className="panel">
        <EmptyState icon={<Icon.calendar />} title="Không tìm thấy lịch chăm sóc này" />
      </section>
    )
  }

  const nurse = getNurse(state, booking.nurseId)
  const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
  const careRequest = getCareRequest(state, booking.careRequestId)
  const today = dayjs().format('YYYY-MM-DD')
  const sessions = [...booking.sessions].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <>
      <PageHead
        eyebrow="Booking & scheduling"
        title={`${careRequest ? careTypeLabel(careRequest.careType) : 'Lịch chăm sóc'} · ${nurse?.name || ''}`}
        description={`${hospital?.name || ''} · Mã lịch ${booking.id}`}
        action={<StatusBadge status={computeBookingStatus(booking)} labelMap={BOOKING_STATUS_LABEL} />}
      />

      <section className="panel panel-body" style={{ marginBottom: 20 }}>
      <div className="active-care-meta" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="meta-item">
          <Icon.file />
          <span>
            <small>Yêu cầu gốc</small>
            <b>{careRequest ? <Link to={`/patient/request/${careRequest.id}`}>#{careRequest.id}</Link> : '—'}</b>
          </span>
        </div>
        <div className="meta-item">
          <Icon.user />
          <span>
            <small>Điều dưỡng phụ trách</small>
            <b>{nurse ? <Link to={`/patient/nurses/${nurse.id}`}>{nurse.name}</Link> : '—'}</b>
          </span>
        </div>
        <div className="meta-item">
          <Icon.pin />
          <span>
            <small>Khu vực</small>
            <b>{careRequest?.district || '—'}</b>
          </span>
        </div>
      </div>
      </section>

      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h2>{sessions.length} buổi chăm sóc</h2>
            <p>Ca có nhãn “Đã đổi điều dưỡng” được thực hiện bởi người thay thế</p>
          </div>
        </div>
        <div className="day-session-list" ref={listRef}>
          {sessions.map((s) => {
            const sessionNurse = getNurse(state, s.nurseId)
            return (
              <div className={`day-session${s.date === today ? ' is-today' : ''}`} key={s.id}>
                <div className="day-session-time">
                  <b>{dayjs(s.date).format('DD/MM')}</b>
                  <small>{s.date === today ? 'Hôm nay' : dayjs(s.date).format('YYYY')}</small>
                </div>
                <div>
                  <h3>
                    {s.start} – {s.end}
                  </h3>
                  <p>
                    {sessionNurse ? <Link to={`/patient/nurses/${sessionNurse.id}`}>{sessionNurse.name}</Link> : '—'}
                    {s.status === SESSION_STATUS.CANNOT_PERFORM ? ' · Đang tìm điều dưỡng thay thế' : ''}
                  </p>
                </div>
                <div className="day-session-side">
                  <StatusBadge status={s.status} labelMap={SESSION_STATUS_LABEL} />
                  {s.date >= today && (
                    <Button
                      size="small"
                      onClick={() => {
                        setRescheduleSession(s)
                        setNote('')
                      }}
                    >
                      Đổi lịch
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {booking.sessions.some((s) => s.history?.length) && (
        <section className="panel panel-body" style={{ marginBottom: 20 }}>
          <h3 className="detail-heading" style={{ marginTop: 0 }}>
            Lịch sử thay đổi
          </h3>
          <div className="stack-gap-8">
            {booking.sessions
              .filter((s) => s.history?.length)
              .flatMap((s) =>
                s.history.map((h, i) => (
                  <p key={`${s.id}-${i}`} className="detail-text">
                    {formatDate(s.date)}: {getNurse(state, h.nurseId)?.name} báo không thể thực hiện — lý do: {h.reason}
                  </p>
                )),
              )}
          </div>
        </section>
      )}

      <p className="form-hint">Nếu có bất thường trong lúc chăm sóc, nhấn nút SOS (có thể kéo đến vị trí thuận tiện) để gọi 115 hoặc báo người thân ngay.</p>

      <PatientConfirmDialog
        open={!!rescheduleSession}
        title="Yêu cầu đổi lịch"
        description={rescheduleSession ? `Gửi yêu cầu đổi lịch cho buổi ${formatDate(rescheduleSession.date)} tới bệnh viện.` : ''}
        confirmLabel="Gửi yêu cầu"
        confirmDisabled={!note.trim()}
        onClose={() => setRescheduleSession(null)}
        onConfirm={() => {
          requestReschedule({ bookingId: booking.id, sessionId: rescheduleSession.id, note })
          setRescheduleSession(null)
          toast('Đã gửi yêu cầu đổi lịch', 'Bệnh viện sẽ liên hệ để xác nhận thời gian mới.')
        }}
      >
        <TextField autoFocus fullWidth multiline minRows={3} label="Lý do / thời gian mong muốn" value={note} onChange={(e) => setNote(e.target.value)} />
      </PatientConfirmDialog>
    </>
  )
}
