export const ISO = 'YYYY-MM-DD'
export const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
export const WEEKDAY_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export const SESSION_META = {
  confirmed: { label: 'Đã xác nhận', color: 'cyan' },
  completed: { label: 'Hoàn thành', color: 'default' },
  reassigned: { label: 'Đã đổi điều dưỡng', color: 'purple' },
  cannot_perform: { label: 'Cần người thay', color: 'red' },
}

export const minutesOf = (s) => {
  const [sh, sm] = s.start.split(':').map(Number)
  const [eh, em] = s.end.split(':').map(Number)
  return eh * 60 + em - sh * 60 - sm
}
export const hoursText = (minutes) => `${Math.round((minutes / 60) * 10) / 10} h`

// Colour step of a cell by hours worked that day: 0 none … 4 heavy.
export const loadLevel = (minutes) => (minutes === 0 ? 0 : minutes <= 120 ? 1 : minutes <= 300 ? 2 : minutes <= 480 ? 3 : 4)

export const LOAD_LEGEND = [
  { level: 1, label: '≤ 2 h' },
  { level: 2, label: '2–5 h' },
  { level: 3, label: '5–8 h' },
  { level: 4, label: '> 8 h' },
]

