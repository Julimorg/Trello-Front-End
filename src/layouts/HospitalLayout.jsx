import Shell from '../components/Shell'
import AntdThemeProvider from '../antd/AntdThemeProvider'
import NurseSos from '../features/nurse/NurseSos'
import { useAuth } from '../auth/AuthContext'
import { useDb } from '../lib/store'
import { getHospital, getNurse, listPendingRequestsForNurse } from '../lib/db'

const adminNavItems = [
  { to: '/hospital/admin/overview', label: 'Tổng quan', icon: 'home' },
  { to: '/hospital/admin/roster', label: 'Danh sách điều dưỡng', icon: 'users' },
  { to: '/hospital/admin/verification', label: 'Xác minh hồ sơ', icon: 'shield' },
  { to: '/hospital/admin/schedule', label: 'Điều phối lịch', icon: 'calendar' },
  { to: '/hospital/admin/requests', label: 'Yêu cầu chăm sóc', icon: 'file' },
  { to: '/hospital/admin/sos-log', label: 'Cảnh báo SOS', icon: 'bell' },
]

const nurseNavItemsBase = [
  { to: '/hospital/nurse/overview', label: 'Tổng quan', icon: 'home' },
  { to: '/hospital/nurse/requests', label: 'Ca chăm sóc mới', icon: 'bell' },
  { to: '/hospital/nurse/schedule', label: 'Lịch làm việc', icon: 'calendar', also: ['/hospital/nurse/sessions'] },
  { to: '/hospital/nurse/profile', label: 'Hồ sơ nghề nghiệp', icon: 'shield' },
]

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function HospitalLayout() {
  const { session } = useAuth()
  const state = useDb()
  const isNurse = session.role === 'nurse'
  const nurse = isNurse ? getNurse(state, session.id) : null
  const hospital = getHospital(state, isNurse ? nurse?.hospitalId : session.id)

  const pendingCount = isNurse ? listPendingRequestsForNurse(state, session.id).length : 0
  const nurseNavItems = nurseNavItemsBase.map((item) =>
    item.to === '/hospital/nurse/requests' && pendingCount ? { ...item, badge: pendingCount } : item,
  )

  const shell = (
    <Shell
      appLabel={isNurse ? 'Ứng dụng điều dưỡng' : 'Cổng bệnh viện'}
      roleDot={isNurse ? 'nurse' : 'hospital'}
      roleAvatar={isNurse ? 'ĐD' : 'BV'}
      roleLabel={isNurse ? 'Điều dưỡng' : 'Admin bệnh viện'}
      orgLabel={hospital?.name || ''}
      navItems={isNurse ? nurseNavItems : adminNavItems}
      profileName={isNurse ? nurse?.name || '' : 'Điều phối viên'}
      profileMeta={isNurse ? 'Đã được xác minh' : hospital?.name || ''}
      profileInitials={isNurse ? initials(nurse?.name) : 'BV'}
      profileTo={isNurse ? '/hospital/nurse/profile' : undefined}
      notificationRole={isNurse ? 'nurse' : 'hospital'}
      notificationTargetId={isNurse ? session.id : hospital?.id}
    />
  )

  // Nurse and hospital admin portals are both built with Ant Design.
  return (
    <AntdThemeProvider>
      {shell}
      {isNurse && <NurseSos nurseId={session.id} />}
    </AntdThemeProvider>
  )
}
