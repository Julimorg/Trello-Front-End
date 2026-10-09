import { minutesAgo, timestampAt } from '../patient/date-utils'
import type { SupportTicket, TicketPriority, TicketStatus } from './types'

// Data for "Hỗ trợ khách hàng" (/admin/support): requests from patients, nurses and hospital
// admins. requesterId points at patient profiles, nurses or hospitals in the other data files.

export const TICKET_CATEGORIES = ['Đặt lịch & yêu cầu', 'Tài khoản & đăng nhập', 'Điều dưỡng', 'Cảnh báo SOS', 'Lỗi kỹ thuật', 'Góp ý'] as const

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Mới', color: 'red' },
  in_progress: { label: 'Đang xử lý', color: 'blue' },
  waiting: { label: 'Chờ phản hồi', color: 'orange' },
  resolved: { label: 'Đã giải quyết', color: 'green' },
}

export const TICKET_PRIORITY_META: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Thấp', color: 'default' },
  normal: { label: 'Bình thường', color: 'blue' },
  high: { label: 'Cao', color: 'orange' },
  urgent: { label: 'Khẩn', color: 'red' },
}

const msg = (id: string, from: 'requester' | 'admin', author: string, text: string, at: string) => ({ id, from, author, text, at })

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tk-1001',
    subject: 'Không nhận được thông báo khi điều dưỡng chấp nhận',
    category: 'Lỗi kỹ thuật',
    priority: 'high',
    status: 'open',
    requesterRole: 'patient',
    requesterId: 'patient-an',
    requesterName: 'Nguyễn Văn An',
    assignee: null,
    createdAt: minutesAgo(95),
    updatedAt: minutesAgo(95),
    messages: [msg('m1', 'requester', 'Nguyễn Văn An', 'Hôm qua điều dưỡng đã nhận ca nhưng tôi không thấy thông báo nào trên điện thoại, phải vào lịch mới biết.', minutesAgo(95))],
  },
  {
    id: 'tk-1002',
    subject: 'Muốn đổi số điện thoại đăng nhập',
    category: 'Tài khoản & đăng nhập',
    priority: 'normal',
    status: 'in_progress',
    requesterRole: 'patient',
    requesterId: 'patient-thu',
    requesterName: 'Trần Thị Thu',
    assignee: 'Linh Phạm',
    createdAt: timestampAt(-1, '09:10'),
    updatedAt: timestampAt(-1, '10:25'),
    messages: [
      msg('m1', 'requester', 'Trần Thị Thu', 'Tôi đổi số điện thoại mới, làm sao cập nhật tài khoản?', timestampAt(-1, '09:10')),
      msg('m2', 'admin', 'Linh Phạm', 'Chào chị, em đã nhận yêu cầu. Chị gửi giúp em ảnh CCCD mặt trước để xác minh trước khi đổi số nhé.', timestampAt(-1, '10:25')),
    ],
  },
  {
    id: 'tk-1003',
    subject: 'Điều dưỡng báo trùng lịch trực nhưng vẫn bị giao ca',
    category: 'Điều dưỡng',
    priority: 'high',
    status: 'waiting',
    requesterRole: 'hospital',
    requesterId: 'hosp-115',
    requesterName: 'Bệnh viện Nhân Dân 115',
    assignee: 'Linh Phạm',
    createdAt: timestampAt(-2, '14:00'),
    updatedAt: timestampAt(-2, '15:40'),
    messages: [
      msg('m1', 'requester', 'Bệnh viện Nhân Dân 115', 'Điều dưỡng Đặng Hữu Phúc có lịch trực đêm nhưng hệ thống vẫn giao ca 16:00 ngày mai. Nhờ CareShift kiểm tra bộ lọc lịch rảnh.', timestampAt(-2, '14:00')),
      msg('m2', 'admin', 'Linh Phạm', 'Đã ghi nhận. Bên em đang kiểm tra cách tính lịch rảnh với ca trực. Anh chị cập nhật lại khung giờ rảnh của điều dưỡng trong hồ sơ giúp em.', timestampAt(-2, '15:40')),
    ],
  },
  {
    id: 'tk-1004',
    subject: 'Nút SOS bấm nhưng người thân không nhận được tin',
    category: 'Cảnh báo SOS',
    priority: 'urgent',
    status: 'in_progress',
    requesterRole: 'patient',
    requesterId: 'patient-lien',
    requesterName: 'Lê Thị Liên',
    assignee: 'Linh Phạm',
    createdAt: minutesAgo(40),
    updatedAt: minutesAgo(22),
    messages: [
      msg('m1', 'requester', 'Lê Thị Liên', 'Con gái tôi nói không nhận được cảnh báo khi tôi bấm SOS thử. Tôi rất lo.', minutesAgo(40)),
      msg('m2', 'admin', 'Linh Phạm', 'Chào bác, em đang kiểm tra ngay. Bác cho em xin tên người thân đã liên kết để em đối chiếu quyền nhận cảnh báo ạ.', minutesAgo(22)),
    ],
  },
  {
    id: 'tk-1005',
    subject: 'Gợi ý: cho phép chọn nhiều ngày khác nhau trong một yêu cầu',
    category: 'Góp ý',
    priority: 'low',
    status: 'open',
    requesterRole: 'patient',
    requesterId: 'patient-hanh',
    requesterName: 'Phạm Văn Hạnh',
    assignee: null,
    createdAt: timestampAt(-3, '20:15'),
    updatedAt: timestampAt(-3, '20:15'),
    messages: [msg('m1', 'requester', 'Phạm Văn Hạnh', 'Có lúc tôi cần thay băng vào thứ 2 và thứ 6 nhưng giờ khác nhau. Mong app cho đặt từng ngày riêng.', timestampAt(-3, '20:15'))],
  },
  {
    id: 'tk-1006',
    subject: 'Không tải được chứng chỉ PDF lên hồ sơ',
    category: 'Lỗi kỹ thuật',
    priority: 'normal',
    status: 'resolved',
    requesterRole: 'nurse',
    requesterId: 'nurse-hoa',
    requesterName: 'Trần Thị Hoa',
    assignee: 'Linh Phạm',
    createdAt: timestampAt(-6, '08:30'),
    updatedAt: timestampAt(-5, '09:00'),
    messages: [
      msg('m1', 'requester', 'Trần Thị Hoa', 'Tôi tải file PDF 6MB lên báo lỗi.', timestampAt(-6, '08:30')),
      msg('m2', 'admin', 'Linh Phạm', 'Hiện hệ thống chỉ nhận file dưới 5MB. Chị nén lại file hoặc chụp ảnh từng trang giúp em nhé.', timestampAt(-6, '09:05')),
      msg('m3', 'requester', 'Trần Thị Hoa', 'Em nén lại rồi, tải được rồi ạ. Cảm ơn.', timestampAt(-5, '08:50')),
      msg('m4', 'admin', 'Linh Phạm', 'Cảm ơn chị đã phản hồi, em đóng yêu cầu này.', timestampAt(-5, '09:00')),
    ],
  },
]
