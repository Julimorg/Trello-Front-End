import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import NursePendingCard from './NursePendingCard'
import SosButton from '../sos/SosButton'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getNurse, getPatient, listBookingsByNurse, listPendingRequestsForNurse } from '../../lib/db'
import { SESSION_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function NurseOverview() {
  const { session } = useAuth()
  const state = useDb()
  const nurse = getNurse(state, session.id)
  const pending = listPendingRequestsForNurse(state, session.id)
  const bookings = listBookingsByNurse(state, session.id)

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const monthPrefix = dayjs().format('YYYY-MM')
    const sessions = bookings.flatMap((b) => b.sessions.filter((s) => s.nurseId === session.id).map((s) => ({ ...s, bookingId: b.id })))
    const todaySessions = sessions.filter((s) => s.date === today && s.status !== SESSION_STATUS.CANNOT_PERFORM)
    const completedThisMonth = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED && s.date.startsWith(monthPrefix))
    return { todaySessions, completedThisMonth }
  }, [bookings, session.id])

  const todaySession = stats.todaySessions[0]

  return (
    <>
      <PageHead
        eyebrow="Ca trực ngoài giờ"
        title={`Chào buổi sáng, ${nurse?.name?.split(' ').pop() || ''}.`}
        description={`Bạn có ${pending.length ? `${pending.length} yêu cầu mới cần phản hồi` : 'không có yêu cầu mới'} và ${stats.todaySessions.length} lịch chăm sóc hôm nay.`}
        action={
          <Link to="/hospital/nurse/schedule" className="btn secondary">
            <Icon.calendar /> Xem lịch
          </Link>
        }
      />

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-top">
            <span>Ca mới</span>
            <span className="metric-icon blue">
              <Icon.bell />
            </span>
          </div>
          <strong>{String(pending.length).padStart(2, '0')}</strong>
          <small>Cần phản hồi trong 15 phút</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Lịch hôm nay</span>
            <span className="metric-icon">
              <Icon.calendar />
            </span>
          </div>
          <strong>{String(stats.todaySessions.length).padStart(2, '0')}</strong>
          <small>{todaySession ? `Ca đầu tiên lúc ${todaySession.start}` : 'Không có ca hôm nay'}</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Hoàn thành tháng này</span>
            <span className="metric-icon amber">
              <Icon.check />
            </span>
          </div>
          <strong>{String(stats.completedThisMonth.length).padStart(2, '0')}</strong>
          <small>Buổi chăm sóc đã hoàn tất</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Đánh giá</span>
            <span className="metric-icon red">★</span>
          </div>
          <strong>{nurse?.rating ?? '—'}</strong>
          <small>Trung bình từ bệnh nhân</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section>
          <h2 className="section-title">Yêu cầu mới</h2>
          {pending.length === 0 ? (
            <div className="panel">
              <EmptyState icon={<Icon.bell />} title="Không có ca mới" description="Yêu cầu phù hợp sẽ xuất hiện tại đây." />
            </div>
          ) : (
            <NursePendingCard careRequest={pending[0]} />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Lịch hôm nay</h2>
              <p>{dayjs().format('dddd, DD/MM')}</p>
            </div>
          </div>
          <div className="quick-list">
            {stats.todaySessions.length === 0 && (
              <p style={{ padding: '14px 18px', color: 'var(--muted)', fontSize: '.8rem' }}>Không có ca nào hôm nay.</p>
            )}
            {stats.todaySessions.map((s) => {
              const booking = bookings.find((b) => b.id === s.bookingId)
              const patient = booking ? getPatient(state, booking.patientId) : null
              return (
                <div className="quick-item" key={s.id}>
                  <span className="quick-icon">{s.start}</span>
                  <span>
                    <b>{patient?.name}</b>
                    <small>{patient?.district}</small>
                  </span>
                  <Icon.chevron />
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {todaySession && <SosButton bookingId={todaySession.bookingId} sessionId={todaySession.id} role="nurse" />}
    </>
  )
}
