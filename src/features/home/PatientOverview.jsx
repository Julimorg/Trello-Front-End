import { useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import CountUp from '../../patient/CountUp'
import { useStaggerIn } from '../../patient/anime'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getNurse, getPrimaryFamilyContact, listBookingsByPatient, listCareRequestsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS, CARE_REQUEST_STATUS_LABEL, SESSION_STATUS } from '../../lib/constants'
import { DASHBOARD_HERO, DASHBOARD_METRICS, DASHBOARD_QUICK_LINKS, DASHBOARD_RECENT_DAYS, DASHBOARD_RECENT_LIMIT, DASHBOARD_UPCOMING_DAYS } from '../../Data/patient/dashboard-data'
import { relativeDay, weekdayLong } from '../booking/booking-shared'
import dayjs from 'dayjs'
import { Icon } from '../../lib/icons'

const IN_FLIGHT = [CARE_REQUEST_STATUS.MATCHING, CARE_REQUEST_STATUS.MATCHED, CARE_REQUEST_STATUS.NURSE_PENDING]

export default function PatientOverview() {
  const { session } = useAuth()
  const state = useDb()
  const navigate = useNavigate()
  const metricsRef = useRef(null)
  const recentRef = useRef(null)

  const requests = listCareRequestsByPatient(state, session.id)
  const bookings = listBookingsByPatient(state, session.id)
  const primary = getPrimaryFamilyContact(state, session.id)
  // "Gần nhất": created today or in the previous few days. "Sắp tới": visits in the next month.
  const recentSince = dayjs().subtract(DASHBOARD_RECENT_DAYS, 'day').startOf('day')
  const recent = requests.filter((r) => !dayjs(r.createdAt).isBefore(recentSince)).slice(0, DASHBOARD_RECENT_LIMIT)

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const horizon = dayjs().add(DASHBOARD_UPCOMING_DAYS, 'day').format('YYYY-MM-DD')
    const upcoming = bookings
      .flatMap((b) => b.sessions.map((s) => ({ ...s, booking: b })))
      .filter((s) => s.date >= today && s.date <= horizon && s.status !== SESSION_STATUS.CANNOT_PERFORM && s.status !== SESSION_STATUS.COMPLETED)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    return {
      values: {
        activeRequests: requests.filter((r) => IN_FLIGHT.includes(r.status)).length,
        upcomingSessions: upcoming.length,
      },
      upcoming,
      nextSession: upcoming[0],
    }
  }, [requests, bookings])

  const hints = {
    activeRequests: stats.values.activeRequests ? 'Đang chờ xử lý' : 'Chưa có yêu cầu mới',
    upcomingSessions: stats.nextSession ? `Gần nhất: ${relativeDay(stats.nextSession.date).toLowerCase()}, ${formatDate(stats.nextSession.date)} lúc ${stats.nextSession.start}` : `Không có buổi nào trong ${DASHBOARD_UPCOMING_DAYS} ngày tới`,
  }

  useStaggerIn(metricsRef, '.metric', [])
  useStaggerIn(recentRef, '.recent-card', [recent.map((r) => r.id).join()])

  return (
    <>
      <PageHead eyebrow={DASHBOARD_HERO.eyebrow} title={DASHBOARD_HERO.title} description={DASHBOARD_HERO.description} />

      <div className="metric-grid" ref={metricsRef}>
        {DASHBOARD_METRICS.map((m) => {
          const MetricIcon = Icon[m.icon]
          return (
            <Link key={m.key} to={m.to} className="metric metric-link">
              <div className="metric-top">
                <span>{m.label}</span>
                <span className={`metric-icon ${m.tone}`}>
                  <MetricIcon />
                </span>
              </div>
              <strong>
                <CountUp value={stats.values[m.key]} />
              </strong>
              <small>{hints[m.key]}</small>
            </Link>
          )
        })}
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'grid', gap: 20, alignContent: 'start', minWidth: 0 }}>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Yêu cầu chăm sóc gần nhất</h2>
              <p>Tạo hôm nay và {DASHBOARD_RECENT_DAYS} ngày trước · tối đa {DASHBOARD_RECENT_LIMIT} yêu cầu</p>
            </div>
            <div className="panel-head-actions">
              <Link to="/patient/request" className="text-button">
                Xem tất cả
              </Link>
              <Button variant="contained" size="small" startIcon={<Icon.plus />} onClick={() => navigate('/patient/request', { state: { openWizard: true } })}>
                Tạo yêu cầu chăm sóc
              </Button>
            </div>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={<Icon.plus />} title={`Không có yêu cầu nào trong ${DASHBOARD_RECENT_DAYS} ngày qua`} description="Tạo yêu cầu mới hoặc xem toàn bộ lịch sử ở mục Yêu cầu chăm sóc." />
          ) : (
            <div className="recent-list" ref={recentRef}>
              {recent.map((r) => {
                const nurse = r.selectedNurseId ? getNurse(state, r.selectedNurseId) : null
                return (
                  <Card key={r.id} variant="outlined" className="recent-card">
                    <CardActionArea component={Link} to={`/patient/request/${r.id}`} sx={{ p: 2 }}>
                      <div className="recent-card-top">
                        <b>{careTypeLabel(r.careType)}</b>
                        <StatusBadge status={r.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
                      </div>
                      <div className="recent-card-meta">
                        <span>
                          <Icon.calendar /> {formatDate(r.desiredStartDate)} · {r.timeSlot?.start}
                        </span>
                        <span>
                          <Icon.pin /> {r.district}
                        </span>
                        <span>
                          <Icon.user /> {nurse ? nurse.name : r.status === CARE_REQUEST_STATUS.MATCHED ? `${r.matchedNurseIds.length} điều dưỡng phù hợp` : 'Chưa chọn điều dưỡng'}
                        </span>
                      </div>
                      <small className="recent-card-id">#{r.id}</small>
                    </CardActionArea>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Lịch sắp tới</h2>
              <p>Các buổi chăm sóc trong {DASHBOARD_UPCOMING_DAYS} ngày tới</p>
            </div>
            <Link to="/patient/bookings" className="text-button">
              Mở lịch
            </Link>
          </div>
          {stats.upcoming.length === 0 ? (
            <EmptyState icon={<Icon.calendar />} title="Chưa có buổi chăm sóc sắp tới" description={`Không có buổi nào trong ${DASHBOARD_UPCOMING_DAYS} ngày tới.`} />
          ) : (
            <div className="day-session-list">
              {stats.upcoming.slice(0, 5).map((s) => (
                <Link key={s.id} to={`/patient/bookings/${s.booking.id}`} className="day-session" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="day-session-time">
                    <b>{dayjs(s.date).format('DD/MM')}</b>
                    <small>{relativeDay(s.date)}</small>
                  </div>
                  <div>
                    <h3>{careTypeLabel(requests.find((r) => r.id === s.booking.careRequestId)?.careType)}</h3>
                    <p>
                      {weekdayLong(s.date)} · {s.start}–{s.end} · {getNurse(state, s.nurseId)?.name}
                    </p>
                  </div>
                  <StatusBadge status={s.status} labelMap={{ confirmed: { label: 'Đã xác nhận', tone: 'success' } }} />
                </Link>
              ))}
            </div>
          )}
        </section>
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Truy cập nhanh</h2>
              <p>Các thao tác thường dùng</p>
            </div>
          </div>
          <div className="quick-list">
            {DASHBOARD_QUICK_LINKS.map((q) => {
              const QuickIcon = Icon[q.icon]
              const subtitle = q.id === 'ql-family' && primary?.status === 'Đã liên kết' ? `${primary.name} nhận cảnh báo SOS trước` : q.subtitle
              return (
                <Link key={q.id} to={q.to} className="quick-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="quick-icon">
                    <QuickIcon />
                  </span>
                  <span>
                    <b>{q.title}</b>
                    <small>{subtitle}</small>
                  </span>
                  <Icon.chevron />
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
