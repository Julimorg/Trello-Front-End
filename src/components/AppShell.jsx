import { useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import MenuIcon from '@mui/icons-material/Menu'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { useAuth } from '../auth/AuthContext'
import { useDb } from '../lib/store'
import { listNotificationsFor } from '../lib/db'
import { formatDateTime } from '../lib/format'

const DRAWER_WIDTH = 260

export default function AppShell({ appLabel, identityLabel, navItems, notificationRole, notificationTargetId }) {
  const { logout } = useAuth()
  const state = useDb()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifAnchor, setNotifAnchor] = useState(null)

  const notifications = useMemo(
    () => (notificationRole && notificationTargetId ? listNotificationsFor(state, notificationRole, notificationTargetId) : []),
    [state, notificationRole, notificationTargetId],
  )

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1 }}>
        <LocalHospitalIcon color="primary" />
        <Typography variant="h6" fontWeight={700} color="primary">
          CareShift
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            sx={{
              '&.active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { sm: `${DRAWER_WIDTH}px` }, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" sx={{ display: { sm: 'none' } }} onClick={() => setMobileOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flexGrow: 1 }}>
            {appLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {identityLabel}
          </Typography>
          <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
            <Badge badgeContent={notifications.filter((n) => !n.read).length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu anchorEl={notifAnchor} open={!!notifAnchor} onClose={() => setNotifAnchor(null)}>
            {notifications.length === 0 && <MenuItem disabled>Chưa có thông báo</MenuItem>}
            {notifications.slice(0, 8).map((n) => (
              <MenuItem key={n.id} sx={{ whiteSpace: 'normal', maxWidth: 320 }} onClick={() => setNotifAnchor(null)}>
                <Box>
                  <Typography variant="body2">{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(n.createdAt)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
          <IconButton onClick={logout} title="Đăng xuất">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
