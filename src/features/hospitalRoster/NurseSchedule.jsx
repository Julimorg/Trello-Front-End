import { useState } from 'react'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import EventIcon from '@mui/icons-material/Event'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import StatusChip from '../../components/StatusChip'
import ConfirmDialog from '../../components/ConfirmDialog'
import SosButton from '../sos/SosButton'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getHospital, getPatient, listBookingsByNurse, reportCannotPerform } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { SESSION_STATUS, SESSION_STATUS_LABEL } from '../../lib/constants'

export default function NurseSchedule() {
  const { session } = useAuth()
  const state = useDb()
  const bookings = listBookingsByNurse(state, session.id)
  const [cannotPerform, setCannotPerform] = useState(null)
  const [reason, setReason] = useState('')
  const today = dayjs().format('YYYY-MM-DD')

  const hospital = getHospital(state, state.nurses.find((n) => n.id === session.id)?.hospitalId)

  const rows = bookings.flatMap((b) =>
    b.sessions
      .filter((s) => s.nurseId === session.id)
      .map((s) => ({ booking: b, sessionItem: s })),
  ).sort((a, b) => a.sessionItem.date.localeCompare(b.sessionItem.date))

  if (rows.length === 0) {
    return (
      <>
        <PageHeader title="Lịch làm việc" />
        <EmptyState icon={<EventIcon color="disabled" sx={{ fontSize: 48 }} />} title="Chưa có ca chăm sóc nào được giao" />
      </>
    )
  }

  return (
    <>
      <PageHeader title="Lịch làm việc" subtitle="Các buổi chăm sóc đã được xác nhận" />
      <Paper variant="outlined">
        <List disablePadding>
          {rows.map(({ booking, sessionItem }, idx) => {
            const careRequest = getCareRequest(state, booking.careRequestId)
            const patient = getPatient(state, booking.patientId)
            const canReport = sessionItem.status === SESSION_STATUS.CONFIRMED && sessionItem.date >= today
            return (
              <ListItem key={sessionItem.id} divider={idx < rows.length - 1} alignItems="flex-start">
                <ListItemText
                  primary={`${formatDate(sessionItem.date)} · ${sessionItem.start}-${sessionItem.end} · ${patient?.name}`}
                  secondary={careRequest ? careTypeLabel(careRequest.careType) : ''}
                />
                <Stack direction="row" spacing={1} alignItems="center">
                  <StatusChip status={sessionItem.status} labelMap={SESSION_STATUS_LABEL} />
                  {canReport && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setCannotPerform({ booking, sessionItem })
                        setReason('')
                      }}
                    >
                      Báo không thể thực hiện
                    </Button>
                  )}
                </Stack>
              </ListItem>
            )
          })}
        </List>
      </Paper>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.secondary">
        Nếu phát hiện dấu hiệu bất thường trong ca đang diễn ra, nhấn nút SOS ở góc màn hình.
      </Typography>

      {rows.some((r) => r.sessionItem.date === today && r.sessionItem.status !== SESSION_STATUS.CANNOT_PERFORM) && (
        <SosButton
          bookingId={rows.find((r) => r.sessionItem.date === today).booking.id}
          sessionId={rows.find((r) => r.sessionItem.date === today).sessionItem.id}
          role="nurse"
          hospitalPhone={hospital?.phone}
        />
      )}

      <ConfirmDialog
        open={!!cannotPerform}
        title="Báo không thể thực hiện ca"
        description="Dùng khi có sự cố bất khả kháng (ốm, việc phát sinh...). Hệ thống sẽ tự tìm người thay thế nếu có."
        confirmLabel="Gửi báo cáo"
        confirmColor="error"
        confirmDisabled={!reason.trim()}
        onClose={() => setCannotPerform(null)}
        onConfirm={() => {
          reportCannotPerform({ bookingId: cannotPerform.booking.id, sessionId: cannotPerform.sessionItem.id, reason })
          setCannotPerform(null)
        }}
      >
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label="Lý do"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </ConfirmDialog>
    </>
  )
}
