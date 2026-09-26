import { useState } from 'react'
import Modal, { ModalCloseButton } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { addFamilyContact } from '../../lib/db'

const RELATIONS = ['Vợ / Chồng', 'Con', 'Cha / Mẹ', 'Anh / Chị / Em', 'Người giám hộ', 'Khác']

const initialForm = { name: '', relationship: RELATIONS[1], contact: '', emergency: true, schedule: true, status: false, primary: false }

export default function FamilyLinkModal({ open, onClose, patientId }) {
  const toast = useToast()
  const [form, setForm] = useState(initialForm)

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))
  const canSubmit = form.name.trim() && form.contact.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const permissions = []
    if (form.emergency) permissions.push('Nhận cảnh báo SOS')
    if (form.schedule) permissions.push('Xem lịch chăm sóc')
    if (form.status) permissions.push('Xem trạng thái yêu cầu')
    addFamilyContact(patientId, {
      name: form.name.trim(),
      relation: form.relationship,
      phone: form.contact.trim(),
      status: 'Chờ xác nhận',
      primary: form.primary,
      permissions,
    })
    toast('Đã tạo lời mời liên kết', `${form.name} cần xác nhận trước khi nhận cảnh báo SOS.`)
    setForm(initialForm)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} className="compact family-link-modal" labelledBy="familyLinkTitle">
      <div className="modal-head">
        <div>
          <span className="eyebrow">Tài khoản người thân</span>
          <h2 id="familyLinkTitle">Liên kết người thân</h2>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <p className="modal-intro">CareShift sẽ gửi lời mời xác nhận tới tài khoản của người thân trước khi chia sẻ thông tin.</p>
      <form onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            <span className="field-label">Họ và tên</span>
            <input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Nguyễn Thị Lan" required />
          </label>
          <label>
            <span className="field-label">Mối quan hệ</span>
            <select value={form.relationship} onChange={(e) => update({ relationship: e.target.value })}>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className="field-label">Số điện thoại hoặc email tài khoản CareShift</span>
          <input value={form.contact} onChange={(e) => update({ contact: e.target.value })} placeholder="090 123 4567 hoặc email@example.com" required />
        </label>
        <fieldset className="permission-box">
          <legend>Quyền chia sẻ</legend>
          <label>
            <input type="checkbox" checked={form.emergency} onChange={(e) => update({ emergency: e.target.checked })} />
            <span>
              <b>Nhận cảnh báo SOS</b>
              <small>Vị trí và thông tin ca đang diễn ra</small>
            </span>
          </label>
          <label>
            <input type="checkbox" checked={form.schedule} onChange={(e) => update({ schedule: e.target.checked })} />
            <span>
              <b>Xem lịch chăm sóc</b>
              <small>Lịch đã xác nhận và thay đổi quan trọng</small>
            </span>
          </label>
          <label>
            <input type="checkbox" checked={form.status} onChange={(e) => update({ status: e.target.checked })} />
            <span>
              <b>Xem trạng thái yêu cầu</b>
              <small>Tiến độ matching và xác nhận điều dưỡng</small>
            </span>
          </label>
        </fieldset>
        <label className="consent">
          <input type="checkbox" checked={form.primary} onChange={(e) => update({ primary: e.target.checked })} />
          <span>Đặt làm người liên hệ khẩn cấp ưu tiên (sau khi được xác nhận).</span>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn primary" disabled={!canSubmit}>
            Gửi lời mời liên kết
          </button>
        </div>
      </form>
    </Modal>
  )
}
