import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import PageHeader from '../../components/PageHeader'
import { useDb } from '../../lib/store'
import { listCareRequestsByPatient } from '../../lib/db'

export default function PatientsOversight() {
  const state = useDb()

  return (
    <>
      <PageHeader title="Bệnh nhân" subtitle="Tài khoản bệnh nhân/gia đình trên nền tảng" />
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Họ tên</TableCell>
              <TableCell>Khu vực</TableCell>
              <TableCell>Điện thoại</TableCell>
              <TableCell>Người thân đăng ký SOS</TableCell>
              <TableCell>Số yêu cầu đã tạo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.patients.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.district}</TableCell>
                <TableCell>{p.phone}</TableCell>
                <TableCell>{p.familyContacts.length}</TableCell>
                <TableCell>{listCareRequestsByPatient(state, p.id).length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
