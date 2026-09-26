import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

const TABS = [
  { value: 'patient', label: 'Bệnh nhân / Gia đình' },
  { value: 'hospitalAdmin', label: 'Admin bệnh viện' },
  { value: 'nurse', label: 'Điều dưỡng' },
  { value: 'platformAdmin', label: 'Admin CareShift' },
]

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function LoginPage() {
  const { login } = useAuth()
  const state = useDb()
  const navigate = useNavigate()
  const [tab, setTab] = useState('patient')
  const [selectedId, setSelectedId] = useState('')

  const homeByRole = {
    patient: '/patient/overview',
    hospitalAdmin: '/hospital/admin/overview',
    nurse: '/hospital/nurse/overview',
    platformAdmin: '/admin/overview',
  }

  const options = useMemo(() => {
    if (tab === 'patient') return state.patients.map((p) => ({ id: p.id, primary: p.name, secondary: p.district }))
    if (tab === 'hospitalAdmin') return state.hospitals.map((h) => ({ id: h.id, primary: h.name, secondary: h.district }))
    if (tab === 'nurse')
      return state.nurses.map((n) => {
        const hospital = state.hospitals.find((h) => h.id === n.hospitalId)
        return { id: n.id, primary: n.name, secondary: `${hospital?.name || ''} · ${n.rank}`, badge: NURSE_AUTH_STATUS_LABEL[n.authStatus] }
      })
    return []
  }, [tab, state])

  const handleTabChange = (value) => {
    setTab(value)
    setSelectedId('')
  }

  const handleLogin = () => {
    if (tab === 'platformAdmin') {
      login({ role: 'platformAdmin', id: 'platform' })
      navigate(homeByRole.platformAdmin)
      return
    }
    if (!selectedId) return
    login({ role: tab, id: selectedId })
    navigate(homeByRole[tab])
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">+</div>
          <strong>CareShift</strong>
        </div>
        <p className="auth-tagline">
          Phase 1 · Validate — Hospital Roster, Care Request, Nurse Matching, Booking &amp; Scheduling, SOS.
          <br />
          Chọn vai trò demo để đăng nhập.
        </p>

        <div className="role-tab-row">
          {TABS.map((t) => (
            <button key={t.value} type="button" className={`role-tab${tab === t.value ? ' active' : ''}`} onClick={() => handleTabChange(t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'platformAdmin' ? (
          <p style={{ color: 'var(--muted)', fontSize: '.8rem', margin: '0 0 18px' }}>
            Đăng nhập với vai trò quản trị toàn hệ thống, quản lý tài khoản bệnh viện / điều dưỡng / bệnh nhân theo chính sách chung.
          </p>
        ) : (
          <div className="persona-list">
            {options.map((o) => (
              <button key={o.id} type="button" className={`persona-item${selectedId === o.id ? ' selected' : ''}`} onClick={() => setSelectedId(o.id)}>
                <span className="person-avatar">{initials(o.primary)}</span>
                <span className="persona-meta">
                  <b>{o.primary}</b>
                  <small>{o.secondary}</small>
                </span>
                {o.badge && <span className={`status ${o.badge.tone}`}>{o.badge.label}</span>}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="btn primary" style={{ width: '100%', minHeight: 48 }} disabled={tab !== 'platformAdmin' && !selectedId} onClick={handleLogin}>
          Đăng nhập
        </button>
        <p className="auth-note">Đây là bản dựng demo với dữ liệu mẫu, không dùng để lưu thông tin thật.</p>
      </div>
    </div>
  )
}
