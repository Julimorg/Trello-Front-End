import Button from '@mui/material/Button'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { isTrustedNurse, listServedNurses, setTrustedNurse } from '../../lib/db'

// "Chọn thành điều dưỡng đáng tin cậy" — only offered for nurses who have already finished a visit for the patient.
export default function TrustNurseButton({ nurse, size = 'medium', variant }) {
  const { session } = useAuth()
  const toast = useToast()
  const state = useDb()
  if (!nurse || session?.role !== 'patient') return null
  const served = listServedNurses(state, session.id).some((e) => e.nurseId === nurse.id)
  if (!served) return null
  const trusted = isTrustedNurse(state, session.id, nurse.id)

  const toggle = () => {
    setTrustedNurse(session.id, nurse.id, !trusted)
    toast(trusted ? 'Đã bỏ khỏi danh sách tin cậy' : 'Đã thêm vào điều dưỡng đáng tin cậy', trusted ? nurse.name : `${nurse.name} sẽ được ưu tiên gợi ý cho các yêu cầu sau.`)
  }

  return (
    <Button size={size} variant={variant || (trusted ? 'outlined' : 'contained')} color={trusted ? 'inherit' : 'primary'} onClick={toggle}>
      {trusted ? '✓ Đáng tin cậy · Bỏ chọn' : 'Chọn thành điều dưỡng đáng tin cậy'}
    </Button>
  )
}
