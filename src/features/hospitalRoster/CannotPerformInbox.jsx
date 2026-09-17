import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listNursesByHospital, manualReassignSession } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { NURSE_AUTH_STATUS } from '../../lib/constants'

export default function CannotPerformInbox() {
  const { session } = useAuth()
  const state = useDb()
  const hospitalNurseIds = new Set(listNursesByHospital(state, session.id).map((n) => n.id))
  const [picks, setPicks] = useState({})

  const pendingItems = state.bookings.flatMap((b) =>
    b.sessions
      .filter((s) => s.needsManualReassignment && hospitalNurseIds.has(s.nurseId))
      .map((s) => ({ booking: b, sessionItem: s })),
  )

  const availableNursesFor = (careType) =>
    listNursesByHospital(state, session.id).filter(
      (n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && n.authorizedCareTypes.includes(careType),
    )

  return (
    <>
      <PageHeader title="Ca cần hỗ trợ đổi điều dưỡng" subtitle="Các buổi chăm sóc chưa tự động tìm được người thay thế" />

      {pendingItems.length === 0 ? (
        <EmptyState icon={<CheckCircleOutlineIcon color="success" sx={{ fontSize: 48 }} />} title="Không có ca nào cần hỗ trợ" />
      ) : (
        <Stack spacing={2}>
          {pendingItems.map(({ booking, sessionItem }) => {
            const careRequest = getCareRequest(state, booking.careRequestId)
            const patient = getPatient(state, booking.patientId)
            const originalNurse = getNurse(state, sessionItem.history?.[sessionItem.history.length - 1]?.nurseId)
            const candidates = careRequest ? availableNursesFor(careRequest.careType) : []
            return (
              <Paper key={sessionItem.id} variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {patient?.name} · {careRequest ? careTypeLabel(careRequest.careType) : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Buổi {formatDate(sessionItem.date)} · {sessionItem.start}-{sessionItem.end} · Điều dưỡng cũ:{' '}
                  {originalNurse?.name}
                </Typography>
                {sessionItem.history?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Lý do: {sessionItem.history[sessionItem.history.length - 1].reason}
                  </Alert>
                )}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    select
                    size="small"
                    label="Chọn điều dưỡng thay thế"
                    value={picks[sessionItem.id] || ''}
                    onChange={(e) => setPicks((p) => ({ ...p, [sessionItem.id]: e.target.value }))}
                    sx={{ minWidth: 240 }}
                  >
                    {candidates.length === 0 && <MenuItem disabled value="">Không có điều dưỡng phù hợp</MenuItem>}
                    {candidates.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="contained"
                    disabled={!picks[sessionItem.id]}
                    onClick={() =>
                      manualReassignSession({ bookingId: booking.id, sessionId: sessionItem.id, nurseId: picks[sessionItem.id] })
                    }
                  >
                    Xác nhận đổi
                  </Button>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}
    </>
  )
}
