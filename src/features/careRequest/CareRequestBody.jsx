import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import StatusBadge from '../../components/StatusBadge'
import PatientConfirmDialog from '../../patient/PatientConfirmDialog'
import NurseProfileCard from '../nurseMatching/NurseProfileCard'
import { useDb } from '../../lib/store'
import { cancelCareRequest, getAlternativeNurses, getNurse, retryMatching, selectNurseForCareRequest } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS, CARE_REQUEST_STATUS_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

function Timeline({ careRequest }) {
  const chosen = careRequest.status !== CARE_REQUEST_STATUS.MATCHING && careRequest.status !== CARE_REQUEST_STATUS.MATCHED
  const confirmed = careRequest.status === CARE_REQUEST_STATUS.COMPLETED
  return (
    <div className="care-timeline">
      <div className="timeline-step done">
        <span>✓</span>Đã tạo yêu cầu
      </div>
      <div className={`timeline-step ${chosen ? 'done' : ''}`}>
        <span>{chosen ? '✓' : '2'}</span>Đã chọn điều dưỡng
      </div>
      <div className={`timeline-step ${confirmed ? 'done' : chosen ? 'active' : ''}`}>
        <span>{confirmed ? '✓' : '3'}</span>
        {confirmed ? 'Đã xác nhận' : 'Chờ phản hồi'}
      </div>
    </div>
  )
}

function Meta({ careRequest, nurse, nurseLabel }) {
  return (
    <div className="active-care-meta">
      <div className="meta-item">
        <Icon.calendar />
        <span>
          <small>Thời gian</small>
          <b>
            {formatDate(careRequest.desiredStartDate)} · {careRequest.timeSlot?.start}
          </b>
        </span>
      </div>
      <div className="meta-item">
        <Icon.pin />
        <span>
          <small>Khu vực</small>
          <b>{careRequest.district}</b>
        </span>
      </div>
      <div className="meta-item">
        <Icon.user />
        <span>
          <small>{nurseLabel}</small>
          <b>{nurse ? <Link to={`/patient/nurses/${nurse.id}`}>{nurse.name}</Link> : '—'}</b>
        </span>
      </div>
    </div>
  )
}

// Shown instead of a dead-end "no nurse found": the closest verified nurses, with what differs.
function AlternativeNurses({ careRequest, alternatives }) {
  const declined = careRequest.declinedNurseIds?.length || 0
  return (
    <>
      <div className="matching-bar is-alternative">
        <span className="pulse" />
        <span>
          <b>
            {declined ? 'Các điều dưỡng đã chọn chưa nhận ca' : 'Chưa có điều dưỡng khớp hoàn toàn'} · {alternatives.length} điều dưỡng thay thế
          </b>
          <small>
            Gợi ý gần nhất theo chuyên môn, khu vực {careRequest.district} và lịch rảnh. Điểm khác biệt được ghi rõ trên từng hồ sơ.
          </small>
        </span>
        <Button size="small" onClick={() => retryMatching(careRequest.id)}>
          Tìm lại
        </Button>
      </div>
      {alternatives.length === 0 && (
        <p className="detail-text">Tất cả điều dưỡng đang hoạt động đều đã được đề xuất. Bệnh viện điều phối sẽ liên hệ để hỗ trợ bạn.</p>
      )}
      <div className="match-grid">
        {alternatives.map(({ nurse, score, reasons }) => (
          <NurseProfileCard
            key={nurse.id}
            nurse={nurse}
            matchScore={`${score}%`}
            careType={careRequest.careType}
            reasons={reasons}
            profileHref={`/patient/nurses/${nurse.id}`}
            selectLabel="Chọn thay thế"
            onSelect={(n) => selectNurseForCareRequest(careRequest.id, n.id)}
          />
        ))}
      </div>
    </>
  )
}

export default function CareRequestBody({ careRequest, showCancel = true }) {
  const state = useDb()
  const [cancelOpen, setCancelOpen] = useState(false)
  const selectedNurse = careRequest.selectedNurseId ? getNurse(state, careRequest.selectedNurseId) : null
  const canCancel = ![CARE_REQUEST_STATUS.COMPLETED, CARE_REQUEST_STATUS.CANCELLED].includes(careRequest.status)

  return (
    <>
      <div className="active-care-top" style={{ marginBottom: 6 }}>
        <div>
          <h3 style={{ margin: '0 0 2px' }}>{careTypeLabel(careRequest.careType)}</h3>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.8rem' }}>
            Mã yêu cầu <Link to={`/patient/request/${careRequest.id}`}>#{careRequest.id}</Link>
          </p>
        </div>
        <StatusBadge status={careRequest.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
      </div>

      {careRequest.status === CARE_REQUEST_STATUS.MATCHING && (
        <div className="matching-bar">
          <span className="pulse" />
          <span>
            <b>Đang tìm điều dưỡng phù hợp...</b>
            <small>Lọc theo chuyên môn, khu vực {careRequest.district} và lịch rảnh.</small>
          </span>
        </div>
      )}

      {careRequest.status === CARE_REQUEST_STATUS.MATCHED && (
        <>
          <div className="matching-bar">
            <span className="pulse" />
            <span>
              <b>Tìm thấy {careRequest.matchedNurseIds.length} điều dưỡng phù hợp</b>
              <small>Tất cả đều đã được bệnh viện xác minh và cấp phép cho loại ca này.</small>
            </span>
          </div>
          <div className="match-grid">
            {careRequest.matchedNurseIds.map((id) => {
              const nurse = getNurse(state, id)
              if (!nurse) return null
              return (
                <NurseProfileCard
                  key={id}
                  nurse={nurse}
                  matchScore="96%"
                  careType={careRequest.careType}
                  selectLabel="Chọn"
                  onSelect={(n) => selectNurseForCareRequest(careRequest.id, n.id)}
                />
              )
            })}
          </div>
        </>
      )}

      {careRequest.status === CARE_REQUEST_STATUS.NURSE_PENDING && (
        <>
          <Timeline careRequest={careRequest} />
          <Meta careRequest={careRequest} nurse={selectedNurse} nurseLabel="Điều dưỡng đã chọn" />
        </>
      )}

      {careRequest.status === CARE_REQUEST_STATUS.COMPLETED && (
        <>
          <Timeline careRequest={careRequest} />
          <Meta careRequest={careRequest} nurse={selectedNurse} nurseLabel="Điều dưỡng" />
          {careRequest.bookingId && (
            <Button component={Link} to={`/patient/bookings/${careRequest.bookingId}`} sx={{ mt: 2 }}>
              Xem lịch chăm sóc →
            </Button>
          )}
        </>
      )}

      {careRequest.status === CARE_REQUEST_STATUS.NO_MATCH && (
        <AlternativeNurses careRequest={careRequest} alternatives={getAlternativeNurses(state, careRequest)} />
      )}

      {careRequest.status === CARE_REQUEST_STATUS.CANCELLED && (
        <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Yêu cầu này đã được hủy.</p>
      )}

      {showCancel && canCancel && (
        <div style={{ marginTop: 18 }}>
          <Button variant="outlined" onClick={() => setCancelOpen(true)}>
            Hủy yêu cầu
          </Button>
        </div>
      )}

      <PatientConfirmDialog
        open={cancelOpen}
        title="Hủy yêu cầu chăm sóc?"
        description="Bạn có chắc muốn hủy yêu cầu này? Hành động này không thể hoàn tác."
        confirmLabel="Hủy yêu cầu"
        confirmColor="error"
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelCareRequest(careRequest.id)
          setCancelOpen(false)
        }}
      />
    </>
  )
}
