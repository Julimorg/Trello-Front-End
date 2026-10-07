import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import PatientConfirmDialog from '../../patient/PatientConfirmDialog'
import CareProgress from './CareProgress'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getBooking, getCareRequest, getHospital, getNurse, getPatient, requestReschedule } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { BOOKING_STATUS_LABEL, SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'
import { CARE_PLANS } from '../../Data/patient/care-progress-data'
import { certificateStatus } from '../hospitalAdmin/admin-shared'
import { bookingSummary, formatDuration, frequencyText, isDone, minutesBetween, relativeDay, visitWork, weekdayLong } from './booking-shared'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const TABS = [
  { value: 'process', label: 'Quá trình chăm sóc' },
  { value: 'plan', label: 'Kế hoạch & công việc' },
  { value: 'nurse', label: 'Điều dưỡng' },
  { value: 'progress', label: 'Tiến triển' },
]

const initials = (name) =>
  (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

function Fact({ icon, label, children }) {
  const Ico = Icon[icon]
  return (
    <div className="fact">
      {Ico && <Ico />}
      <span>
        <small>{label}</small>
        <b>{children}</b>
      </span>
    </div>
  )
}

// One visit, expandable: what was done, the nurse's note and measurements.
function SessionRow({ session, index, total, careType, nurse, today, onReschedule, state }) {
  const [open, setOpen] = useState(false)
  const work = visitWork(session, careType)
  const done = isDone(session, today)
  const o = session.observation
  const canExpand = done || session.nurseNote || o
  return (
    <div className={`visit${session.date === today ? ' is-today' : ''}`}>
      <div className="visit-row">
        <div className="day-session-time">
          <b>{dayjs(session.date).format('DD/MM')}</b>
          <small>{session.date === today ? 'Hôm nay' : dayjs(session.date).format('YYYY')}</small>
        </div>
        <div className="visit-main">
          <h3>
            Buổi {index + 1}/{total} · {session.start} – {session.end}
          </h3>
          <p>
            {weekdayLong(session.date)} · {formatDuration(minutesBetween(session.start, session.end))}
            {' · '}
            {nurse ? <Link to={`/patient/nurses/${nurse.id}`}>{nurse.name}</Link> : '—'}
            {session.status === SESSION_STATUS.CANNOT_PERFORM && ' · Đang tìm điều dưỡng thay thế'}
          </p>
          {done && (
            <p className="visit-done">
              Hoàn thành {work.done.length}/{work.tasks.length} đầu việc{session.completedAt ? ` · lúc ${dayjs(session.completedAt).format('HH:mm')}` : ''}
            </p>
          )}
          {!done && session.status !== SESSION_STATUS.CANNOT_PERFORM && session.date >= today && <p className="visit-done is-upcoming">{relativeDay(session.date, today)}</p>}
        </div>
        <div className="day-session-side">
          <StatusBadge status={session.status} labelMap={SESSION_STATUS_LABEL} />
          {session.date >= today && !done && (
            <Button size="small" onClick={() => onReschedule(session)}>
              Đổi lịch
            </Button>
          )}
          {canExpand && (
            <Button size="small" variant="outlined" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? 'Thu gọn' : 'Xem chi tiết'}
            </Button>
          )}
        </div>
      </div>
      <Collapse in={open} unmountOnExit>
        <div className="visit-detail">
          <div>
            <h4>Công việc trong buổi</h4>
            <ul className="mini-tasks">
              {work.tasks.map((t) => (
                <li key={t.id} className={work.done.includes(t.id) ? 'is-done' : ''}>
                  <span aria-hidden="true">{work.done.includes(t.id) ? '✓' : '○'}</span>
                  {t.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Diễn biến điều dưỡng ghi nhận</h4>
            <p className="detail-text">{session.nurseNote || o?.summary || 'Điều dưỡng chưa ghi chú cho buổi này.'}</p>
            {o && (
              <div className="observation-chips" style={{ marginTop: 10 }}>
                {o.vitals?.bp && <span>HA {o.vitals.bp}</span>}
                {o.vitals?.pulse && <span>Mạch {o.vitals.pulse}</span>}
                {o.vitals?.temp && <span>{String(o.vitals.temp).replace('.', ',')}°C</span>}
                {o.vitals?.spo2 && <span>SpO₂ {o.vitals.spo2}%</span>}
                {o.vitals?.glucose && <span>Đường huyết {String(o.vitals.glucose).replace('.', ',')}</span>}
                {typeof o.pain === 'number' && <span>Đau {o.pain}/10</span>}
                {(o.extras || []).map((e) => (
                  <span key={e.label}>
                    {e.label}: {e.value}
                  </span>
                ))}
              </div>
            )}
            {session.history?.length > 0 && (
              <p className="detail-text" style={{ marginTop: 10 }}>
                Đổi điều dưỡng: {getNurse(state, session.history[0].nurseId)?.name} báo không thể thực hiện — {session.history[0].reason}
              </p>
            )}
          </div>
        </div>
      </Collapse>
    </div>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const state = useDb()
  const listRef = useRef(null)
  const booking = getBooking(state, id)
  const [rescheduleSession, setRescheduleSession] = useState(null)
  const [note, setNote] = useState('')
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'process'

  useStaggerIn(listRef, '.visit', [id, tab])

  if (!booking) {
    return (
      <section className="panel">
        <EmptyState icon={<Icon.calendar />} title="Không tìm thấy lịch chăm sóc này" />
      </section>
    )
  }

  const nurse = getNurse(state, booking.nurseId)
  const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
  const careRequest = getCareRequest(state, booking.careRequestId)
  const patient = getPatient(state, booking.patientId)
  const today = dayjs().format('YYYY-MM-DD')
  const summary = bookingSummary(booking, today)
  const { sessions } = summary
  const careType = careRequest?.careType
  const plan = CARE_PLANS[careType] || CARE_PLANS.other
  const status = computeBookingStatus(booking)
  const substitutes = [...new Set(sessions.map((s) => s.nurseId))].filter((nid) => nid !== booking.nurseId).map((nid) => getNurse(state, nid)).filter(Boolean)
  const allTasks = visitWork(sessions[0] || {}, careType).tasks
  const doneSessions = sessions.filter((s) => isDone(s, today))
  const taskTotals = doneSessions.reduce(
    (acc, s) => {
      const w = visitWork(s, careType)
      return { done: acc.done + w.done.length, total: acc.total + w.tasks.length }
    },
    { done: 0, total: 0 },
  )

  return (
    <>
      <PageHead
        eyebrow="Booking & scheduling"
        title={`${careType ? careTypeLabel(careType) : 'Lịch chăm sóc'} · ${nurse?.name || ''}`}
        description={`${hospital?.name || ''} · Mã lịch ${booking.id}`}
        action={<StatusBadge status={status} labelMap={BOOKING_STATUS_LABEL} />}
      />

      <section className="panel panel-body booking-overview" style={{ marginBottom: 20 }}>
        <div className="booking-overview-progress">
          <div className="booking-overview-head">
            <div>
              <small>Tiến độ liệu trình</small>
              <b>
                {summary.done}/{summary.total} buổi
              </b>
            </div>
            <strong>{summary.percent}%</strong>
          </div>
          <div className="progress-line" role="progressbar" aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${summary.percent}%` }} />
          </div>
          <p className="detail-text">
            {summary.next
              ? `Buổi tiếp theo: ${weekdayLong(summary.next.date)}, ${formatDate(summary.next.date)} lúc ${summary.next.start} (${relativeDay(summary.next.date, today).toLowerCase()})`
              : summary.done === summary.total
                ? 'Đã hoàn thành toàn bộ liệu trình.'
                : 'Chưa có buổi sắp tới được xác nhận.'}
            {summary.needsNurse > 0 && ` · ${summary.needsNurse} buổi đang tìm điều dưỡng thay thế`}
          </p>
        </div>
        <div className="facts">
          <Fact icon="calendar" label="Thời gian liệu trình">
            {formatDate(summary.first?.date)}
            {summary.last?.date !== summary.first?.date ? ` → ${formatDate(summary.last?.date)}` : ''}
            <em>{summary.spanDays} ngày</em>
          </Fact>
          <Fact icon="clock" label="Thời lượng">
            {formatDuration(summary.perSessionMinutes)}/buổi
            <em>
              Tổng {formatDuration(summary.totalMinutes)} · đã chăm sóc {formatDuration(summary.doneMinutes)}
            </em>
          </Fact>
          <Fact icon="refresh" label="Tần suất">
            {careRequest ? frequencyText(careRequest) : '—'}
            <em>Khung giờ {summary.first?.start}–{summary.first?.end}</em>
          </Fact>
          <Fact icon="pin" label="Địa điểm chăm sóc">
            {patient?.address || careRequest?.district || '—'}
            <em>{careRequest?.district}</em>
          </Fact>
          <Fact icon="file" label="Yêu cầu gốc">
            {careRequest ? <Link to={`/patient/request/${careRequest.id}`}>#{careRequest.id}</Link> : '—'}
            <em>Tạo {formatDate(careRequest?.createdAt)}</em>
          </Fact>
          <Fact icon="check" label="Công việc đã làm">
            {taskTotals.total ? `${taskTotals.done}/${taskTotals.total} đầu việc` : 'Chưa có'}
            <em>{doneSessions.length} buổi đã hoàn thành</em>
          </Fact>
        </div>
      </section>

      <Tabs value={tab} onChange={(_, v) => setParams(v === 'process' ? {} : { tab: v }, { replace: true })} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile className="booking-tabs">
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} />
        ))}
      </Tabs>

      {tab === 'process' && (
        <>
          <section className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-head">
              <div>
                <h2>{sessions.length} buổi chăm sóc</h2>
                <p>Bấm “Xem chi tiết” để xem công việc đã làm và diễn biến mà điều dưỡng ghi nhận.</p>
              </div>
            </div>
            <div className="visit-list" ref={listRef}>
              {sessions.map((s, i) => (
                <SessionRow key={s.id} session={s} index={i} total={sessions.length} careType={careType} nurse={getNurse(state, s.nurseId)} today={today} state={state} onReschedule={(x) => { setRescheduleSession(x); setNote('') }} />
              ))}
            </div>
          </section>

          {sessions.some((s) => s.history?.length) && (
            <section className="panel panel-body" style={{ marginBottom: 20 }}>
              <h3 className="detail-heading" style={{ marginTop: 0 }}>
                Lịch sử thay đổi
              </h3>
              <div className="stack-gap-8">
                {sessions
                  .filter((s) => s.history?.length)
                  .flatMap((s) =>
                    s.history.map((h, i) => (
                      <p key={`${s.id}-${i}`} className="detail-text">
                        {formatDate(s.date)}: {getNurse(state, h.nurseId)?.name} báo không thể thực hiện — lý do: {h.reason}
                        {h.reportedAt ? ` (${formatDateTime(h.reportedAt)})` : ''}
                      </p>
                    )),
                  )}
              </div>
            </section>
          )}
        </>
      )}

      {tab === 'plan' && (
        <div className="plan-grid">
          <section className="panel panel-body">
            <h3 className="detail-heading">Bạn được chăm sóc những gì</h3>
            <p className="plan-lead">
              <b>{careType ? careTypeLabel(careType) : 'Chăm sóc tại nhà'}</b> — {plan.summary}
            </p>
            {careRequest?.notes && (
              <div className="plan-note">
                <small>Yêu cầu của bạn</small>
                <p>{careRequest.notes}</p>
              </div>
            )}
            <h3 className="detail-heading">Công việc điều dưỡng thực hiện mỗi buổi</h3>
            <ul className="mini-tasks">
              {allTasks.map((t) => (
                <li key={t.id}>
                  <span aria-hidden="true">•</span>
                  <span>
                    {t.label}
                    {t.hint && <small>{t.hint}</small>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel panel-body">
            <h3 className="detail-heading">Mục tiêu chăm sóc</h3>
            <ul className="plan-list is-goal">
              {plan.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <h3 className="detail-heading">Bạn và người nhà cần lưu ý</h3>
            <ul className="plan-list">
              {plan.instructions.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <h3 className="detail-heading">Dấu hiệu cần báo ngay</h3>
            <ul className="plan-list is-warning">
              {plan.warningSigns.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="detail-text" style={{ marginTop: 16 }}>Trường hợp khẩn cấp, nhấn nút SOS để gọi 115 hoặc báo người thân.</p>
          </section>
          <section className="panel panel-body plan-wide">
            <h3 className="detail-heading">Thông tin sức khỏe điều dưỡng được xem</h3>
            <div className="facts">
              <Fact icon="user" label="Bệnh nhân">
                {patient?.name}
                <em>
                  {patient?.gender} · {patient?.dateOfBirth ? `${dayjs().diff(patient.dateOfBirth, 'year')} tuổi` : ''} · Nhóm máu {patient?.bloodType || '—'}
                </em>
              </Fact>
              <Fact icon="info" label="Bệnh nền">
                {patient?.conditions || '—'}
              </Fact>
              <Fact icon="shield" label="Dị ứng">
                {patient?.allergies || 'Không'}
              </Fact>
              <Fact icon="file" label="Số BHYT">
                {patient?.insuranceNumber || '—'}
              </Fact>
            </div>
          </section>
        </div>
      )}

      {tab === 'nurse' && nurse && (
        <div className="plan-grid">
          <section className="panel panel-body nurse-full">
            <div className="nurse-full-head">
              <div className="nurse-avatar">{initials(nurse.name)}</div>
              <div>
                <h2>{nurse.name}</h2>
                <p>
                  {nurse.rank} · {nurse.experienceYears} năm kinh nghiệm
                </p>
                <div className="chip-row">
                  <Chip size="small" color="success" variant="outlined" label="Đã được bệnh viện xác minh" />
                  <Chip size="small" variant="outlined" label={`${nurse.completedCases} ca đã hoàn thành`} />
                </div>
              </div>
            </div>
            <p className="detail-text" style={{ marginTop: 14 }}>
              {nurse.bio}
            </p>
            <h3 className="detail-heading">Chuyên môn</h3>
            <div className="chip-row">
              {nurse.specialties.map((sp) => (
                <Chip key={sp} size="small" color={sp === careType ? 'primary' : 'default'} label={careTypeLabel(sp)} />
              ))}
            </div>
            <h3 className="detail-heading">Khu vực phục vụ</h3>
            <div className="chip-row">
              {nurse.serviceAreas.map((a) => (
                <Chip key={a} size="small" variant="outlined" label={a} />
              ))}
            </div>
            <div className="nurse-actions">
              <Button variant="outlined" component={Link} to={`/patient/nurses/${nurse.id}`}>
                Xem hồ sơ đầy đủ
              </Button>
              <Button variant="outlined" component="a" href={`tel:${nurse.phone}`}>
                Gọi {nurse.phone}
              </Button>
            </div>
          </section>

          <section className="panel panel-body">
            <h3 className="detail-heading">Chứng chỉ hành nghề</h3>
            {nurse.certificates.length === 0 ? (
              <p className="detail-text">Chưa có chứng chỉ nào được ghi nhận.</p>
            ) : (
              <div className="credential-list">
                {nurse.certificates.map((c) => {
                  const st = certificateStatus(c)
                  return (
                    <div className="credential" key={c.id}>
                      <Icon.shield />
                      <span>
                        <b>{c.name}</b>
                        <small>
                          Số {c.number} · {c.issuedBy}
                          {c.expiresAt ? ` · hết hạn ${formatDate(c.expiresAt)}` : ''}
                        </small>
                      </span>
                      <em className={`cred-state is-${st.key}`}>{st.label}</em>
                    </div>
                  )
                })}
              </div>
            )}
            <h3 className="detail-heading">Bệnh viện quản lý</h3>
            {hospital ? (
              <div className="hospital-block">
                <b>{hospital.name}</b>
                <p className="detail-text">{hospital.address}</p>
                <p className="detail-text">Điện thoại: {hospital.phone}</p>
              </div>
            ) : (
              <p className="detail-text">—</p>
            )}
            {substitutes.length > 0 && (
              <>
                <h3 className="detail-heading">Điều dưỡng thay thế trong liệu trình</h3>
                <div className="stack-gap-8">
                  {substitutes.map((sub) => (
                    <p key={sub.id} className="detail-text">
                      <Link to={`/patient/nurses/${sub.id}`}>{sub.name}</Link> · {sub.rank} · {sessions.filter((s) => s.nurseId === sub.id).length} buổi
                    </p>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'progress' && <CareProgress sessions={sessions} />}

      <p className="form-hint" style={{ marginTop: 20 }}>
        Nếu có bất thường trong lúc chăm sóc, nhấn nút SOS (có thể kéo đến vị trí thuận tiện) để gọi 115 hoặc báo người thân ngay.
      </p>

      <PatientConfirmDialog
        open={!!rescheduleSession}
        title="Yêu cầu đổi lịch"
        description={rescheduleSession ? `Gửi yêu cầu đổi lịch cho buổi ${formatDate(rescheduleSession.date)} tới bệnh viện.` : ''}
        confirmLabel="Gửi yêu cầu"
        confirmDisabled={!note.trim()}
        onClose={() => setRescheduleSession(null)}
        onConfirm={() => {
          requestReschedule({ bookingId: booking.id, sessionId: rescheduleSession.id, note })
          setRescheduleSession(null)
          toast('Đã gửi yêu cầu đổi lịch', 'Bệnh viện sẽ liên hệ để xác nhận thời gian mới.')
        }}
      >
        <TextField autoFocus fullWidth multiline minRows={3} label="Lý do / thời gian mong muốn" value={note} onChange={(e) => setNote(e.target.value)} />
      </PatientConfirmDialog>
    </>
  )
}
