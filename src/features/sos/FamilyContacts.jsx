import { useState } from 'react'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import FamilyLinkModal from './FamilyLinkModal'
import SosButton from './SosButton'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { getPatient, getPrimaryFamilyContact, setPrimaryFamilyContact } from '../../lib/db'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function statusTone(status) {
  return status === 'Đã liên kết' ? 'success' : 'pending'
}

export default function FamilyContacts() {
  const { session } = useAuth()
  const toast = useToast()
  const state = useDb()
  const patient = getPatient(state, session.id)
  const primary = getPrimaryFamilyContact(state, session.id)
  const [linkOpen, setLinkOpen] = useState(false)

  if (!patient) return null

  return (
    <>
      <PageHead
        eyebrow="Family & emergency contacts"
        title="Người thân liên kết"
        description="Cho phép người thân nhận cảnh báo SOS và theo dõi những thông tin bạn chủ động chia sẻ."
        action={
          <button type="button" className="btn primary" onClick={() => setLinkOpen(true)}>
            <Icon.plus /> Liên kết người thân
          </button>
        }
      />

      {patient.familyContacts.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            <div className="empty-icon">
              <Icon.users />
            </div>
            <h3>Chưa liên kết người thân nào</h3>
            <p>Hãy thêm ít nhất một người liên hệ để nhận cảnh báo khẩn cấp SOS.</p>
          </div>
        </section>
      ) : (
        <div className="family-grid">
          {patient.familyContacts.map((c) => (
            <article className="family-card" key={c.id}>
              <div className="family-card-head">
                <span className="family-avatar">{initials(c.name)}</span>
                <div>
                  <h3>{c.name}</h3>
                  <p>
                    {c.relation} · {c.phone}
                  </p>
                </div>
                <StatusBadge label={c.status} tone={statusTone(c.status)} />
              </div>
              <div className="family-permissions">
                {(c.permissions || []).map((p) => (
                  <span key={p}>{p}</span>
                ))}
                {(c.permissions || []).length === 0 && <span>Chưa cấp quyền nào</span>}
              </div>
              <div className="family-card-actions">
                <small>{c.primary ? 'Người liên hệ khẩn cấp ưu tiên' : 'Có thể nhận cảnh báo theo quyền đã cấp'}</small>
                {c.status === 'Đã liên kết' && !c.primary ? (
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => {
                      setPrimaryFamilyContact(session.id, c.id)
                      toast('Đã đổi người liên hệ ưu tiên', 'Cảnh báo SOS sẽ được gửi tới người này trước.')
                    }}
                  >
                    Đặt làm ưu tiên
                  </button>
                ) : c.primary ? (
                  <span className="status success">Ưu tiên SOS</span>
                ) : (
                  <button type="button" className="btn ghost small" onClick={() => toast('Đã gửi lại lời mời', `Đang chờ ${c.name} xác nhận.`)}>
                    Gửi lại lời mời
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="family-safety-note">
        <Icon.shield />
        <span>
          <b>Quyền riêng tư do bạn kiểm soát.</b> Người thân chỉ xem được các nội dung đã được cấp quyền. Vị trí chính xác chỉ được chia sẻ khi SOS được kích hoạt.
        </span>
      </div>

      <SosButton role="patient" familyLabel={primary ? `${primary.name} · ${primary.relation}` : ''} onNeedFamilyLink={() => setLinkOpen(true)} />

      <FamilyLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} patientId={session.id} />
    </>
  )
}
