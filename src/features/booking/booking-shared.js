import dayjs from 'dayjs'
import { SESSION_STATUS } from '../../lib/constants'
import { sessionWork } from '../nurse/nurse-shared'

export { frequencyText } from '../nurse/nurse-shared'

export const minutesBetween = (start, end) => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

// 90 -> "1 giờ 30 phút", 120 -> "2 giờ", 45 -> "45 phút"
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} phút`
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const weekdayLong = (date) => WEEKDAY_LONG[dayjs(date).day()]

// A visit counts as done once it is completed, or handed to a substitute and already in the past.
export const isDone = (s, today = dayjs().format('YYYY-MM-DD')) =>
  s.status === SESSION_STATUS.COMPLETED || (s.status === SESSION_STATUS.REASSIGNED && s.date <= today)

// Overall picture of one course of care (booking).
export function bookingSummary(booking, today = dayjs().format('YYYY-MM-DD')) {
  const sessions = [...booking.sessions].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  const done = sessions.filter((s) => isDone(s, today))
  const needsNurse = sessions.filter((s) => s.status === SESSION_STATUS.CANNOT_PERFORM)
  const next = sessions.find((s) => !isDone(s, today) && s.status !== SESSION_STATUS.CANNOT_PERFORM && s.date >= today) || null
  const minutes = (list) => list.reduce((sum, s) => sum + minutesBetween(s.start, s.end), 0)
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  return {
    sessions,
    total: sessions.length,
    done: done.length,
    percent: sessions.length ? Math.round((done.length / sessions.length) * 100) : 0,
    needsNurse: needsNurse.length,
    next,
    first,
    last,
    spanDays: first && last ? dayjs(last.date).diff(dayjs(first.date), 'day') + 1 : 0,
    totalMinutes: minutes(sessions),
    doneMinutes: minutes(done),
    perSessionMinutes: first ? minutesBetween(first.start, first.end) : 0,
  }
}

// "in 2 days", "tomorrow", "today" for the next visit.
export function relativeDay(date, today = dayjs().format('YYYY-MM-DD')) {
  const diff = dayjs(date).diff(dayjs(today), 'day')
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Ngày mai'
  if (diff > 1) return `${diff} ngày nữa`
  return `${-diff} ngày trước`
}

// Work recorded for one visit: tasks done vs the plan.
// A visit handed to a substitute and already past counts as completed work.
export const visitWork = (session, careType) =>
  sessionWork(session.status === SESSION_STATUS.REASSIGNED && isDone(session) ? { ...session, status: SESSION_STATUS.COMPLETED } : session, careType)

// Vital signs charted on the "Tiến triển" tab. `lowerIsBetter: null` means "closest to normal range".
export const VITAL_METRICS = [
  { key: 'pain', label: 'Mức đau', unit: '/10', lowerIsBetter: true, get: (o) => o.pain },
  { key: 'systolic', label: 'Huyết áp tâm thu', unit: 'mmHg', lowerIsBetter: true, normal: [90, 130], get: (o) => (o.vitals?.bp ? Number(o.vitals.bp.split('/')[0]) : undefined) },
  { key: 'pulse', label: 'Mạch', unit: 'lần/phút', lowerIsBetter: null, normal: [60, 100], get: (o) => o.vitals?.pulse },
  { key: 'temp', label: 'Nhiệt độ', unit: '°C', lowerIsBetter: true, normal: [36, 37.2], get: (o) => o.vitals?.temp },
  { key: 'spo2', label: 'SpO₂', unit: '%', lowerIsBetter: false, normal: [95, 100], get: (o) => o.vitals?.spo2 },
  { key: 'glucose', label: 'Đường huyết', unit: 'mmol/L', lowerIsBetter: true, normal: [3.9, 7.8], get: (o) => o.vitals?.glucose },
]

// Compares the first and last reading: 'better' | 'stable' | 'worse'.
export function trendOf(metric, values) {
  if (values.length < 2) return 'stable'
  const first = values[0]
  const last = values[values.length - 1]
  const delta = last - first
  const threshold = Math.max(Math.abs(first) * 0.02, metric.key === 'temp' ? 0.15 : 0.5)
  if (Math.abs(delta) < threshold) return 'stable'
  if (metric.lowerIsBetter === null) {
    const mid = (metric.normal[0] + metric.normal[1]) / 2
    return Math.abs(last - mid) < Math.abs(first - mid) ? 'better' : 'worse'
  }
  return (delta < 0) === metric.lowerIsBetter ? 'better' : 'worse'
}

export const TREND_META = {
  better: { label: 'Cải thiện', color: '#21845b', bg: '#e7f6ee' },
  stable: { label: 'Ổn định', color: '#2b69c9', bg: '#eaf1fc' },
  worse: { label: 'Cần theo dõi', color: '#b96b08', bg: '#fff4df' },
}

export const inRange = (metric, value) => !metric.normal || (value >= metric.normal[0] && value <= metric.normal[1])
