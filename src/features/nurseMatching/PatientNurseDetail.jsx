import { useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, getNurse, getPricing, listBookingsByPatient, listCareRequestsByPatient } from '../../lib/db'
import { careTypeLabel, formatCurrency, formatDate, weekdayLabel } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL, SESSION_STATUS_LABEL } from '../../lib/constants'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function PatientNurseDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const state = useDb()
  const pageRef = useRef(null)
  const nurse = getNurse(state, id)

  useStaggerIn(pageRef, '.panel', [id])

  if (!nurse) {
    return (
      <section className="panel">
        <EmptyState icon={<Icon.user />} title="Không tìm thấy điều dưỡng" action={<Button onClick={() => navigate('/patient/nurses')}>Về danh sách</Button>} />
      </section>
    )
  }

  const hospital = getHospital(state, nurse.hospitalId)
  const requests = listCareRequestsByPatient(state, session.id).filter((r) => r.matchedNurseIds.includes(nurse.id) || r.selectedNurseId === nurse.id)
  const sessions = listBookingsByPatient(state, session.id)
    .flatMap((b) => b.sessions.filter((s) => s.nurseId === nurse.id).map((s) => ({ ...s, bookingId: b.id, careRequestId: b.careRequestId })))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div ref={pageRef}>
      <PageHead
        eyebrow="Verified nurse profile"
        title={nurse.name}
        description={`${nurse.rank} · ${hospital?.name}`}
        action={
          <Button variant="outlined" startIcon={<span aria-hidden="true">←</span>} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        }
      />

      <div className="dashboard-grid">
        <div className="stack-gap-12">
          <section className="panel panel-body">
            <div className="detail-hero" style={{ paddingRight: 0 }}>
              <div className="nurse-avatar">{initials(nurse.name)}</div>
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{nurse.name}</h2>
                <span className="specialty" style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  {hospital?.name} · {hospital?.district}
                </span>
                <span className="verified">
                  <Icon.shield /> Đã xác minh và cấp phép bởi bệnh viện
                </span>
              </div>
            </div>
            <div className="detail-stats">
              <div className="detail-stat">
                <b>{nurse.experienceYears} năm</b>
                <small>Kinh nghiệm</small>
              </div>
              <div className="detail-stat">
                <b>{nurse.completedCases}</b>
                <small>Ca hoàn thành</small>
              </div>
              <div className="detail-stat">
                <b>★ {nurse.rating ?? '—'}</b>
                <small>{nurse.reviewCount} đánh giá</small>
              </div>
            </div>
            <p className="detail-text">{nurse.bio}</p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Lịch sử chăm sóc cùng bạn</h2>
                <p>Các yêu cầu và buổi chăm sóc có điều dưỡng này</p>
              </div>
            </div>
            <div className="attention-list">
              {requests.length === 0 && sessions.length === 0 && <p className="form-hint" style={{ padding: '12px 0' }}>Chưa có lịch sử chăm sóc.</p>}
              {requests.map((r) => (
                <Link key={r.id} to={`/patient/request/${r.id}`} className="attention-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="attention-icon blue">
                    <Icon.file />
                  </span>
                  <span>
                    <b>
                      {careTypeLabel(r.careType)} · #{r.id}
                    </b>
                    <small>
                      {formatDate(r.desiredStartDate)} · {r.selectedNurseId === nurse.id ? 'Bạn đã chọn điều dưỡng này' : 'Được đề xuất'}
                    </small>
                  </span>
                  <StatusBadge status={r.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
                </Link>
              ))}
              {sessions.map((s) => (
                <Link key={s.id} to={`/patient/bookings/${s.bookingId}`} className="attention-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="attention-icon green">
                    <Icon.calendar />
                  </span>
                  <span>
                    <b>
                      Buổi chăm sóc {formatDate(s.date)} · {s.start}–{s.end}
                    </b>
                    <small>Thuộc lịch {s.bookingId}</small>
                  </span>
                  <StatusBadge status={s.status} labelMap={SESSION_STATUS_LABEL} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="stack-gap-12">
          <section className="panel panel-body">
            <h3 className="detail-heading">Chuyên môn được cấp phép &amp; giá tham khảo</h3>
            {nurse.authorizedCareTypes.map((c) => {
              const price = getPricing(state, nurse.hospitalId, c)
              return (
                <div className="review-row" key={c}>
                  <span>{careTypeLabel(c)}</span>
                  <b>{price ? `${formatCurrency(price.price)} / ${price.unit}` : 'Liên hệ để biết giá'}</b>
                </div>
              )
            })}
            {nurse.authorizedCareTypes.length === 0 && <p className="detail-text">Chưa có phạm vi được cấp phép</p>}
            <h3 className="detail-heading">Khu vực phục vụ</h3>
            <div className="chip-row">
              {nurse.serviceAreas.map((a) => (
                <Chip key={a} variant="outlined" label={a} icon={<Icon.pin style={{ width: 14, height: 14 }} />} />
              ))}
            </div>
          </section>
          <section className="panel panel-body">
            <h3 className="detail-heading" style={{ marginTop: 0 }}>
              Lịch rảnh ngoài giờ trực
            </h3>
            {nurse.availability.length === 0 && <p className="detail-text">Chưa cập nhật</p>}
            {nurse.availability.map((a) => (
              <div className="review-row" key={a.id}>
                <span>{weekdayLabel(a.weekday)}</span>
                <b>
                  {a.start} – {a.end}
                </b>
              </div>
            ))}
            <h3 className="detail-heading">Chứng chỉ hành nghề</h3>
            {nurse.certificates.map((c) => (
              <div className="credential" key={c.id} style={{ marginBottom: 8 }}>
                <Icon.shield />
                <span>
                  <b>{c.name}</b>
                  <small>
                    Số {c.number} · Cấp bởi {c.issuedBy}
                  </small>
                </span>
              </div>
            ))}
            {nurse.certificates.length === 0 && <p className="detail-text">Chưa cập nhật</p>}
          </section>
        </div>
      </div>
    </div>
  )
}
