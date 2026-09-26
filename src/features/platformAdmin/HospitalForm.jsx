import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import { addHospital } from '../../lib/db'
import { DISTRICTS } from '../../lib/constants'

const initialForm = { name: '', address: '', district: DISTRICTS[0], phone: '' }

export default function HospitalForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)

  const canSubmit = form.name.trim() && form.address.trim() && form.phone.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const id = addHospital(form)
    navigate(`/admin/hospitals/${id}`)
  }

  return (
    <>
      <PageHead eyebrow="Partner network" title="Thêm bệnh viện đối tác" />
      <section className="panel" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} className="panel-body">
          <label>
            <span className="field-label">Tên bệnh viện</span>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </label>
          <label>
            <span className="field-label">Địa chỉ</span>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
          </label>
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
              <span className="field-label">Số điện thoại</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
            </label>
          </div>
          <button type="submit" className="btn primary" disabled={!canSubmit} style={{ marginTop: 8 }}>
            Tạo tài khoản bệnh viện
          </button>
        </form>
      </section>
    </>
  )
}
