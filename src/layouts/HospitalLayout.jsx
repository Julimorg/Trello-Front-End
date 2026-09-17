import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupIcon from '@mui/icons-material/Group'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PriceChangeIcon from '@mui/icons-material/PriceChange'
import EventIcon from '@mui/icons-material/Event'
import BadgeIcon from '@mui/icons-material/Badge'
import AppShell from '../components/AppShell'
import { useAuth } from '../auth/AuthContext'
import { useDb } from '../lib/store'
import { getHospital, getNurse } from '../lib/db'

const adminNavItems = [
  { to: '/hospital/admin/dashboard', label: 'Tổng quan', icon: <DashboardIcon /> },
  { to: '/hospital/admin/nurses', label: 'Nhân sự điều dưỡng', icon: <GroupIcon /> },
  { to: '/hospital/admin/cannot-perform', label: 'Ca cần hỗ trợ đổi người', icon: <SwapHorizIcon /> },
  { to: '/hospital/admin/sos-log', label: 'Cảnh báo SOS', icon: <WarningAmberIcon /> },
  { to: '/hospital/admin/pricing', label: 'Giá dịch vụ', icon: <PriceChangeIcon /> },
]

const nurseNavItems = [
  { to: '/hospital/nurse/schedule', label: 'Lịch làm việc', icon: <EventIcon /> },
  { to: '/hospital/nurse/profile', label: 'Hồ sơ cá nhân', icon: <BadgeIcon /> },
]

export default function HospitalLayout() {
  const { session } = useAuth()
  const state = useDb()
  const isNurse = session.role === 'nurse'
  const hospital = getHospital(state, isNurse ? getNurse(state, session.id)?.hospitalId : session.id)
  const nurse = isNurse ? getNurse(state, session.id) : null

  return (
    <AppShell
      appLabel="CareShift · Bệnh viện"
      identityLabel={isNurse ? `${nurse?.name || ''} · ${hospital?.name || ''}` : `${hospital?.name || ''} (Admin)`}
      navItems={isNurse ? nurseNavItems : adminNavItems}
      notificationRole={isNurse ? 'nurse' : 'hospital'}
      notificationTargetId={isNurse ? session.id : hospital?.id}
    />
  )
}
