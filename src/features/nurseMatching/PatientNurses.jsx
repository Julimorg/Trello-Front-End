import { useMemo, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import NurseProfileCard from './NurseProfileCard'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, getNurse, listBookingsByPatient, listCareRequestsByPatient } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { CARE_TYPES } from '../../lib/constants'
import { NURSE_PAGE_SIZE, NURSE_SORT_OPTIONS } from '../../Data/patient/nurse-data'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const RATING_FILTERS = [
  { id: 0, label: 'Mọi đánh giá' },
  { id: 4.5, label: 'Từ 4.5 ★' },
  { id: 4.7, label: 'Từ 4.7 ★' },
]

const SORTERS = {
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  experience: (a, b) => b.experienceYears - a.experienceYears,
  cases: (a, b) => (b.completedCases ?? 0) - (a.completedCases ?? 0),
  name: (a, b) => a.name.split(' ').pop().localeCompare(b.name.split(' ').pop(), 'vi'),
}

const initialFilters = { search: '', specialty: 'all', hospital: 'all', minRating: 0, servedOnly: false, sort: 'rating' }

export default function PatientNurses() {
  const { session } = useAuth()
  const state = useDb()
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const gridRef = useRef(null)

  const requests = listCareRequestsByPatient(state, session.id)
  const servedIds = useMemo(
    () => new Set(listBookingsByPatient(state, session.id).flatMap((b) => b.sessions.map((s) => s.nurseId))),
    [state, session.id],
  )
  const trusted = useMemo(
    () => [...new Set(requests.flatMap((r) => r.matchedNurseIds))].map((id) => getNurse(state, id)).filter(Boolean),
    [requests, state],
  )
  const hospitals = useMemo(() => [...new Set(trusted.map((n) => n.hospitalId))].map((id) => getHospital(state, id)).filter(Boolean), [trusted, state])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return trusted
      .filter((n) => {
        if (q) {
          const haystack = [n.name, getHospital(state, n.hospitalId)?.name, ...n.specialties.map(careTypeLabel), ...n.serviceAreas].join(' ').toLowerCase()
          if (!haystack.includes(q)) return false
        }
        if (filters.specialty !== 'all' && !n.specialties.includes(filters.specialty)) return false
        if (filters.hospital !== 'all' && n.hospitalId !== filters.hospital) return false
        if (filters.minRating && (n.rating ?? 0) < filters.minRating) return false
        if (filters.servedOnly && !servedIds.has(n.id)) return false
        return true
      })
      .sort(SORTERS[filters.sort])
  }, [trusted, filters, servedIds, state])

  const pageCount = Math.max(1, Math.ceil(filtered.length / NURSE_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * NURSE_PAGE_SIZE, currentPage * NURSE_PAGE_SIZE)

  useStaggerIn(gridRef, '.nurse-card', [currentPage, filtered.map((n) => n.id).join()])

  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(initialFilters)

  return (
    <>
      <PageHead
        eyebrow="Verified profiles"
        title="Điều dưỡng tin cậy"
        description="Các điều dưỡng đã được đề xuất cho bạn qua những yêu cầu chăm sóc trước đây — tất cả đều được bệnh viện xác minh."
      />

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
        <TextField select size="small" label="Đánh giá" value={filters.minRating} onChange={(e) => update({ minRating: Number(e.target.value) })}>
          {RATING_FILTERS.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.label}
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
        <FormControlLabel
          control={<Switch checked={filters.servedOnly} onChange={(e) => update({ servedOnly: e.target.checked })} />}
          label="Đã từng chăm sóc tôi"
          slotProps={{ typography: { sx: { fontSize: '.8rem', fontWeight: 600 } } }}
        />
        {isFiltered && (
          <Button size="small" onClick={() => update(initialFilters)}>
            Đặt lại
          </Button>
        )}
      </div>

      <p className="result-count">
        Hiển thị {pageItems.length} / {filtered.length} điều dưỡng
      </p>

      {filtered.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.user />} title="Không có điều dưỡng phù hợp bộ lọc" description="Thử bỏ bớt điều kiện lọc hoặc tìm với từ khóa khác." />
        </section>
      ) : (
        <div className="match-grid" ref={gridRef}>
          {pageItems.map((n) => (
            <NurseProfileCard key={n.id} nurse={n} profileHref={`/patient/nurses/${n.id}`} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="pagination-row">
          <Pagination count={pageCount} page={currentPage} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
        </div>
      )}
    </>
  )
}
