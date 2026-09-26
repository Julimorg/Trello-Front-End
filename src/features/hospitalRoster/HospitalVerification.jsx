import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getNurse, listNursesByHospital, setNurseAuthStatus } from '../../lib/db'
import { NURSE_AUTH_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function HospitalVerification() {
  const { session } = useAuth()
  const toast = useToast()
  const state = useDb()
  const pending = listNursesByHospital(state, session.id).filter((n) => n.authStatus === NURSE_AUTH_STATUS.DRAFT)
  const [target, setTarget] = useState(null)
  const [error, setError] = useState('')

  const handleVerify = () => {
    const result = setNurseAuthStatus(target.id, NURSE_AUTH_STATUS.AUTHORIZED)
    if (!result.ok) {
      setError(result.error)
      return
    }
    toast('Cấp phép thành công', 'Điều dưỡng đã được đưa vào nguồn matching.')
    setTarget(null)
  }

  return (
    <>
      <PageHead eyebrow="Credential verification" title="Xác minh hồ sơ" description="Đối chiếu chứng chỉ trước khi cấp quyền nhận ca trên CareShift." />

      {pending.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.shield />} title="Không có hồ sơ nào chờ xác minh" />
        </section>
      ) : (
        pending.map((n) => {
          const nurse = getNurse(state, n.id)
          return (
            <div className="notification-card" key={n.id}>
              <span className="notification-symbol">
                <Icon.shield />
              </span>
              <div>
                <h3>
                  {nurse.name} · {nurse.id}
                </h3>
                <p>{nurse.certificates.length > 0 ? `${nurse.certificates.length} chứng chỉ đã nộp` : 'Chưa nộp chứng chỉ hành nghề nào'}</p>
                <div className="notification-meta">
                  <span>
                    <Icon.file /> {nurse.certificates.length} tài liệu
                  </span>
                  <span>
                    <Icon.pin /> {nurse.serviceAreas.join(', ')}
                  </span>
                </div>
              </div>
              <div className="notification-actions">
                <Link to={`/hospital/admin/roster/${n.id}`} className="btn ghost small">
                  Yêu cầu bổ sung
                </Link>
                <button
                  type="button"
                  className="btn primary small"
                  onClick={() => {
                    setError('')
                    setTarget(nurse)
                  }}
                >
                  Xác minh &amp; cấp phép
                </button>
              </div>
            </div>
          )
        })
      )}

      <ConfirmDialog
        open={!!target}
        title="Xác minh & cấp phép"
        description={target ? `Cấp phép Authorized cho ${target.name} với toàn bộ chuyên môn đã khai báo?` : ''}
        confirmLabel="Cấp phép"
        onClose={() => setTarget(null)}
        onConfirm={handleVerify}
      >
        {error && (
          <div className="info-callout" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}>
            <Icon.info />
            <span>{error}</span>
          </div>
        )}
      </ConfirmDialog>
    </>
  )
}
