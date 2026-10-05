// Data for the patient dashboard ("Tổng quan", /patient/overview). Record data (requests,
// bookings, nurses) lives in its own page file; this file only holds what the dashboard
// itself owns: copy, metric tiles, quick links and how many recent requests to show.

export const DASHBOARD_HERO = {
  eyebrow: 'Xin chào',
  title: 'Chăm sóc đúng người, đúng lúc.',
  description: 'Theo dõi yêu cầu hiện tại hoặc tìm điều dưỡng đã được bệnh viện xác minh.',
}

export const DASHBOARD_RECENT_LIMIT = 5

export type DashboardMetricKey = 'activeRequests' | 'upcomingSessions' | 'trustedNurses' | 'completedSessions'

export const DASHBOARD_METRICS: { key: DashboardMetricKey; label: string; icon: string; tone: '' | 'blue' | 'amber' | 'red'; to: string }[] = [
  { key: 'activeRequests', label: 'Yêu cầu hiện tại', icon: 'file', tone: '', to: '/patient/request' },
  { key: 'upcomingSessions', label: 'Lịch sắp tới', icon: 'calendar', tone: 'blue', to: '/patient/bookings' },
  { key: 'trustedNurses', label: 'Điều dưỡng tin cậy', icon: 'shield', tone: 'amber', to: '/patient/nurses' },
  { key: 'completedSessions', label: 'Buổi đã hoàn thành', icon: 'check', tone: 'red', to: '/patient/bookings' },
]

export const DASHBOARD_QUICK_LINKS = [
  { id: 'ql-bookings', to: '/patient/bookings', icon: 'calendar', title: 'Lịch chăm sóc', subtitle: 'Xem lịch theo ngày và các ca đã đặt' },
  { id: 'ql-nurses', to: '/patient/nurses', icon: 'user', title: 'Điều dưỡng tin cậy', subtitle: 'Hồ sơ đã được bệnh viện xác minh' },
  { id: 'ql-family', to: '/patient/family', icon: 'users', title: 'Người thân liên kết', subtitle: 'Người nhận cảnh báo SOS' },
]
