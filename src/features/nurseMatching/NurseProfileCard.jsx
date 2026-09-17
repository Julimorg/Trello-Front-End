import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import VerifiedIcon from '@mui/icons-material/Verified'
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium'
import PlaceIcon from '@mui/icons-material/Place'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { useDb } from '../../lib/store'
import { getHospital, getPricing } from '../../lib/db'
import { careTypeLabel, formatCurrency, weekdayLabel } from '../../lib/format'

function initials(name) {
  return name
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function NurseProfileCard({ nurse, reason, careType, onSelect, selectLabel = 'Chọn điều dưỡng này' }) {
  const state = useDb()
  const [open, setOpen] = useState(false)
  const hospital = getHospital(state, nurse.hospitalId)
  const price = careType ? getPricing(state, nurse.hospitalId, careType) : null

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>{initials(nurse.name)}</Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {nurse.name}
                </Typography>
                <VerifiedIcon color="success" fontSize="small" titleAccess="Đã xác minh" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {nurse.rank} · {nurse.experienceYears} năm kinh nghiệm · {hospital?.name}
              </Typography>
              {nurse.rating && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                  <Rating value={nurse.rating} precision={0.1} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {nurse.rating.toFixed(1)}
                  </Typography>
                </Stack>
              )}
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {nurse.specialties.map((s) => (
                  <Chip key={s} label={careTypeLabel(s)} size="small" />
                ))}
              </Box>
              {reason && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                  {reason}
                </Typography>
              )}
            </Box>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            {price ? (
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(price.price)} / {price.unit}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Liên hệ để biết giá
              </Typography>
            )}
            <Button size="small" onClick={() => setOpen(true)}>
              Xem hồ sơ
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{initials(nurse.name)}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {nurse.name}
              </Typography>
              <Chip icon={<VerifiedIcon />} label="Đã xác minh bởi bệnh viện" color="success" size="small" />
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2">
              {nurse.rank} · {nurse.experienceYears} năm kinh nghiệm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trực thuộc {hospital?.name}
            </Typography>
            <Divider />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Chuyên môn được cấp phép
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {nurse.authorizedCareTypes.map((s) => (
                  <Chip key={s} label={careTypeLabel(s)} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
            <List dense disablePadding>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PlaceIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Khu vực phục vụ" secondary={nurse.serviceAreas.join(', ')} />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ScheduleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Lịch rảnh ngoài giờ trực"
                  secondary={nurse.availability.map((a) => `${weekdayLabel(a.weekday)} ${a.start}-${a.end}`).join(' · ') || 'Chưa cập nhật'}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <WorkspacePremiumIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Chứng chỉ hành nghề"
                  secondary={nurse.certificates.map((c) => c.name).join(', ') || 'Chưa cập nhật'}
                />
              </ListItem>
            </List>
            {price && (
              <Alert severity="info" sx={{ py: 0 }}>
                Giá tham khảo: {formatCurrency(price.price)} / {price.unit} (thanh toán ngoài hệ thống)
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Đóng</Button>
          {onSelect && (
            <Button
              variant="contained"
              onClick={() => {
                setOpen(false)
                onSelect(nurse)
              }}
            >
              {selectLabel}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}
