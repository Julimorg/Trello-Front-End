import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import PatientThemeProvider from '../../patient/PatientThemeProvider'
import { useDb } from '../../lib/store'
import { acceptFamilyInvite, familyInviteStatus, getFamilyInvite, getPatient } from '../../lib/db'
import { FAMILY_RELATIONS } from '../../Data/patient/family-data'
import { Icon } from '../../lib/icons'

// Public page opened by scanning a patient's QR invite (or typing its code).
// The relative fills in who they are and their account is linked immediately.

const PHONE_OR_EMAIL = /^(\+?\d[\d\s.-]{7,}|[^\s@]+@[^\s@]+\.[^\s@]+)$/

const STATUS_COPY = {
  not_found: { title: 'Mã liên kết không hợp lệ', text: 'Kiểm tra lại mã hoặc nhờ người thân tạo mã QR mới.' },
  expired: { title: 'Mã liên kết đã hết hạn', text: 'Mã chỉ có hiệu lực trong thời gian ngắn. Nhờ người thân tạo mã QR mới.' },
  revoked: { title: 'Mã liên kết đã bị thay thế', text: 'Người thân đã tạo một mã mới. Hãy quét mã mới nhất.' },
  used: { title: 'Mã liên kết đã được sử dụng', text: 'Mỗi mã chỉ dùng được một lần. Nhờ người thân tạo mã mới nếu cần.' },
}

function CodeEntry() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const normalized = value.trim().toUpperCase()
  return (
    <form
      className="invite-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (normalized) navigate(`/family-invite/${normalized}`)
      }}
    >
      <h1>Nhập mã liên kết</h1>
      <p className="detail-text">Nhập mã hiển thị bên dưới mã QR trên điện thoại của người thân (dạng CS-XXXXXX).</p>
      <TextField label="Mã liên kết" value={value} onChange={(e) => setValue(e.target.value)} placeholder="CS-7K2QX9" autoFocus fullWidth />
      <Button type="submit" variant="contained" disabled={!normalized} fullWidth>
        Tiếp tục
      </Button>
    </form>
  )
}

function InviteContent({ code }) {
  const state = useDb()
  const [now, setNow] = useState(() => Date.now())
  const [form, setForm] = useState({ name: '', phone: '', relation: 'Con' })
  const [result, setResult] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const invite = getFamilyInvite(state, code)
  const patient = invite ? getPatient(state, invite.patientId) : null

  if (result?.contactId) {
    return (
      <div className="invite-form" role="status">
        <span className="qr-success-icon">
          <Icon.check />
        </span>
        <h1>Đã liên kết với {patient?.name}</h1>
        <p className="detail-text">
          Bạn sẽ nhận được {invite.permissions.map((p) => p.toLowerCase()).join(', ')} theo quyền {patient?.name} đã cấp.
        </p>
        <Button component={Link} to="/" variant="outlined" fullWidth>
          Về trang CareShift
        </Button>
      </div>
    )
  }

  const status = result?.error || (invite ? familyInviteStatus(invite, now) : 'not_found')
  if (status !== 'active') {
    const copy = STATUS_COPY[status]
    return (
      <div className="invite-form">
        <span className="qr-success-icon is-error">
          <Icon.info />
        </span>
        <h1>{copy.title}</h1>
        <p className="detail-text">{copy.text}</p>
        <Button component={Link} to="/family-invite" variant="outlined" fullWidth>
          Nhập mã khác
        </Button>
      </div>
    )
  }

  const phoneValid = PHONE_OR_EMAIL.test(form.phone.trim())
  const canSubmit = form.name.trim() && phoneValid
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  return (
    <form
      className="invite-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) setResult(acceptFamilyInvite(code, { name: form.name.trim(), phone: form.phone.trim(), relation: form.relation }))
      }}
    >
      <span className="eyebrow">Lời mời liên kết · {invite.code}</span>
      <h1>{patient?.name} mời bạn trở thành người thân liên kết</h1>
      <div className="invite-permissions">
        <small>Bạn sẽ được:</small>
        {invite.permissions.map((p) => (
          <span key={p}>
            <Icon.check /> {p}
          </span>
        ))}
      </div>
      <TextField label="Họ và tên của bạn" required value={form.name} onChange={(e) => update({ name: e.target.value })} fullWidth />
      <TextField
        label="Số điện thoại hoặc email"
        required
        value={form.phone}
        onChange={(e) => update({ phone: e.target.value })}
        error={Boolean(form.phone) && !phoneValid}
        helperText={form.phone && !phoneValid ? 'Nhập số điện thoại hoặc email hợp lệ' : undefined}
        fullWidth
      />
      <TextField select label={`Bạn là gì của ${patient?.name}?`} value={form.relation} onChange={(e) => update({ relation: e.target.value })} fullWidth>
        {FAMILY_RELATIONS.map((r) => (
          <MenuItem key={r} value={r}>
            {r}
          </MenuItem>
        ))}
      </TextField>
      <Button type="submit" variant="contained" disabled={!canSubmit} fullWidth>
        Xác nhận liên kết
      </Button>
    </form>
  )
}

export default function FamilyInviteAccept() {
  const { code } = useParams()
  return (
    <PatientThemeProvider>
      <div className="auth-page">
        <div className="auth-card invite-card">
          <div className="auth-brand">
            <div className="brand-mark">+</div>
            <strong>CareShift</strong>
          </div>
          {code ? <InviteContent key={code} code={code} /> : <CodeEntry />}
        </div>
      </div>
    </PatientThemeProvider>
  )
}
