import { HOSPITAL_STATUS } from './constants'
import { NURSES } from '../Data/patient/nurse-data'
import { CARE_REQUESTS } from '../Data/patient/care-request-data'
import { BOOKINGS } from '../Data/patient/booking-data'
import { FAMILY_CONTACTS } from '../Data/patient/family-data'
import { PATIENT_PROFILES } from '../Data/patient/profile-data'
import { SOS_EVENTS } from '../Data/patient/sos-data'
import { NOTIFICATIONS } from '../Data/patient/notification-data'

const HOSPITALS = [
  {
    id: 'hosp-115',
    name: 'Bệnh viện Nhân Dân 115',
    address: '527 Sư Vạn Hạnh, Bình Thạnh',
    district: 'Bình Thạnh',
    phone: '028-1234-5678',
    status: HOSPITAL_STATUS.ACTIVE,
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'hosp-ydvn',
    name: 'Bệnh viện Đại học Y Dược',
    address: '215 Hồng Bàng, Quận 5',
    district: 'Quận 5',
    phone: '028-8765-4321',
    status: HOSPITAL_STATUS.ACTIVE,
    createdAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'hosp-tdh',
    name: 'Bệnh viện TP. Thủ Đức',
    address: '29 Phú Châu, Thủ Đức',
    district: 'Thủ Đức',
    phone: '028-3896-0335',
    status: HOSPITAL_STATUS.ACTIVE,
    createdAt: '2026-07-20T00:00:00.000Z',
  },
]

const price = (hospitalId, careType, value) => ({ id: `price-${hospitalId}-${careType}`, hospitalId, careType, unit: 'buổi', price: value })

const PRICING = [
  price('hosp-115', 'wound-dressing', 150000),
  price('hosp-115', 'post-surgery', 250000),
  price('hosp-115', 'vitals-monitoring', 120000),
  price('hosp-115', 'mobility-support', 180000),
  price('hosp-115', 'elderly-care', 200000),
  price('hosp-115', 'medication', 130000),
  price('hosp-ydvn', 'post-surgery', 280000),
  price('hosp-ydvn', 'wound-dressing', 160000),
  price('hosp-ydvn', 'elderly-care', 210000),
  price('hosp-ydvn', 'medication', 140000),
  price('hosp-tdh', 'post-surgery', 240000),
  price('hosp-tdh', 'wound-dressing', 145000),
  price('hosp-tdh', 'elderly-care', 190000),
  price('hosp-tdh', 'mobility-support', 175000),
]

// Deep copies so store mutations never touch the imported data modules.
const clone = (value) => JSON.parse(JSON.stringify(value))

export function seedState() {
  return {
    hospitals: clone(HOSPITALS),
    nurses: clone(NURSES),
    patients: PATIENT_PROFILES.map((p) => ({ ...clone(p), familyContacts: clone(FAMILY_CONTACTS[p.id] || []) })),
    careRequests: clone(CARE_REQUESTS),
    bookings: clone(BOOKINGS),
    sosEvents: clone(SOS_EVENTS),
    pricing: clone(PRICING),
    notifications: clone(NOTIFICATIONS),
  }
}
