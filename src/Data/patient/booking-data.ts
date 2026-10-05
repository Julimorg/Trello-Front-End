import { dayOffset, timestampAt } from './date-utils'
import type { Booking, CareSession, SessionStatus } from './types'

// Data for "Lịch chăm sóc" (/patient/bookings calendar and /patient/bookings/:id).
// careRequestId points at care-request-data.ts, nurseId at nurse-data.ts.

const session = (
  bookingId: string,
  index: number,
  offset: number,
  start: string,
  end: string,
  nurseId: string,
  extra: Partial<CareSession> = {},
): CareSession => {
  const status: SessionStatus = offset < 0 ? 'completed' : 'confirmed'
  return { id: `${bookingId}-s${index}`, date: dayOffset(offset), start, end, status, nurseId, ...extra }
}

export const BOOKINGS: Booking[] = [
  {
    id: 'bk-2014',
    careRequestId: 'cr-1014',
    patientId: 'patient-an',
    nurseId: 'nurse-huong',
    status: 'completed',
    createdAt: timestampAt(-60, '10:00'),
    sessions: [session('bk-2014', 1, -59, '18:00', '19:00', 'nurse-huong')],
  },
  {
    id: 'bk-2001',
    careRequestId: 'cr-1001',
    patientId: 'patient-an',
    nurseId: 'nurse-mai',
    status: 'completed',
    createdAt: timestampAt(-57, '09:30'),
    sessions: [
      session('bk-2001', 1, -56, '17:00', '19:00', 'nurse-mai'),
      session('bk-2001', 2, -54, '17:00', '19:00', 'nurse-quoc', {
        status: 'reassigned',
        history: [{ nurseId: 'nurse-mai', reason: 'Đột xuất có ca trực tại bệnh viện', reportedAt: timestampAt(-55, '20:00') }],
      }),
      session('bk-2001', 3, -49, '17:00', '19:00', 'nurse-mai'),
      session('bk-2001', 4, -47, '17:00', '19:00', 'nurse-mai'),
    ],
  },
  {
    id: 'bk-2013',
    careRequestId: 'cr-1013',
    patientId: 'patient-an',
    nurseId: 'nurse-thao',
    status: 'completed',
    createdAt: timestampAt(-45, '08:00'),
    sessions: [session('bk-2013', 1, -44, '17:30', '18:30', 'nurse-thao')],
  },
  {
    id: 'bk-2002',
    careRequestId: 'cr-1002',
    patientId: 'patient-an',
    nurseId: 'nurse-thao',
    status: 'completed',
    createdAt: timestampAt(-41, '18:00'),
    sessions: [-40, -39, -38, -37].map((offset, i) => session('bk-2002', i + 1, offset, '17:30', '18:30', 'nurse-thao')),
  },
  {
    id: 'bk-2004',
    careRequestId: 'cr-1004',
    patientId: 'patient-an',
    nurseId: 'nurse-hoa',
    status: 'completed',
    createdAt: timestampAt(-25, '09:00'),
    sessions: [
      session('bk-2004', 1, -24, '18:00', '20:00', 'nurse-hoa'),
      session('bk-2004', 2, -22, '18:00', '20:00', 'nurse-hoa'),
      session('bk-2004', 3, -17, '18:00', '20:00', 'nurse-huong', {
        status: 'reassigned',
        history: [{ nurseId: 'nurse-hoa', reason: 'Ốm đột xuất', reportedAt: timestampAt(-18, '19:00') }],
      }),
      session('bk-2004', 4, -15, '18:00', '20:00', 'nurse-hoa'),
    ],
  },
  {
    id: 'bk-2006',
    careRequestId: 'cr-1006',
    patientId: 'patient-an',
    nurseId: 'nurse-phuc',
    status: 'in_progress',
    createdAt: timestampAt(-15, '11:00'),
    sessions: [
      session('bk-2006', 1, -14, '16:00', '18:00', 'nurse-phuc'),
      session('bk-2006', 2, -7, '16:00', '18:00', 'nurse-phuc'),
      session('bk-2006', 3, 7, '16:00', '18:00', 'nurse-phuc', {
        status: 'cannot_perform',
        needsManualReassignment: true,
        history: [{ nurseId: 'nurse-phuc', reason: 'Trùng lịch trực đêm tại bệnh viện', reportedAt: timestampAt(-1, '22:00') }],
      }),
      session('bk-2006', 4, 14, '16:00', '18:00', 'nurse-phuc'),
    ],
  },
  {
    id: 'bk-2007',
    careRequestId: 'cr-1007',
    patientId: 'patient-an',
    nurseId: 'nurse-lan',
    status: 'completed',
    createdAt: timestampAt(-9, '16:00'),
    sessions: [session('bk-2007', 1, -8, '17:30', '18:30', 'nurse-lan')],
  },
  {
    id: 'bk-2008',
    careRequestId: 'cr-1008',
    patientId: 'patient-an',
    nurseId: 'nurse-mai',
    status: 'in_progress',
    createdAt: timestampAt(-5, '09:15'),
    sessions: [0, 1, 2, 3].map((offset, i) => session('bk-2008', i + 1, offset, '18:00', '19:00', 'nurse-mai')),
  },
  {
    id: 'bk-2010',
    careRequestId: 'cr-1010',
    patientId: 'patient-an',
    nurseId: 'nurse-duyen',
    status: 'confirmed',
    createdAt: timestampAt(-3, '15:30'),
    sessions: [1, 3, 5, 8].map((offset, i) => session('bk-2010', i + 1, offset, '14:00', '16:00', 'nurse-duyen')),
  },
  {
    id: 'bk-2101',
    careRequestId: 'cr-1101',
    patientId: 'patient-thu',
    nurseId: 'nurse-lan',
    status: 'completed',
    createdAt: timestampAt(-11, '10:00'),
    sessions: [-10, -9, -8, -7].map((offset, i) => session('bk-2101', i + 1, offset, '17:30', '19:00', 'nurse-lan')),
  },
]
