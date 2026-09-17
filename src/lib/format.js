import dayjs from 'dayjs'
import { CARE_TYPES, DISTRICTS, WEEKDAYS } from './constants'

export const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '')

export const formatDateTime = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '')

export const careTypeLabel = (id) => CARE_TYPES.find((c) => c.id === id)?.label || id

export const weekdayLabel = (id) => WEEKDAYS.find((w) => w.id === id)?.label || id

export const districtLabel = (id) => (DISTRICTS.includes(id) ? id : id)
