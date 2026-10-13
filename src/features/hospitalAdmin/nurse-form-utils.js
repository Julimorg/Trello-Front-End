import dayjs from 'dayjs'

export const CERT_NAMES = [
  'Chứng chỉ hành nghề Điều dưỡng',
  'Chứng chỉ Hồi sức tim phổi cơ bản (BLS)',
  'Chứng chỉ Chăm sóc vết thương',
  'Chứng chỉ Phục hồi chức năng',
  'Chứng chỉ Chăm sóc người cao tuổi',
]
export const certToForm = (c) => ({
  name: c?.name,
  number: c?.number,
  issuedBy: c?.issuedBy,
  issuedAt: c?.issuedAt ? dayjs(c.issuedAt) : null,
  expiresAt: c?.expiresAt ? dayjs(c.expiresAt) : null,
  file: c?.file || null,
})

const trim = (v) => (typeof v === 'string' ? v.trim() : v)
export const formToCert = (v) => ({
  name: trim(v.name) || '',
  number: trim(v.number) || '',
  issuedBy: trim(v.issuedBy) || '',
  issuedAt: v.issuedAt ? v.issuedAt.format('YYYY-MM-DD') : undefined,
  expiresAt: v.expiresAt ? v.expiresAt.format('YYYY-MM-DD') : undefined,
  file: v.file || undefined,
})

export const DEFAULT_RANGE = ['08:00', '17:00']
export const asTime = (hhmm) => dayjs(`2000-01-01T${hhmm}`)

// Stored slots -> one entry per weekday. Older data with several slots on the same day is merged.
export function slotsToSchedule(slots = []) {
  const byDay = new Map()
  slots.forEach((s) => {
    const cur = byDay.get(s.weekday)
    byDay.set(s.weekday, cur ? { ...cur, start: s.start < cur.start ? s.start : cur.start, end: s.end > cur.end ? s.end : cur.end } : { weekday: s.weekday, start: s.start, end: s.end })
  })
  return [...byDay.values()]
}

export const scheduleToSlots = (schedule = []) => schedule.map((s) => ({ weekday: s.weekday, start: s.start, end: s.end }))

export const scheduleRules = [
  {
    validator: (_, value) => {
      if (!value || value.length === 0) return Promise.reject(new Error('Bắt buộc có lịch tham gia — bật ít nhất 1 ngày trong tuần'))
      if (value.some((s) => s.end <= s.start)) return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu'))
      return Promise.resolve()
    },
  },
]


// Resolves with the values, or null when validation fails (the form already shows the errors).
export const validateForm = (form, fields) => form.validateFields(fields).catch(() => null)
