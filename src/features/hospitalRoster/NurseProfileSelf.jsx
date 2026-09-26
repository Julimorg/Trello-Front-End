import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, getNurse } from '../../lib/db'
import { careTypeLabel, weekdayLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

export default function NurseProfileSelf() {
  const { session } = useAuth()
  const state = useDb()
  const nurse = getNurse(state, session.id)
  if (!nurse) return null
  const hospital = getHospital(state, nurse.hospitalId)

  return (
    <>
      <PageHead
        eyebrow="CareShift"
        title={nurse.name}
        description={`${nurse.rank} · ${nurse.experienceYears} năm kinh nghiệm · ${hospital?.name}`}
        action={<StatusBadge status={nurse.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />}
      />

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Phạm vi hành nghề</h2>
              <p>Thông tin xác minh do {hospital?.name} quản lý</p>
            </div>
          </div>
          <div className="panel-body">
            <span className="field-label">Phạm vi ca được phép</span>
            <div className="chip-row" style={{ marginBottom: 16 }}>
              {nurse.authorizedCareTypes.length > 0 ? (
                nurse.authorizedCareTypes.map((c) => (
                  <span className="chip-select selected" key={c} style={{ cursor: 'default' }}>
                    {careTypeLabel(c)}
                  </span>
                ))
              ) : (
                <p className="form-hint">Chưa được cấp phép ca nào. Vui lòng liên hệ quản trị bệnh viện.</p>
              )}
            </div>
            <span className="field-label">Khu vực phục vụ</span>
            <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--muted)' }}>{nurse.serviceAreas.join(', ') || 'Chưa cập nhật'}</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Chứng chỉ hành nghề</h2>
              <p>Đã đối chiếu bởi bệnh viện</p>
            </div>
          </div>
          <div className="attention-list">
            {nurse.certificates.map((c) => (
              <div className="attention-item" key={c.id}>
                <span className="attention-icon">✓</span>
                <span>
                  <b>{c.name}</b>
                  <small>
                    Số {c.number} · Cấp bởi {c.issuedBy}
                  </small>
                </span>
              </div>
            ))}
            {nurse.certificates.length === 0 && <p className="form-hint" style={{ padding: '0 18px 14px' }}>Chưa có chứng chỉ nào được ghi nhận.</p>}
          </div>
        </section>
      </div>

      <section className="panel section-gap">
        <div className="panel-head">
          <div>
            <h2>Lịch rảnh ngoài giờ trực</h2>
            <p>Do bệnh viện phê duyệt trước khi đưa vào Nurse Matching</p>
          </div>
        </div>
        <div className="attention-list">
          {nurse.availability.map((a) => (
            <div className="attention-item" key={a.id}>
              <span className="attention-icon blue">
                {a.start}
              </span>
              <span>
                <b>{weekdayLabel(a.weekday)}</b>
                <small>
                  {a.start} – {a.end}
                </small>
              </span>
            </div>
          ))}
          {nurse.availability.length === 0 && <p className="form-hint" style={{ padding: '0 18px 14px' }}>Chưa có khung giờ rảnh nào. Liên hệ quản trị bệnh viện để cập nhật.</p>}
        </div>
      </section>
    </>
  )
}
