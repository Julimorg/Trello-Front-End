import dayjs from 'dayjs'

// Shared labels/colours/helpers for the hospital admin portal (Ant Design preset colours).

export const AUTH_META = {
  draft: { label: 'Chờ xác minh', color: 'gold' },
  authorized: { label: 'Đã cấp phép', color: 'green' },
  suspended: { label: 'Tạm ngưng', color: 'orange' },
  revoked: { label: 'Đã thu hồi', color: 'red' },
}

export const SOS_STATUS_META = {
  open: { label: 'Chưa xử lý', color: 'red' },
  acknowledged: { label: 'Đang xử lý', color: 'gold' },
  resolved: { label: 'Đã xử lý', color: 'green' },
}

export const SOS_TYPE_META = {
  call_115: { label: 'Gọi 115', color: 'red' },
  notify_hospital: { label: 'Báo bệnh viện', color: 'blue' },
  notify_primary_family: { label: 'Báo người thân ưu tiên', color: 'purple' },
  notify_family: { label: 'Báo người thân', color: 'cyan' },
}

export function initials(name) {
  return (name || '')
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// Vietnamese lists are alphabetised by given name (the last word), then the full name.
const collator = new Intl.Collator('vi', { sensitivity: 'base' })
export const givenName = (name) => (name || '').trim().split(/\s+/).pop() || ''
export const compareByGivenName = (a, b) => collator.compare(givenName(a), givenName(b)) || collator.compare(a || '', b || '')
export const compareText = (a, b) => collator.compare(a || '', b || '')

// Licence validity from its expiry date.
export function certificateStatus(cert, today = dayjs()) {
  if (!cert.expiresAt) return { key: 'unknown', label: 'Không thời hạn', color: 'default' }
  const days = dayjs(cert.expiresAt).diff(today, 'day')
  if (days < 0) return { key: 'expired', label: 'Đã hết hạn', color: 'red', days }
  if (days <= 90) return { key: 'expiring', label: `Còn ${days} ngày`, color: 'orange', days }
  return { key: 'valid', label: 'Còn hiệu lực', color: 'green', days }
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
