import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useDb } from '../../lib/store'
import { cancelCareRequest, getCareRequest, retryMatching } from '../../lib/db'
import { careTypeLabel, formatDate, weekdayLabel } from '../../lib/format'
import { CARE_REQUEST_STATUS, CARE_REQUEST_STATUS_LABEL, FREQUENCIES } from '../../lib/constants'

export default function CareRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useDb()
  const request = getCareRequest(state, id)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!request) {
    return <Alert severity="warning">Không tìm thấy yêu cầu chăm sóc này.</Alert>
  }

  const canCancel = ![CARE_REQUEST_STATUS.COMPLETED, CARE_REQUEST_STATUS.CANCELLED].includes(request.status)

  return (
    <>
      <PageHeader
        title={careTypeLabel(request.careType)}
        subtitle={`Yêu cầu #${request.id}`}
        action={<StatusChip status={request.status} labelMap={CARE_REQUEST_STATUS_LABEL} />}
      />

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack spacing={1}>
          <Typography variant="body2">Khu vực: {request.district}</Typography>
          <Typography variant="body2">Ngày bắt đầu mong muốn: {formatDate(request.desiredStartDate)}</Typography>
          <Typography variant="body2">
            Tần suất: {FREQUENCIES.find((f) => f.id === request.frequency)?.label}
            {request.frequency === 'weekly' && request.weekdays.length > 0
              ? ` (${request.weekdays.map(weekdayLabel).join(', ')})`
              : ''}
          </Typography>
          <Typography variant="body2">
            Khung giờ mỗi buổi: {request.timeSlot?.start} - {request.timeSlot?.end}
          </Typography>
          {request.notes && <Typography variant="body2">Ghi chú: {request.notes}</Typography>}
        </Stack>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {request.status === CARE_REQUEST_STATUS.MATCHING && (
        <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
          <CircularProgress size={28} />
          <Typography color="text.secondary">Đang tìm điều dưỡng phù hợp...</Typography>
        </Stack>
      )}

      {request.status === CARE_REQUEST_STATUS.MATCHED && (
        <Alert
          severity="success"
          action={
            <Button color="inherit" size="small" component={RouterLink} to={`/patient/requests/${id}/matches`}>
              Xem danh sách
            </Button>
          }
        >
          Đã tìm thấy {request.matchedNurseIds.length} điều dưỡng phù hợp với yêu cầu của bạn.
        </Alert>
      )}

      {request.status === CARE_REQUEST_STATUS.NO_MATCH && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => retryMatching(id)}>
              Thử tìm lại
            </Button>
          }
        >
          Hiện chưa tìm được điều dưỡng phù hợp trong khu vực/thời gian bạn chọn. Hệ thống sẽ tự tìm lại định kỳ,
          hoặc bạn có thể liên hệ bệnh viện để được hỗ trợ thủ công.
        </Alert>
      )}

      {request.status === CARE_REQUEST_STATUS.COMPLETED && request.bookingId && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" component={RouterLink} to={`/patient/bookings/${request.bookingId}`}>
              Xem lịch chăm sóc
            </Button>
          }
        >
          Yêu cầu này đã được chuyển thành lịch chăm sóc chính thức.
        </Alert>
      )}

      {request.status === CARE_REQUEST_STATUS.CANCELLED && (
        <Alert severity="info" icon={false}>
          Yêu cầu đã được hủy.
        </Alert>
      )}

      {canCancel && (
        <Box sx={{ mt: 3 }}>
          <Button color="error" variant="outlined" onClick={() => setCancelOpen(true)}>
            Hủy yêu cầu
          </Button>
        </Box>
      )}

      <ConfirmDialog
        open={cancelOpen}
        title="Hủy yêu cầu chăm sóc?"
        description="Bạn có chắc muốn hủy yêu cầu này? Hành động này không thể hoàn tác."
        confirmLabel="Hủy yêu cầu"
        confirmColor="error"
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          cancelCareRequest(id)
          setCancelOpen(false)
          navigate('/patient/requests')
        }}
      />
    </>
  )
}
