import { useLocation, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'

// "Quay lại" for detail pages: goes back in history, or to `fallback` when the page was opened directly.
export default function BackButton({ fallback, label = 'Quay lại' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const go = () => (location.key !== 'default' ? navigate(-1) : navigate(fallback || '/'))
  return (
    <Button variant="outlined" startIcon={<span aria-hidden="true">←</span>} onClick={go}>
      {label}
    </Button>
  )
}
