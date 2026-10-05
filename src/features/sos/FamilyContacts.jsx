import { useRef, useState } from 'react'
import Button from '@mui/material/Button'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import FamilyLinkModal from './FamilyLinkModal'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { getPatient, setPrimaryFamilyContact } from '../../lib/db'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function FamilyContacts() {
  const { session } = useAuth()
  const toast = useToast()
  const state = useDb()
  const patient = getPatient(state, session.id)
  const [linkOpen, setLinkOpen] = useState(false)
  const gridRef = useRef(null)

  useStaggerIn(gridRef, '.family-card', [patient?.familyContacts.length])

  if (!patient) return null

  return (
    <>
      <PageHead
        eyebrow="Family & emergency contacts"
        title="Người thân liên kết"
        description="Cho phép người thân nhận cảnh báo SOS và theo dõi những thông tin bạn chủ động chia sẻ."
        action={
          <Button variant="contained" startIcon={<Icon.plus />} onClick={() => setLinkOpen(true)}>
            Liên kết người thân
          </Button>
        }
      />

      {patient.familyContacts.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.users />} title="Chưa liên kết người thân nào" description="Hãy thêm ít nhất một người liên hệ để nhận cảnh báo khẩn cấp SOS." />
        </section>
      ) : (
        <div className="family-grid" ref={gridRef}>
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
                <StatusBadge label={c.status} tone={c.status === 'Đã liên kết' ? 'success' : 'pending'} />
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
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setPrimaryFamilyContact(session.id, c.id)
                      toast('Đã đổi người liên hệ ưu tiên', 'Cảnh báo SOS sẽ được gửi tới người này trước.')
                    }}
                  >
                    Đặt làm ưu tiên
                  </Button>
                ) : c.primary ? (
                  <span className="status success">Ưu tiên SOS</span>
                ) : (
                  <Button variant="outlined" size="small" onClick={() => toast('Đã gửi lại lời mời', `Đang chờ ${c.name} xác nhận.`)}>
                    Gửi lại lời mời
                  </Button>
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

      <FamilyLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} patientId={session.id} />
    </>
  )
}
