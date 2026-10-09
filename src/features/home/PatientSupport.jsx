import { useState } from 'react'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import PatientConfirmDialog from '../../patient/PatientConfirmDialog'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { createTicket, replyTicket } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { TICKET_CATEGORIES, TICKET_STATUS_META } from '../../Data/admin/support-data'

// "Liên hệ hỗ trợ" on the patient profile: send a request to CareShift and read the replies.
export default function PatientSupport({ patient }) {
  const toast = useToast()
  const state = useDb()
  const [openId, setOpenId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ category: TICKET_CATEGORIES[0], subject: '', message: '' })
  const [reply, setReply] = useState('')
  const mine = (state.tickets || []).filter((t) => t.requesterRole === 'patient' && t.requesterId === patient.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const submit = () => {
    const id = createTicket({ requesterRole: 'patient', requesterId: patient.id, requesterName: patient.name, subject: form.subject.trim(), category: form.category, message: form.message.trim(), priority: form.category === 'Cảnh báo SOS' ? 'urgent' : 'normal' })
    setCreating(false)
    setForm({ category: TICKET_CATEGORIES[0], subject: '', message: '' })
    setOpenId(id)
    toast('Đã gửi yêu cầu hỗ trợ', 'CareShift sẽ trả lời bạn trong thời gian sớm nhất.')
  }

  return (
    <section className="panel" style={{ marginTop: 20 }}>
      <div className="panel-head">
        <div>
          <h2>Hỗ trợ</h2>
          <p>Gặp vấn đề hoặc muốn góp ý? Gửi cho đội ngũ CareShift.</p>
        </div>
        <Button variant="outlined" size="small" onClick={() => setCreating(true)}>
          Gửi yêu cầu hỗ trợ
        </Button>
      </div>
      {mine.length === 0 ? (
        <p className="detail-text" style={{ padding: '16px 20px' }}>
          Bạn chưa gửi yêu cầu hỗ trợ nào.
        </p>
      ) : (
        <div className="support-list">
          {mine.map((t) => {
            const expanded = openId === t.id
            const meta = TICKET_STATUS_META[t.status]
            return (
              <div key={t.id} className="support-item">
                <button type="button" className="support-item-head" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : t.id)}>
                  <span>
                    <b>{t.subject}</b>
                    <small>
                      {t.category} · cập nhật {dayjs(t.updatedAt).fromNow()}
                    </small>
                  </span>
                  <span className={`status ${t.status === 'resolved' ? 'success' : t.status === 'waiting' ? 'pending' : 'info'}`}>{t.status === 'waiting' ? 'CareShift đã trả lời' : meta.label}</span>
                </button>
                <Collapse in={expanded} unmountOnExit>
                  <div className="support-thread">
                    {t.messages.map((m) => (
                      <div key={m.id} className={`support-msg${m.from === 'admin' ? ' is-admin' : ''}`}>
                        <b>{m.from === 'admin' ? 'CareShift' : 'Bạn'}</b>
                        <p>{m.text}</p>
                        <small>{formatDateTime(m.at)}</small>
                      </div>
                    ))}
                    {t.status !== 'resolved' && (
                      <div className="support-reply">
                        <TextField size="small" fullWidth multiline minRows={2} placeholder="Nhập phản hồi…" value={reply} onChange={(e) => setReply(e.target.value)} />
                        <Button
                          variant="contained"
                          size="small"
                          disabled={!reply.trim()}
                          onClick={() => {
                            replyTicket(t.id, { from: 'requester', author: patient.name, text: reply.trim() })
                            setReply('')
                          }}
                        >
                          Gửi
                        </Button>
                      </div>
                    )}
                  </div>
                </Collapse>
              </div>
            )
          })}
        </div>
      )}

      <PatientConfirmDialog open={creating} title="Gửi yêu cầu hỗ trợ" confirmLabel="Gửi" confirmDisabled={!form.subject.trim() || !form.message.trim()} onClose={() => setCreating(false)} onConfirm={submit}>
        <div className="stack-gap-8" style={{ display: 'grid', gap: 14, marginTop: 4 }}>
          <TextField select label="Loại vấn đề" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {TICKET_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Tiêu đề" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} slotProps={{ htmlInput: { maxLength: 100 } }} />
          <TextField label="Mô tả chi tiết" multiline minRows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          <small className="detail-text">Trường hợp khẩn cấp hãy dùng nút SOS thay vì gửi yêu cầu hỗ trợ.</small>
        </div>
      </PatientConfirmDialog>
    </section>
  )
}
