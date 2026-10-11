// Data for the patient dashboard ("Tổng quan", /patient/overview). Record data (requests,
// bookings, nurses) lives in its own page file; this file only holds what the dashboard
// itself owns: copy, metric tiles, quick links and how many recent requests to show.

export const DASHBOARD_HERO = {
  eyebrow: 'Xin chào',
  title: 'Chăm sóc đúng người, đúng lúc.',
  description: 'Theo dõi yêu cầu hiện tại hoặc tìm điều dưỡng đã được bệnh viện xác minh.',
}

export const DASHBOARD_RECENT_LIMIT = 5

/** "Gần nhất" = requests created today or in the previous N days. */
export const DASHBOARD_RECENT_DAYS = 4
/** "Sắp tới" = visits scheduled within the next N days. */
export const DASHBOARD_UPCOMING_DAYS = 30

export type DashboardMetricKey = 'activeRequests' | 'upcomingSessions'

export const DASHBOARD_METRICS: { key: DashboardMetricKey; label: string; icon: string; tone: '' | 'blue' | 'amber' | 'red'; to: string }[] = [
  { key: 'activeRequests', label: 'Yêu cầu hiện tại', icon: 'file', tone: '', to: '/patient/request' },
  { key: 'upcomingSessions', label: 'Lịch sắp tới (30 ngày)', icon: 'calendar', tone: 'blue', to: '/patient/bookings' },
]

export const DASHBOARD_QUICK_LINKS = [
  { id: 'ql-bookings', to: '/patient/bookings', icon: 'calendar', title: 'Lịch chăm sóc', subtitle: 'Xem ca chăm sóc theo tuần' },
  { id: 'ql-nurses', to: '/patient/nurses', icon: 'user', title: 'Điều dưỡng tin cậy', subtitle: 'Điều dưỡng đã từng chăm sóc bạn' },
  { id: 'ql-family', to: '/patient/family', icon: 'users', title: 'Người thân liên kết', subtitle: 'Người nhận cảnh báo SOS' },
]
