import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import { useDb } from '../../lib/store'
import { createBooking, getCareRequest, getNurse } from '../../lib/db'
import { careTypeLabel, formatDate, weekdayLabel } from '../../lib/format'
import { FREQUENCIES, WEEKDAYS } from '../../lib/constants'

function buildPreviewDates({ startDate, endDate, frequency, weekdays }) {
  if (!startDate) return []
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate || startDate)
  if (frequency === 'once') return [startDate]
  const cursor = new Date(start)
  while (cursor <= end) {
    const day = cursor.getDay()
    if (frequency === 'daily' || (weekdays || []).includes(day)) {
      dates.push(cursor.toISOString().slice(0, 10))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export default function BookingForm() {
  const { id, nurseId } = useParams()
  const navigate = useNavigate()
  const state = useDb()
  const request = getCareRequest(state, id)
  const nurse = getNurse(state, nurseId)

  const [frequency, setFrequency] = useState(request?.frequency || 'once')
  const [weekdays, setWeekdays] = useState(request?.weekdays || [])
  const [startDate, setStartDate] = useState(request?.desiredStartDate || '')
  const [endDate, setEndDate] = useState(request?.desiredStartDate || '')
  const [timeStart, setTimeStart] = useState(request?.timeSlot?.start || '17:00')
  const [timeEnd, setTimeEnd] = useState(request?.timeSlot?.end || '19:00')

  const previewDates = useMemo(
    () => buildPreviewDates({ startDate, endDate, frequency, weekdays }),
    [startDate, endDate, frequency, weekdays],
  )

  if (!request || !nurse) {
    return <Alert severity="warning">Không tìm thấy dữ liệu yêu cầu hoặc điều dưỡng.</Alert>
  }

  const canSubmit = startDate && (frequency === 'once' || endDate) && (frequency !== 'weekly' || weekdays.length > 0)

  const handleSubmit = () => {
    const bookingId = createBooking({
      careRequestId: id,
      nurseId,
      startDate,
      endDate: frequency === 'once' ? startDate : endDate,
      frequency,
      weekdays,
      timeSlot: { start: timeStart, end: timeEnd },
    })
    navigate(`/patient/bookings/${bookingId}`)
  }

  return (
    <>
      <PageHeader title="Xác nhận đặt lịch" subtitle={`Với điều dưỡng ${nurse.name} · ${careTypeLabel(request.careType)}`} />

      <Alert severity="info" sx={{ mb: 3 }}>
        Lịch sẽ được xác nhận ngay khi bạn gửi, vì điều dưỡng đã nằm trong khung giờ được bệnh viện duyệt trước.
      </Alert>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <TextField select label="Chu kỳ lặp lại" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            {FREQUENCIES.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>

          {frequency === 'weekly' && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {WEEKDAYS.map((w) => (
                <Chip
                  key={w.id}
                  label={w.label}
                  clickable
                  color={weekdays.includes(w.id) ? 'primary' : 'default'}
                  onClick={() =>
                    setWeekdays((prev) => (prev.includes(w.id) ? prev.filter((d) => d !== w.id) : [...prev, w.id]))
                  }
                />
              ))}
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Ngày bắt đầu"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
            />
            {frequency !== 'once' && (
              <TextField
                label="Ngày kết thúc"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
              />
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Giờ bắt đầu mỗi buổi"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              fullWidth
            />
            <TextField
              label="Giờ kết thúc mỗi buổi"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              fullWidth
            />
          </Stack>

          {previewDates.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Sẽ tạo {previewDates.length} buổi chăm sóc
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {previewDates.slice(0, 10).map((d) => (
                  <Chip key={d} label={formatDate(d)} size="small" />
                ))}
                {previewDates.length > 10 && <Chip label={`+${previewDates.length - 10} buổi khác`} size="small" />}
              </Stack>
              {frequency === 'weekly' && weekdays.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Lặp lại vào: {weekdays.map(weekdayLabel).join(', ')}
                </Typography>
              )}
            </Paper>
          )}

          <Button variant="contained" size="large" disabled={!canSubmit} onClick={handleSubmit}>
            Xác nhận đặt lịch
          </Button>
        </Stack>
      </Paper>
    </>
  )
}
