import Shell from '../components/Shell'
import AntdThemeProvider from '../antd/AntdThemeProvider'

const navItems = [
  { to: '/admin/overview', label: 'Tổng quan hệ thống', icon: 'chart' },
  { to: '/admin/hospitals', label: 'Bệnh viện đối tác', icon: 'building' },
  { to: '/admin/accounts', label: 'Tài khoản người dùng', icon: 'users' },
  { to: '/admin/compliance', label: 'Tuân thủ & chính sách', icon: 'shield' },
  { to: '/admin/broadcasts', label: 'Thông báo hệ thống', icon: 'bell' },
  { to: '/admin/audit', label: 'Nhật ký hoạt động', icon: 'file' },
  { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: 'settings' },
]

export default function AdminLayout() {
  return (
    <AntdThemeProvider>
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
    </AntdThemeProvider>
  )
}
