import { useRef, useState } from 'react'
import Button from '@mui/material/Button'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import FamilyLinkModal from './FamilyLinkModal'
import FamilyQrDialog from './FamilyQrDialog'
import PatientConfirmDialog from '../../patient/PatientConfirmDialog'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { getPatient, getPrimaryFamilyContact, removeFamilyContact, respondFamilyRequest, resendFamilyInvite, setPrimaryFamilyContact } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const LINKED = 'Đã liên kết'

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
  const primary = getPrimaryFamilyContact(state, session.id)
  const [linkOpen, setLinkOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  // { type: 'set' | 'unset', contact } — kept after closing so the dialog text doesn't change mid-fade.
  const [confirm, setConfirm] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const askConfirm = (next) => {
    setConfirm(next)
    setConfirmOpen(true)
  }
  const gridRef = useRef(null)
  const [removing, setRemoving] = useState(null)

  useStaggerIn(gridRef, '.family-card', [patient?.familyContacts.length])

  if (!patient) return null

  // Invites other CareShift accounts have sent to this account.
  const incoming = (state.familyRequests || []).filter((r) => r.toPatientId === session.id && r.status === 'pending')

  // Primary contact first, then linked, then pending invites.
  const contacts = [...patient.familyContacts].sort(
    (a, b) => Number(b.primary) - Number(a.primary) || Number(b.status === LINKED) - Number(a.status === LINKED),
  )

  const makePrimary = (contact) => {
    if (primary) {
      askConfirm({ type: 'set', contact })
      return
    }
    setPrimaryFamilyContact(session.id, contact.id)
    toast('Đã đặt người liên hệ ưu tiên', `${contact.name} sẽ nhận cảnh báo SOS trước.`)
  }

  const applyConfirm = () => {
    if (confirm.type === 'set') {
      setPrimaryFamilyContact(session.id, confirm.contact.id)
      toast('Đã đổi người liên hệ ưu tiên', `${confirm.contact.name} sẽ nhận cảnh báo SOS trước.`)
    } else {
      setPrimaryFamilyContact(session.id, null)
      toast('Đã gỡ người liên hệ ưu tiên', 'Bạn có thể đặt lại một người thân làm ưu tiên bất kỳ lúc nào.')
    }
    setConfirmOpen(false)
  }

  return (
    <>
      <PageHead
        eyebrow="Family & emergency contacts"
        title="Người thân liên kết"
        description="Cho phép người thân nhận cảnh báo SOS và theo dõi những thông tin bạn chủ động chia sẻ."
        action={
          <div className="panel-head-actions">
            <Button variant="outlined" startIcon={<Icon.qr />} onClick={() => setQrOpen(true)}>
              Tạo mã QR liên kết
            </Button>
            <Button variant="contained" startIcon={<Icon.plus />} onClick={() => setLinkOpen(true)}>
              Liên kết người thân
            </Button>
          </div>
        }
      />

      {incoming.length > 0 && (
        <section className="panel family-incoming">
          <div className="panel-head">
            <div>
              <h2>Lời mời liên kết đến bạn ({incoming.length})</h2>
              <p>Người dùng CareShift khác muốn thêm bạn là người thân</p>
            </div>
          </div>
          <div className="family-incoming-list">
            {incoming.map((r) => {
              const from = getPatient(state, r.fromPatientId)
              return (
                <div className="family-incoming-item" key={r.id}>
                  <span className="family-avatar">{initials(from?.name)}</span>
                  <div className="family-incoming-main">
                    <b>{from?.name}</b>
                    <small>
                      Muốn liên kết với bạn · gửi {formatDate(r.createdAt)}
                    </small>
                    <div className="family-permissions">
                      {r.permissions.map((p) => (
                        <span key={p}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="family-incoming-actions">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        respondFamilyRequest(r.id, true)
                        toast('Đã liên kết người thân', `${from?.name} đã được thêm vào danh sách người thân của bạn.`)
                      }}
                    >
                      Chấp nhận
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => {
                        respondFamilyRequest(r.id, false)
                        toast('Đã từ chối lời mời', `${from?.name} sẽ nhận được thông báo.`)
                      }}
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className={`family-primary-strip${primary?.status === LINKED ? '' : ' is-warning'}`}>
        <Icon.shield aria-hidden="true" />
        <span>
          {primary ? (
            <>
              <b>
                Người liên hệ ưu tiên: {primary.name} · {primary.relation}
              </b>
              <small>
                {primary.status === LINKED
                  ? 'Nhận cảnh báo khi bạn chọn “Báo người thân ưu tiên nhất”. Mỗi tài khoản chỉ có một người ưu tiên.'
                  : 'Người này chưa xác nhận lời mời, nên chưa nhận được cảnh báo SOS ưu tiên.'}
              </small>
            </>
          ) : (
            <>
              <b>Chưa có người liên hệ ưu tiên</b>
              <small>Đặt một người thân đã liên kết làm ưu tiên để dùng “Báo người thân ưu tiên nhất” khi khẩn cấp.</small>
            </>
          )}
        </span>
      </div>

      {contacts.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.users />} title="Chưa liên kết người thân nào" description="Hãy thêm ít nhất một người liên hệ để nhận cảnh báo khẩn cấp SOS." />
        </section>
      ) : (
        <div className="family-grid" ref={gridRef}>
          {contacts.map((c) => (
            <article className={`family-card${c.primary ? ' is-primary' : ''}`} key={c.id}>
              <div className="family-card-head">
                <span className="family-avatar">{initials(c.name)}</span>
                <div>
                  <h3>{c.name}</h3>
                  <p>
                    {c.relation} · {c.phone}
                  </p>
                </div>
                <StatusBadge label={c.status} tone={c.status === LINKED ? 'success' : 'pending'} />
              </div>
              <div className="family-permissions">
                {(c.permissions || []).map((p) => (
                  <span key={p}>{p}</span>
                ))}
                {(c.permissions || []).length === 0 && <span>Chưa cấp quyền nào</span>}
                {c.linkedPatientId && (
                  <span className="family-via-qr">
                    <Icon.user /> Tài khoản CareShift
                  </span>
                )}
                {c.inviteCode && (
                  <span className="family-via-qr">
                    <Icon.qr /> Liên kết qua mã QR
                  </span>
                )}
              </div>
              <div className="family-card-actions">
                {c.primary ? (
                  <>
                    <span className="status success">{c.status === LINKED ? 'Ưu tiên SOS' : 'Ưu tiên · chờ xác nhận'}</span>
                    <Button size="small" color="error" onClick={() => askConfirm({ type: 'unset', contact: c })}>
                      Gỡ ưu tiên
                    </Button>
                  </>
                ) : c.status === LINKED ? (
                  <>
                    <small>Có thể nhận cảnh báo theo quyền đã cấp</small>
                    <Button variant="outlined" size="small" onClick={() => makePrimary(c)}>
                      Đặt làm ưu tiên
                    </Button>
                  </>
                ) : (
                  <>
                    <small>{c.linkedPatientId ? `Đang chờ ${c.name} chấp nhận trong tài khoản của họ` : 'Đang chờ người thân xác nhận'}</small>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        if (c.linkedPatientId) resendFamilyInvite(session.id, c.id)
                        toast('Đã gửi lại lời mời', `Đang chờ ${c.name} xác nhận.`)
                      }}
                    >
                      Gửi lại lời mời
                    </Button>
                  </>
                )}
                <Button size="small" color="inherit" className="family-remove" onClick={() => setRemoving(c)}>
                  {c.status === LINKED ? 'Hủy liên kết' : 'Hủy lời mời'}
                </Button>
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

      <PatientConfirmDialog
        open={Boolean(removing)}
        title={removing?.status === LINKED ? 'Hủy liên kết người thân?' : 'Hủy lời mời?'}
        description={removing ? `${removing.name} sẽ không còn nhận cảnh báo SOS${removing.linkedPatientId && removing.status === LINKED ? ' và bạn cũng bị gỡ khỏi danh sách người thân của họ' : ''}.` : ''}
        confirmLabel="Xác nhận"
        confirmColor="error"
        onConfirm={() => {
          removeFamilyContact(session.id, removing.id)
          toast('Đã gỡ người thân', removing.name)
          setRemoving(null)
        }}
        onClose={() => setRemoving(null)}
      />
      <FamilyLinkModal open={linkOpen} onClose={() => setLinkOpen(false)} patientId={session.id} currentPrimary={primary} />
      <FamilyQrDialog open={qrOpen} onClose={() => setQrOpen(false)} patientId={session.id} />
      <PatientConfirmDialog
        open={confirmOpen}
        title={confirm?.type === 'unset' ? 'Gỡ người liên hệ ưu tiên?' : 'Đổi người liên hệ ưu tiên?'}
        description={
          confirm?.type === 'unset'
            ? `${confirm.contact.name} sẽ không còn là người ưu tiên. Nút “Báo người thân ưu tiên nhất” trong SOS sẽ không gửi được cho đến khi bạn chọn người khác.`
            : confirm
              ? `Mỗi tài khoản chỉ có một người ưu tiên. ${primary?.name} sẽ được thay bằng ${confirm.contact.name}.`
              : ''
        }
        confirmLabel={confirm?.type === 'unset' ? 'Gỡ ưu tiên' : 'Đổi người ưu tiên'}
        confirmColor={confirm?.type === 'unset' ? 'error' : 'primary'}
        onConfirm={applyConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
