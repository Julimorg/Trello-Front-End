import dayjs from 'dayjs'
import { PLATFORM_STATUS_META } from '../../lib/constants'

export { PLATFORM_STATUS_META }

// Contract term state against today and the configured warning window.
export function contractState(contract, warningDays = 60) {
  if (!contract?.endDate) return { key: 'none', label: 'Chưa có hợp đồng', color: 'default', daysLeft: null }
  const daysLeft = dayjs(contract.endDate).endOf('day').diff(dayjs(), 'day')
  if (daysLeft < 0) return { key: 'expired', label: `Hết hạn ${-daysLeft} ngày`, color: 'red', daysLeft }
  if (daysLeft <= warningDays) return { key: 'expiring', label: `Còn ${daysLeft} ngày`, color: 'orange', daysLeft }
  return { key: 'valid', label: `Còn ${daysLeft} ngày`, color: 'green', daysLeft }
}

export const CONTRACT_FILTERS = [
  { value: 'valid', label: 'Còn hiệu lực' },
  { value: 'expiring', label: 'Sắp hết hạn' },
  { value: 'expired', label: 'Đã hết hạn' },
]

export const ageOf = (dob) => (dob ? dayjs().diff(dayjs(dob), 'year') : null)

// Accent-insensitive search key ("Nguyễn" matches "nguyen").
export const normalize = (t) =>
  (t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

// StatusBadge tones from lib/constants mapped to antd Tag colours.
export const TONE_COLOR = { neutral: 'default', info: 'blue', success: 'green', pending: 'orange', danger: 'red' }

export const REPORT_STATUS_META = {
  open: { label: 'Mới', color: 'red' },
  investigating: { label: 'Đang xem xét', color: 'orange' },
  resolved: { label: 'Đã xử lý', color: 'green' },
  dismissed: { label: 'Bác bỏ', color: 'default' },
}
