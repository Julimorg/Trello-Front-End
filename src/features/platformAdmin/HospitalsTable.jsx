import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useDb } from '../../lib/store'
import { listNursesByHospital } from '../../lib/db'
import { HOSPITAL_STATUS_LABEL, NURSE_AUTH_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function HospitalsTable() {
  const state = useDb()

  return (
    <>
      <PageHead
        eyebrow="Partner network"
        title="Bệnh viện đối tác"
        description="Quản lý trạng thái hợp tác, nguồn điều dưỡng và hiệu suất vận hành."
        action={
          <Link to="/admin/hospitals/new" className="btn primary">
            <Icon.plus /> Thêm bệnh viện
          </Link>
        }
      />
      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bệnh viện</th>
                <th>Nguồn lực</th>
                <th>Tỷ lệ cấp phép</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.hospitals.map((h) => {
                const nurses = listNursesByHospital(state, h.id)
                const rate = nurses.length ? Math.round((nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED).length / nurses.length) * 100) : 0
                return (
                  <tr key={h.id}>
                    <td>
                      <div className="person-cell">
                        <span className="person-avatar">{initials(h.name) || 'BV'}</span>
                        <span>
                          <b>{h.name}</b>
                          <small>{h.district}</small>
                        </span>
                      </div>
                    </td>
                    <td>{nurses.length} điều dưỡng</td>
                    <td>
                      <b>{rate}%</b>
                      <div className="progress-line">
                        <span style={{ width: `${rate}%` }} />
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={h.status} labelMap={HOSPITAL_STATUS_LABEL} />
                    </td>
                    <td>
                      <Link to={`/admin/hospitals/${h.id}`} className="icon-mini">
                        <Icon.more />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
