import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
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

export default function NurseProfileCard({ nurse, matchScore, careType, onSelect, selectLabel = 'Chọn', profileHref, reasons }) {
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
            <Icon.check /> {nurse.completedCases ?? 0} ca hoàn thành
          </span>
          <span>★ {nurse.rating ?? '—'}</span>
        </div>
        {reasons && (
          <ul className="fit-reasons">
            {reasons.map((r) => (
              <li key={r.label} className={r.ok ? 'ok' : 'warn'}>
                {r.ok ? '✓' : '!'} {r.label}
              </li>
            ))}
          </ul>
        )}
        <div className="nurse-card-actions" style={onSelect ? undefined : { gridTemplateColumns: '1fr' }}>
          {profileHref ? (
            <Button variant="outlined" component={Link} to={profileHref}>
              Xem hồ sơ
            </Button>
          ) : (
            <Button variant="outlined" onClick={() => setOpen(true)}>
              Xem hồ sơ
            </Button>
          )}
          {onSelect && (
            <Button variant="contained" onClick={() => onSelect(nurse)}>
              {selectLabel}
            </Button>
          )}
        </div>
      </article>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" aria-labelledby={`nurse-${nurse.id}-title`}>
        <div className="nurse-detail-body">
          <IconButton aria-label="Đóng" onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 18, top: 18, border: '1px solid var(--line)', borderRadius: '10px' }}>
            <Icon.close />
          </IconButton>
          <div className="detail-hero">
            <div className="nurse-avatar">{initials(nurse.name)}</div>
            <div>
              <span className="eyebrow">Verified nurse profile</span>
              <h2 id={`nurse-${nurse.id}-title`}>{nurse.name}</h2>
              <span className="specialty">
                {nurse.rank} · {hospital?.name}
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
              <b>{nurse.completedCases ?? 0}</b>
              <small>Ca hoàn thành</small>
            </div>
            <div className="detail-stat">
              <b>★ {nurse.rating ?? '—'}</b>
              <small>Đánh giá</small>
            </div>
          </div>
          <div className="detail-section">
            <h3>Chuyên môn được cấp phép</h3>
            <p className="detail-text">{nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || 'Chưa có phạm vi được cấp phép'}</p>
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
              <p className="detail-text">Chưa cập nhật</p>
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
            <Button variant="outlined" component={Link} to={`/patient/nurses/${nurse.id}`}>
              Trang hồ sơ đầy đủ
            </Button>
            {onSelect && (
              <Button
                variant="contained"
                onClick={() => {
                  setOpen(false)
                  onSelect(nurse)
                }}
              >
                {selectLabel} {nurse.name.split(' ').pop()}
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  )
}
