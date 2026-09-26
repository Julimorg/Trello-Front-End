import { useState } from 'react'
import Modal, { ModalCloseButton } from '../../components/Modal'
import { useDb } from '../../lib/store'
import { getHospital, getPricing } from '../../lib/db'
import { careTypeLabel, formatCurrency } from '../../lib/format'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function NurseProfileCard({ nurse, matchScore, careType, onSelect, selectLabel = 'Chọn' }) {
  const state = useDb()
  const [open, setOpen] = useState(false)
  const hospital = getHospital(state, nurse.hospitalId)
  const price = careType ? getPricing(state, nurse.hospitalId, careType) : null

  return (
    <>
      <article className="nurse-card">
        <div className="nurse-card-top">
          {matchScore && <span className="match-score">Phù hợp {matchScore}</span>}
          <div className="nurse-avatar">{initials(nurse.name)}</div>
          <h3>{nurse.name}</h3>
          <span className="specialty">{nurse.specialties.map(careTypeLabel).join(', ')}</span>
          <span className="verified">
            <Icon.shield /> Đã xác minh bởi {hospital?.name}
          </span>
        </div>
        <div className="match-reasons">
          <span>
            <Icon.pin /> {nurse.serviceAreas[0]}
          </span>
          <span>
            <Icon.clock /> {nurse.experienceYears} năm KN
          </span>
          <span>
            <Icon.check /> {nurse.rank}
          </span>
          <span>★ {nurse.rating ?? '—'}</span>
        </div>
        <div className="nurse-card-actions">
          <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
            Xem hồ sơ
          </button>
          {onSelect && (
            <button type="button" className="btn primary" onClick={() => onSelect(nurse)}>
              {selectLabel}
            </button>
          )}
        </div>
      </article>

      <Modal open={open} onClose={() => setOpen(false)} className="nurse-detail" labelledBy="nurseDetailTitle">
        <ModalCloseButton onClose={() => setOpen(false)} floating />
        <div className="detail-hero">
          <div className="nurse-avatar">{initials(nurse.name)}</div>
          <div>
            <span className="eyebrow">Verified nurse profile</span>
            <h2 id="nurseDetailTitle">{nurse.name}</h2>
            <span className="specialty">
              {nurse.specialties.map(careTypeLabel).join(', ')} · {hospital?.name}
            </span>
            <span className="verified">
              <Icon.shield /> Đã xác minh và cấp phép
            </span>
          </div>
        </div>
        <div className="detail-stats">
          <div className="detail-stat">
            <b>{nurse.experienceYears} năm</b>
            <small>Kinh nghiệm</small>
          </div>
          <div className="detail-stat">
            <b>{nurse.rank}</b>
            <small>Cấp bậc</small>
          </div>
          <div className="detail-stat">
            <b>★ {nurse.rating ?? '—'}</b>
            <small>Đánh giá</small>
          </div>
        </div>
        <div className="detail-section">
          <h3>Chuyên môn được cấp phép</h3>
          <p style={{ fontSize: '.76rem', color: 'var(--muted)', margin: 0 }}>
            {nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || 'Chưa có phạm vi được cấp phép'}
          </p>
        </div>
        <div className="detail-section">
          <h3>Khu vực phục vụ</h3>
          <p style={{ fontSize: '.76rem', color: 'var(--muted)', margin: 0 }}>{nurse.serviceAreas.join(', ')}</p>
        </div>
        <div className="detail-section">
          <h3>Chứng chỉ hành nghề</h3>
          {nurse.certificates.length > 0 ? (
            <div className="credential">
              <Icon.shield />
              <span>
                <b>{nurse.certificates[0].name}</b>
                <small>
                  Số {nurse.certificates[0].number} · Cấp bởi {nurse.certificates[0].issuedBy}
                </small>
              </span>
            </div>
          ) : (
            <p style={{ fontSize: '.76rem', color: 'var(--muted)', margin: 0 }}>Chưa cập nhật</p>
          )}
        </div>
        {price && (
          <div className="info-callout">
            <Icon.info />
            <span>
              Giá tham khảo: {formatCurrency(price.price)} / {price.unit} (thanh toán ngoài hệ thống)
            </span>
          </div>
        )}
        <div className="detail-actions">
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
            Để sau
          </button>
          {onSelect && (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setOpen(false)
                onSelect(nurse)
              }}
            >
              {selectLabel} {nurse.name.split(' ').pop()}
            </button>
          )}
        </div>
      </Modal>
    </>
  )
}
