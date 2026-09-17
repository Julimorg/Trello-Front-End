import { useState } from 'react'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import { useDb } from '../../lib/store'
import { getHospital, updateNurse } from '../../lib/db'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'
import { formatDateTime } from '../../lib/format'

export default function NursesOversight() {
  const state = useDb()
  const [hospitalFilter, setHospitalFilter] = useState('all')

  const nurses = state.nurses.filter((n) => hospitalFilter === 'all' || n.hospitalId === hospitalFilter)

  return (
    <>
      <PageHeader
        title="Điều dưỡng toàn hệ thống"
        subtitle="Giám sát chéo các bệnh viện — spot-check định kỳ, không xác minh lại từng hồ sơ"
      />

      <TextField
        select
        size="small"
        label="Bệnh viện"
        value={hospitalFilter}
        onChange={(e) => setHospitalFilter(e.target.value)}
        sx={{ mb: 2, minWidth: 240 }}
      >
        <MenuItem value="all">Tất cả bệnh viện</MenuItem>
        {state.hospitals.map((h) => (
          <MenuItem key={h.id} value={h.id}>
            {h.name}
          </MenuItem>
        ))}
      </TextField>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Bệnh viện</TableCell>
              <TableCell>Cấp bậc</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Spot-check</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nurses.map((n) => (
              <TableRow key={n.id} hover>
                <TableCell>{n.name}</TableCell>
                <TableCell>{getHospital(state, n.hospitalId)?.name}</TableCell>
                <TableCell>{n.rank}</TableCell>
                <TableCell>
                  <StatusChip status={n.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />
                </TableCell>
                <TableCell>
                  {n.spotCheckedAt ? (
                    <Chip size="small" color="success" label={`Đã kiểm tra ${formatDateTime(n.spotCheckedAt)}`} />
                  ) : (
                    <Chip size="small" variant="outlined" label="Chưa kiểm tra" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => updateNurse(n.id, { spotCheckedAt: new Date().toISOString() })}>
                    Đánh dấu đã spot-check
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
