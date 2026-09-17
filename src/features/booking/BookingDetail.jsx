import { useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import ConfirmDialog from '../../components/ConfirmDialog'
import SosButton from '../sos/SosButton'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getBooking, getHospital, getNurse, requestReschedule } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { BOOKING_STATUS_LABEL, SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'

export default function BookingDetail() {
  const { id } = useParams()
  const state = useDb()
  const booking = getBooking(state, id)
  const [rescheduleSession, setRescheduleSession] = useState(null)
  const [note, setNote] = useState('')

  if (!booking) {
    return <Alert severity="warning">Không tìm thấy lịch chăm sóc này.</Alert>
  }

  const nurse = getNurse(state, booking.nurseId)
  const hospital = nurse ? getHospital(state, nurse.hospitalId) : null
  const today = dayjs().format('YYYY-MM-DD')
  const todaySession = booking.sessions.find((s) => s.date === today && s.status !== SESSION_STATUS.CANNOT_PERFORM)

  return (
    <>
      <PageHeader
        title={`Lịch chăm sóc với ${nurse?.name || 'điều dưỡng'}`}
        subtitle={hospital?.name}
        action={<StatusChip status={computeBookingStatus(booking)} labelMap={BOOKING_STATUS_LABEL} />}
      />

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <List disablePadding>
          {booking.sessions.map((s, idx) => (
            <ListItem key={s.id} divider={idx < booking.sessions.length - 1}>
              <ListItemText
                primary={`${formatDate(s.date)} · ${s.start} - ${s.end}`}
                secondary={
                  s.status === SESSION_STATUS.REASSIGNED
                    ? `Đã đổi điều dưỡng: ${getNurse(state, s.nurseId)?.name || ''}`
                    : s.status === SESSION_STATUS.CANNOT_PERFORM
                      ? 'Đang tìm điều dưỡng thay thế'
                      : undefined
                }
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <StatusChip status={s.status} labelMap={SESSION_STATUS_LABEL} />
                {s.date >= today && (
                  <Button
                    size="small"
                    onClick={() => {
                      setRescheduleSession(s)
                      setNote('')
                    }}
                  >
                    Yêu cầu đổi lịch
                  </Button>
                )}
              </Stack>
            </ListItem>
          ))}
        </List>
      </Paper>

      {booking.sessions.some((s) => s.history?.length) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Lịch sử thay đổi
          </Typography>
          <Stack spacing={1}>
            {booking.sessions
              .filter((s) => s.history?.length)
              .flatMap((s) =>
                s.history.map((h, i) => (
                  <Typography variant="body2" color="text.secondary" key={`${s.id}-${i}`}>
                    {formatDate(s.date)}: {getNurse(state, h.nurseId)?.name} báo không thể thực hiện — lý do: {h.reason}
                  </Typography>
                )),
              )}
          </Stack>
        </Paper>
      )}

      <Divider sx={{ mb: 2 }} />
      <Typography variant="caption" color="text.secondary">
        Nếu có bất thường trong lúc chăm sóc, bạn hoặc người thân có thể nhấn nút SOS ở góc màn hình để gọi 115 và báo
        cho bệnh viện ngay lập tức.
      </Typography>

      {todaySession && <SosButton bookingId={booking.id} sessionId={todaySession.id} role="patient" />}

      <ConfirmDialog
        open={!!rescheduleSession}
        title="Yêu cầu đổi lịch"
        description={rescheduleSession ? `Gửi yêu cầu đổi lịch cho buổi ${formatDate(rescheduleSession.date)} tới bệnh viện.` : ''}
        confirmLabel="Gửi yêu cầu"
        onClose={() => setRescheduleSession(null)}
        confirmDisabled={!note.trim()}
        onConfirm={() => {
          requestReschedule({ bookingId: booking.id, sessionId: rescheduleSession.id, note })
          setRescheduleSession(null)
        }}
      >
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label="Lý do / thời gian mong muốn"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </ConfirmDialog>
    </>
  )
}
