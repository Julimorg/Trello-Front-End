// Shapes for the platform-admin data files. Hospital ids are referenced by nurses
// (Data/patient/nurse-data.ts), SOS events and compliance reports.

export type PartnerStatus = 'active' | 'suspended' | 'locked'
export type AccountStatus = 'active' | 'suspended' | 'locked'

export interface DigitalSignature {
  party: 'hospital' | 'careshift'
  name: string
  title: string
  signedAt: string
  /** Certificate of the digital signature (chữ ký số). */
  certificate: { issuer: string; serial: string; validTo: string }
}

export interface PartnerContract {
  number: string
  signedAt: string
  startDate: string
  endDate: string
  scope: string[]
  file: { name: string; url: string; size: number }
  signatures: DigitalSignature[]
}

export interface Branch {
  id: string
  name: string
  address: string
  district: string
  phone: string
  manager: string
}

export interface HospitalStaff {
  id: string
  name: string
  role: string
  email: string
  phone: string
  status: AccountStatus
}

export interface PartnerHospital {
  id: string
  name: string
  address: string
  district: string
  region: string
  phone: string
  email: string
  website: string
  type: 'Công lập' | 'Tư nhân'
  licenseNumber: string
  taxCode: string
  beds: number
  status: PartnerStatus
  statusReason?: string
  statusChangedAt?: string
  createdAt: string
  representative: { name: string; title: string; phone: string; email: string }
  contract: PartnerContract
  branches: Branch[]
  staff: HospitalStaff[]
}

export interface PatientAccount {
  status: AccountStatus
  statusReason?: string
  joinedAt: string
  lastActiveAt: string
  verified: boolean
  verifiedBy: 'eKYC CCCD' | 'Bệnh viện xác nhận' | null
}

export interface AuditLogEntry {
  id: string
  at: string
  actor: string
  action: string
  targetType: 'hospital' | 'nurse' | 'patient' | 'report' | 'broadcast' | 'settings' | 'staff' | 'request' | 'sos' | 'ticket' | 'data'
  targetId: string | null
  targetName: string
  detail?: string
}

export interface Broadcast {
  id: string
  title: string
  message: string
  audience: 'all' | 'patients' | 'nurses' | 'hospitals'
  hospitalId: string | null
  sentAt: string
  sentBy: string
  recipients: number
}

export interface SystemSettings {
  matchLimit: number
  responseWindowMinutes: number
  sosEscalationMinutes: number
  contractWarningDays: number
  maintenanceMode: boolean
  maintenanceMessage: string
  /** Hours within which a support ticket should get its first reply. */
  supportSlaHours: number
  /** Districts patients can currently request care in (rollout area). */
  openDistricts: string[]
  /** Care types temporarily not offered ('other' is always available). */
  disabledCareTypes: string[]
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TicketMessage {
  id: string
  from: 'requester' | 'admin'
  author: string
  text: string
  at: string
}

/** A support request raised by a patient, nurse or hospital admin ("Hỗ trợ khách hàng"). */
export interface SupportTicket {
  id: string
  subject: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  requesterRole: 'patient' | 'nurse' | 'hospital'
  requesterId: string
  requesterName: string
  assignee: string | null
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}
