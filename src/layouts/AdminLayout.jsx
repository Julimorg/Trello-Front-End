import Shell from '../components/Shell'

const navItems = [
  { to: '/admin/overview', label: 'Tổng quan hệ thống', icon: 'chart' },
  { to: '/admin/hospitals', label: 'Bệnh viện đối tác', icon: 'building' },
  { to: '/admin/accounts', label: 'Tài khoản người dùng', icon: 'users' },
  { to: '/admin/compliance', label: 'Tuân thủ & chính sách', icon: 'shield' },
  { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: 'settings' },
]

export default function AdminLayout() {
  return (
    <Shell
      appLabel="CareShift Admin"
      roleDot="platform"
      roleAvatar="CS"
      roleLabel="Admin CareShift"
      orgLabel="CareShift Operations"
      navItems={navItems}
      profileName="Linh Phạm"
      profileMeta="Platform Administrator"
      profileInitials="LP"
    />
  )
}
