import { minutesAgo, timestampAt } from '../patient/date-utils'
import type { PatientAccount } from './types'

// Data for "Tài khoản người dùng" (/admin/accounts and /admin/accounts/:id): platform-level
// account state of each patient profile in Data/patient/profile-data.ts. Suspended / locked
// patients cannot sign in.

export const PATIENT_ACCOUNTS: Record<string, PatientAccount> = {
  'patient-an': { status: 'active', joinedAt: '2026-06-03T10:20:00.000Z', lastActiveAt: minutesAgo(9), verified: true, verifiedBy: 'eKYC CCCD' },
  'patient-thu': { status: 'active', joinedAt: '2026-06-20T08:45:00.000Z', lastActiveAt: timestampAt(-3, '20:10'), verified: true, verifiedBy: 'eKYC CCCD' },
  'patient-lien': { status: 'active', joinedAt: '2026-08-25T09:00:00.000Z', lastActiveAt: minutesAgo(4), verified: true, verifiedBy: 'Bệnh viện xác nhận' },
  'patient-hanh': { status: 'active', joinedAt: '2026-09-01T14:30:00.000Z', lastActiveAt: minutesAgo(11), verified: true, verifiedBy: 'eKYC CCCD' },
  'patient-dung': { status: 'active', joinedAt: '2026-09-10T16:00:00.000Z', lastActiveAt: timestampAt(-1, '21:15'), verified: false, verifiedBy: null },
  'patient-khanh': {
    status: 'suspended',
    statusReason: 'Hai tài khoản trùng số CCCD — tạm ngưng chờ xác minh danh tính.',
    joinedAt: '2026-09-18T11:00:00.000Z',
    lastActiveAt: timestampAt(-1, '19:30'),
    verified: false,
    verifiedBy: null,
  },
  'patient-tuan': { status: 'active', joinedAt: '2026-09-28T07:40:00.000Z', lastActiveAt: timestampAt(-3, '09:20'), verified: true, verifiedBy: 'Bệnh viện xác nhận' },
}

export const ACCOUNT_STATUS_META = {
  active: { label: 'Hoạt động', color: 'green' },
  suspended: { label: 'Tạm ngưng', color: 'orange' },
  locked: { label: 'Khóa', color: 'red' },
} as const
