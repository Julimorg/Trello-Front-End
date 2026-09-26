import { useState } from 'react'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import CareRequestWizardModal from '../careRequest/CareRequestWizardModal'
import HospitalPatientPickerModal from '../careRequest/HospitalPatientPickerModal'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listNursesByHospital, manualReassignSession } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL, NURSE_AUTH_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function HospitalRequests() {
  const { session } = useAuth()
  const state = useDb()
  const hospitalNurses = listNursesByHospital(state, session.id)
  const hospitalNurseIds = new Set(hospitalNurses.map((n) => n.id))
  const [picks, setPicks] = useState({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [wizardPatientId, setWizardPatientId] = useState(null)

  const cannotPerformItems = state.bookings.flatMap((b) =>
    b.sessions.filter((s) => s.needsManualReassignment && hospitalNurseIds.has(s.nurseId)).map((s) => ({ booking: b, sessionItem: s })),
  )

  const availableNursesFor = (careType) => hospitalNurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && n.authorizedCareTypes.includes(careType))

  const relatedRequests = state.careRequests.filter(
    (r) => r.matchedNurseIds.some((id) => hospitalNurseIds.has(id)) || (r.selectedNurseId && hospitalNurseIds.has(r.selectedNurseId)),
  )

  return (
    <>
      <PageHead
        eyebrow="Care requests"
        title="Yêu cầu liên quan"
        description="Yêu cầu do bệnh viện tạo thay hoặc đang cần hỗ trợ điều phối."
        action={
          <button type="button" className="btn primary" onClick={() => setPickerOpen(true)}>
            <Icon.plus /> Tạo thay bệnh nhân
          </button>
        }
      />

      {cannotPerformItems.length > 0 && (
        <>
          <h2 className="section-title">Ca cần hỗ trợ đổi điều dưỡng</h2>
          <div className="stack-gap-12" style={{ marginBottom: 24 }}>
            {cannotPerformItems.map(({ booking, sessionItem }) => {
              const careRequest = getCareRequest(state, booking.careRequestId)
              const patient = getPatient(state, booking.patientId)
              const originalNurse = getNurse(state, sessionItem.history?.[sessionItem.history.length - 1]?.nurseId)
              const candidates = careRequest ? availableNursesFor(careRequest.careType) : []
              return (
                <div className="panel panel-body" key={sessionItem.id}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '.95rem' }}>
                    {patient?.name} · {careRequest ? careTypeLabel(careRequest.careType) : ''}
                  </h3>
                  <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: '.78rem' }}>
                    Buổi {formatDate(sessionItem.date)} · {sessionItem.start}-{sessionItem.end} · Điều dưỡng cũ: {originalNurse?.name}
                  </p>
                  {sessionItem.history?.length > 0 && (
                    <div className="info-callout" style={{ background: 'var(--amber-soft)', color: 'var(--amber)', marginBottom: 12 }}>
                      <Icon.info />
                      <span>Lý do: {sessionItem.history[sessionItem.history.length - 1].reason}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select value={picks[sessionItem.id] || ''} onChange={(e) => setPicks((p) => ({ ...p, [sessionItem.id]: e.target.value }))} style={{ minWidth: 220 }}>
                      <option value="">— Chọn điều dưỡng thay thế —</option>
                      {candidates.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={!picks[sessionItem.id]}
                      onClick={() => manualReassignSession({ bookingId: booking.id, sessionId: sessionItem.id, nurseId: picks[sessionItem.id] })}
                    >
                      Xác nhận đổi
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <section className="panel">
        {relatedRequests.length === 0 ? (
          <EmptyState icon={<Icon.file />} title="Chưa có yêu cầu liên quan" />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã yêu cầu</th>
                  <th>Bệnh nhân</th>
                  <th>Nhu cầu</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {relatedRequests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b>#{r.id}</b>
                    </td>
                    <td>{getPatient(state, r.patientId)?.name}</td>
                    <td>{careTypeLabel(r.careType)}</td>
                    <td>
                      {formatDate(r.desiredStartDate)} · {r.timeSlot?.start}
                    </td>
                    <td>
                      <StatusBadge status={r.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <HospitalPatientPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={(patientId) => {
          setPickerOpen(false)
          setWizardPatientId(patientId)
        }}
      />
      <CareRequestWizardModal
        open={!!wizardPatientId}
        onClose={() => setWizardPatientId(null)}
        patientId={wizardPatientId}
        createdBy="hospital"
        onCreated={() => setWizardPatientId(null)}
      />
    </>
  )
}
