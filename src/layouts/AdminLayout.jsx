import Shell from '../components/Shell'
import AntdThemeProvider from '../antd/AntdThemeProvider'

const navItems = [
  { to: '/admin/overview', label: 'Tổng quan hệ thống', icon: 'chart' },
  { to: '/admin/operations', label: 'Trung tâm vận hành', icon: 'pulse' },
  { to: '/admin/analytics', label: 'Phân tích & chỉ số', icon: 'trend' },
  { to: '/admin/hospitals', label: 'Bệnh viện đối tác', icon: 'building' },
  { to: '/admin/nurses', label: 'Điều dưỡng', icon: 'user' },
  { to: '/admin/accounts', label: 'Tài khoản người dùng', icon: 'users' },
  { to: '/admin/support', label: 'Hỗ trợ khách hàng', icon: 'help' },
  { to: '/admin/compliance', label: 'Tuân thủ & chính sách', icon: 'shield' },
  { to: '/admin/broadcasts', label: 'Thông báo hệ thống', icon: 'bell' },
  { to: '/admin/audit', label: 'Nhật ký hoạt động', icon: 'file' },
  { to: '/admin/data', label: 'Dữ liệu & sao lưu', icon: 'download' },
  { to: '/admin/settings', label: 'Cấu hình hệ thống', icon: 'settings' },
]

export default function AdminLayout() {
  return (
    <AntdThemeProvider>
      <Shell
        appLabel="CareShift Admin"
        roleDot="platform"
        roleAvatar="CS"
        notificationRole="admin"
        notificationTargetId="platform"
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
