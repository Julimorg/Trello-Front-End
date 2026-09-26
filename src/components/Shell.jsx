import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../lib/icons'
import { useAuth } from '../auth/AuthContext'
import { useDb } from '../lib/store'
import { listNotificationsFor } from '../lib/db'
import { formatDateTime } from '../lib/format'

export default function Shell({
  roleDot,
  roleAvatar,
  roleLabel,
  orgLabel,
  navItems,
  profileName,
  profileMeta,
  profileInitials,
  appLabel,
  notificationRole,
  notificationTargetId,
  profileTo,
}) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = useDb()
  const [navOpen, setNavOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const notifications = useMemo(
    () => (notificationRole && notificationTargetId ? listNotificationsFor(state, notificationRole, notificationTargetId) : []),
    [state, notificationRole, notificationTargetId],
  )
  const currentTitle = navItems.find((n) => location.pathname.startsWith(n.to))?.label

  return (
    <>
      <div className="app-shell">
        <aside className={`sidebar${navOpen ? ' open' : ''}`} aria-label="Điều hướng chính">
          <button className="sidebar-close" aria-label="Đóng menu" onClick={() => setNavOpen(false)}>
            <Icon.close aria-hidden="true" />
          </button>
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              +
            </div>
            <div>
              <strong>CareShift</strong>
              <span>Care, made certain.</span>
            </div>
          </div>

          <div className="role-label">Đang xem với vai trò</div>
          <div className="role-switcher" style={{ cursor: 'default' }}>
            <span className={`role-dot ${roleDot}`}>{roleAvatar}</span>
            <span>
              <strong>{roleLabel}</strong>
              <small>{orgLabel}</small>
            </span>
          </div>

          <nav id="sideNav">
            {navItems.map((item) => {
              const NavIcon = Icon[item.icon]
              return (
                <NavLink key={item.to} to={item.to} onClick={() => setNavOpen(false)}>
                  {NavIcon && <NavIcon />}
                  <span>{item.label}</span>
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </NavLink>
              )
            })}
          </nav>

          <div className="sidebar-foot">
            <div className="privacy-note">
              <Icon.shield aria-hidden="true" />
              <span>
                <strong>Dữ liệu được bảo vệ</strong>
                <small>Chỉ chia sẻ khi cần thiết</small>
              </span>
            </div>
            <button className="profile-chip" onClick={() => profileTo && navigate(profileTo)}>
              <span>{profileInitials || roleAvatar}</span>
              <span>
                <b>{profileName}</b>
                <small>{profileMeta}</small>
              </span>
              <Icon.more />
            </button>
          </div>
        </aside>
        <button className={`nav-backdrop${navOpen ? ' open' : ''}`} aria-label="Đóng menu" onClick={() => setNavOpen(false)} />

        <main className="main">
          <header className="topbar">
            <button className="mobile-menu" aria-label="Mở menu" onClick={() => setNavOpen(true)}>
              <Icon.menu />
            </button>
            <div className="crumb">
              <span>{appLabel}</span>
              <Icon.chevron />
              <strong>{currentTitle}</strong>
            </div>
            <div className="top-actions">
              <div style={{ position: 'relative' }}>
                <button className="icon-button" aria-label="Thông báo" onClick={() => setNotifOpen((v) => !v)}>
                  <Icon.bell />
                  {notifications.some((n) => !n.read) && <span className="notification-dot" />}
                </button>
                {notifOpen && (
                  <div
                    className="panel"
                    style={{ position: 'absolute', right: 0, top: 48, width: 300, maxHeight: 360, overflowY: 'auto', zIndex: 50 }}
                  >
                    {notifications.length === 0 ? (
                      <div className="empty-state" style={{ padding: 24 }}>
                        <p>Chưa có thông báo</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div key={n.id} className="attention-item" style={{ padding: '12px 16px' }}>
                          <span />
                          <span>
                            <b style={{ fontWeight: 600 }}>{n.message}</b>
                            <small>{formatDateTime(n.createdAt)}</small>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button className="support-button" onClick={logout}>
                Đăng xuất
              </button>
            </div>
          </header>

          <section className="app-content" aria-live="polite">
            <Outlet />
          </section>
        </main>
      </div>
    </>
  )
}
