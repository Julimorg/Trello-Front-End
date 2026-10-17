// One-line hints shown under each demo persona on the login page, so a tester knows which
// account to pick for which scenario. Keys are patient / hospital / nurse ids from the seed data.

export const DEMO_HINTS: Record<string, string> = {
  // Patients
  'patient-an': 'Tài khoản chính: có ca hôm nay, lịch sử có chỉ số, yêu cầu đang chờ điều dưỡng, yêu cầu chưa tìm được điều dưỡng, lời mời người thân',
  'patient-thu': 'Đang chờ chọn điều dưỡng cho một yêu cầu; vừa gửi lời mời liên kết người thân cho Nguyễn Văn An',
  'patient-lien': 'Đang có cảnh báo SOS chưa xử lý từ điều dưỡng; chăm sóc người cao tuổi',
  'patient-khanh': 'Tài khoản đang bị tạm ngưng (xem Admin CareShift)',
  // Hospital admins
  'hosp-115': 'Có SOS chưa xử lý, ca cần đổi điều dưỡng, hồ sơ chờ cấp phép, chứng chỉ sắp hết hạn',
  'hosp-gd': 'Bệnh viện đang bị tạm ngưng nhận ca mới',
  'hosp-tn': 'Hợp đồng hết hạn — tài khoản bị khóa',
  // Nurses
  'nurse-hoa': 'Tài khoản chính: 4 yêu cầu chờ phản hồi, ca hôm nay (5 ca), lịch 1 tháng',
  'nurse-mai': 'Đang chăm sóc hậu phẫu cho Nguyễn Văn An; chứng chỉ sắp hết hạn',
  'nurse-khoa': 'Chứng chỉ hành nghề đã hết hạn',
  'nurse-yen': 'Đang bị bệnh viện tạm ngưng',
  'nurse-nhi': 'Hồ sơ đủ, chờ bệnh viện cấp phép',
  'nurse-binh': 'Hồ sơ nháp (chưa có chứng chỉ, lịch tham gia)',
}
