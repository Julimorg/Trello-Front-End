import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import { useDb } from '../../lib/store'
import { computeNorthStarMetrics } from '../../lib/db'

function GateCard({ label, value, targetLabel, progress }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={800}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Mục tiêu Phase 1: {targetLabel}
        </Typography>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={Math.min(100, progress * 100)}
            color={progress >= 1 ? 'success' : 'primary'}
            sx={{ mt: 1, height: 6, borderRadius: 3 }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default function PlatformDashboard() {
  const state = useDb()
  const metrics = computeNorthStarMetrics(state)

  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        subtitle="North Star Metric & mục tiêu bắt buộc — Gate để vào Phase 2 (theo roadmap)"
      />
      <Grid container spacing={2}>
        <Grid xs={12} sm={6} md={4}>
          <GateCard
            label="Bệnh viện đối tác"
            value={metrics.activeHospitals}
            targetLabel="1 bệnh viện (ký chính thức)"
            progress={metrics.activeHospitals / 1}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <GateCard
            label="North Star: tỷ lệ hoàn thành"
            value={`${Math.round(metrics.completionRate * 100)}%`}
            targetLabel="≥ 40%"
            progress={metrics.completionRate / 0.4}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <GateCard
            label="Điều dưỡng được cấp phép"
            value={metrics.authorizedNurseCount}
            targetLabel="30–50 điều dưỡng"
            progress={metrics.authorizedNurseCount / 30}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <GateCard
            label="Tỷ lệ điều dưỡng dormant"
            value={`${Math.round(metrics.dormantRate * 100)}%`}
            targetLabel="≤ 30%"
            progress={metrics.dormantRate <= 0.3 ? 1 : 0.3 / metrics.dormantRate}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <GateCard
            label="Tổng số yêu cầu chăm sóc"
            value={metrics.totalRequests}
            targetLabel="≥ 300 yêu cầu"
            progress={metrics.totalRequests / 300}
          />
        </Grid>
        <Grid xs={12} sm={6} md={4}>
          <GateCard label="Yêu cầu đã hoàn tất" value={metrics.completed} targetLabel="Chuyển thành Booking" />
        </Grid>
      </Grid>

      <Stack sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Dữ liệu trên là dữ liệu mẫu (mock) phục vụ demo Phase 1 — sẽ được thay bằng số liệu thật khi có backend/API.
        </Typography>
      </Stack>
    </>
  )
}
