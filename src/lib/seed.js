import { HOSPITAL_STATUS } from './constants'
import { NURSES } from '../Data/patient/nurse-data'
import { CARE_REQUESTS } from '../Data/patient/care-request-data'
import { BOOKINGS } from '../Data/patient/booking-data'
import { FAMILY_CONTACTS, FAMILY_INVITES } from '../Data/patient/family-data'
import { PATIENT_PROFILES } from '../Data/patient/profile-data'
import { SOS_EVENTS } from '../Data/patient/sos-data'
import { NOTIFICATIONS } from '../Data/patient/notification-data'
import { NURSE_CARE_REQUESTS } from '../Data/nurse/requests-data'
import { NURSE_BOOKINGS } from '../Data/nurse/schedule-data'
import { NURSE_NOTIFICATIONS } from '../Data/nurse/notification-data'
import { HOSPITAL_SOS_EVENTS } from '../Data/hospital/sos-log-data'
import { COMPLIANCE_REPORTS } from '../Data/admin/compliance-data'

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

// Deep copies so store mutations never touch the imported data modules.
const clone = (value) => JSON.parse(JSON.stringify(value))

export function seedState() {
  return {
    hospitals: clone(HOSPITALS),
    nurses: clone(NURSES),
    patients: PATIENT_PROFILES.map((p) => ({ ...clone(p), familyContacts: clone(FAMILY_CONTACTS[p.id] || []) })),
    careRequests: clone([...CARE_REQUESTS, ...NURSE_CARE_REQUESTS]),
    bookings: clone([...BOOKINGS, ...NURSE_BOOKINGS]),
    familyInvites: clone(FAMILY_INVITES),
    sosEvents: clone([...SOS_EVENTS, ...HOSPITAL_SOS_EVENTS]),
    reports: clone(COMPLIANCE_REPORTS),
    notifications: clone([...NOTIFICATIONS, ...NURSE_NOTIFICATIONS]),
  }
}
