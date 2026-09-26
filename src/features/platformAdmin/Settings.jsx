import PageHead from '../../components/PageHead'
import { useToast } from '../../components/ToastProvider'
import { RECURRING_SESSION_COUNT } from '../../lib/constants'

export default function Settings() {
  const toast = useToast()

  return (
    <>
      <PageHead
        eyebrow="CareShift"
        title="Cấu hình hệ thống"
        description="Thiết lập bán kính matching, SLA phản hồi và danh mục dịch vụ."
        action={
          <button type="button" className="btn primary" onClick={() => toast('Đã lưu cấu hình', 'Thay đổi sẽ áp dụng cho các yêu cầu mới.')}>
            Lưu thay đổi
          </button>
        }
      />
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Thông số Nurse Matching</h2>
            <p>Áp dụng cho Stage 1 (rule-based, hard filter)</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="field-grid">
            <label>
              <span className="field-label">Số lượng gợi ý tối đa mỗi yêu cầu</span>
              <input defaultValue="5" />
            </label>
            <label>
              <span className="field-label">Thời gian phản hồi tối đa của điều dưỡng</span>
              <input defaultValue="15 phút" />
            </label>
          </div>
          <div className="field-grid">
            <label>
              <span className="field-label">Chạy lại matching sau (nếu chưa có kết quả)</span>
              <input defaultValue="60 phút" />
            </label>
            <label>
              <span className="field-label">Số buổi mặc định cho liệu trình định kỳ</span>
              <input defaultValue={`${RECURRING_SESSION_COUNT} buổi`} disabled />
            </label>
          </div>
        </div>
      </section>
    </>
  )
}
