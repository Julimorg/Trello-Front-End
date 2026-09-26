import { useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import {
  addAvailability,
  addCertificate,
  getNurse,
  removeAvailability,
  removeCertificate,
  setNurseAuthStatus,
  updateNurse,
} from '../../lib/db'
import { useDb } from '../../lib/store'
import { careTypeLabel, weekdayLabel } from '../../lib/format'
import { CARE_TYPES, DISTRICTS, NURSE_AUTH_STATUS, NURSE_AUTH_STATUS_LABEL, WEEKDAYS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function NurseDetail() {
  const { id } = useParams()
  const state = useDb()
  const nurse = getNurse(state, id)

  const [certForm, setCertForm] = useState({ name: '', number: '', issuedBy: '' })
  const [availForm, setAvailForm] = useState({ weekday: 1, start: '17:00', end: '20:00' })
  const [authorizeOpen, setAuthorizeOpen] = useState(false)
  const [authorizeError, setAuthorizeError] = useState('')
  const [selectedCareTypes, setSelectedCareTypes] = useState([])
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)

  if (!nurse) {
    return (
      <div className="empty-state">
        <h3>Không tìm thấy điều dưỡng</h3>
      </div>
    )
  }

  const openAuthorize = () => {
    setSelectedCareTypes(nurse.specialties)
    setAuthorizeError('')
    setAuthorizeOpen(true)
  }

  const handleAuthorize = () => {
    const result = setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.AUTHORIZED, selectedCareTypes)
    if (!result.ok) {
      setAuthorizeError(result.error)
      return
    }
    setAuthorizeOpen(false)
  }

  return (
    <>
      <PageHead
        eyebrow="Hospital roster"
        title={nurse.name}
        description={`${nurse.rank} · ${nurse.experienceYears} năm kinh nghiệm`}
        action={<StatusBadge status={nurse.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />}
      />

      <div className="chip-row" style={{ marginBottom: 22 }}>
        {nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED && (
          <button type="button" className="btn primary" onClick={openAuthorize}>
            Cấp phép (Authorized)
          </button>
        )}
        {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (
          <button type="button" className="btn ghost" onClick={() => setSuspendOpen(true)}>
            Tạm ngưng
          </button>
        )}
        {nurse.authStatus !== NURSE_AUTH_STATUS.REVOKED && (
          <button type="button" className="btn danger" onClick={() => setRevokeOpen(true)}>
            Thu hồi quyền
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        <div>
          <section className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-head">
              <div>
                <h2>Thông tin cơ bản</h2>
              </div>
            </div>
            <div className="panel-body">
              <div className="field-grid" style={{ marginBottom: 16 }}>
                <label>
                  <span className="field-label">Số điện thoại</span>
                  <input defaultValue={nurse.phone} onBlur={(e) => updateNurse(nurse.id, { phone: e.target.value })} />
                </label>
                <label>
                  <span className="field-label">Số năm kinh nghiệm</span>
                  <input type="number" defaultValue={nurse.experienceYears} onBlur={(e) => updateNurse(nurse.id, { experienceYears: Number(e.target.value) })} />
                </label>
              </div>
              <span className="field-label">Chuyên môn</span>
              <div className="chip-row" style={{ marginBottom: 16 }}>
                {CARE_TYPES.filter((c) => c.id !== 'other').map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip-select${nurse.specialties.includes(c.id) ? ' selected' : ''}`}
                    onClick={() =>
                      updateNurse(nurse.id, {
                        specialties: nurse.specialties.includes(c.id) ? nurse.specialties.filter((s) => s !== c.id) : [...nurse.specialties, c.id],
                      })
                    }
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <span className="field-label">Khu vực phục vụ</span>
              <div className="chip-row" style={{ marginBottom: 16 }}>
                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`chip-select${nurse.serviceAreas.includes(d) ? ' selected' : ''}`}
                    onClick={() =>
                      updateNurse(nurse.id, {
                        serviceAreas: nurse.serviceAreas.includes(d) ? nurse.serviceAreas.filter((s) => s !== d) : [...nurse.serviceAreas, d],
                      })
                    }
                  >
                    {d}
                  </button>
                ))}
              </div>
              {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (
                <div className="info-callout">
                  <Icon.info />
                  <span>Phạm vi ca được phép hiện tại: {nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || 'Chưa có'}</span>
                </div>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Chứng chỉ hành nghề</h2>
              </div>
            </div>
            <div className="panel-body">
              <div className="attention-list" style={{ padding: 0, marginBottom: 12 }}>
                {nurse.certificates.map((c) => (
                  <div className="attention-item" key={c.id}>
                    <span className="attention-icon green">
                      <Icon.shield />
                    </span>
                    <span>
                      <b>{c.name}</b>
                      <small>
                        Số {c.number} · Cấp bởi {c.issuedBy}
                      </small>
                    </span>
                    <button type="button" className="icon-mini" onClick={() => removeCertificate(nurse.id, c.id)}>
                      <Icon.close />
                    </button>
                  </div>
                ))}
              </div>
              <div className="field-grid">
                <label>
                  <span className="field-label">Tên chứng chỉ</span>
                  <input value={certForm.name} onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))} />
                </label>
                <label>
                  <span className="field-label">Số chứng chỉ</span>
                  <input value={certForm.number} onChange={(e) => setCertForm((f) => ({ ...f, number: e.target.value }))} />
                </label>
              </div>
              <label>
                <span className="field-label">Nơi cấp</span>
                <input value={certForm.issuedBy} onChange={(e) => setCertForm((f) => ({ ...f, issuedBy: e.target.value }))} />
              </label>
              <button
                type="button"
                className="btn ghost"
                style={{ marginTop: 12 }}
                disabled={!certForm.name.trim() || !certForm.number.trim()}
                onClick={() => {
                  addCertificate(nurse.id, certForm)
                  setCertForm({ name: '', number: '', issuedBy: '' })
                }}
              >
                <Icon.plus /> Thêm chứng chỉ
              </button>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Lịch rảnh ngoài giờ trực</h2>
              <p>Bệnh viện phê duyệt trước khi đưa vào Nurse Matching</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="attention-list" style={{ padding: 0, marginBottom: 12 }}>
              {nurse.availability.map((a) => (
                <div className="attention-item" key={a.id}>
                  <span className="attention-icon blue">{a.start}</span>
                  <span>
                    <b>{weekdayLabel(a.weekday)}</b>
                    <small>
                      {a.start} – {a.end}
                    </small>
                  </span>
                  <button type="button" className="icon-mini" onClick={() => removeAvailability(nurse.id, a.id)}>
                    <Icon.close />
                  </button>
                </div>
              ))}
              {nurse.availability.length === 0 && <p className="form-hint">Chưa có khung giờ rảnh nào.</p>}
            </div>
            <div className="field-grid">
              <label>
                <span className="field-label">Thứ</span>
                <select value={availForm.weekday} onChange={(e) => setAvailForm((f) => ({ ...f, weekday: Number(e.target.value) }))}>
                  {WEEKDAYS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="field-label">Từ</span>
                <input type="time" value={availForm.start} onChange={(e) => setAvailForm((f) => ({ ...f, start: e.target.value }))} />
              </label>
            </div>
            <label>
              <span className="field-label">Đến</span>
              <input type="time" value={availForm.end} onChange={(e) => setAvailForm((f) => ({ ...f, end: e.target.value }))} />
            </label>
            <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={() => addAvailability(nurse.id, availForm)}>
              <Icon.plus /> Thêm khung giờ
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog open={authorizeOpen} title="Cấp phép Authorized" confirmLabel="Cấp phép" onClose={() => setAuthorizeOpen(false)} onConfirm={handleAuthorize}>
        {authorizeError && (
          <div className="info-callout" style={{ background: 'var(--red-soft)', color: 'var(--red)', marginBottom: 12 }}>
            <Icon.info />
            <span>{authorizeError}</span>
          </div>
        )}
        <p style={{ fontSize: '.8rem', marginBottom: 8 }}>Chọn phạm vi ca được phép nhận (theo cấp bậc/chuyên ngành):</p>
        <div className="stack-gap-8">
          {nurse.specialties.map((s) => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedCareTypes.includes(s)}
                onChange={() => setSelectedCareTypes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))}
                style={{ width: 17, height: 17 }}
              />
              <span>{careTypeLabel(s)}</span>
            </label>
          ))}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={suspendOpen}
        title="Tạm ngưng điều dưỡng?"
        description="Điều dưỡng sẽ không được đề xuất trong Nurse Matching cho đến khi được cấp phép lại."
        confirmLabel="Tạm ngưng"
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => {
          setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.SUSPENDED)
          setSuspendOpen(false)
        }}
      />

      <ConfirmDialog
        open={revokeOpen}
        title="Thu hồi quyền điều dưỡng?"
        description="Dùng khi điều dưỡng nghỉ việc hoặc vi phạm. Các ca đã đặt lịch dang dở sẽ cần được xử lý riêng."
        confirmLabel="Thu hồi"
        confirmTone="danger"
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => {
          setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.REVOKED)
          setRevokeOpen(false)
        }}
      />
    </>
  )
}
