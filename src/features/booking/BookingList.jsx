import { Link as RouterLink } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import StatusChip from '../../components/StatusChip'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getCareRequest, getNurse, listBookingsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { BOOKING_STATUS_LABEL } from '../../lib/constants'

export default function BookingList() {
  const { session } = useAuth()
  const state = useDb()
  const bookings = listBookingsByPatient(state, session.id).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )

  if (bookings.length === 0) {
    return (
      <>
        <PageHeader title="Lịch chăm sóc" />
        <EmptyState
          icon={<EventAvailableIcon color="disabled" sx={{ fontSize: 48 }} />}
          title="Chưa có lịch chăm sóc nào"
          description="Sau khi chọn điều dưỡng từ một yêu cầu chăm sóc, lịch của bạn sẽ hiện ở đây."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Lịch chăm sóc" subtitle="Các liệu trình đã được xác nhận với điều dưỡng" />
      <Stack spacing={2}>
        {bookings.map((b) => {
          const nurse = getNurse(state, b.nurseId)
          const request = getCareRequest(state, b.careRequestId)
          const status = computeBookingStatus(b)
          const nextSession = b.sessions.find((s) => s.date >= new Date().toISOString().slice(0, 10))
          return (
            <Card key={b.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/patient/bookings/${b.id}`}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {request ? careTypeLabel(request.careType) : 'Lịch chăm sóc'} · {nurse?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {b.sessions.length} buổi
                        {nextSession ? ` · Buổi tiếp theo: ${formatDate(nextSession.date)}` : ''}
                      </Typography>
                    </Stack>
                    <StatusChip status={status} labelMap={BOOKING_STATUS_LABEL} />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          )
        })}
      </Stack>
    </>
  )
}
