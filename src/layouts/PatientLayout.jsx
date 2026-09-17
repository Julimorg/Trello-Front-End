import AssignmentIcon from '@mui/icons-material/Assignment'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'
import AppShell from '../components/AppShell'
import { useAuth } from '../auth/AuthContext'
import { useDb } from '../lib/store'
import { getPatient } from '../lib/db'

const navItems = [
  { to: '/patient/requests', label: 'Yêu cầu chăm sóc', icon: <AssignmentIcon /> },
  { to: '/patient/bookings', label: 'Lịch chăm sóc', icon: <EventAvailableIcon /> },
  { to: '/patient/family', label: 'Người thân & SOS', icon: <FamilyRestroomIcon /> },
]

export default function PatientLayout() {
  const { session } = useAuth()
  const state = useDb()
  const patient = getPatient(state, session.id)

  return (
    <AppShell
      appLabel="CareShift · Bệnh nhân"
      identityLabel={patient ? `${patient.name}` : ''}
      navItems={navItems}
      notificationRole="patient"
      notificationTargetId={session.id}
    />
  )
}
