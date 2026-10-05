// Shared shapes for the patient-app data files. Every record carries its own id, and
// cross-references (nurseId, careRequestId, bookingId, hospitalId, patientId) point at
// ids defined in the sibling data files so detail pages can link to each other.

export type CareTypeId =
  | 'wound-dressing'
  | 'vitals-monitoring'
  | 'mobility-support'
  | 'medication'
  | 'post-surgery'
  | 'elderly-care'
  | 'other'

export type NurseAuthStatus = 'draft' | 'authorized' | 'suspended' | 'revoked'

export type CareRequestStatus =
  | 'created'
  | 'matching'
  | 'matched'
  | 'nurse_pending'
  | 'no_match'
  | 'cancelled'
  | 'completed'

export type SessionStatus = 'confirmed' | 'cannot_perform' | 'reassigned' | 'completed'

export type Frequency = 'once' | 'daily' | 'weekly'

export type SosType = 'call_115' | 'notify_primary_family' | 'notify_family' | 'notify_hospital'

export interface Certificate {
  id: string
  name: string
  number: string
  issuedBy: string
}

export interface AvailabilitySlot {
  id: string
  weekday: number
  start: string
  end: string
}

export interface Nurse {
  id: string
  hospitalId: string
  name: string
  rank: string
  phone: string
  experienceYears: number
  specialties: CareTypeId[]
  serviceAreas: string[]
  authStatus: NurseAuthStatus
  authorizedCareTypes: CareTypeId[]
  certificates: Certificate[]
  availability: AvailabilitySlot[]
  rating: number | null
  reviewCount: number
  completedCases: number
  bio: string
}

export interface TimeSlot {
  start: string
  end: string
}

export interface CareRequest {
  id: string
  patientId: string
  careType: CareTypeId
  district: string
  desiredStartDate: string
  frequency: Frequency
  weekdays: number[]
  timeSlot: TimeSlot
  notes: string
  attachments: string[]
  status: CareRequestStatus
  createdBy: 'patient' | 'hospital'
  matchedNurseIds: string[]
  selectedNurseId: string | null
  declinedNurseIds: string[]
  bookingId: string | null
  lastMatchedAt: string | null
  createdAt: string
}

export interface SessionHistoryEntry {
  nurseId: string
  reason: string
  reportedAt: string
}

export interface CareSession {
  id: string
  date: string
  start: string
  end: string
  status: SessionStatus
  nurseId: string
  history?: SessionHistoryEntry[]
  needsManualReassignment?: boolean
}

export interface Booking {
  id: string
  careRequestId: string
  patientId: string
  nurseId: string
  status: 'confirmed' | 'in_progress' | 'completed'
  createdAt: string
  sessions: CareSession[]
}

export interface FamilyContact {
  id: string
  name: string
  phone: string
  relation: string
  status: 'Đã liên kết' | 'Chờ xác nhận'
  /** Only one contact per patient may be primary (the SOS "người thân ưu tiên nhất"). */
  primary: boolean
  permissions: string[]
  /** Set when the relative linked by scanning the patient's QR invite. */
  inviteCode?: string
}

/** QR / link invite a patient shares so a relative can link their CareShift account. */
export interface FamilyInvite {
  code: string
  patientId: string
  permissions: string[]
  createdAt: string
  expiresAt: string
  /** Set once a relative accepts; points at the FamilyContact it created. */
  usedAt?: string
  contactId?: string
  revokedAt?: string
}

export interface PatientProfile {
  id: string
  name: string
  phone: string
  email: string
  district: string
  address: string
  dateOfBirth: string
  gender: 'Nam' | 'Nữ'
  bloodType: string
  allergies: string
  conditions: string
  insuranceNumber: string
}

export interface SosEvent {
  id: string
  patientId: string | null
  bookingId: string | null
  sessionId: string | null
  triggeredBy: 'patient' | 'nurse'
  type: SosType
  contactIds: string[]
  note: string
  location: { lat: number; lng: number } | null
  createdAt: string
}

export interface AppNotification {
  id: string
  role: 'patient' | 'nurse' | 'hospital'
  targetId: string
  message: string
  createdAt: string
  read: boolean
  link?: string
}
