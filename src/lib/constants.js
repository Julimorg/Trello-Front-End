export const CARE_TYPES = [
  { id: 'wound-dressing', label: 'Thay băng vết thương' },
  { id: 'vitals-monitoring', label: 'Theo dõi sinh hiệu' },
  { id: 'mobility-support', label: 'Hỗ trợ vận động' },
  { id: 'medication', label: 'Hỗ trợ dùng thuốc' },
  { id: 'post-surgery', label: 'Chăm sóc hậu phẫu' },
  { id: 'elderly-care', label: 'Chăm sóc người cao tuổi' },
  { id: 'other', label: 'Khác' },
]

export const DISTRICTS = [
  'Quận 1',
  'Quận 3',
  'Quận 5',
  'Quận 7',
  'Bình Thạnh',
  'Phú Nhuận',
  'Thủ Đức',
  'Gò Vấp',
]

export const NURSE_RANKS = [
  'Điều dưỡng chính thức',
  'Y tá',
  'Thực tập sinh',
]

export const FREQUENCIES = [
  { id: 'once', label: 'Một lần duy nhất' },
  { id: 'daily', label: 'Hàng ngày' },
  { id: 'weekly', label: 'Hàng tuần (chọn thứ)' },
]

export const WEEKDAYS = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 0, label: 'Chủ nhật' },
]

export const CARE_REQUEST_STATUS = {
  CREATED: 'created',
  MATCHING: 'matching',
  MATCHED: 'matched',
  NO_MATCH: 'no_match',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const CARE_REQUEST_STATUS_LABEL = {
  [CARE_REQUEST_STATUS.CREATED]: { label: 'Đã tạo', color: 'default' },
  [CARE_REQUEST_STATUS.MATCHING]: { label: 'Đang tìm điều dưỡng', color: 'info' },
  [CARE_REQUEST_STATUS.MATCHED]: { label: 'Đã có điều dưỡng phù hợp', color: 'success' },
  [CARE_REQUEST_STATUS.NO_MATCH]: { label: 'Không tìm được điều dưỡng', color: 'warning' },
  [CARE_REQUEST_STATUS.CANCELLED]: { label: 'Đã hủy', color: 'default' },
  [CARE_REQUEST_STATUS.COMPLETED]: { label: 'Hoàn tất', color: 'primary' },
}

export const NURSE_AUTH_STATUS = {
  DRAFT: 'draft',
  AUTHORIZED: 'authorized',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
}

export const NURSE_AUTH_STATUS_LABEL = {
  [NURSE_AUTH_STATUS.DRAFT]: { label: 'Chưa cấp phép', color: 'default' },
  [NURSE_AUTH_STATUS.AUTHORIZED]: { label: 'Đã cấp phép (Authorized)', color: 'success' },
  [NURSE_AUTH_STATUS.SUSPENDED]: { label: 'Tạm ngưng', color: 'warning' },
  [NURSE_AUTH_STATUS.REVOKED]: { label: 'Đã thu hồi', color: 'error' },
}

export const SESSION_STATUS = {
  CONFIRMED: 'confirmed',
  CANNOT_PERFORM: 'cannot_perform',
  REASSIGNED: 'reassigned',
  COMPLETED: 'completed',
}

export const SESSION_STATUS_LABEL = {
  [SESSION_STATUS.CONFIRMED]: { label: 'Đã xác nhận', color: 'success' },
  [SESSION_STATUS.CANNOT_PERFORM]: { label: 'Báo không thể thực hiện', color: 'error' },
  [SESSION_STATUS.REASSIGNED]: { label: 'Đã đổi điều dưỡng', color: 'info' },
  [SESSION_STATUS.COMPLETED]: { label: 'Hoàn tất', color: 'primary' },
}

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

export const BOOKING_STATUS_LABEL = {
  [BOOKING_STATUS.CONFIRMED]: { label: 'Đã xác nhận', color: 'success' },
  [BOOKING_STATUS.IN_PROGRESS]: { label: 'Đang thực hiện', color: 'info' },
  [BOOKING_STATUS.COMPLETED]: { label: 'Hoàn tất', color: 'primary' },
}

export const SOS_TYPES = {
  CALL_115: 'call_115',
  CALL_DOCTOR: 'call_doctor',
  NOTIFY_FAMILY: 'notify_family',
}

export const SOS_TYPE_LABEL = {
  [SOS_TYPES.CALL_115]: 'Gọi 115',
  [SOS_TYPES.CALL_DOCTOR]: 'Gọi bác sĩ phụ trách',
  [SOS_TYPES.NOTIFY_FAMILY]: 'Thông báo người thân',
}

export const HOSPITAL_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
}

export const HOSPITAL_STATUS_LABEL = {
  [HOSPITAL_STATUS.ACTIVE]: { label: 'Đang hoạt động', color: 'success' },
  [HOSPITAL_STATUS.SUSPENDED]: { label: 'Tạm ngưng', color: 'warning' },
}

export const MATCH_RETRY_WINDOW_MS = 60 * 60 * 1000 // 1 hour
