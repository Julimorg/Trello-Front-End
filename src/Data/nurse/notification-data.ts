import { minutesAgo } from '../patient/date-utils'
import type { AppNotification } from '../patient/types'

// Bell notifications for nurse-hoa; links open the request in "Ca chăm sóc mới".

const forHoa = (id: string, message: string, minutes: number, link: string, read = false): AppNotification => ({
  id,
  role: 'nurse',
  targetId: 'nurse-hoa',
  message,
  createdAt: minutesAgo(minutes),
  read,
  link,
})

export const NURSE_NOTIFICATIONS: AppNotification[] = [
  forHoa('ntf-6001', 'Lê Thị Liên đã chọn bạn cho ca Chăm sóc người cao tuổi. Phản hồi trong 15 phút.', 3, '/hospital/nurse/requests?id=cr-3001'),
  forHoa('ntf-6002', 'Phạm Văn Hạnh đã chọn bạn cho ca Hỗ trợ vận động.', 10, '/hospital/nurse/requests?id=cr-3002'),
  forHoa('ntf-6003', 'Bạn được đề xuất cho yêu cầu của Ngô Văn Tuấn tại Thủ Đức.', 21, '/hospital/nurse/requests?id=cr-3005'),
  forHoa('ntf-6004', 'Võ Thị Dung đã chọn bạn cho ca Chăm sóc người cao tuổi hằng ngày.', 94, '/hospital/nurse/requests?id=cr-3003', true),
  forHoa('ntf-6005', 'Bệnh viện đã phê duyệt lịch rảnh tuần này của bạn.', 2 * 24 * 60, '/hospital/nurse/schedule', true),
]
