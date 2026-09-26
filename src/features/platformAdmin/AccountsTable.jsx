import { useMemo, useState } from 'react'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { getHospital, listCareRequestsByPatient, updateNurse } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { ACCOUNT_STATUS_LABEL, NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'
import { Icon } from '../../lib/icons'

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function AccountsTable() {
  const toast = useToast()
  const state = useDb()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const accounts = useMemo(() => {
    const patients = state.patients.map((p) => ({
      kind: 'patient',
      id: p.id,
      name: p.name,
      role: 'Bệnh nhân',
      status: 'active',
      meta: `${listCareRequestsByPatient(state, p.id).length} yêu cầu đã tạo`,
      raw: p,
    }))
    const nurses = state.nurses.map((n) => ({
      kind: 'nurse',
      id: n.id,
      name: n.name,
      role: 'Điều dưỡng',
      status: n.authStatus === 'revoked' ? 'suspended' : 'active',
      meta: getHospital(state, n.hospitalId)?.name,
      raw: n,
    }))
    const hospitals = state.hospitals.map((h) => ({
      kind: 'hospital',
      id: h.id,
      name: h.name,
      role: 'Admin bệnh viện',
      status: h.status,
      meta: h.district,
      raw: h,
    }))
    return [...patients, ...nurses, ...hospitals].filter(
      (a) =>
        (roleFilter === 'all' || a.kind === roleFilter) &&
        (search.trim() === '' || a.name.toLowerCase().includes(search.trim().toLowerCase())),
    )
  }, [state, search, roleFilter])

  return (
    <>
      <PageHead eyebrow="Account governance" title="Tài khoản người dùng" description="Giám sát bệnh nhân, điều dưỡng và admin theo chính sách nền tảng." />

      <div className="filter-row">
        <div className="search-box">
          <Icon.search />
          <input placeholder="Tìm tên hoặc mã tài khoản" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Tất cả vai trò</option>
          <option value="patient">Bệnh nhân</option>
          <option value="nurse">Điều dưỡng</option>
          <option value="hospital">Admin bệnh viện</option>
        </select>
      </div>

      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={`${a.kind}-${a.id}`}>
                  <td>
                    <div className="person-cell">
                      <span className="person-avatar">{initials(a.name)}</span>
                      <span>
                        <b>{a.name}</b>
                        <small>{a.id}</small>
                      </span>
                    </div>
                  </td>
                  <td>{a.role}</td>
                  <td>
                    {a.kind === 'nurse' ? (
                      <StatusBadge status={a.raw.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />
                    ) : (
                      <StatusBadge status={a.status} labelMap={ACCOUNT_STATUS_LABEL} />
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{a.meta}</td>
                  <td>
                    {a.kind === 'nurse' && (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => {
                          updateNurse(a.id, { spotCheckedAt: new Date().toISOString() })
                          toast('Đã spot-check', `${a.name} đã được kiểm tra định kỳ.`)
                        }}
                      >
                        {a.raw.spotCheckedAt ? `Đã kiểm tra ${formatDateTime(a.raw.spotCheckedAt)}` : 'Spot-check'}
                      </button>
                    )}
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
