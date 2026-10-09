import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { CARE_TYPES, DISTRICTS, WEEKDAYS } from './constants'

// "3 giờ trước" style times are used by every portal, not only the Ant Design ones.
dayjs.extend(relativeTime)

export const formatDate = (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '')

export const formatDateTime = (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '')

export const careTypeLabel = (id) => CARE_TYPES.find((c) => c.id === id)?.label || id

export const weekdayLabel = (id) => WEEKDAYS.find((w) => w.id === id)?.label || id

export const districtLabel = (id) => (DISTRICTS.includes(id) ? id : id)
