import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { animate, createDraggable } from 'animejs'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { attachSosLocation, getPatient, getPrimaryFamilyContact, triggerSOS } from '../../lib/db'
import { SOS_ACTIONS } from '../../Data/patient/sos-data'
import { prefersReducedMotion } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const POSITION_KEY = 'careshift_sos_position'
const EDGE_PADDING = 14

function readSavedPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    const timer = setTimeout(() => resolve(null), 3000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
      { timeout: 3000 },
    )
  })
}

export default function PatientSos({ patientId }) {
  const state = useDb()
  const toast = useToast()
  const navigate = useNavigate()
  const buttonRef = useRef(null)
  const ringRef = useRef(null)
  const draggedRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('actions')
  const [selectedIds, setSelectedIds] = useState([])

  const contacts = getPatient(state, patientId)?.familyContacts || []
  const linkedContacts = contacts.filter((c) => c.status === 'Đã liên kết')
  const primary = getPrimaryFamilyContact(state, patientId)

  // Draggable anywhere inside the viewport (animejs clamps fixed elements to the window);
  // the drop position is remembered per browser.
  useEffect(() => {
    const el = buttonRef.current
    if (!el) return undefined
    const draggable = createDraggable(el, {
      container: document.body,
      containerPadding: EDGE_PADDING,
      onGrab: () => {
        draggedRef.current = false
      },
      onDrag: () => {
        draggedRef.current = true
      },
      onSettle: (d) => {
        try {
          localStorage.setItem(POSITION_KEY, JSON.stringify({ x: d.x, y: d.y }))
        } catch {
          // ignore
        }
      },
    })
    const saved = readSavedPosition()
    if (saved) {
      const rect = el.getBoundingClientRect()
      const minX = -(rect.left - EDGE_PADDING)
      const minY = -(rect.top - EDGE_PADDING)
      draggable.setX(Math.min(0, Math.max(minX, saved.x)))
      draggable.setY(Math.min(0, Math.max(minY, saved.y)))
    }
    const pulse = prefersReducedMotion()
      ? null
      : animate(ringRef.current, { scale: [1, 1.5], opacity: [0.55, 0], duration: 1700, loop: true, ease: 'outQuad' })
    return () => {
      pulse?.revert()
      draggable.revert()
    }
  }, [])

  const close = () => {
    setOpen(false)
    setView('actions')
  }

  const handleButtonClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    setSelectedIds(linkedContacts.map((c) => c.id))
    setOpen(true)
  }

  const send = (type, contactIds, title, message) => {
    const eventId = triggerSOS({ patientId, triggeredBy: 'patient', type, contactIds, location: null })
    close()
    toast(title, message)
    getLocation().then((location) => location && attachSosLocation(eventId, location))
  }

  const handleAction = (type) => {
    if (type === 'call_115') {
      send('call_115', [], 'Đã gọi 115', 'Mô phỏng cuộc gọi cấp cứu — nếu mất mạng, hãy gọi trực tiếp 115.')
      return
    }
    if (type === 'notify_primary_family') {
      if (!primary || primary.status !== 'Đã liên kết') {
        close()
        navigate('/patient/family')
        toast(
          primary ? `${primary.name} chưa xác nhận liên kết` : 'Chưa có người thân ưu tiên',
          primary ? 'Người thân ưu tiên cần xác nhận lời mời trước khi nhận cảnh báo.' : 'Hãy đặt một người thân đã liên kết làm người liên hệ ưu tiên.',
        )
        return
      }
      send('notify_primary_family', [primary.id], `Đã báo ${primary.name}`, 'Mô phỏng cảnh báo kèm vị trí hiện tại; không gửi tin thật.')
      return
    }
    setView('family')
  }

  const toggleContact = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <>
      <button ref={buttonRef} type="button" className="patient-sos" aria-label="Hỗ trợ khẩn cấp (có thể kéo thả)" onClick={handleButtonClick}>
        <span ref={ringRef} className="patient-sos-ring" aria-hidden="true" />
        <span className="patient-sos-label">SOS</span> Khẩn cấp
      </button>

      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth slotProps={{ paper: { className: 'patient-sos-dialog' } }}>
        <IconButton aria-label="Đóng" onClick={close} sx={{ position: 'absolute', right: 14, top: 14, border: '1px solid var(--line)', borderRadius: '10px' }}>
          <Icon.close />
        </IconButton>
        {view === 'actions' ? (
          <div className="patient-sos-body">
            <div className="sos-icon">SOS</div>
            <span className="eyebrow danger">Hỗ trợ khẩn cấp</span>
            <h2>Bạn cần liên hệ với ai?</h2>
            <p>Chọn phương án phù hợp. CareShift sẽ ghi nhận sự cố và chia sẻ thông tin ca đang diễn ra.</p>
            <div className="sos-actions">
              {SOS_ACTIONS.map((action) => {
                const hint =
                  action.type === 'notify_primary_family'
                    ? primary
                      ? `${primary.name} · ${primary.relation}${primary.status === 'Đã liên kết' ? '' : ' (chờ xác nhận)'}`
                      : 'Chưa có người thân ưu tiên'
                    : action.type === 'notify_family'
                      ? `${linkedContacts.length} người thân đã liên kết`
                      : action.hint
                return (
                  <button key={action.type} type="button" onClick={() => handleAction(action.type)}>
                    <span className={`sos-action-icon ${action.tone === 'blue' ? 'hospital' : action.tone === 'teal' ? 'family' : ''}`}>{action.glyph}</span>
                    <span>
                      <b>{action.title}</b>
                      <small>{hint}</small>
                    </span>
                    <Icon.chevron />
                  </button>
                )
              })}
            </div>
            <small className="sos-note">CareShift không thay thế dịch vụ cấp cứu. Nếu có nguy cơ đe dọa tính mạng, hãy gọi 115 ngay.</small>
          </div>
        ) : (
          <div className="patient-sos-body family">
            <span className="eyebrow danger">Báo người thân</span>
            <h2>Gửi cảnh báo cho ai?</h2>
            <p>Đánh dấu những người thân sẽ nhận cảnh báo SOS kèm vị trí hiện tại.</p>
            <List dense disablePadding className="patient-sos-list">
              {contacts.map((c) => {
                const linked = c.status === 'Đã liên kết'
                return (
                  <ListItemButton key={c.id} disabled={!linked} onClick={() => toggleContact(c.id)} sx={{ borderRadius: '12px' }}>
                    <ListItemIcon sx={{ minWidth: 38 }}>
                      <Checkbox edge="start" checked={linked && selectedIds.includes(c.id)} tabIndex={-1} disableRipple slotProps={{ input: { 'aria-label': c.name } }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${c.name}${c.primary ? ' · Ưu tiên' : ''}`}
                      secondary={linked ? `${c.relation} · ${c.phone}` : `${c.relation} · Chờ xác nhận liên kết`}
                      slotProps={{ primary: { sx: { fontWeight: 700, fontSize: '.84rem' } }, secondary: { sx: { fontSize: '.72rem' } } }}
                    />
                  </ListItemButton>
                )
              })}
              {contacts.length === 0 && <p className="form-hint">Bạn chưa liên kết người thân nào.</p>}
            </List>
            <div className="patient-sos-actions">
              <Button variant="outlined" onClick={() => setView('actions')}>
                Quay lại
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={selectedIds.length === 0}
                onClick={() =>
                  send(
                    'notify_family',
                    selectedIds,
                    `Đã báo ${selectedIds.length} người thân`,
                    'Mô phỏng cảnh báo kèm vị trí hiện tại; không gửi tin thật.',
                  )
                }
              >
                Gửi cảnh báo ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
