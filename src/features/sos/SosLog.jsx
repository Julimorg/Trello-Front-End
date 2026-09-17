import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getBooking, getNurse, getPatient, listSosEventsForHospital } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { SOS_TYPE_LABEL } from '../../lib/constants'

export default function SosLog() {
  const { session } = useAuth()
  const state = useDb()
  const events = listSosEventsForHospital(state, session.id).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )

  return (
    <>
      <PageHeader title="Cảnh báo SOS" subtitle="Nhật ký sự cố khẩn cấp từ các ca chăm sóc của bệnh viện" />

      {events.length === 0 ? (
        <EmptyState
          icon={<WarningAmberIcon color="disabled" sx={{ fontSize: 48 }} />}
          title="Chưa có cảnh báo SOS nào"
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thời điểm</TableCell>
                <TableCell>Bệnh nhân</TableCell>
                <TableCell>Điều dưỡng</TableCell>
                <TableCell>Người kích hoạt</TableCell>
                <TableCell>Loại cảnh báo</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((e) => {
                const booking = getBooking(state, e.bookingId)
                const nurse = booking ? getNurse(state, booking.nurseId) : null
                const patient = booking ? getPatient(state, booking.patientId) : null
                return (
                  <TableRow key={e.id} hover>
                    <TableCell>{formatDateTime(e.createdAt)}</TableCell>
                    <TableCell>{patient?.name}</TableCell>
                    <TableCell>{nurse?.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={e.triggeredBy === 'nurse' ? 'Điều dưỡng' : 'Gia đình'}
                        color={e.triggeredBy === 'nurse' ? 'info' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{SOS_TYPE_LABEL[e.type]}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {e.note || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  )
}
