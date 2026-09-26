import { useParams } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useDb } from '../../lib/store'
import { getHospital, listNursesByHospital, setHospitalStatus } from '../../lib/db'
import { HOSPITAL_STATUS, HOSPITAL_STATUS_LABEL, NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

export default function HospitalAccountDetail() {
  const { id } = useParams()
  const state = useDb()
  const hospital = getHospital(state, id)

  if (!hospital) {
    return (
      <div className="empty-state">
        <h3>Không tìm thấy bệnh viện</h3>
      </div>
    )
  }

  const nurses = listNursesByHospital(state, id)

  return (
    <>
      <PageHead
        eyebrow="Partner network"
        title={hospital.name}
        description={`${hospital.address} · ${hospital.phone}`}
        action={<StatusBadge status={hospital.status} labelMap={HOSPITAL_STATUS_LABEL} />}
      />

      <div style={{ marginBottom: 20 }}>
        {hospital.status === HOSPITAL_STATUS.ACTIVE ? (
          <button type="button" className="btn ghost" onClick={() => setHospitalStatus(id, HOSPITAL_STATUS.SUSPENDED)}>
            Tạm ngưng tài khoản
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={() => setHospitalStatus(id, HOSPITAL_STATUS.ACTIVE)}>
            Kích hoạt lại
          </button>
        )}
      </div>

      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Điều dưỡng</th>
                <th>Cấp bậc</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {nurses.map((n) => (
                <tr key={n.id}>
                  <td>{n.name}</td>
                  <td>{n.rank}</td>
                  <td>
                    <StatusBadge status={n.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
