import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import Box from '@mui/material/Box'
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
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listNursesByHospital } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

export default function NurseTable() {
  const { session } = useAuth()
  const state = useDb()
  const nurses = listNursesByHospital(state, session.id)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(
    () => nurses.filter((n) => statusFilter === 'all' || n.authStatus === statusFilter),
    [nurses, statusFilter],
  )

  return (
    <>
      <PageHeader
        title="Nhân sự điều dưỡng"
        subtitle="Danh sách điều dưỡng do bệnh viện quản lý"
        action={
          <Button component={RouterLink} to="/hospital/admin/nurses/new" variant="contained" startIcon={<AddIcon />}>
            Thêm điều dưỡng
          </Button>
        }
      />

      <TextField
        select
        size="small"
        label="Trạng thái"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ mb: 2, minWidth: 220 }}
      >
        <MenuItem value="all">Tất cả</MenuItem>
        {Object.entries(NURSE_AUTH_STATUS_LABEL).map(([value, { label }]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Cấp bậc</TableCell>
              <TableCell>Kinh nghiệm</TableCell>
              <TableCell>Chuyên môn</TableCell>
              <TableCell>Khu vực</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((n) => (
              <TableRow key={n.id} hover>
                <TableCell>{n.name}</TableCell>
                <TableCell>{n.rank}</TableCell>
                <TableCell>{n.experienceYears} năm</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 220 }}>
                    {n.specialties.map((s) => (
                      <Chip key={s} label={careTypeLabel(s)} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{n.serviceAreas.join(', ')}</TableCell>
                <TableCell>
                  <StatusChip status={n.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" component={RouterLink} to={`/hospital/admin/nurses/${n.id}`}>
                    Xem / Chỉnh sửa
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
