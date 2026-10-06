import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import CareRequestWizardModal from './CareRequestWizardModal'
import CareRequestBody from './CareRequestBody'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getNurse, getPatient, listCareRequestsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CARE_REQUEST_STATUS, CARE_REQUEST_STATUS_LABEL } from '../../lib/constants'
import { HISTORY_PAGE_SIZE } from '../../Data/patient/care-request-data'
import { useStaggerIn } from '../../patient/anime'
import { Icon } from '../../lib/icons'

const IN_FLIGHT = [CARE_REQUEST_STATUS.MATCHING, CARE_REQUEST_STATUS.MATCHED, CARE_REQUEST_STATUS.NURSE_PENDING]

export default function CareRequestHome() {
  const { session } = useAuth()
  const state = useDb()
  // A suspended account keeps SOS and existing care, but cannot open new requests.
  const account = getPatient(state, session.id)?.account
  const suspended = account?.status === 'suspended'
  const location = useLocation()
  const navigate = useNavigate()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [page, setPage] = useState(1)
  const historyRef = useRef(null)

  // The dashboard's "Tạo yêu cầu chăm sóc" button routes here and asks for the wizard.
  useEffect(() => {
    if (location.state?.openWizard && !suspended) {
      setWizardOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate, suspended])

  const requests = listCareRequestsByPatient(state, session.id)
  const active = requests.find((r) => IN_FLIGHT.includes(r.status))

  const history = useMemo(
    () =>
      requests
        .filter((r) => r.id !== active?.id)
        .filter((r) => {
          const d = dayjs(r.desiredStartDate)
          if (from && d.isBefore(from, 'day')) return false
          if (to && d.isAfter(to, 'day')) return false
          return true
        }),
    [requests, active?.id, from, to],
  )
  const pageCount = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = history.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE)

  useStaggerIn(historyRef, '.history-item', [currentPage, from?.valueOf(), to?.valueOf(), history.length])

  const resetFilter = () => {
    setFrom(null)
    setTo(null)
    setPage(1)
  }

  return (
    <>
      <PageHead
        eyebrow="Care Request"
        title="Yêu cầu chăm sóc"
        description="Mô tả nhu cầu một lần để CareShift tìm điều dưỡng phù hợp nhất."
        action={
          <Button variant="contained" startIcon={<Icon.plus />} disabled={suspended} onClick={() => setWizardOpen(true)}>
            Tạo yêu cầu
          </Button>
        }
      />

      {suspended && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '14px' }}>
          Tài khoản của bạn đang bị tạm ngưng nên chưa thể tạo yêu cầu mới.{account.statusReason ? ` Lý do: ${account.statusReason}` : ''} Các lịch đã đặt và nút SOS vẫn hoạt động.
        </Alert>
      )}

      <section className="panel">
        {active ? (
          <div className="active-care">
            <CareRequestBody careRequest={active} />
          </div>
        ) : (
          <EmptyState
            icon={<Icon.search />}
            title="Chưa có yêu cầu nào đang xử lý"
            description="Nhấn “Tạo yêu cầu” để chọn loại chăm sóc, khu vực và thời gian mong muốn."
          />
        )}
      </section>

      <div className="history-head">
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            Lịch sử yêu cầu
          </h2>
          <small>
            {history.length} yêu cầu{from || to ? ' trong khoảng đã chọn' : ''}
          </small>
        </div>
        <div className="history-filter">
          <DatePicker
            label="Từ ngày"
            value={from}
            maxDate={to || undefined}
            onChange={(v) => {
              setFrom(v && v.isValid() ? v : null)
              setPage(1)
            }}
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <DatePicker
            label="Đến ngày"
            value={to}
            minDate={from || undefined}
            onChange={(v) => {
              setTo(v && v.isValid() ? v : null)
              setPage(1)
            }}
            slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
          />
          <Button variant="outlined" size="small" disabled={!from && !to} onClick={resetFilter}>
            Xóa lọc
          </Button>
        </div>
      </div>

      {history.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.calendar />} title="Không có yêu cầu nào trong khoảng ngày này" description="Thử chọn khoảng ngày khác hoặc xóa bộ lọc." />
        </section>
      ) : (
        <div className="stack-gap-12" ref={historyRef}>
          {pageItems.map((r) => {
            const nurse = r.selectedNurseId ? getNurse(state, r.selectedNurseId) : null
            return (
              <Link key={r.id} to={`/patient/request/${r.id}`} className="notification-card history-item">
                <span className="notification-symbol">
                  <Icon.file />
                </span>
                <div>
                  <h3>{careTypeLabel(r.careType)}</h3>
                  <p>
                    #{r.id} · {r.district} · {formatDate(r.desiredStartDate)} {r.timeSlot?.start}
                    {nurse ? ` · ${nurse.name}` : ''}
                  </p>
                </div>
                <StatusBadge status={r.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
              </Link>
            )
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="pagination-row">
          <Pagination count={pageCount} page={currentPage} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
        </div>
      )}

      <CareRequestWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} patientId={session.id} createdBy="patient" onCreated={(id) => {
          setWizardOpen(false)
          navigate(`/patient/request/${id}`)
        }}
      />
    </>
  )
}
