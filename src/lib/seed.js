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
import { PARTNER_HOSPITALS } from '../Data/admin/partner-data'
import { SUPPORT_TICKETS } from '../Data/admin/support-data'
import { PATIENT_ACCOUNTS } from '../Data/admin/account-data'
import { AUDIT_LOGS } from '../Data/admin/audit-data'
import { BROADCASTS } from '../Data/admin/broadcast-data'
import { DEFAULT_SETTINGS } from '../Data/admin/settings-data'

const DEFAULT_PATIENT_ACCOUNT = { status: 'active', joinedAt: '2026-06-01T00:00:00.000Z', lastActiveAt: '2026-06-01T00:00:00.000Z', verified: false, verifiedBy: null }

// Deep copies so store mutations never touch the imported data modules.
const clone = (value) => JSON.parse(JSON.stringify(value))

export function seedState() {
  return {
    hospitals: clone(PARTNER_HOSPITALS),
    nurses: NURSES.map((n) => ({ ...clone(n), accountStatus: 'active' })),
    patients: PATIENT_PROFILES.map((p) => ({
      ...clone(p),
      familyContacts: clone(FAMILY_CONTACTS[p.id] || []),
      account: clone(PATIENT_ACCOUNTS[p.id] || DEFAULT_PATIENT_ACCOUNT),
    })),
    careRequests: clone([...CARE_REQUESTS, ...NURSE_CARE_REQUESTS]),
    bookings: clone([...BOOKINGS, ...NURSE_BOOKINGS]),
    familyInvites: clone(FAMILY_INVITES),
    sosEvents: clone([...SOS_EVENTS, ...HOSPITAL_SOS_EVENTS]),
    reports: clone(COMPLIANCE_REPORTS),
    auditLogs: clone(AUDIT_LOGS),
    broadcasts: clone(BROADCASTS),
    settings: clone(DEFAULT_SETTINGS),
    tickets: clone(SUPPORT_TICKETS),
    notifications: clone([...NOTIFICATIONS, ...NURSE_NOTIFICATIONS]),
  }
}
