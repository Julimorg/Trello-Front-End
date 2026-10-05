import Shell from '../components/Shell'
import PatientThemeProvider from '../patient/PatientThemeProvider'
import PatientSos from '../features/sos/PatientSos'
import { useAuth } from '../auth/AuthContext'
import { useDb } from '../lib/store'
import { getPatient } from '../lib/db'

const navItems = [
  { to: '/patient/overview', label: 'Tổng quan', icon: 'home' },
  { to: '/patient/request', label: 'Yêu cầu chăm sóc', icon: 'plus' },
  { to: '/patient/bookings', label: 'Lịch chăm sóc', icon: 'calendar' },
  { to: '/patient/nurses', label: 'Điều dưỡng tin cậy', icon: 'user' },
  { to: '/patient/family', label: 'Người thân liên kết', icon: 'users' },
  { to: '/patient/profile', label: 'Hồ sơ cá nhân', icon: 'settings' },
]

function initials(name) {
  return (name || '')
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function PatientLayout() {
  const { session } = useAuth()
  const state = useDb()
  const patient = getPatient(state, session.id)

  return (
    <PatientThemeProvider>
      <Shell
        appLabel="Ứng dụng bệnh nhân"
        roleDot="patient"
        roleAvatar="BN"
        roleLabel="Bệnh nhân"
        orgLabel={patient?.name || ''}
        navItems={navItems}
        profileName={patient?.name || ''}
        profileMeta="Bệnh nhân"
        profileInitials={initials(patient?.name)}
        profileTo="/patient/profile"
        notificationRole="patient"
        notificationTargetId={session.id}
      />
      <PatientSos patientId={session.id} />
    </PatientThemeProvider>
  )
}
