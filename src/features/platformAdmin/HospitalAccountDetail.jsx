import { useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import { useDb } from '../../lib/store'
import { getHospital, listNursesByHospital, setHospitalStatus } from '../../lib/db'
import { HOSPITAL_STATUS, HOSPITAL_STATUS_LABEL, NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

export default function HospitalAccountDetail() {
  const { id } = useParams()
  const state = useDb()
  const hospital = getHospital(state, id)

  if (!hospital) return <Alert severity="warning">Không tìm thấy bệnh viện.</Alert>

  const nurses = listNursesByHospital(state, id)

  return (
    <>
      <PageHeader
        title={hospital.name}
        subtitle={`${hospital.address} · ${hospital.phone}`}
        action={<StatusChip status={hospital.status} labelMap={HOSPITAL_STATUS_LABEL} />}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {hospital.status === HOSPITAL_STATUS.ACTIVE ? (
          <Button variant="outlined" color="warning" onClick={() => setHospitalStatus(id, HOSPITAL_STATUS.SUSPENDED)}>
            Tạm ngưng tài khoản
          </Button>
        ) : (
          <Button variant="outlined" color="success" onClick={() => setHospitalStatus(id, HOSPITAL_STATUS.ACTIVE)}>
            Kích hoạt lại
          </Button>
        )}
      </Stack>

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Điều dưỡng</TableCell>
                <TableCell>Cấp bậc</TableCell>
                <TableCell>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nurses.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{n.name}</TableCell>
                  <TableCell>{n.rank}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={NURSE_AUTH_STATUS_LABEL[n.authStatus].label}
                      color={NURSE_AUTH_STATUS_LABEL[n.authStatus].color}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  )
}
