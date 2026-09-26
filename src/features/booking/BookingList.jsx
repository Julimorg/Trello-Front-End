import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getCareRequest, getNurse, listBookingsByPatient } from '../../lib/db'
import dayjs from 'dayjs'
import { careTypeLabel } from '../../lib/format'
import { BOOKING_STATUS_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function BookingList() {
  const { session } = useAuth()
  const state = useDb()
  const bookings = listBookingsByPatient(state, session.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <>
      <PageHead eyebrow="Booking & scheduling" title="Lịch chăm sóc của bạn" description="Tất cả buổi chăm sóc và trạng thái xác nhận trong một nơi." />

      {bookings.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.calendar />} title="Chưa có lịch được xác nhận" description="Sau khi điều dưỡng chấp nhận, lịch chăm sóc sẽ xuất hiện tại đây." />
        </section>
      ) : (
        bookings.map((b) => {
          const nurse = getNurse(state, b.nurseId)
          const request = getCareRequest(state, b.careRequestId)
          const first = b.sessions[0]
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
                  {first?.start}–{first?.end} · {b.sessions.length} buổi
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
