import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { getPatient, respondToCareRequest } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { Icon } from '../../lib/icons'

export default function NursePendingCard({ careRequest }) {
  const toast = useToast()
  const state = useDb()
  const patient = getPatient(state, careRequest.patientId)

  const respond = (decision) => {
    respondToCareRequest(careRequest.id, decision)
    toast(
      decision === 'accept' ? 'Đã xác nhận nhận ca' : 'Đã từ chối ca',
      decision === 'accept' ? 'Bệnh nhân đã được thông báo và lịch đã được tạo.' : 'CareShift sẽ gửi yêu cầu tới điều dưỡng phù hợp tiếp theo.',
    )
  }

  return (
    <div className="notification-card unread">
      <span className="notification-symbol">
        <Icon.bell />
      </span>
      <div>
        <h3>Ca chăm sóc mới phù hợp với bạn</h3>
        <p>
          {careTypeLabel(careRequest.careType)} cho bệnh nhân {patient?.name} tại {careRequest.district}.
        </p>
        <div className="notification-meta">
          <span>
            <Icon.calendar /> {formatDate(careRequest.desiredStartDate)} · {careRequest.timeSlot?.start}–{careRequest.timeSlot?.end}
          </span>
          <span>
            <Icon.pin /> {careRequest.district}
          </span>
          <span>
            <Icon.clock /> Phản hồi trong 15 phút
          </span>
        </div>
      </div>
      <div className="notification-actions">
        <button type="button" className="btn ghost small" onClick={() => respond('decline')}>
          Từ chối
        </button>
        <button type="button" className="btn primary small" onClick={() => respond('accept')}>
          Xác nhận nhận ca
        </button>
      </div>
    </div>
  )
}
