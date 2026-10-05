import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getBooking, getNurse, getPatient, listSosEventsForHospital } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { SOS_TYPE_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function SosLog() {
  const { session } = useAuth()
  const state = useDb()
  const events = listSosEventsForHospital(state, session.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <>
      <PageHead eyebrow="Emergency" title="Cảnh báo SOS" description="Nhật ký sự cố khẩn cấp từ các ca chăm sóc của bệnh viện." />

      {events.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.bell />} title="Chưa có cảnh báo SOS nào" />
        </section>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời điểm</th>
                  <th>Bệnh nhân</th>
                  <th>Điều dưỡng</th>
                  <th>Người kích hoạt</th>
                  <th>Loại cảnh báo</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const booking = getBooking(state, e.bookingId)
                  const nurse = booking ? getNurse(state, booking.nurseId) : null
                  const patient = getPatient(state, e.patientId || booking?.patientId)
                  return (
                    <tr key={e.id}>
                      <td>{formatDateTime(e.createdAt)}</td>
                      <td>{patient?.name || '—'}</td>
                      <td>{nurse?.name || '—'}</td>
                      <td>
                        <StatusBadge label={e.triggeredBy === 'nurse' ? 'Điều dưỡng' : 'Gia đình'} tone={e.triggeredBy === 'nurse' ? 'info' : 'pending'} />
                      </td>
                      <td>{SOS_TYPE_LABEL[e.type]}</td>
                      <td style={{ color: 'var(--muted)' }}>{e.note || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
