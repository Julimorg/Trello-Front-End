import { Link as RouterLink } from 'react-router-dom'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import StatusChip from '../../components/StatusChip'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listCareRequestsByPatient } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL } from '../../lib/constants'

export default function CareRequestList() {
  const { session } = useAuth()
  const state = useDb()
  const requests = listCareRequestsByPatient(state, session.id)

  return (
    <>
      <PageHeader
        title="Yêu cầu chăm sóc"
        subtitle="Danh sách các yêu cầu chăm sóc bạn đã tạo"
        action={
          <Button component={RouterLink} to="/patient/requests/new" variant="contained" startIcon={<AddIcon />}>
            Tạo yêu cầu mới
          </Button>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={<AssignmentIcon color="disabled" sx={{ fontSize: 48 }} />}
          title="Chưa có yêu cầu chăm sóc nào"
          description="Tạo yêu cầu đầu tiên để hệ thống tìm điều dưỡng phù hợp cho bạn."
          action={
            <Button component={RouterLink} to="/patient/requests/new" variant="contained" startIcon={<AddIcon />}>
              Tạo yêu cầu mới
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          {requests.map((r) => (
            <Card key={r.id} variant="outlined">
              <CardActionArea component={RouterLink} to={`/patient/requests/${r.id}`}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {careTypeLabel(r.careType)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.district} · Bắt đầu {formatDate(r.desiredStartDate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tạo lúc {formatDateTime(r.createdAt)}
                      </Typography>
                    </Stack>
                    <StatusChip status={r.status} labelMap={CARE_REQUEST_STATUS_LABEL} />
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </>
  )
}
