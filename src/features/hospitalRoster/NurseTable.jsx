import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import NurseAddModal from './NurseAddModal'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listNursesByHospital } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function NurseTable() {
  const { session } = useAuth()
  const state = useDb()
  const nurses = listNursesByHospital(state, session.id)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(
    () =>
      nurses.filter(
        (n) =>
          (statusFilter === 'all' || n.authStatus === statusFilter) &&
          (search.trim() === '' || n.name.toLowerCase().includes(search.trim().toLowerCase()) || n.id.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [nurses, statusFilter, search],
  )

  return (
    <>
      <PageHead
        eyebrow="Hospital roster"
        title="Danh sách điều dưỡng"
        description="Quản lý hồ sơ, phạm vi hành nghề và trạng thái cấp phép."
        action={
          <button type="button" className="btn primary" onClick={() => setAddOpen(true)}>
            <Icon.plus /> Thêm điều dưỡng
          </button>
        }
      />

      <div className="filter-row">
        <div className="search-box">
          <Icon.search />
          <input placeholder="Tìm theo tên hoặc mã nhân sự" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(NURSE_AUTH_STATUS_LABEL).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Điều dưỡng</th>
                <th>Chuyên môn</th>
                <th>Khu vực</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div className="person-cell">
                      <span className="person-avatar">{initials(n.name)}</span>
                      <span>
                        <b>{n.name}</b>
                        <small>{n.rank}</small>
                      </span>
                    </div>
                  </td>
                  <td>{n.specialties.map(careTypeLabel).join(', ')}</td>
                  <td>{n.serviceAreas.join(', ')}</td>
                  <td>
                    <StatusBadge status={n.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />
                  </td>
                  <td>
                    <Link to={`/hospital/admin/roster/${n.id}`} className="icon-mini">
                      <Icon.more />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <NurseAddModal open={addOpen} onClose={() => setAddOpen(false)} hospitalId={session.id} />
    </>
  )
}
