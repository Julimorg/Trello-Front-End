import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import CareRequestWizardModal from './CareRequestWizardModal'
import CareRequestBody from './CareRequestBody'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listCareRequestsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS, CARE_REQUEST_STATUS_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

const IN_FLIGHT = [CARE_REQUEST_STATUS.MATCHING, CARE_REQUEST_STATUS.MATCHED, CARE_REQUEST_STATUS.NURSE_PENDING]

export default function CareRequestHome() {
  const { session } = useAuth()
  const state = useDb()
  const [wizardOpen, setWizardOpen] = useState(false)
  const requests = listCareRequestsByPatient(state, session.id)
  const active = requests.find((r) => IN_FLIGHT.includes(r.status))
  const history = requests.filter((r) => r.id !== active?.id)

  return (
    <>
      <PageHead
        eyebrow="Care Request"
        title="Yêu cầu chăm sóc"
        description="Mô tả nhu cầu một lần để CareShift tìm điều dưỡng phù hợp nhất."
        action={
          <button type="button" className="btn primary" onClick={() => setWizardOpen(true)}>
            <Icon.plus /> Tạo yêu cầu
          </button>
        }
      />

      {active ? (
        <section className="panel">
          <div className="active-care">
            <CareRequestBody careRequest={active} />
          </div>
        </section>
      ) : (
        <section className="panel">
          <EmptyState
            icon={<Icon.search />}
            title="Chưa có yêu cầu nào"
            description="Bắt đầu bằng loại chăm sóc, khu vực và thời gian mong muốn."
            action={
              <button type="button" className="btn secondary" onClick={() => setWizardOpen(true)}>
                Tạo yêu cầu đầu tiên
              </button>
            }
          />
        </section>
      )}

      {history.length > 0 && (
        <>
          <h2 className="section-title">Lịch sử yêu cầu</h2>
          <div className="stack-gap-12">
            {history.map((r) => (
              <Link key={r.id} to={`/patient/request/${r.id}`} className="notification-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="notification-symbol">
                  <Icon.file />
                </span>
                <div>
                  <h3>{careTypeLabel(r.careType)}</h3>
                  <p>
                    {r.district} · {formatDate(r.desiredStartDate)}
                  </p>
                </div>
                <StatusBadge status={r.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
              </Link>
            ))}
          </div>
        </>
      )}

      <CareRequestWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} patientId={session.id} createdBy="patient" onCreated={() => setWizardOpen(false)} />
    </>
  )
}
