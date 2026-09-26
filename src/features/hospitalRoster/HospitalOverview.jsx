import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, listNursesByHospital } from '../../lib/db'
import { NURSE_AUTH_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function HospitalOverview() {
  const { session } = useAuth()
  const state = useDb()
  const hospital = getHospital(state, session.id)
  const nurses = listNursesByHospital(state, session.id)
  const authorized = nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED)
  const draft = nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.DRAFT)
  const activeNurseIds = new Set(state.bookings.flatMap((b) => b.sessions.map((s) => s.nurseId)))
  const inProgressSessions = state.bookings
    .flatMap((b) => b.sessions)
    .filter((s) => nurses.some((n) => n.id === s.nurseId) && s.status !== 'cannot_perform')
  const cannotPerformCount = state.bookings.flatMap((b) => b.sessions).filter((s) => s.needsManualReassignment && nurses.some((n) => n.id === s.nurseId)).length
  const acceptRate = nurses.length ? Math.round((authorized.filter((n) => activeNurseIds.has(n.id)).length / nurses.length) * 100) : 0

  return (
    <>
      <PageHead
        eyebrow={hospital?.name}
        title="Điều phối nguồn lực chăm sóc"
        description="Theo dõi điều dưỡng được cấp phép, lịch rảnh và các yêu cầu cần xử lý."
        action={
          <Link to="/hospital/admin/roster" className="btn primary">
            <Icon.plus /> Thêm điều dưỡng
          </Link>
        }
      />

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-top">
            <span>Điều dưỡng hoạt động</span>
            <span className="metric-icon">
              <Icon.users />
            </span>
          </div>
          <strong>{String(nurses.length).padStart(2, '0')}</strong>
          <small>{authorized.length} sẵn sàng nhận ca</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Chờ xác minh</span>
            <span className="metric-icon amber">
              <Icon.shield />
            </span>
          </div>
          <strong>{String(draft.length).padStart(2, '0')}</strong>
          <small>Cần hoàn tất hồ sơ</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Ca đang diễn ra</span>
            <span className="metric-icon blue">
              <Icon.calendar />
            </span>
          </div>
          <strong>{String(inProgressSessions.length).padStart(2, '0')}</strong>
          <small>Trong khu vực {hospital?.district}</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Tỷ lệ nhận ca</span>
            <span className="metric-icon red">
              <Icon.chart />
            </span>
          </div>
          <strong>{acceptRate}%</strong>
          <small>Điều dưỡng đã cấp phép đang hoạt động</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Điều dưỡng gần đây</h2>
              <p>Trạng thái cấp phép của nhân sự</p>
            </div>
            <Link to="/hospital/admin/roster" className="text-button">
              Xem tất cả
            </Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Điều dưỡng</th>
                  <th>Chuyên môn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {nurses.slice(0, 4).map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className="person-cell">
                        <span className="person-avatar">{initials(n.name)}</span>
                        <span>
                          <b>{n.name}</b>
                          <small>{n.rank}</small>
                        </span>
                      </div>
                    </td>
                    <td>{n.specialties[0] ? n.specialties.length + ' chuyên môn' : '—'}</td>
                    <td>
                      <span className={`status ${n.authStatus === 'authorized' ? 'success' : n.authStatus === 'revoked' ? 'danger' : 'pending'}`}>
                        {n.authStatus === 'authorized' ? 'Đã cấp phép' : n.authStatus === 'revoked' ? 'Đã thu hồi' : 'Chờ xác minh'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Cần chú ý</h2>
              <p>Ưu tiên xử lý hôm nay</p>
            </div>
          </div>
          <div className="attention-list">
            <Link to="/hospital/admin/verification" className="attention-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="attention-icon">
                <Icon.file />
              </span>
              <span>
                <b>{draft.length} hồ sơ chờ xác minh</b>
                <small>Thiếu văn bằng hoặc đang đối chiếu</small>
              </span>
              <Icon.chevron />
            </Link>
            <Link to="/hospital/admin/requests" className="attention-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="attention-icon red">
                <Icon.bell />
              </span>
              <span>
                <b>{cannotPerformCount} ca chưa có người thay thế</b>
                <small>Cần hỗ trợ đổi điều dưỡng</small>
              </span>
              <Icon.chevron />
            </Link>
            <Link to="/hospital/admin/schedule" className="attention-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="attention-icon">
                <Icon.calendar />
              </span>
              <span>
                <b>Lịch tuần này</b>
                <small>Xem điều phối ca trực</small>
              </span>
              <Icon.chevron />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
