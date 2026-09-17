import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, getNurse } from '../../lib/db'
import { careTypeLabel, weekdayLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

export default function NurseProfileSelf() {
  const { session } = useAuth()
  const state = useDb()
  const nurse = getNurse(state, session.id)
  if (!nurse) return null
  const hospital = getHospital(state, nurse.hospitalId)

  return (
    <>
      <PageHeader
        title={nurse.name}
        subtitle={`${nurse.rank} · ${nurse.experienceYears} năm kinh nghiệm · ${hospital?.name}`}
        action={<StatusChip status={nurse.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />}
      />

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Phạm vi ca được phép
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {nurse.authorizedCareTypes.length > 0 ? (
            nurse.authorizedCareTypes.map((c) => <Chip key={c} label={careTypeLabel(c)} color="primary" size="small" />)
          ) : (
            <Typography variant="body2" color="text.secondary">
              Chưa được cấp phép ca nào. Vui lòng liên hệ quản trị bệnh viện.
            </Typography>
          )}
        </Box>
        <Typography variant="subtitle2" gutterBottom>
          Khu vực phục vụ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {nurse.serviceAreas.join(', ') || 'Chưa cập nhật'}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Chứng chỉ hành nghề
        </Typography>
        <List dense disablePadding>
          {nurse.certificates.map((c) => (
            <ListItem key={c.id} disableGutters>
              <ListItemText primary={c.name} secondary={`Số: ${c.number} · Cấp bởi: ${c.issuedBy}`} />
            </ListItem>
          ))}
          {nurse.certificates.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Chưa có chứng chỉ nào được ghi nhận.
            </Typography>
          )}
        </List>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" gutterBottom>
          Lịch rảnh ngoài giờ trực (do bệnh viện phê duyệt)
        </Typography>
        <Stack spacing={0.5}>
          {nurse.availability.map((a) => (
            <Typography variant="body2" key={a.id}>
              {weekdayLabel(a.weekday)}: {a.start} - {a.end}
            </Typography>
          ))}
          {nurse.availability.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Chưa có khung giờ rảnh nào. Liên hệ quản trị bệnh viện để cập nhật.
            </Typography>
          )}
        </Stack>
      </Paper>
    </>
  )
}
