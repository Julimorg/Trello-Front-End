import { Link as RouterLink } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listNursesByHospital, listSosEventsForHospital } from '../../lib/db'
import { NURSE_AUTH_STATUS } from '../../lib/constants'

function StatCard({ label, value, hint }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={800}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default function RosterDashboard() {
  const { session } = useAuth()
  const state = useDb()
  const nurses = listNursesByHospital(state, session.id)
  const authorized = nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED)
  const draft = nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.DRAFT)
  const activeNurseIds = new Set(
    state.bookings.flatMap((b) => b.sessions.map((s) => s.nurseId)).filter((id) => nurses.some((n) => n.id === id)),
  )
  const dormant = authorized.filter((n) => !activeNurseIds.has(n.id))
  const cannotPerformCount = state.bookings
    .flatMap((b) => b.sessions)
    .filter((s) => s.needsManualReassignment && nurses.some((n) => n.id === s.nurseId)).length
  const sosCount = listSosEventsForHospital(state, session.id).length

  return (
    <>
      <PageHeader
        title="Tổng quan bệnh viện"
        subtitle="Quản lý nhân sự điều dưỡng trên nền tảng CareShift"
        action={
          <Button component={RouterLink} to="/hospital/admin/nurses/new" variant="contained">
            Thêm điều dưỡng
          </Button>
        }
      />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard label="Tổng số điều dưỡng" value={nurses.length} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard label="Đã cấp phép (Authorized)" value={authorized.length} />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard label="Chưa cấp phép" value={draft.length} hint="Cần bổ sung chứng chỉ để cấp phép" />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            label="Tỷ lệ dormant"
            value={authorized.length ? `${Math.round((dormant.length / authorized.length) * 100)}%` : '0%'}
            hint={`${dormant.length}/${authorized.length} đã cấp phép nhưng chưa nhận ca`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                Ca cần hỗ trợ đổi điều dưỡng
              </Typography>
              <Typography variant="h5" fontWeight={800} color={cannotPerformCount ? 'error.main' : 'text.primary'}>
                {cannotPerformCount}
              </Typography>
            </Stack>
            <Button component={RouterLink} to="/hospital/admin/cannot-perform" size="small" sx={{ mt: 1 }}>
              Xem chi tiết
            </Button>
          </Paper>
        </Grid>
        <Grid xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                Cảnh báo SOS đã ghi nhận
              </Typography>
              <Typography variant="h5" fontWeight={800}>
                {sosCount}
              </Typography>
            </Stack>
            <Button component={RouterLink} to="/hospital/admin/sos-log" size="small" sx={{ mt: 1 }}>
              Xem chi tiết
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </>
  )
}
