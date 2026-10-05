export const CARE_TYPES = [
  { id: 'wound-dressing', label: 'Thay băng & chăm sóc vết thương' },
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
  { id: 'once', label: 'Một lần' },
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

// How many concrete sessions a recurring (daily/weekly) care request generates once a
// nurse accepts it. There is no explicit end-date field in the request wizard, so this
// acts as the default course length (kept short/simple for the Phase 1 prototype).
export const RECURRING_SESSION_COUNT = 4

export const CARE_REQUEST_STATUS = {
  CREATED: 'created',
  MATCHING: 'matching',
  MATCHED: 'matched',
  NURSE_PENDING: 'nurse_pending',
  NO_MATCH: 'no_match',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const CARE_REQUEST_STATUS_LABEL = {
  [CARE_REQUEST_STATUS.CREATED]: { label: 'Đã tạo', tone: 'neutral' },
  [CARE_REQUEST_STATUS.MATCHING]: { label: 'Đang tìm điều dưỡng', tone: 'info' },
  [CARE_REQUEST_STATUS.MATCHED]: { label: 'Đã có điều dưỡng phù hợp', tone: 'success' },
  [CARE_REQUEST_STATUS.NURSE_PENDING]: { label: 'Đang chờ phản hồi', tone: 'pending' },
  [CARE_REQUEST_STATUS.NO_MATCH]: { label: 'Không tìm được điều dưỡng', tone: 'danger' },
  [CARE_REQUEST_STATUS.CANCELLED]: { label: 'Đã hủy', tone: 'neutral' },
  [CARE_REQUEST_STATUS.COMPLETED]: { label: 'Đã chấp nhận', tone: 'success' },
}

export const NURSE_AUTH_STATUS = {
  DRAFT: 'draft',
  AUTHORIZED: 'authorized',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
}

export const NURSE_AUTH_STATUS_LABEL = {
  [NURSE_AUTH_STATUS.DRAFT]: { label: 'Chờ xác minh', tone: 'pending' },
  [NURSE_AUTH_STATUS.AUTHORIZED]: { label: 'Đã cấp phép', tone: 'success' },
  [NURSE_AUTH_STATUS.SUSPENDED]: { label: 'Tạm ngưng', tone: 'pending' },
  [NURSE_AUTH_STATUS.REVOKED]: { label: 'Đã thu hồi', tone: 'danger' },
}

export const SESSION_STATUS = {
  CONFIRMED: 'confirmed',
  CANNOT_PERFORM: 'cannot_perform',
  REASSIGNED: 'reassigned',
  COMPLETED: 'completed',
}

export const SESSION_STATUS_LABEL = {
  [SESSION_STATUS.CONFIRMED]: { label: 'Đã xác nhận', tone: 'success' },
  [SESSION_STATUS.CANNOT_PERFORM]: { label: 'Báo không thể thực hiện', tone: 'danger' },
  [SESSION_STATUS.REASSIGNED]: { label: 'Đã đổi điều dưỡng', tone: 'info' },
  [SESSION_STATUS.COMPLETED]: { label: 'Hoàn tất', tone: 'neutral' },
}

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

export const BOOKING_STATUS_LABEL = {
  [BOOKING_STATUS.CONFIRMED]: { label: 'Đã xác nhận', tone: 'success' },
  [BOOKING_STATUS.IN_PROGRESS]: { label: 'Đang thực hiện', tone: 'info' },
  [BOOKING_STATUS.COMPLETED]: { label: 'Hoàn tất', tone: 'neutral' },
}

export const SOS_TYPES = {
  CALL_115: 'call_115',
  NOTIFY_HOSPITAL: 'notify_hospital',
  NOTIFY_PRIMARY_FAMILY: 'notify_primary_family',
  NOTIFY_FAMILY: 'notify_family',
}

export const SOS_TYPE_LABEL = {
  [SOS_TYPES.CALL_115]: 'Gọi 115',
  [SOS_TYPES.NOTIFY_HOSPITAL]: 'Báo bệnh viện',
  [SOS_TYPES.NOTIFY_PRIMARY_FAMILY]: 'Báo người thân ưu tiên',
  [SOS_TYPES.NOTIFY_FAMILY]: 'Báo người thân',
}

export const HOSPITAL_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
}

export const HOSPITAL_STATUS_LABEL = {
  [HOSPITAL_STATUS.ACTIVE]: { label: 'Hoạt động', tone: 'success' },
  [HOSPITAL_STATUS.SUSPENDED]: { label: 'Cần rà soát', tone: 'pending' },
}

export const ACCOUNT_STATUS_LABEL = {
  active: { label: 'Hoạt động', tone: 'success' },
  suspended: { label: 'Tạm khóa', tone: 'pending' },
}

export const MATCH_RETRY_WINDOW_MS = 60 * 60 * 1000 // 1 hour
