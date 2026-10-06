import { dayOffset, timestampAt } from '../patient/date-utils'
import type { Booking, CareSession, SessionStatus } from '../patient/types'

// Data for "Lịch làm việc" (/hospital/nurse/schedule): nurse-hoa's bookings for the
// cr-31xx requests in requests-data.ts. Sessions span last month → next month so the
// month calendar always has data, and several days carry 3+ shifts.

const sessionsFor = (bookingId: string, offsets: number[], start: string, end: string): CareSession[] =>
  offsets.map((offset, i) => {
    const status: SessionStatus = offset < 0 ? 'completed' : 'confirmed'
    return { id: `${bookingId}-s${i + 1}`, date: dayOffset(offset), start, end, status, nurseId: 'nurse-hoa' }
  })

const booking = (id: string, careRequestId: string, patientId: string, createdOffset: number, sessions: CareSession[]): Booking => ({
  id,
  careRequestId,
  patientId,
  nurseId: 'nurse-hoa',
  status: sessions.every((s) => s.status === 'completed') ? 'completed' : 'confirmed',
  createdAt: timestampAt(createdOffset, '12:00'),
  sessions,
})

export const NURSE_BOOKINGS: Booking[] = [
  booking(
    'bk-3101',
    'cr-3101',
    'patient-lien',
    -34,
    sessionsFor('bk-3101', [-33, -30, -26, -23, -19, -16, -12, -9, -5, -2, 0, 1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29], '07:30', '09:00'),
  ),
  booking(
    'bk-3102',
    'cr-3102',
    'patient-hanh',
    -29,
    sessionsFor('bk-3102', [-28, -21, -14, -7, -2, 0, 3, 7, 10, 14, 17, 21, 24, 28, 31], '14:00', '15:30'),
  ),
  booking(
    'bk-3103',
    'cr-3103',
    'patient-dung',
    -21,
    sessionsFor('bk-3103', [-20, -13, -6, -5, -2, 1, 3, 5, 8, 12, 15, 19, 22, 26, 33], '17:00', '18:30'),
  ),
  booking('bk-3104', 'cr-3104', 'patient-khanh', -13, sessionsFor('bk-3104', [-12, -5, -2, 0, 3, 7, 10, 14, 21, 28, 35], '19:00', '20:30')),
  booking('bk-3105', 'cr-3105', 'patient-tuan', -3, sessionsFor('bk-3105', [-2, 0, 1, 3, 10, 17, 24, 31, 38], '10:00', '11:30')),
]

/** Shifts shown inside a calendar cell before collapsing into "+N more". */
export const MAX_SHIFTS_PER_DAY_CELL = 3

/** Colour per session status for calendar chips (Ant Design preset colours). */
export const SHIFT_STATUS_COLOR: Record<SessionStatus, string> = {
  confirmed: 'cyan',
  completed: 'default',
  reassigned: 'purple',
  cannot_perform: 'red',
}
