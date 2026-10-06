import type { SystemSettings } from './types'

// Data for "Cấu hình hệ thống" (/admin/settings). matchLimit → Nurse Matching,
// responseWindowMinutes → nurse response countdown, sosEscalationMinutes → overdue SOS on the
// admin dashboard, contractWarningDays → "sắp hết hạn" contracts, maintenance → banner for users.

export const DEFAULT_SETTINGS: SystemSettings = {
  matchLimit: 5,
  responseWindowMinutes: 15,
  sosEscalationMinutes: 10,
  contractWarningDays: 60,
  maintenanceMode: false,
  maintenanceMessage: 'CareShift đang bảo trì, vui lòng quay lại sau ít phút.',
}
