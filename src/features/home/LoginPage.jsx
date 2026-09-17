import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { NURSE_AUTH_STATUS_LABEL } from '../../lib/constants'

const TABS = [
  { value: 'patient', label: 'Bệnh nhân / Gia đình' },
  { value: 'hospitalAdmin', label: 'Admin bệnh viện' },
  { value: 'nurse', label: 'Điều dưỡng' },
  { value: 'platformAdmin', label: 'Admin nền tảng (CareShift)' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const state = useDb()
  const navigate = useNavigate()
  const [tab, setTab] = useState('patient')
  const [selectedId, setSelectedId] = useState('')

  const homeByRole = {
    patient: '/patient/requests',
    hospitalAdmin: '/hospital/admin/dashboard',
    nurse: '/hospital/nurse/schedule',
    platformAdmin: '/admin/dashboard',
  }

  const options = useMemo(() => {
    if (tab === 'patient') return state.patients.map((p) => ({ id: p.id, primary: p.name, secondary: p.district }))
    if (tab === 'hospitalAdmin')
      return state.hospitals.map((h) => ({ id: h.id, primary: h.name, secondary: h.district }))
    if (tab === 'nurse')
      return state.nurses.map((n) => {
        const hospital = state.hospitals.find((h) => h.id === n.hospitalId)
        return {
          id: n.id,
          primary: n.name,
          secondary: `${hospital?.name || ''} · ${n.rank}`,
          badge: NURSE_AUTH_STATUS_LABEL[n.authStatus],
        }
      })
    return []
  }, [tab, state])

  const handleTabChange = (_, value) => {
    setTab(value)
    setSelectedId('')
  }

  const handleLogin = () => {
    if (tab === 'platformAdmin') {
      login({ role: 'platformAdmin', id: 'platform' })
      navigate(homeByRole.platformAdmin)
      return
    }
    if (!selectedId) return
    login({ role: tab, id: selectedId })
    navigate(homeByRole[tab])
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', py: 6 }}>
      <Container maxWidth="sm">
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <LocalHospitalIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h4" fontWeight={800}>
            CareShift
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Bản dựng Phase 1 · Validate — Hospital Roster, Care Request, Nurse Matching, Booking &amp; Scheduling, SOS.
            Chọn vai trò demo để đăng nhập.
          </Typography>
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
            {TABS.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} />
            ))}
          </Tabs>

          {tab === 'platformAdmin' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Đăng nhập với vai trò quản trị toàn hệ thống, quản lý tài khoản bệnh viện / điều dưỡng / bệnh nhân
              theo chính sách chung.
            </Typography>
          ) : (
            <List sx={{ maxHeight: 320, overflowY: 'auto', mb: 1 }}>
              {options.map((o) => (
                <ListItemButton key={o.id} selected={selectedId === o.id} onClick={() => setSelectedId(o.id)}>
                  <ListItemText primary={o.primary} secondary={o.secondary} />
                  {o.badge && <Chip label={o.badge.label} color={o.badge.color} size="small" />}
                </ListItemButton>
              ))}
            </List>
          )}

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={tab !== 'platformAdmin' && !selectedId}
          >
            Đăng nhập
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
