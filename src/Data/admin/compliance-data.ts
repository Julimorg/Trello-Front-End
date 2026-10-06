import { minutesAgo, timestampAt } from '../patient/date-utils'

// Data for "Tuân thủ & chính sách" (/admin/compliance): reports raised against nurses or
// hospitals. subjectId points at Data/patient/nurse-data.ts or the hospitals in lib/seed.js;
// reporterId at a patient profile / hospital; bookingId at a booking when it is about a visit.

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'
export type ReportSeverity = 'low' | 'medium' | 'high'

export interface ComplianceReport {
  id: string
  subjectType: 'nurse' | 'hospital'
  subjectId: string
  reporterRole: 'patient' | 'family' | 'hospital' | 'system'
  reporterId: string | null
  category: string
  title: string
  description: string
  severity: ReportSeverity
  status: ReportStatus
  bookingId?: string
  createdAt: string
  updatedAt?: string
  resolution?: string
}

export const REPORT_CATEGORIES = ['Đúng giờ', 'Thái độ phục vụ', 'Chuyên môn', 'Quyền riêng tư', 'Hồ sơ & chứng chỉ', 'Điều phối'] as const

export const COMPLIANCE_REPORTS: ComplianceReport[] = [
  {
    id: 'rp-1001',
    subjectType: 'nurse',
    subjectId: 'nurse-thao',
    reporterRole: 'family',
    reporterId: 'patient-an',
    category: 'Quyền riêng tư',
    title: 'Chia sẻ ảnh vết thương qua Zalo cá nhân',
    description: 'Người nhà phản ánh điều dưỡng gửi ảnh vết thương của bệnh nhân vào nhóm Zalo cá nhân thay vì lưu trên hồ sơ CareShift.',
    severity: 'high',
    status: 'investigating',
    bookingId: 'bk-2002',
    createdAt: timestampAt(-3, '20:15'),
    updatedAt: timestampAt(-2, '09:00'),
  },
  {
    id: 'rp-1002',
    subjectType: 'nurse',
    subjectId: 'nurse-khoa',
    reporterRole: 'system',
    reporterId: null,
    category: 'Hồ sơ & chứng chỉ',
    title: 'Chứng chỉ hành nghề đã hết hạn',
    description: 'Chứng chỉ DD-2015-00088 hết hạn ngày 15/03/2025 nhưng điều dưỡng vẫn ở trạng thái được cấp phép.',
    severity: 'high',
    status: 'open',
    createdAt: minutesAgo(60 * 26),
  },
  {
    id: 'rp-1003',
    subjectType: 'nurse',
    subjectId: 'nurse-quoc',
    reporterRole: 'patient',
    reporterId: 'patient-an',
    category: 'Đúng giờ',
    title: 'Đến trễ 40 phút, không báo trước',
    description: 'Buổi thay băng được đổi sang điều dưỡng Quốc; điều dưỡng đến trễ 40 phút và không gọi báo.',
    severity: 'medium',
    status: 'resolved',
    bookingId: 'bk-2001',
    createdAt: timestampAt(-54, '19:50'),
    updatedAt: timestampAt(-52, '10:00'),
    resolution: 'Bệnh viện đã nhắc nhở; điều dưỡng cam kết báo trước khi có thay đổi. Đóng sau khi trao đổi với bệnh nhân.',
  },
  {
    id: 'rp-1004',
    subjectType: 'nurse',
    subjectId: 'nurse-phuc',
    reporterRole: 'patient',
    reporterId: 'patient-an',
    category: 'Điều phối',
    title: 'Báo hủy ca sát giờ',
    description: 'Điều dưỡng báo không thể thực hiện buổi tập 1 ngày trước giờ hẹn, chưa có người thay thế.',
    severity: 'medium',
    status: 'open',
    bookingId: 'bk-2006',
    createdAt: timestampAt(-1, '22:05'),
  },
  {
    id: 'rp-1005',
    subjectType: 'hospital',
    subjectId: 'hosp-tdh',
    reporterRole: 'patient',
    reporterId: 'patient-hanh',
    category: 'Điều phối',
    title: 'Chậm hỗ trợ đổi điều dưỡng',
    description: 'Bệnh nhân yêu cầu đổi điều dưỡng nhưng bệnh viện chưa phản hồi sau 24 giờ.',
    severity: 'medium',
    status: 'open',
    createdAt: timestampAt(-2, '08:30'),
  },
  {
    id: 'rp-1006',
    subjectType: 'nurse',
    subjectId: 'nurse-yen',
    reporterRole: 'hospital',
    reporterId: 'hosp-ydvn',
    category: 'Hồ sơ & chứng chỉ',
    title: 'Thông tin chứng chỉ không khớp hồ sơ gốc',
    description: 'Số chứng chỉ khai báo không khớp với bản gốc tại Sở Y tế khi đối chiếu định kỳ.',
    severity: 'high',
    status: 'resolved',
    createdAt: timestampAt(-30, '11:00'),
    updatedAt: timestampAt(-28, '15:00'),
    resolution: 'Đã tạm ngưng tài khoản điều dưỡng cho đến khi bổ sung hồ sơ hợp lệ.',
  },
  {
    id: 'rp-1007',
    subjectType: 'nurse',
    subjectId: 'nurse-hoa',
    reporterRole: 'patient',
    reporterId: 'patient-dung',
    category: 'Thái độ phục vụ',
    title: 'Nói chuyện điện thoại riêng trong ca',
    description: 'Người nhà phản ánh điều dưỡng nghe điện thoại riêng khoảng 10 phút trong buổi chăm sóc.',
    severity: 'low',
    status: 'dismissed',
    bookingId: 'bk-3103',
    createdAt: timestampAt(-9, '19:10'),
    updatedAt: timestampAt(-8, '09:30'),
    resolution: 'Điều dưỡng đang gọi bác sĩ để hỏi về chỉ số huyết áp; đã giải thích với gia đình.',
  },
]
