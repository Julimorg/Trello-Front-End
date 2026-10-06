import { CARE_REQUEST_STATUS } from '../../lib/constants'

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
