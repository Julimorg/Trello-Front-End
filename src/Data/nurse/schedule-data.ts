import { dayOffset, timestampAt } from '../patient/date-utils'
import { SESSION_OBSERVATIONS } from '../patient/care-progress-data'
import type { Booking, CareSession, SessionStatus } from '../patient/types'

// Data for "Lịch làm việc" (/hospital/nurse/schedule): nurse-hoa's bookings for the
// cr-31xx requests in requests-data.ts. Every course has a visit today (so the "ca hôm nay"
// flow can be tried end to end) plus past and upcoming visits. Time slots never overlap, and
// nothing is booked after 20:30 so evening requests can still be accepted.

const sessionsFor = (bookingId: string, offsets: number[], start: string, end: string): CareSession[] =>
  offsets.map((offset, i) => {
    const status: SessionStatus = offset < 0 ? 'completed' : 'confirmed'
    const id = `${bookingId}-s${i + 1}`
    const observation = SESSION_OBSERVATIONS[id]
    return { id, date: dayOffset(offset), start, end, status, nurseId: 'nurse-hoa', ...(observation ? { observation } : {}) }
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
  booking('bk-3101', 'cr-3101', 'patient-lien', -14, sessionsFor('bk-3101', [-12, -9, -6, -3, 0, 3, 6, 9, 12, 15], '07:30', '09:00')),
  booking('bk-3105', 'cr-3105', 'patient-tuan', -9, sessionsFor('bk-3105', [-7, 0, 7, 14], '10:00', '11:30')),
  booking('bk-3102', 'cr-3102', 'patient-hanh', -16, sessionsFor('bk-3102', [-14, -7, 0, 7, 14, 21], '14:00', '15:30')),
  booking('bk-3103', 'cr-3103', 'patient-dung', -12, sessionsFor('bk-3103', [-10, -5, 0, 5, 10, 15], '17:00', '18:30')),
  booking('bk-3104', 'cr-3104', 'patient-khanh', -14, sessionsFor('bk-3104', [-12, -6, 0, 6, 12], '19:00', '20:30')),
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
