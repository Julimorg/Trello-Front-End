import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import CareRequestWizardModal from '../careRequest/CareRequestWizardModal'
import CareRequestBody from '../careRequest/CareRequestBody'
import SosButton from '../sos/SosButton'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getPrimaryFamilyContact, listBookingsByPatient, listCareRequestsByPatient } from '../../lib/db'
import { CARE_REQUEST_STATUS, SESSION_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

const IN_FLIGHT = [CARE_REQUEST_STATUS.MATCHING, CARE_REQUEST_STATUS.MATCHED, CARE_REQUEST_STATUS.NURSE_PENDING]

export default function PatientOverview() {
  const { session } = useAuth()
  const state = useDb()
  const [wizardOpen, setWizardOpen] = useState(false)

  const requests = listCareRequestsByPatient(state, session.id)
  const bookings = listBookingsByPatient(state, session.id)
  const active = requests.find((r) => IN_FLIGHT.includes(r.status))
  const primary = getPrimaryFamilyContact(state, session.id)

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const allSessions = bookings.flatMap((b) => b.sessions)
    const upcoming = allSessions.filter((s) => s.date >= today && s.status !== SESSION_STATUS.CANNOT_PERFORM)
    const completedSessions = allSessions.filter((s) => s.status === SESSION_STATUS.COMPLETED)
    const trustedNurses = new Set(requests.flatMap((r) => r.matchedNurseIds))
    return {
      activeRequests: requests.filter((r) => IN_FLIGHT.includes(r.status)).length,
      upcoming: upcoming.length,
      trustedNurses: trustedNurses.size,
      completedSessions: completedSessions.length,
      nextSession: upcoming.sort((a, b) => a.date.localeCompare(b.date))[0],
    }
  }, [requests, bookings])

  const todaySession = bookings.flatMap((b) => b.sessions.map((s) => ({ ...s, bookingId: b.id }))).find((s) => s.date === new Date().toISOString().slice(0, 10) && s.status !== SESSION_STATUS.CANNOT_PERFORM)

  return (
    <>
      <PageHead
        eyebrow="Xin chào"
        title="Chăm sóc đúng người, đúng lúc."
        description="Theo dõi yêu cầu hiện tại hoặc tìm điều dưỡng đã được bệnh viện xác minh."
        action={
          <button type="button" className="btn primary" onClick={() => setWizardOpen(true)}>
            <Icon.plus /> Tạo yêu cầu chăm sóc
          </button>
        }
      />

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-top">
            <span>Yêu cầu hiện tại</span>
            <span className="metric-icon">
              <Icon.file />
            </span>
          </div>
          <strong>{String(stats.activeRequests).padStart(2, '0')}</strong>
          <small>{stats.activeRequests ? 'Đang chờ xử lý' : 'Chưa có yêu cầu mới'}</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Lịch sắp tới</span>
            <span className="metric-icon blue">
              <Icon.calendar />
            </span>
          </div>
          <strong>{String(stats.upcoming).padStart(2, '0')}</strong>
          <small>{stats.nextSession ? `${stats.nextSession.date} lúc ${stats.nextSession.start}` : 'Chưa có lịch được xác nhận'}</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Điều dưỡng tin cậy</span>
            <span className="metric-icon amber">
              <Icon.shield />
            </span>
          </div>
          <strong>{String(stats.trustedNurses).padStart(2, '0')}</strong>
          <small>Đã xuất hiện trong kết quả tìm kiếm</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Buổi đã hoàn thành</span>
            <span className="metric-icon red">
              <Icon.check />
            </span>
          </div>
          <strong>{String(stats.completedSessions).padStart(2, '0')}</strong>
          <small>Tổng số buổi chăm sóc</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Yêu cầu chăm sóc gần nhất</h2>
              <p>Trạng thái được cập nhật theo thời gian thực</p>
            </div>
            <Link to="/patient/request" className="text-button">
              Xem chi tiết
            </Link>
          </div>
          {active ? (
            <div className="active-care">
              <CareRequestBody careRequest={active} showCancel={false} />
            </div>
          ) : (
            <EmptyState
              icon={<Icon.plus />}
              title="Bắt đầu yêu cầu chăm sóc"
              description="Chỉ mất khoảng 2 phút để mô tả nhu cầu và nhận danh sách điều dưỡng phù hợp."
              action={
                <button type="button" className="btn secondary" onClick={() => setWizardOpen(true)}>
                  Tạo yêu cầu
                </button>
              }
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Truy cập nhanh</h2>
              <p>Các thao tác thường dùng</p>
            </div>
          </div>
          <div className="quick-list">
            <Link to="/patient/bookings" className="quick-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="quick-icon">
                <Icon.calendar />
              </span>
              <span>
                <b>Lịch chăm sóc</b>
                <small>Xem và quản lý lịch đã đặt</small>
              </span>
              <Icon.chevron />
            </Link>
            <Link to="/patient/nurses" className="quick-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="quick-icon">
                <Icon.user />
              </span>
              <span>
                <b>Điều dưỡng đã lưu</b>
                <small>{stats.trustedNurses} hồ sơ được tin cậy</small>
              </span>
              <Icon.chevron />
            </Link>
            <Link to="/patient/family" className="quick-item" data-page-jump style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="quick-icon">
                <Icon.users />
              </span>
              <span>
                <b>Người thân liên kết</b>
                <small>{primary ? `${primary.name} có thể nhận cảnh báo SOS` : 'Chưa liên kết người thân'}</small>
              </span>
              <Icon.chevron />
            </Link>
          </div>
        </section>
      </div>

      <div className="service-banner">
        <div>
          <h3>Cần hỗ trợ tạo yêu cầu?</h3>
          <p>Đội ngũ CareShift có thể hướng dẫn bạn từng bước qua điện thoại.</p>
        </div>
        <button type="button" className="btn">
          Liên hệ hỗ trợ
        </button>
      </div>

      {todaySession && (
        <SosButton
          bookingId={todaySession.bookingId}
          sessionId={todaySession.id}
          role="patient"
          familyLabel={primary ? `${primary.name} · ${primary.relation}` : ''}
        />
      )}

      <CareRequestWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} patientId={session.id} createdBy="patient" onCreated={() => setWizardOpen(false)} />
    </>
  )
}
