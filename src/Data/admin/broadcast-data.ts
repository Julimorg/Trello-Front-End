import { timestampAt } from '../patient/date-utils'
import type { Broadcast } from './types'

// Data for "Thông báo hệ thống" (/admin/broadcasts): announcements sent to groups of users.

export const BROADCASTS: Broadcast[] = [
  {
    id: 'bc-001',
    title: 'Bảo trì hệ thống đêm 28/09',
    message: 'CareShift bảo trì từ 23:00 đến 23:30 ngày 28/09. Cảnh báo SOS vẫn hoạt động bình thường.',
    audience: 'all',
    hospitalId: null,
    sentAt: timestampAt(-9, '15:00'),
    sentBy: 'Linh Phạm',
    recipients: 25,
  },
  {
    id: 'bc-002',
    title: 'Nhắc cập nhật chứng chỉ hành nghề',
    message: 'Điều dưỡng có chứng chỉ sắp hết hạn vui lòng gửi bản cập nhật cho bệnh viện trước ngày 31/10.',
    audience: 'nurses',
    hospitalId: null,
    sentAt: timestampAt(-4, '08:30'),
    sentBy: 'Linh Phạm',
    recipients: 14,
  },
]

export const BROADCAST_AUDIENCES = [
  { value: 'all', label: 'Tất cả người dùng' },
  { value: 'patients', label: 'Bệnh nhân' },
  { value: 'nurses', label: 'Điều dưỡng' },
  { value: 'hospitals', label: 'Admin bệnh viện' },
] as const
