import { BOOKING_STATUS, CARE_REQUEST_STATUS, FREQUENCIES, SESSION_STATUS, WEEKDAYS } from '../../lib/constants'
import { computeBookingStatus, getBooking } from '../../lib/db'
import { tasksFor } from '../../Data/nurse/session-data'

// Labels/colours shared by the nurse portal pages (Ant Design preset colours).
export const RELATION_META = {
  pending: { label: 'Chờ phản hồi', color: 'gold' },
  suggested: { label: 'Được đề xuất', color: 'blue' },
  accepted: { label: 'Đã nhận', color: 'green' },
  declined: { label: 'Đã từ chối', color: 'red' },
  closed: { label: 'Đã đóng', color: 'default' },
}

export const SESSION_STATUS_META = {
  confirmed: { label: 'Đã xác nhận', color: 'cyan' },
  completed: { label: 'Hoàn thành', color: 'default' },
  reassigned: { label: 'Đã đổi điều dưỡng', color: 'purple' },
  cannot_perform: { label: 'Không thể thực hiện', color: 'red' },
}

export const CLOSED_REASON = {
  [CARE_REQUEST_STATUS.CANCELLED]: 'Bệnh nhân đã hủy yêu cầu',
  [CARE_REQUEST_STATUS.NURSE_PENDING]: 'Bệnh nhân đã chọn điều dưỡng khác',
  [CARE_REQUEST_STATUS.COMPLETED]: 'Ca đã được điều dưỡng khác nhận',
  [CARE_REQUEST_STATUS.NO_MATCH]: 'Bệnh nhân đang chọn điều dưỡng thay thế',
}

export const DECLINE_REASONS = ['Trùng lịch trực tại bệnh viện', 'Ngoài phạm vi di chuyển', 'Chưa phù hợp chuyên môn', 'Lý do cá nhân']

export function initials(name) {
  return (name || '')
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export const shortName = (name) => (name || '').split(/\s+/).slice(-1)[0]

export function frequencyText(careRequest) {
  const base = FREQUENCIES.find((f) => f.id === careRequest.frequency)?.label || careRequest.frequency
  if (careRequest.frequency !== 'weekly' || !careRequest.weekdays?.length) return base.replace(' (chọn thứ)', '')
  const days = careRequest.weekdays.map((d) => (WEEKDAYS.find((w) => w.id === d)?.label || '').replace('Thứ ', 'T').replace('Chủ nhật', 'CN'))
  return `Hàng tuần · ${days.join(', ')}`
}

// Where a request stands for this nurse, and whether anything on it can still be acted on.
// Cancelled, declined, closed and fully completed requests are view-only.
export function requestStage(state, careRequest, relation) {
  if (relation === 'pending') return { key: 'pending', label: 'Chờ phản hồi', color: 'gold', readOnly: false }
  if (relation === 'suggested') return { key: 'suggested', label: 'Được đề xuất', color: 'blue', readOnly: false }
  if (relation === 'declined') return { key: 'declined', label: 'Đã từ chối', color: 'red', readOnly: true }
  if (relation === 'accepted') {
    const booking = careRequest.bookingId ? getBooking(state, careRequest.bookingId) : null
    return booking && computeBookingStatus(booking) === BOOKING_STATUS.COMPLETED
      ? { key: 'completed', label: 'Đã hoàn thành', color: 'default', readOnly: true }
      : { key: 'in_progress', label: 'Đang thực hiện', color: 'green', readOnly: false }
  }
  if (careRequest.status === CARE_REQUEST_STATUS.CANCELLED) return { key: 'cancelled', label: 'Đã hủy', color: 'default', readOnly: true }
  return { key: 'closed', label: 'Đã đóng', color: 'default', readOnly: true }
}

// Work done in one visit. Seeded past visits have no recorded checklist, so a completed
// visit without one counts as fully done.
export function sessionWork(session, careType) {
  const tasks = tasksFor(careType || 'other')
  const done = session.status === SESSION_STATUS.COMPLETED && !session.checklist ? tasks.map((t) => t.id) : (session.checklist || []).filter((id) => tasks.some((t) => t.id === id))
  return { tasks, done, percent: Math.round((done.length / tasks.length) * 100) }
}
