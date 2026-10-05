import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

export default function PatientConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  confirmColor = 'primary',
  confirmDisabled = false,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-.02em', pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        {description && <DialogContentText sx={{ fontSize: '.84rem', mb: children ? 2 : 0 }}>{description}</DialogContentText>}
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="contained" color={confirmColor} disabled={confirmDisabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
