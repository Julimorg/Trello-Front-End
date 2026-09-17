import { Link as RouterLink } from 'react-router-dom'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import { useDb } from '../../lib/store'
import { listNursesByHospital } from '../../lib/db'
import { HOSPITAL_STATUS_LABEL } from '../../lib/constants'

export default function HospitalsTable() {
  const state = useDb()

  return (
    <>
      <PageHeader
        title="Bệnh viện đối tác"
        subtitle="Quản lý tài khoản bệnh viện trên nền tảng"
        action={
          <Button component={RouterLink} to="/admin/hospitals/new" variant="contained" startIcon={<AddIcon />}>
            Thêm bệnh viện
          </Button>
        }
      />
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên bệnh viện</TableCell>
              <TableCell>Khu vực</TableCell>
              <TableCell>Điện thoại</TableCell>
              <TableCell>Số điều dưỡng</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.hospitals.map((h) => (
              <TableRow key={h.id} hover>
                <TableCell>{h.name}</TableCell>
                <TableCell>{h.district}</TableCell>
                <TableCell>{h.phone}</TableCell>
                <TableCell>{listNursesByHospital(state, h.id).length}</TableCell>
                <TableCell>
                  <StatusChip status={h.status} labelMap={HOSPITAL_STATUS_LABEL} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" component={RouterLink} to={`/admin/hospitals/${h.id}`}>
                    Xem chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
