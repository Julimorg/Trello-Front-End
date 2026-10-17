# CareShift — kịch bản demo cho stakeholder

Dữ liệu mẫu tính theo **ngày hôm nay**, nên lúc nào mở cũng có lịch quá khứ, ca hôm nay và lịch sắp tới.
Muốn quay lại dữ liệu ban đầu: màn hình đăng nhập → **Đặt lại dữ liệu demo** (đặt lại cho mọi thiết bị đang kết nối).
Mở hai cửa sổ (bệnh nhân + điều dưỡng) để thấy đồng bộ thời gian thực.

Mỗi tài khoản trên màn hình đăng nhập có dòng gợi ý màu xanh cho biết nên chọn tài khoản nào cho kịch bản nào.

## 1. Bệnh nhân — Nguyễn Văn An (tài khoản chính)
| Việc thử | Ở đâu | Kết quả mong đợi |
|---|---|---|
| Xem ca hôm nay | Lịch chăm sóc | Ca hậu phẫu 18:00 với Nguyễn Thị Mai; mở chi tiết để xem quy trình, tiến triển (huyết áp, mức đau giảm dần) |
| Xem lịch sử tiến triển | Lịch chăm sóc → liệu trình đã hoàn thành → tab Tiến triển | Biểu đồ chỉ số qua các buổi, đánh giá chung |
| Tạo yêu cầu mới | Yêu cầu chăm sóc → Tạo yêu cầu (Bình Thạnh, buổi tối) | Có 3–5 điều dưỡng phù hợp; điều dưỡng "đáng tin cậy" được xếp trước |
| Khi chưa có điều dưỡng | Yêu cầu #cr-1011 (Quận 7, hỗ trợ dùng thuốc) | Hiển thị điều dưỡng thay thế gần nhất kèm lý do |
| Báo trùng lịch | Tạo yêu cầu 18:00–19:00 hôm nay/ngày mai | Cảnh báo trùng ca và nút hủy buổi trùng |
| Hủy buổi | Chi tiết lịch → Hủy buổi | Buổi bị xóa, điều dưỡng và bệnh viện nhận thông báo |
| Người thân | Người thân liên kết | Lời mời của **Trần Thị Thu** chờ chấp nhận; SOS báo người thân ưu tiên |
| Điều dưỡng tin cậy | Điều dưỡng tin cậy | Mai, Thảo đã được đánh dấu; thử "Chọn thành điều dưỡng đáng tin cậy" |

**Trần Thị Thu**: yêu cầu đang ở bước "chọn điều dưỡng" (Đỗ Minh Tâm) và đã gửi lời mời liên kết cho An.

## 2. Điều dưỡng — Trần Thị Hoa (BV Nhân Dân 115)
| Việc thử | Ở đâu | Kết quả mong đợi |
|---|---|---|
| Nhận ca | Ca chăm sóc mới → tab Chờ phản hồi (4 yêu cầu) | Một chạm "Nhận ca" là xong; bệnh nhân nhận thông báo ngay |
| Từ chối ca | Từ chối → chọn lý do | Yêu cầu chuyển cho điều dưỡng kế tiếp |
| Ca hôm nay | Lịch làm việc | 5 ca hôm nay (07:30, 10:00, 14:00, 17:00, 19:00) |
| Làm việc trong buổi | Mở ca hôm nay | Tick công việc, nhập chỉ số, "Hoàn thành buổi" |
| Ca chưa tới ngày | Mở ca ngày mai | Chỉ xem, công việc bị khóa tới ngày thực hiện |
| Bộ lọc | Ca chăm sóc mới | Lọc, vào chi tiết rồi bấm Back — bộ lọc được giữ nguyên |
| SOS | Nút SOS kéo thả được | Báo bệnh viện / người thân của bệnh nhân đang chăm sóc |

Điều dưỡng khác: **Nguyễn Thị Mai** (chứng chỉ sắp hết hạn), **Hoàng Đăng Khoa** (chứng chỉ đã hết hạn), **Vũ Thị Yến** (đang bị tạm ngưng).

## 3. Admin bệnh viện — BV Nhân Dân 115
| Việc thử | Ở đâu | Kết quả mong đợi |
|---|---|---|
| Tổng quan việc cần xử lý | Tổng quan | 2 SOS chưa xử lý, 1 ca cần người thay, 2 hồ sơ chờ cấp phép, 1 chứng chỉ sắp hết hạn |
| Xử lý SOS | Cảnh báo SOS | Xem ghi chú, người thân của bệnh nhân, địa chỉ; Tiếp nhận → Đã xử lý (điều dưỡng được thông báo) |
| Đổi điều dưỡng | Yêu cầu & điều phối lịch | Khung "Ca cần đổi điều dưỡng" → chọn người thay → Xác nhận |
| Xem tải lịch | Yêu cầu & điều phối lịch | Lịch tuần theo số ca/giờ; bấm ô hoặc ngày để mở danh sách ca; bấm "Xem chi tiết" |
| Cấp phép điều dưỡng | Danh sách điều dưỡng → **Đoàn Ngọc Nhi** | Hồ sơ đủ → bấm "Cấp phép" |
| Hoàn tất hồ sơ nháp | Danh sách điều dưỡng → **Lê Văn Bình** | "Bản nháp": bổ sung chứng chỉ + lịch tham gia rồi "Cập nhật" |
| Thêm điều dưỡng | Thêm điều dưỡng | Trang riêng, mọi trường bắt buộc; "Lưu nháp" khi chưa đủ |

## 4. Admin CareShift (toàn hệ thống)
| Việc thử | Ở đâu |
|---|---|
| Hợp đồng bệnh viện: còn hiệu lực / sắp hết hạn / tạm ngưng / bị khóa | Bệnh viện đối tác |
| Chứng chỉ điều dưỡng sắp hết hạn, đã hết hạn | Điều dưỡng |
| Tài khoản bệnh nhân bị tạm ngưng (Đỗ Minh Khánh) | Tài khoản người dùng |
| Hàng đợi vận hành (SOS quá hạn, yêu cầu chờ lâu) | Trung tâm vận hành |
| Phiếu hỗ trợ, báo cáo tuân thủ, nhật ký hoạt động | Hỗ trợ khách hàng / Tuân thủ / Nhật ký |
| Thông báo hệ thống, cấu hình khu vực & loại ca | Thông báo hệ thống / Cấu hình |
