import { timestampAt } from '../patient/date-utils'
import type { AuditLogEntry } from './types'

// Data for "Nhật ký hoạt động" (/admin/audit): who changed what on the platform.
// targetId points at hospitals, nurses, patients or reports from the other data files.

export const AUDIT_LOGS: AuditLogEntry[] = [
  { id: 'au-0001', at: '2026-05-28T10:06:00.000Z', actor: 'Linh Phạm', action: 'Ký hợp đồng', targetType: 'hospital', targetId: 'hosp-115', targetName: 'Bệnh viện Nhân Dân 115', detail: 'HĐ-CS-2026-001 — chữ ký số VNPT-CA hai bên' },
  { id: 'au-0002', at: '2026-08-05T11:31:00.000Z', actor: 'Linh Phạm', action: 'Ký hợp đồng', targetType: 'hospital', targetId: 'hosp-gd', targetName: 'Bệnh viện Nhân dân Gia Định', detail: 'HĐ-CS-2026-004' },
  { id: 'au-0003', at: '2026-09-25T09:00:00.000Z', actor: 'Linh Phạm', action: 'Đổi trạng thái → Tạm ngưng', targetType: 'hospital', targetId: 'hosp-gd', targetName: 'Bệnh viện Nhân dân Gia Định', detail: 'Bổ sung hồ sơ điều dưỡng theo phụ lục hợp đồng' },
  { id: 'au-0004', at: '2026-09-30T08:00:00.000Z', actor: 'Hệ thống', action: 'Đổi trạng thái → Khóa', targetType: 'hospital', targetId: 'hosp-tn', targetName: 'Bệnh viện Thống Nhất', detail: 'Hợp đồng thí điểm hết hạn' },
  { id: 'au-0005', at: timestampAt(-2, '09:00'), actor: 'Linh Phạm', action: 'Xem xét báo cáo', targetType: 'report', targetId: 'rp-1001', targetName: 'Chia sẻ ảnh vết thương qua Zalo cá nhân' },
  { id: 'au-0006', at: timestampAt(-1, '19:45'), actor: 'Linh Phạm', action: 'Đổi trạng thái → Tạm ngưng', targetType: 'patient', targetId: 'patient-khanh', targetName: 'Đỗ Minh Khánh', detail: 'Hai tài khoản trùng số CCCD' },
]

export const AUDIT_TARGET_LABEL: Record<AuditLogEntry['targetType'], string> = {
  hospital: 'Bệnh viện',
  nurse: 'Điều dưỡng',
  patient: 'Bệnh nhân',
  report: 'Báo cáo',
  broadcast: 'Thông báo',
  settings: 'Cấu hình',
  staff: 'Nhân sự bệnh viện',
}
