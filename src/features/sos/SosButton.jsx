import { useState } from 'react'
import Modal, { ModalCloseButton } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { triggerSOS } from '../../lib/db'
import { SOS_TYPES } from '../../lib/constants'
import { Icon } from '../../lib/icons'

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

export default function SosButton({ bookingId, sessionId, role, familyLabel, onNeedFamilyLink }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)

  const handle = async (type, label) => {
    if (type === SOS_TYPES.NOTIFY_FAMILY && !familyLabel && onNeedFamilyLink) {
      setOpen(false)
      onNeedFamilyLink()
      return
    }
    const location = await getLocation()
    triggerSOS({ bookingId, sessionId, triggeredBy: role, type, location })
    setOpen(false)
    toast(
      type === SOS_TYPES.CALL_115 ? 'Đã gọi 115' : `Đã ${label.toLowerCase()}`,
      'Mô phỏng cảnh báo khẩn cấp — nếu mất mạng, hãy gọi trực tiếp 115.',
    )
  }

  return (
    <>
      <button className="floating-sos" onClick={() => setOpen(true)}>
        <span>SOS</span> Khẩn cấp
      </button>

      <Modal open={open} onClose={() => setOpen(false)} className="sos-modal" backdropClassName="sos-backdrop" labelledBy="sosTitle">
        <ModalCloseButton onClose={() => setOpen(false)} floating />
        <div className="sos-icon">SOS</div>
        <span className="eyebrow danger">Hỗ trợ khẩn cấp</span>
        <h2 id="sosTitle">Bạn cần liên hệ với ai?</h2>
        <p>Chọn phương án phù hợp. CareShift sẽ ghi nhận sự cố và chia sẻ thông tin ca đang diễn ra.</p>
        <div className="sos-actions">
          <button type="button" onClick={() => handle(SOS_TYPES.CALL_115, 'Gọi 115')}>
            <span className="sos-action-icon">✚</span>
            <span>
              <b>Gọi 115</b>
              <small>Tình huống cấp cứu y tế</small>
            </span>
            <Icon.chevron />
          </button>
          <button type="button" onClick={() => handle(SOS_TYPES.NOTIFY_HOSPITAL, 'báo bệnh viện')}>
            <span className="sos-action-icon hospital">H</span>
            <span>
              <b>Báo bệnh viện</b>
              <small>Liên hệ điều phối viên trực</small>
            </span>
            <Icon.chevron />
          </button>
          <button type="button" onClick={() => handle(SOS_TYPES.NOTIFY_FAMILY, 'báo người thân')}>
            <span className="sos-action-icon family">⌂</span>
            <span>
              <b>Báo người thân</b>
              <small>{familyLabel || 'Chưa có người thân được liên kết'}</small>
            </span>
            <Icon.chevron />
          </button>
        </div>
        <small className="sos-note">CareShift không thay thế dịch vụ cấp cứu. Nếu có nguy cơ đe dọa tính mạng, hãy gọi 115 ngay.</small>
      </Modal>
    </>
  )
}
