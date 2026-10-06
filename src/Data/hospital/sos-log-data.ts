import { minutesAgo, timestampAt } from '../patient/date-utils'
import type { SosEvent } from '../patient/types'

// Data for "Cảnh báo SOS" (/hospital/admin/sos-log): incidents from nurse-hoa's shifts at
// Bệnh viện Nhân Dân 115. bookingId / sessionId point at Data/nurse/schedule-data.ts.

export const HOSPITAL_SOS_EVENTS: SosEvent[] = [
  {
    id: 'sos-3101',
    patientId: 'patient-lien',
    bookingId: 'bk-3101',
    sessionId: 'bk-3101-s11',
    nurseId: 'nurse-hoa',
    triggeredBy: 'nurse',
    type: 'notify_hospital',
    contactIds: [],
    note: 'Bà Liên chóng mặt, huyết áp 160/95. Đã cho nằm nghỉ, đo lại sau 10 phút vẫn cao — cần bác sĩ tư vấn.',
    location: { lat: 10.8042, lng: 106.7121 },
    createdAt: minutesAgo(18),
    status: 'open',
  },
  {
    id: 'sos-3102',
    patientId: 'patient-dung',
    bookingId: 'bk-3103',
    sessionId: 'bk-3103-s4',
    nurseId: 'nurse-hoa',
    triggeredBy: 'nurse',
    type: 'notify_hospital',
    contactIds: [],
    note: 'Bệnh nhân từ chối uống thuốc huyết áp tối nay, người nhà không nghe máy.',
    location: { lat: 10.7993, lng: 106.7058 },
    createdAt: timestampAt(-5, '17:40'),
    status: 'acknowledged',
    acknowledgedAt: timestampAt(-5, '17:46'),
    resolution: 'Đã gọi con trai bệnh nhân, chờ phản hồi.',
  },
  {
    id: 'sos-3103',
    patientId: 'patient-hanh',
    bookingId: 'bk-3102',
    sessionId: 'bk-3102-s5',
    nurseId: 'nurse-hoa',
    triggeredBy: 'nurse',
    type: 'call_115',
    contactIds: [],
    note: 'Bệnh nhân trượt ngã khi tập đi, đau cổ tay phải, nghi gãy xương. Đã cố định tạm và gọi 115.',
    location: { lat: 10.8506, lng: 106.7719 },
    createdAt: timestampAt(-2, '14:35'),
    status: 'resolved',
    acknowledgedAt: timestampAt(-2, '14:37'),
    resolvedAt: timestampAt(-2, '16:10'),
    resolution: 'Đã chuyển cấp cứu BV 115, gãy đầu dưới xương quay. Tạm hoãn 2 buổi tập, đã báo gia đình.',
  },
]
