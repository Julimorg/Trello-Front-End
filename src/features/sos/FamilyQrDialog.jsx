import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import { useToast } from '../../components/ToastProvider'
import { getState, useDb } from '../../lib/store'
import {
  createFamilyInvite,
  familyInviteStatus,
  getActiveFamilyInvite,
  getFamilyInvite,
  getPatient,
  updateFamilyInvite,
} from '../../lib/db'
import { FAMILY_INVITE_TTL_MINUTES, FAMILY_PERMISSIONS } from '../../Data/patient/family-data'
import { popIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const DEFAULT_PERMISSIONS = FAMILY_PERMISSIONS.filter((p) => p.id !== 'status').map((p) => p.label)

function familyInviteUrl(code) {
  return `${window.location.origin}/family-invite/${code}`
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export default function FamilyQrDialog({ open, onClose, patientId }) {
  const toast = useToast()
  const state = useDb()
  const [code, setCode] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const qrBoxRef = useRef(null)

  const newInvite = () => {
    const invite = createFamilyInvite(patientId, { permissions: DEFAULT_PERMISSIONS, ttlMinutes: FAMILY_INVITE_TTL_MINUTES })
    setCode(invite.code)
    setNow(Date.now())
  }

  // Reuse the patient's still-valid invite when reopening, otherwise issue a new one.
  useEffect(() => {
    if (!open) return
    const active = getActiveFamilyInvite(getState(), patientId)
    if (active) setCode(active.code)
    else newInvite()
    setNow(Date.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientId])

  useEffect(() => {
    if (!open) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [open])

  useEffect(() => {
    if (open && code && qrBoxRef.current) popIn(qrBoxRef.current)
  }, [open, code])

  const invite = code ? getFamilyInvite(state, code) : null
  const status = invite ? familyInviteStatus(invite, now) : 'active'
  const linkedContact = invite?.contactId ? getPatient(state, patientId)?.familyContacts.find((c) => c.id === invite.contactId) : null
  const url = code ? familyInviteUrl(code) : ''

  const togglePermission = (label) => {
    if (!invite) return
    const next = invite.permissions.includes(label) ? invite.permissions.filter((p) => p !== label) : [...invite.permissions, label]
    updateFamilyInvite(invite.code, { permissions: FAMILY_PERMISSIONS.map((p) => p.label).filter((l) => next.includes(l)) })
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Đã sao chép liên kết', 'Gửi liên kết này cho người thân nếu họ không quét được mã.')
    } catch {
      toast('Không sao chép được', url)
    }
  }

  const downloadQr = () => {
    const canvas = qrBoxRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `careshift-lien-ket-${code}.png`
    a.click()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="familyQrTitle">
      <div className="patient-dialog-body">
        <div className="patient-dialog-head">
          <div>
            <span className="eyebrow">Liên kết bằng mã QR</span>
            <h2 id="familyQrTitle">Mã QR liên kết tài khoản</h2>
            <p className="detail-text">Người thân quét mã bằng camera điện thoại hoặc ứng dụng CareShift để liên kết với tài khoản của bạn.</p>
          </div>
          <IconButton aria-label="Đóng" onClick={onClose} sx={{ border: '1px solid var(--line)', borderRadius: '10px' }}>
            <Icon.close />
          </IconButton>
        </div>

        {status === 'used' ? (
          <div className="qr-success" role="status">
            <span className="qr-success-icon">
              <Icon.check />
            </span>
            <h3>{linkedContact ? `${linkedContact.name} đã liên kết` : 'Mã đã được sử dụng'}</h3>
            <p className="detail-text">
              {linkedContact
                ? `${linkedContact.relation} · ${linkedContact.phone}. Bạn có thể đặt người này làm người liên hệ ưu tiên trên trang Người thân liên kết.`
                : 'Mỗi mã chỉ dùng được một lần.'}
            </p>
            <div className="patient-sos-actions">
              <Button variant="outlined" startIcon={<Icon.refresh />} onClick={newInvite}>
                Tạo mã cho người khác
              </Button>
              <Button variant="contained" onClick={onClose}>
                Xong
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="qr-layout">
              <div className="qr-column">
                <div className={`qr-box${status !== 'active' ? ' is-expired' : ''}`} ref={qrBoxRef}>
                  {code && <QRCodeCanvas value={url} size={188} marginSize={1} fgColor="#15313a" level="M" role="img" aria-label={`Mã QR liên kết ${code}`} />}
                  {status !== 'active' && (
                    <div className="qr-expired">
                      <b>Mã đã hết hạn</b>
                      <Button size="small" variant="contained" onClick={newInvite}>
                        Tạo mã mới
                      </Button>
                    </div>
                  )}
                </div>
                <div className="qr-code-text">
                  <small>Mã liên kết</small>
                  <b>{code}</b>
                </div>
                <div className={`qr-countdown${status !== 'active' ? ' is-expired' : ''}`}>
                  <Icon.clock />
                  {status === 'active' ? `Hết hạn sau ${formatCountdown(new Date(invite?.expiresAt).getTime() - now)}` : 'Đã hết hạn'}
                </div>
              </div>

              <div>
                <ol className="qr-steps">
                  <li>Người thân mở camera hoặc ứng dụng CareShift và quét mã.</li>
                  <li>Họ nhập tên, số điện thoại và mối quan hệ với bạn.</li>
                  <li>Tài khoản được liên kết ngay. Bạn sẽ nhận được thông báo.</li>
                </ol>
                <fieldset className="permission-box">
                  <legend>Quyền người thân nhận được</legend>
                  {FAMILY_PERMISSIONS.map((p) => {
                    const checked = invite?.permissions.includes(p.label) ?? false
                    return (
                      <FormControlLabel
                        key={p.id}
                        sx={{ alignItems: 'flex-start', display: 'flex', m: 0, py: 0.25 }}
                        disabled={status !== 'active' || (checked && invite.permissions.length === 1)}
                        control={<Checkbox size="small" checked={checked} onChange={() => togglePermission(p.label)} />}
                        label={
                          <span style={{ display: 'block', paddingTop: 7 }}>
                            <b style={{ display: 'block', fontSize: '.76rem' }}>{p.label}</b>
                            <small style={{ color: 'var(--muted)', fontSize: '.66rem' }}>{p.hint}</small>
                          </span>
                        }
                      />
                    )
                  })}
                </fieldset>
              </div>
            </div>

            <p className="qr-note">
              <Icon.shield /> Mỗi mã chỉ dùng được một lần và hết hạn sau {FAMILY_INVITE_TTL_MINUTES} phút. Tạo mã mới sẽ vô hiệu hóa mã cũ.
            </p>

            <div className="qr-actions">
              <Button variant="outlined" startIcon={<Icon.copy />} disabled={status !== 'active'} onClick={copyLink}>
                Sao chép liên kết
              </Button>
              <Button variant="outlined" startIcon={<Icon.download />} disabled={status !== 'active'} onClick={downloadQr}>
                Tải mã QR
              </Button>
              <Button variant="outlined" startIcon={<Icon.refresh />} onClick={newInvite}>
                Tạo mã mới
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
