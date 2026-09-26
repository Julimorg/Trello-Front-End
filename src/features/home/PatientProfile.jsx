import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getPatient, updatePatient } from '../../lib/db'
import { Icon } from '../../lib/icons'

export default function PatientProfile() {
  const { session } = useAuth()
  const toast = useToast()
  const state = useDb()
  const patient = getPatient(state, session.id)
  if (!patient) return null

  return (
    <>
      <PageHead
        eyebrow="CareShift"
        title="Hồ sơ bệnh nhân"
        description="Thông tin liên hệ và dữ liệu sức khỏe được chia sẻ theo từng ca."
        action={
          <button type="button" className="btn primary" onClick={() => toast('Đã lưu thay đổi', 'Thông tin hồ sơ của bạn đã được cập nhật.')}>
            Lưu thay đổi
          </button>
        }
      />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Thông tin chính</h2>
              <p>Cập nhật lần cuối hôm nay</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="field-grid">
              <label>
                <span className="field-label">Họ và tên</span>
                <input defaultValue={patient.name} onBlur={(e) => updatePatient(patient.id, { name: e.target.value })} />
              </label>
              <label>
                <span className="field-label">Số điện thoại</span>
                <input defaultValue={patient.phone} onBlur={(e) => updatePatient(patient.id, { phone: e.target.value })} />
              </label>
            </div>
            <div className="field-grid">
              <label>
                <span className="field-label">Địa chỉ</span>
                <input defaultValue={patient.address} onBlur={(e) => updatePatient(patient.id, { address: e.target.value })} />
              </label>
              <label>
                <span className="field-label">Trạng thái</span>
                <input defaultValue="Đang hoạt động" disabled />
              </label>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Bảo mật</h2>
              <p>Quyền truy cập dữ liệu</p>
            </div>
          </div>
          <div className="attention-list">
            <div className="attention-item">
              <span className="attention-icon">
                <Icon.shield />
              </span>
              <span>
                <b>Xác thực tài khoản</b>
                <small>Đã bật bảo vệ nâng cao</small>
              </span>
              <StatusBadge label="Đã bật" tone="success" />
            </div>
            <div className="attention-item">
              <span className="attention-icon">
                <Icon.file />
              </span>
              <span>
                <b>Nhật ký truy cập</b>
                <small>Xem ai đã dùng dữ liệu của bạn</small>
              </span>
              <Icon.chevron />
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
