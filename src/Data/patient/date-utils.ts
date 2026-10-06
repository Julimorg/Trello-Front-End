// Seed dates are expressed relative to "today" so the demo always has past care
// history and upcoming sessions, no matter when it is opened.

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function dateAt(offset: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d
}

/** Local calendar date (YYYY-MM-DD) `offset` days from today. */
export function dayOffset(offset: number): string {
  const d = dateAt(offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Weekday index (0 = Sunday) of the day `offset` days from today. */
export function weekdayAt(offset: number): number {
  return dateAt(offset).getDay()
}

/** ISO timestamp at local `time` on the day `offset` days from today. */
export function timestampAt(offset: number, time = '09:00'): string {
  return new Date(`${dayOffset(offset)}T${time}:00`).toISOString()
}

/** ISO timestamp `minutes` before now — for "just happened" seed records that must never be in the future. */
export function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString()
}
