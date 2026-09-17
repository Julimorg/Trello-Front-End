import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import PageHeader from '../../components/PageHeader'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { addFamilyContact, getPatient, listBookingsByPatient, removeFamilyContact } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { SOS_TYPE_LABEL } from '../../lib/constants'

const RELATIONS = ['Con trai', 'Con gái', 'Vợ/Chồng', 'Anh/Chị/Em', 'Người giám hộ', 'Khác']

export default function FamilyContacts() {
  const { session } = useAuth()
  const state = useDb()
  const patient = getPatient(state, session.id)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relation: RELATIONS[0] })
  const [removeTarget, setRemoveTarget] = useState(null)

  const bookingIds = new Set(listBookingsByPatient(state, session.id).map((b) => b.id))
  const sosHistory = state.sosEvents.filter((e) => bookingIds.has(e.bookingId))

  if (!patient) return null

  return (
    <>
      <PageHeader
        title="Người thân & Cảnh báo khẩn cấp"
        subtitle="Người thân được thêm sẽ nhận thông báo ngay khi có cảnh báo SOS trong ca chăm sóc"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Thêm người thân
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ mb: 3 }}>
        {patient.familyContacts.length === 0 ? (
          <Alert severity="warning" sx={{ m: 2 }}>
            Bạn chưa thêm người thân nào để nhận cảnh báo khẩn cấp. Hãy thêm ít nhất một người liên hệ.
          </Alert>
        ) : (
          <List disablePadding>
            {patient.familyContacts.map((c, idx) => (
              <ListItem
                key={c.id}
                divider={idx < patient.familyContacts.length - 1}
                secondaryAction={
                  <IconButton edge="end" onClick={() => setRemoveTarget(c)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={c.name} secondary={`${c.relation} · ${c.phone}`} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" gutterBottom>
        Lịch sử cảnh báo SOS
      </Typography>
      {sosHistory.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Chưa có cảnh báo nào được ghi nhận.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {sosHistory.map((e) => (
            <Paper key={e.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">
                  {SOS_TYPE_LABEL[e.type]} {e.note && `— ${e.note}`}
                </Typography>
                <Chip label={e.triggeredBy === 'nurse' ? 'Điều dưỡng kích hoạt' : 'Gia đình kích hoạt'} size="small" />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(e.createdAt)}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={addOpen}
        title="Thêm người thân"
        confirmLabel="Lưu"
        onClose={() => setAddOpen(false)}
        confirmDisabled={!form.name.trim() || !form.phone.trim()}
        onConfirm={() => {
          addFamilyContact(session.id, form)
          setForm({ name: '', phone: '', relation: RELATIONS[0] })
          setAddOpen(false)
        }}
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Họ tên"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          <TextField
            label="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <TextField
            select
            label="Quan hệ"
            value={form.relation}
            onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
          >
            {RELATIONS.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!removeTarget}
        title="Xóa người thân?"
        description={removeTarget ? `Xóa ${removeTarget.name} khỏi danh sách nhận cảnh báo SOS?` : ''}
        confirmLabel="Xóa"
        confirmColor="error"
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          removeFamilyContact(session.id, removeTarget.id)
          setRemoveTarget(null)
        }}
      />
    </>
  )
}
