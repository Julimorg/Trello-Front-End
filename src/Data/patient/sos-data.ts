import { timestampAt } from './date-utils'
import type { SosEvent, SosType } from './types'

// Data for the floating SOS button shown on every patient page.

export const SOS_ACTIONS: { type: SosType; title: string; hint: string; glyph: string; tone: 'red' | 'teal' | 'blue' }[] = [
  { type: 'call_115', title: 'Gọi 115', hint: 'Tình huống cấp cứu y tế', glyph: '✚', tone: 'red' },
  { type: 'notify_primary_family', title: 'Báo người thân ưu tiên nhất', hint: '', glyph: '★', tone: 'blue' },
  { type: 'notify_family', title: 'Báo người thân', hint: 'Chọn những người cần nhận cảnh báo', glyph: '⌂', tone: 'teal' },
]

export const SOS_EVENTS: SosEvent[] = [
  {
    id: 'sos-3001',
    patientId: 'patient-an',
    bookingId: 'bk-2001',
    sessionId: 'bk-2001-s1',
    triggeredBy: 'nurse',
    type: 'notify_hospital',
    contactIds: [],
    note: 'Vết mổ có dấu hiệu sưng đỏ nhẹ, đã báo bác sĩ phụ trách tư vấn.',
    location: { lat: 10.8, lng: 106.71 },
    createdAt: timestampAt(-56, '18:10'),
    nurseId: 'nurse-mai',
    status: 'resolved',
    acknowledgedAt: timestampAt(-56, '18:14'),
    resolvedAt: timestampAt(-56, '19:02'),
    resolution: 'Bác sĩ trực tư vấn qua điện thoại, kê thêm kháng sinh. Theo dõi tiếp ở buổi sau.',
  },
  {
    id: 'sos-3002',
    patientId: 'patient-an',
    bookingId: 'bk-2004',
    sessionId: 'bk-2004-s2',
    triggeredBy: 'patient',
    type: 'notify_primary_family',
    contactIds: ['fc-an-1'],
    note: 'Choáng nhẹ khi đứng dậy, đã báo con gái.',
    location: { lat: 10.802, lng: 106.712 },
    createdAt: timestampAt(-22, '19:05'),
    nurseId: 'nurse-hoa',
    status: 'resolved',
    acknowledgedAt: timestampAt(-22, '19:08'),
    resolvedAt: timestampAt(-22, '19:40'),
    resolution: 'Hạ huyết áp tư thế; điều dưỡng hướng dẫn đứng dậy chậm, gia đình đã có mặt.',
  },
]
