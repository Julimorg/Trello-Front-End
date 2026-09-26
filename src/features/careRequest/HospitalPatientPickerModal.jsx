import { useState } from 'react'
import Modal, { ModalCloseButton } from '../../components/Modal'
import { addPatient } from '../../lib/db'
import { useDb } from '../../lib/store'
import { DISTRICTS } from '../../lib/constants'

export default function HospitalPatientPickerModal({ open, onClose, onPicked }) {
  const state = useDb()
  const [mode, setMode] = useState('existing')
  const [patientId, setPatientId] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', district: DISTRICTS[0], address: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'existing') {
      if (!patientId) return
      onPicked(patientId)
      return
    }
    if (!form.name.trim() || !form.phone.trim()) return
    const id = addPatient(form)
    onPicked(id)
  }

  return (
    <Modal open={open} onClose={onClose} className="compact" labelledBy="patientPickerTitle">
      <div className="modal-head">
        <div>
          <span className="eyebrow">Care requests</span>
          <h2 id="patientPickerTitle">Tạo yêu cầu thay bệnh nhân</h2>
        </div>
        <ModalCloseButton onClose={onClose} />
      </div>
      <div className="role-tab-row">
        <button type="button" className={`role-tab${mode === 'existing' ? ' active' : ''}`} onClick={() => setMode('existing')}>
          Bệnh nhân đã có
        </button>
        <button type="button" className={`role-tab${mode === 'new' ? ' active' : ''}`} onClick={() => setMode('new')}>
          Bệnh nhân mới
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {mode === 'existing' ? (
          <label>
            <span className="field-label">Chọn bệnh nhân</span>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="" disabled>
                — Chọn bệnh nhân —
              </option>
              {state.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.district}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <div className="field-grid">
              <label>
                <span className="field-label">Họ và tên</span>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </label>
              <label>
                <span className="field-label">Số điện thoại</span>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
              </label>
            </div>
            <div className="field-grid">
              <label>
                <span className="field-label">Khu vực</span>
                <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Địa chỉ</span>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </label>
            </div>
          </>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn primary">
            Tiếp tục
          </button>
        </div>
      </form>
    </Modal>
  )
}
