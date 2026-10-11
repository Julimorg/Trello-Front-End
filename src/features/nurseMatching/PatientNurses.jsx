import { useMemo, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import NurseProfileCard from './NurseProfileCard'
import TrustNurseButton from './TrustNurseButton'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, listServedNurses } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_TYPES } from '../../lib/constants'
import { NURSE_SORT_OPTIONS } from '../../Data/patient/nurse-data'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const SORTERS = {
  recent: (a, b) => b.lastDate.localeCompare(a.lastDate),
  experience: (a, b) => b.nurse.experienceYears - a.nurse.experienceYears,
  cases: (a, b) => (b.nurse.completedCases ?? 0) - (a.nurse.completedCases ?? 0),
  name: (a, b) => a.nurse.name.split(' ').pop().localeCompare(b.nurse.name.split(' ').pop(), 'vi'),
}

const initialFilters = { search: '', specialty: 'all', hospital: 'all', sort: 'recent' }

// "Điều dưỡng tin cậy": nurses who have already cared for the patient. The patient can mark the ones they trust.
export default function PatientNurses() {
  const { session } = useAuth()
  const state = useDb()
  const [filters, setFilters] = useState(initialFilters)
  const trustedRef = useRef(null)
  const servedRef = useRef(null)

  const served = useMemo(() => listServedNurses(state, session.id), [state, session.id])
  const hospitals = useMemo(() => [...new Set(served.map((e) => e.nurse.hospitalId))].map((id) => getHospital(state, id)).filter(Boolean), [served, state])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return served
      .filter((e) => {
        const n = e.nurse
        if (q) {
          const haystack = [n.name, getHospital(state, n.hospitalId)?.name, ...n.specialties.map(careTypeLabel), ...n.serviceAreas].join(' ').toLowerCase()
          if (!haystack.includes(q)) return false
        }
        if (filters.specialty !== 'all' && !n.specialties.includes(filters.specialty)) return false
        if (filters.hospital !== 'all' && n.hospitalId !== filters.hospital) return false
        return true
      })
      .sort(SORTERS[filters.sort])
  }, [served, filters, state])

  const trusted = filtered.filter((e) => e.trusted)
  const others = filtered.filter((e) => !e.trusted)

  useStaggerIn(trustedRef, '.nurse-card', [trusted.map((e) => e.nurseId).join()])
  useStaggerIn(servedRef, '.nurse-card', [others.map((e) => e.nurseId).join()])

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(initialFilters)

  const renderCard = (e) => (
    <NurseProfileCard
      key={e.nurseId}
      nurse={e.nurse}
      profileHref={`/patient/nurses/${e.nurseId}`}
      note={`Đã chăm sóc bạn ${e.sessions} buổi · gần nhất ${formatDate(e.lastDate)}`}
    >
      <TrustNurseButton nurse={e.nurse} size="small" />
    </NurseProfileCard>
  )

  return (
    <>
      <PageHead
        eyebrow="Verified profiles"
        title="Điều dưỡng tin cậy"
        description="Những điều dưỡng đã từng chăm sóc bạn. Chọn người bạn tin tưởng — họ sẽ được ưu tiên gợi ý ở các yêu cầu sau."
      />

      {served.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.user />} title="Chưa có điều dưỡng nào từng chăm sóc bạn" description="Sau khi hoàn thành buổi chăm sóc đầu tiên, điều dưỡng sẽ xuất hiện ở đây để bạn chọn là người đáng tin cậy." />
        </section>
      ) : (
        <>
          <div className="toolbar">
            <TextField
              className="toolbar-search"
              size="small"
              placeholder="Tìm theo tên, bệnh viện, chuyên môn, khu vực"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon.search style={{ width: 17, color: '#83979b' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField select size="small" label="Chuyên môn" value={filters.specialty} onChange={(e) => update({ specialty: e.target.value })}>
              <MenuItem value="all">Tất cả chuyên môn</MenuItem>
              {CARE_TYPES.filter((c) => c.id !== 'other').map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Bệnh viện" value={filters.hospital} onChange={(e) => update({ hospital: e.target.value })}>
              <MenuItem value="all">Tất cả bệnh viện</MenuItem>
              {hospitals.map((h) => (
                <MenuItem key={h.id} value={h.id}>
                  {h.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Sắp xếp" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
              {NURSE_SORT_OPTIONS.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            {isFiltered && (
              <Button size="small" onClick={() => setFilters(initialFilters)}>
                Đặt lại
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <section className="panel">
              <EmptyState icon={<Icon.user />} title="Không có điều dưỡng phù hợp bộ lọc" description="Thử bỏ bớt điều kiện lọc hoặc tìm với từ khóa khác." />
            </section>
          ) : (
            <>
              <div className="trust-section-head">
                <div>
                  <h2>Đáng tin cậy ({trusted.length})</h2>
                  <p>Được ưu tiên khi gợi ý điều dưỡng cho yêu cầu mới</p>
                </div>
              </div>
              {trusted.length === 0 ? (
                <p className="detail-text">Bạn chưa chọn điều dưỡng nào. Bấm “Chọn thành điều dưỡng đáng tin cậy” ở người bạn muốn.</p>
              ) : (
                <div className="match-grid" ref={trustedRef}>
                  {trusted.map(renderCard)}
                </div>
              )}

              <div className="trust-section-head">
                <div>
                  <h2>Đã từng chăm sóc bạn ({others.length})</h2>
                  <p>Điều dưỡng đã hoàn thành ít nhất một buổi chăm sóc cho bạn</p>
                </div>
              </div>
              {others.length === 0 ? (
                <p className="detail-text">Tất cả điều dưỡng từng chăm sóc bạn đều đã được chọn là đáng tin cậy.</p>
              ) : (
                <div className="match-grid" ref={servedRef}>
                  {others.map(renderCard)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
