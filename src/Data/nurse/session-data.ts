import type { CareTypeId } from '../patient/types'

// Data for the nurse session detail page (/hospital/nurse/sessions/:sessionId):
// the work checklist for one visit. A visit = opening steps + the care type's tasks
// + closing steps; ticked task ids are stored on the session (CareSession.checklist).

export interface CareTask {
  id: string
  label: string
  hint?: string
}

export const OPENING_TASKS: CareTask[] = [
  { id: 'open-checkin', label: 'Check-in tại nhà bệnh nhân', hint: 'Xác nhận đúng người bệnh, đúng địa chỉ' },
  { id: 'open-hygiene', label: 'Vệ sinh tay, mang găng/khẩu trang' },
  { id: 'open-vitals', label: 'Đo sinh hiệu đầu buổi', hint: 'Huyết áp, mạch, nhiệt độ, SpO₂' },
]

export const CLOSING_TASKS: CareTask[] = [
  { id: 'close-notes', label: 'Ghi chép diễn biến vào sổ theo dõi' },
  { id: 'close-family', label: 'Dặn dò người nhà / hẹn buổi tiếp theo' },
]

export const CARE_TASKS: Record<CareTypeId, CareTask[]> = {
  'wound-dressing': [
    { id: 'wd-assess', label: 'Đánh giá vết thương', hint: 'Kích thước, dịch tiết, dấu hiệu nhiễm trùng' },
    { id: 'wd-clean', label: 'Rửa vết thương bằng dung dịch vô khuẩn' },
    { id: 'wd-dress', label: 'Thay băng mới theo chỉ định' },
    { id: 'wd-photo', label: 'Chụp ảnh vết thương lưu hồ sơ (nếu bệnh nhân đồng ý)' },
  ],
  'vitals-monitoring': [
    { id: 'vm-bp', label: 'Đo huyết áp 2 lần, cách 5 phút' },
    { id: 'vm-glucose', label: 'Đo đường huyết mao mạch', hint: 'Nếu có chỉ định' },
    { id: 'vm-log', label: 'So sánh với các lần đo trước, báo bác sĩ nếu bất thường' },
  ],
  'mobility-support': [
    { id: 'ms-warmup', label: 'Khởi động khớp 10 phút' },
    { id: 'ms-walk', label: 'Tập đi có hỗ trợ (khung tập / gậy)' },
    { id: 'ms-balance', label: 'Bài tập thăng bằng & phòng té ngã' },
    { id: 'ms-home', label: 'Hướng dẫn bài tập tự tập tại nhà' },
  ],
  medication: [
    { id: 'md-check', label: 'Đối chiếu đơn thuốc và hộp thuốc' },
    { id: 'md-give', label: 'Hỗ trợ uống / dùng thuốc đúng giờ' },
    { id: 'md-side', label: 'Theo dõi tác dụng phụ sau dùng thuốc' },
  ],
  'post-surgery': [
    { id: 'ps-wound', label: 'Kiểm tra vết mổ, thay băng' },
    { id: 'ps-pain', label: 'Đánh giá mức độ đau (thang 0–10)' },
    { id: 'ps-drain', label: 'Theo dõi dẫn lưu / dấu hiệu sốt' },
    { id: 'ps-move', label: 'Hỗ trợ vận động nhẹ sau mổ' },
  ],
  'elderly-care': [
    { id: 'ec-hygiene', label: 'Hỗ trợ vệ sinh cá nhân' },
    { id: 'ec-meal', label: 'Hỗ trợ ăn uống, theo dõi lượng nước' },
    { id: 'ec-meds', label: 'Nhắc và hỗ trợ uống thuốc' },
    { id: 'ec-skin', label: 'Kiểm tra da, phòng loét tì đè' },
  ],
  other: [{ id: 'ot-task', label: 'Thực hiện công việc theo mô tả của bệnh nhân' }],
}

export function tasksFor(careType: CareTypeId): CareTask[] {
  return [...OPENING_TASKS, ...(CARE_TASKS[careType] || CARE_TASKS.other), ...CLOSING_TASKS]
}
