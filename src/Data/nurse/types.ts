// Shapes for the nurse-portal data files. Records reuse the shared entity types from
// Data/patient/types.ts so ids (patientId, nurseId, careRequestId, bookingId) link across portals.

export interface Education {
  degree: string
  school: string
  year: number
}

export interface WorkHistoryEntry {
  role: string
  place: string
  from: string
  to: string | null
  note?: string
}

export interface Skill {
  name: string
  /** 1–5 */
  level: number
}

export interface Training {
  id: string
  name: string
  provider: string
  date: string
  hours: number
}

export interface NurseProfileDetail {
  nurseId: string
  dateOfBirth: string
  gender: 'Nam' | 'Nữ'
  email: string
  address: string
  department: string
  licenseNumber: string
  licenseIssuedAt: string
  licenseExpiresAt: string
  licenseScope: string
  education: Education[]
  workHistory: WorkHistoryEntry[]
  languages: string[]
  skills: Skill[]
  trainings: Training[]
  equipment: string[]
  transport: string
  maxSessionsPerWeek: number
  acceptanceRate: number
  onTimeRate: number
}
