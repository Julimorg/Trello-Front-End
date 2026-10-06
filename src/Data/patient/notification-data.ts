import { minutesAgo, timestampAt } from './date-utils'
import type { AppNotification } from './types'

// Data for the header bell. `link` points at the detail page the notification is about.

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'ntf-5001',
    role: 'patient',
    targetId: 'patient-an',
    message: 'Đã gửi yêu cầu #cr-1012 đến Trần Thị Hoa. Điều dưỡng có 15 phút để phản hồi.',
    createdAt: minutesAgo(6),
    read: false,
    link: '/patient/request/cr-1012',
  },
  {
    id: 'ntf-5002',
    role: 'patient',
    targetId: 'patient-an',
    message: 'Hôm nay 18:00 có buổi chăm sóc hậu phẫu với Nguyễn Thị Mai.',
    createdAt: minutesAgo(45),
    read: false,
    link: '/patient/bookings/bk-2008',
  },
  {
    id: 'ntf-5003',
    role: 'patient',
    targetId: 'patient-an',
    message: 'Võ Mỹ Duyên đã xác nhận nhận ca chăm sóc người cao tuổi.',
    createdAt: timestampAt(-3, '15:31'),
    read: false,
    link: '/patient/bookings/bk-2010',
  },
  {
    id: 'ntf-5004',
    role: 'patient',
    targetId: 'patient-an',
    message: 'Đặng Hữu Phúc báo không thể thực hiện một buổi tập vận động. Bệnh viện đang tìm người thay thế.',
    createdAt: timestampAt(-1, '22:01'),
    read: true,
    link: '/patient/bookings/bk-2006',
  },
  {
    id: 'ntf-5005',
    role: 'patient',
    targetId: 'patient-an',
    message: 'Chưa tìm được điều dưỡng cho yêu cầu #cr-1011 tại Quận 7.',
    createdAt: timestampAt(-2, '21:12'),
    read: true,
    link: '/patient/request/cr-1011',
  },
  {
    id: 'ntf-5101',
    role: 'nurse',
    targetId: 'nurse-hoa',
    message: 'Nguyễn Văn An đã chọn bạn cho ca Hỗ trợ vận động. Phản hồi trong 15 phút.',
    createdAt: minutesAgo(7),
    read: false,
    link: '/hospital/nurse/requests?id=cr-1012',
  },
  {
    id: 'ntf-5201',
    role: 'hospital',
    targetId: 'hosp-115',
    message: 'Cần hỗ trợ tìm điều dưỡng thay thế cho một buổi của booking bk-2006.',
    createdAt: timestampAt(-1, '22:01'),
    read: false,
  },
]
