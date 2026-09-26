import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal, { ModalCloseButton } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { addCertificate, addNurse } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, NURSE_RANKS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

const initialForm = {
  name: '',
  rank: NURSE_RANKS[0],
  phone: '',
  experienceYears: '',
  specialties: [],
  serviceAreas: [],
  license: '',
}

export default function NurseAddModal({ open, onClose, hospitalId }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)

  const toggle = (key, value) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }))

  const canSubmit = form.name.trim() && form.phone.trim() && form.specialties.length > 0 && form.serviceAreas.length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const id = addNurse(hospitalId, form)
    if (form.license.trim()) {
      addCertificate(id, { name: 'Chứng chỉ hành nghề Điều dưỡng', number: form.license.trim(), issuedBy: 'Sở Y tế' })
    }
    toast('Đã lưu hồ sơ điều dưỡng', 'Hồ sơ đang chờ bệnh viện xác minh văn bằng và chứng chỉ.')
    setForm(initialForm)
    onClose()
    navigate(`/hospital/admin/roster/${id}`)
  }

  return (
    <Modal open={open} onClose={onClose} className="compact" labelledBy="addNurseTitle">
      <div className="modal-head">
        <div>
          <span className="eyebrow">Hospital roster</span>
          <h2 id="addNurseTitle">Thêm điều dưỡng</h2>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            <span className="field-label">Họ và tên</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" required />
          </label>
          <label>
            <span className="field-label">Số điện thoại</span>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="090 123 4567" required />
          </label>
        </div>
        <div className="field-grid">
          <label>
            <span className="field-label">Cấp bậc</span>
            <select value={form.rank} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}>
              {NURSE_RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">Số năm kinh nghiệm</span>
            <input type="number" min="0" value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))} />
          </label>
        </div>

        <span className="field-label">Chuyên môn</span>
        <div className="chip-row" style={{ marginBottom: 15 }}>
          {CARE_TYPES.filter((c) => c.id !== 'other').map((c) => (
            <button key={c.id} type="button" className={`chip-select${form.specialties.includes(c.id) ? ' selected' : ''}`} onClick={() => toggle('specialties', c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <span className="field-label">Khu vực</span>
        <div className="chip-row" style={{ marginBottom: 15 }}>
          {DISTRICTS.map((d) => (
            <button key={d} type="button" className={`chip-select${form.serviceAreas.includes(d) ? ' selected' : ''}`} onClick={() => toggle('serviceAreas', d)}>
              {d}
            </button>
          ))}
        </div>

        <label>
          <span className="field-label">Số chứng chỉ hành nghề (không bắt buộc)</span>
          <input value={form.license} onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))} placeholder="VD: 004921/HCM-CCHN" />
        </label>
        <div className="upload-zone">
          <Icon.upload />
          <b>Tải văn bằng &amp; chứng chỉ</b>
          <small>PDF, JPG hoặc PNG — tối đa 10 MB</small>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn primary" disabled={!canSubmit}>
            Lưu hồ sơ
          </button>
        </div>
      </form>
    </Modal>
  )
}
