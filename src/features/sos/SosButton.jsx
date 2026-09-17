import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Fab from '@mui/material/Fab'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import EmergencyIcon from '@mui/icons-material/Emergency'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import { triggerSOS } from '../../lib/db'
import { SOS_TYPES } from '../../lib/constants'

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    const timer = setTimeout(() => resolve(null), 3000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
      { timeout: 3000 },
    )
  })
}

export default function SosButton({ bookingId, sessionId, role, hospitalPhone }) {
  const [open, setOpen] = useState(false)
  const [doneMessage, setDoneMessage] = useState('')

  const handleTrigger = async (type) => {
    const location = await getLocation()
    triggerSOS({ bookingId, sessionId, triggeredBy: role, type, location })
    setOpen(false)
    setDoneMessage(
      type === SOS_TYPES.CALL_115
        ? 'Đã ghi nhận cảnh báo và gọi 115. Nếu mất mạng, hãy gọi trực tiếp 115.'
        : 'Đã ghi nhận và gửi cảnh báo khẩn cấp.',
    )
  }

  return (
    <>
      <Fab
        color="error"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
        aria-label="SOS"
      >
        <EmergencyIcon />
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle color="error.main" fontWeight={700}>
          Báo động khẩn cấp (SOS)
        </DialogTitle>
        <DialogContent>
          {role === 'nurse' ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <DialogContentText>Chọn hành động cần thực hiện ngay:</DialogContentText>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<LocalHospitalIcon />}
                href="tel:115"
                onClick={() => handleTrigger(SOS_TYPES.CALL_115)}
              >
                Gọi 115
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<MedicalServicesIcon />}
                href={hospitalPhone ? `tel:${hospitalPhone}` : undefined}
                onClick={() => handleTrigger(SOS_TYPES.CALL_DOCTOR)}
              >
                Gọi bác sĩ phụ trách
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<FamilyRestroomIcon />}
                onClick={() => handleTrigger(SOS_TYPES.NOTIFY_FAMILY)}
              >
                Thông báo người thân
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <DialogContentText>
                Hệ thống sẽ gọi 115 và gửi vị trí hiện tại kèm cảnh báo tới bệnh viện quản lý ca chăm sóc này.
              </DialogContentText>
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<EmergencyIcon />}
                href="tel:115"
                onClick={() => handleTrigger(SOS_TYPES.CALL_115)}
              >
                Xác nhận gửi cảnh báo &amp; gọi 115
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!doneMessage}
        autoHideDuration={5000}
        onClose={() => setDoneMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setDoneMessage('')} sx={{ width: '100%' }}>
          {doneMessage}
        </Alert>
      </Snackbar>
    </>
  )
}
