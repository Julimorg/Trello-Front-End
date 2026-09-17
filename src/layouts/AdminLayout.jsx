import InsightsIcon from '@mui/icons-material/Insights'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import GroupIcon from '@mui/icons-material/Group'
import PeopleIcon from '@mui/icons-material/People'
import AppShell from '../components/AppShell'

const navItems = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: <InsightsIcon /> },
  { to: '/admin/hospitals', label: 'Bệnh viện', icon: <LocalHospitalIcon /> },
  { to: '/admin/nurses', label: 'Điều dưỡng', icon: <GroupIcon /> },
  { to: '/admin/patients', label: 'Bệnh nhân', icon: <PeopleIcon /> },
]

export default function AdminLayout() {
  return (
    <AppShell appLabel="CareShift · Quản trị hệ thống" identityLabel="Platform Admin" navItems={navItems} />
  )
}
