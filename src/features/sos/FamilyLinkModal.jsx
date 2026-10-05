import { useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useToast } from '../../components/ToastProvider'
import { addFamilyContact } from '../../lib/db'
import { FAMILY_PERMISSIONS, FAMILY_RELATIONS } from '../../Data/patient/family-data'
import { Icon } from '../../lib/icons'

const initialForm = { name: '', relationship: 'Con', contact: '', permissions: ['emergency', 'schedule'], primary: false }

export default function FamilyLinkModal({ open, onClose, patientId, currentPrimary }) {
  const toast = useToast()
  const [form, setForm] = useState(initialForm)

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))
  const canSubmit = form.name.trim() && form.contact.trim()

  const togglePermission = (id) =>
    update({ permissions: form.permissions.includes(id) ? form.permissions.filter((p) => p !== id) : [...form.permissions, id] })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    addFamilyContact(patientId, {
      name: form.name.trim(),
      relation: form.relationship,
      phone: form.contact.trim(),
      status: 'Chờ xác nhận',
      primary: form.primary,
      permissions: FAMILY_PERMISSIONS.filter((p) => form.permissions.includes(p.id)).map((p) => p.label),
    })
    toast('Đã tạo lời mời liên kết', `${form.name} cần xác nhận trước khi nhận cảnh báo SOS.`)
    setForm(initialForm)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="familyLinkTitle">
      <form onSubmit={handleSubmit} className="patient-dialog-body">
        <div className="patient-dialog-head">
          <div>
            <span className="eyebrow">Tài khoản người thân</span>
            <h2 id="familyLinkTitle">Liên kết người thân</h2>
            <p className="detail-text">CareShift sẽ gửi lời mời xác nhận tới tài khoản của người thân trước khi chia sẻ thông tin.</p>
          </div>
          <IconButton aria-label="Đóng" onClick={onClose} sx={{ border: '1px solid var(--line)', borderRadius: '10px' }}>
            <Icon.close />
          </IconButton>
        </div>
        <div className="wizard-fields">
          <TextField label="Họ và tên" required value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Nguyễn Thị Lan" />
          <TextField select label="Mối quan hệ" value={form.relationship} onChange={(e) => update({ relationship: e.target.value })}>
            {FAMILY_RELATIONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            className="field-full"
            label="Số điện thoại hoặc email tài khoản CareShift"
            required
            value={form.contact}
            onChange={(e) => update({ contact: e.target.value })}
            placeholder="090 123 4567 hoặc email@example.com"
          />
        </div>
        <fieldset className="permission-box">
          <legend>Quyền chia sẻ</legend>
          {FAMILY_PERMISSIONS.map((p) => (
            <FormControlLabel
              key={p.id}
              sx={{ alignItems: 'flex-start', display: 'flex', m: 0, py: 0.5 }}
              control={<Checkbox checked={form.permissions.includes(p.id)} onChange={() => togglePermission(p.id)} />}
              label={
                <span style={{ display: 'block', paddingTop: 8 }}>
                  <b style={{ display: 'block', fontSize: '.78rem' }}>{p.label}</b>
                  <small style={{ color: 'var(--muted)', fontSize: '.68rem' }}>{p.hint}</small>
                </span>
              }
            />
          ))}
        </fieldset>
        <FormControlLabel
          className="wizard-consent"
          sx={{ mt: 1 }}
          control={<Checkbox checked={form.primary} onChange={(e) => update({ primary: e.target.checked })} />}
          label="Đặt làm người liên hệ khẩn cấp ưu tiên (sau khi được xác nhận)."
        />
        {form.primary && currentPrimary && (
          <p className="wizard-hint">
            Mỗi tài khoản chỉ có một người ưu tiên: {currentPrimary.name} sẽ không còn là người ưu tiên.
          </p>
        )}
        <div className="patient-sos-actions">
          <Button variant="outlined" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            Gửi lời mời liên kết
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
