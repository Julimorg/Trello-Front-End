import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getPricing, setPricing } from '../../lib/db'
import { CARE_TYPES } from '../../lib/constants'

export default function PricingConfig() {
  const { session } = useAuth()
  const state = useDb()

  return (
    <>
      <PageHeader title="Giá dịch vụ tham khảo" subtitle="Hiển thị cho bệnh nhân trước khi đặt lịch" />
      <Alert severity="info" sx={{ mb: 2 }}>
        Đây là giá tham khảo (Stage 1). Việc thanh toán vẫn diễn ra ngoài hệ thống, chưa xử lý giao dịch trong app.
      </Alert>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Loại dịch vụ</TableCell>
              <TableCell>Đơn vị tính</TableCell>
              <TableCell width={220}>Giá (VNĐ)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CARE_TYPES.filter((c) => c.id !== 'other').map((c) => {
              const pricing = getPricing(state, session.id, c.id)
              return (
                <TableRow key={c.id} hover>
                  <TableCell>{c.label}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={pricing?.unit || 'buổi'}
                      onChange={(e) => setPricing(session.id, c.id, e.target.value, pricing?.price || 0)}
                      sx={{ width: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={pricing?.price ?? ''}
                      placeholder="Chưa cấu hình"
                      onChange={(e) => setPricing(session.id, c.id, pricing?.unit || 'buổi', Number(e.target.value))}
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
