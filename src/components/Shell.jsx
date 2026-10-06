import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../lib/icons'
import { useAuth } from '../auth/AuthContext'
import { onRemotePatch, useDb } from '../lib/store'
import { useToast } from './ToastProvider'
import { listNotificationsFor, markNotificationsRead } from '../lib/db'
import { formatDateTime } from '../lib/format'

function NotificationBell({ role, targetId }) {
  const state = useDb()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  // Ids that were unread when the menu opened, so they stay visibly "new" while it is open
  // even though opening it marks them read (which clears the red dot).
  const [freshIds, setFreshIds] = useState([])
  const wrapperRef = useRef(null)

  const notifications = useMemo(() => (role && targetId ? listNotificationsFor(state, role, targetId) : []), [state, role, targetId])
  const hasUnread = notifications.some((n) => !n.read)

  // Pop a toast when a notification for this user arrives from another device (realtime relay).
  const toast = useToast()
  const seenIdsRef = useRef(null)
  if (seenIdsRef.current === null) seenIdsRef.current = new Set(notifications.map((n) => n.id))
  useEffect(
    () =>
      onRemotePatch((patch) => {
        const incoming = (patch.notifications?.upsert || []).filter(
          (n) => n.role === role && n.targetId === targetId && !n.read && !seenIdsRef.current.has(n.id),
        )
        incoming.forEach((n) => {
          seenIdsRef.current.add(n.id)
          toast('Thông báo mới', n.message)
        })
      }),
    [role, targetId, toast],
  )

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    setFreshIds(notifications.filter((n) => !n.read).map((n) => n.id))
    if (role && targetId) markNotificationsRead(role, targetId)
    setOpen(true)
  }

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button className="icon-button" aria-label="Thông báo" aria-expanded={open} onClick={toggle}>
        <Icon.bell />
        {hasUnread && <span className="notification-dot" />}
      </button>
      {open && (
        <div className="notif-menu" role="menu">
          <div className="notif-menu-head">
            <b>Thông báo</b>
            <small>{freshIds.length ? `${freshIds.length} thông báo mới` : 'Bạn đã xem hết'}</small>
          </div>
          {notifications.length === 0 ? (
            <p className="notif-empty">Chưa có thông báo</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                className={`notif-item${freshIds.includes(n.id) ? ' fresh' : ''}`}
                onClick={() => {
                  setOpen(false)
                  if (n.link) navigate(n.link)
                }}
              >
                <span>{n.message}</span>
                <small>{formatDateTime(n.createdAt)}</small>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const SIDEBAR_KEY = 'careshift_sidebar_collapsed'
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
  const { logout, session } = useAuth()
  const settings = useDb().settings
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  // Desktop sidebar can be collapsed to an icon rail; remembered per browser.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, c ? '0' : '1')
      } catch {
        // ignore
      }
      return !c
    })

  // `also` lets a menu item own extra paths (e.g. session details belong to the schedule).
  const currentTitle = navItems.find((n) => [n.to, ...(n.also || [])].some((p) => location.pathname.startsWith(p)))?.label

  const profileContent = (
    <>
      <span className="header-profile-avatar">{profileInitials || roleAvatar}</span>
      <span className="header-profile-text">
        <b>{profileName}</b>
        <small>{profileMeta}</small>
      </span>
    </>
  )

  return (
    <div className={`app-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className={`sidebar${navOpen ? ' open' : ''}`} aria-label="Điều hướng chính">
        <button
          type="button"
          className="sidebar-collapse"
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          onClick={toggleCollapsed}
        >
          <Icon.chevron aria-hidden="true" />
        </button>
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
        <div className="role-switcher" style={{ cursor: 'default' }} title={`${roleLabel} · ${orgLabel}`}>
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
              <NavLink key={item.to} to={item.to} title={item.label} onClick={() => setNavOpen(false)}>
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
            <NotificationBell role={notificationRole} targetId={notificationTargetId} />
            {profileTo ? (
              <Link to={profileTo} className="header-profile">
                {profileContent}
              </Link>
            ) : (
              <div className="header-profile">{profileContent}</div>
            )}
            <button className="support-button" onClick={logout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {settings?.maintenanceMode && session?.role !== 'platformAdmin' && (
          <div className="maintenance-banner" role="status">
            <Icon.info aria-hidden="true" />
            <span>{settings.maintenanceMessage}</span>
          </div>
        )}

        <section className="app-content" aria-live="polite">
          <Suspense fallback={<div className="route-loading" aria-busy="true" />}>
            <Outlet />
          </Suspense>
        </section>
      </main>
    </div>
  )
}
