import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import PageHeader from '../../components/PageHeader'
import StatusChip from '../../components/StatusChip'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useDb } from '../../lib/store'
import {
  addAvailability,
  addCertificate,
  getNurse,
  removeAvailability,
  removeCertificate,
  setNurseAuthStatus,
  updateNurse,
} from '../../lib/db'
import { careTypeLabel, weekdayLabel } from '../../lib/format'
import { CARE_TYPES, DISTRICTS, NURSE_AUTH_STATUS, NURSE_AUTH_STATUS_LABEL, WEEKDAYS } from '../../lib/constants'

export default function NurseDetail() {
  const { id } = useParams()
  const state = useDb()
  const nurse = getNurse(state, id)

  const [certForm, setCertForm] = useState({ name: '', number: '', issuedBy: '' })
  const [availForm, setAvailForm] = useState({ weekday: 1, start: '17:00', end: '20:00' })
  const [authorizeOpen, setAuthorizeOpen] = useState(false)
  const [authorizeError, setAuthorizeError] = useState('')
  const [selectedCareTypes, setSelectedCareTypes] = useState([])
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)

  if (!nurse) return <Alert severity="warning">Không tìm thấy điều dưỡng.</Alert>

  const openAuthorize = () => {
    setSelectedCareTypes(nurse.specialties)
    setAuthorizeError('')
    setAuthorizeOpen(true)
  }

  const handleAuthorize = () => {
    const result = setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.AUTHORIZED, selectedCareTypes)
    if (!result.ok) {
      setAuthorizeError(result.error)
      return
    }
    setAuthorizeOpen(false)
  }

  return (
    <>
      <PageHeader
        title={nurse.name}
        subtitle={`${nurse.rank} · ${nurse.experienceYears} năm kinh nghiệm`}
        action={<StatusChip status={nurse.authStatus} labelMap={NURSE_AUTH_STATUS_LABEL} />}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED && (
          <Button variant="contained" onClick={openAuthorize}>
            Cấp phép (Authorized)
          </Button>
        )}
        {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (
          <Button variant="outlined" color="warning" onClick={() => setSuspendOpen(true)}>
            Tạm ngưng
          </Button>
        )}
        {nurse.authStatus !== NURSE_AUTH_STATUS.REVOKED && (
          <Button variant="outlined" color="error" onClick={() => setRevokeOpen(true)}>
            Thu hồi quyền
          </Button>
        )}
      </Stack>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Thông tin cơ bản
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Số điện thoại"
                value={nurse.phone}
                onChange={(e) => updateNurse(nurse.id, { phone: e.target.value })}
                size="small"
              />
              <TextField
                label="Số năm kinh nghiệm"
                type="number"
                value={nurse.experienceYears}
                onChange={(e) => updateNurse(nurse.id, { experienceYears: Number(e.target.value) })}
                size="small"
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Chuyên môn
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {CARE_TYPES.filter((c) => c.id !== 'other').map((c) => (
                    <Chip
                      key={c.id}
                      label={c.label}
                      clickable
                      color={nurse.specialties.includes(c.id) ? 'primary' : 'default'}
                      onClick={() =>
                        updateNurse(nurse.id, {
                          specialties: nurse.specialties.includes(c.id)
                            ? nurse.specialties.filter((s) => s !== c.id)
                            : [...nurse.specialties, c.id],
                        })
                      }
                    />
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Khu vực phục vụ
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {DISTRICTS.map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      clickable
                      color={nurse.serviceAreas.includes(d) ? 'primary' : 'default'}
                      onClick={() =>
                        updateNurse(nurse.id, {
                          serviceAreas: nurse.serviceAreas.includes(d)
                            ? nurse.serviceAreas.filter((s) => s !== d)
                            : [...nurse.serviceAreas, d],
                        })
                      }
                    />
                  ))}
                </Box>
              </Box>
              {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Phạm vi ca được phép hiện tại: {nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || 'Chưa có'}
                </Alert>
              )}
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Chứng chỉ hành nghề
            </Typography>
            <List dense>
              {nurse.certificates.map((c) => (
                <ListItem
                  key={c.id}
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeCertificate(nurse.id, c.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={c.name} secondary={`Số: ${c.number} · Cấp bởi: ${c.issuedBy}`} />
                </ListItem>
              ))}
            </List>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
              <TextField
                size="small"
                label="Tên chứng chỉ"
                value={certForm.name}
                onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="Số chứng chỉ"
                value={certForm.number}
                onChange={(e) => setCertForm((f) => ({ ...f, number: e.target.value }))}
                fullWidth
              />
              <TextField
                size="small"
                label="Nơi cấp"
                value={certForm.issuedBy}
                onChange={(e) => setCertForm((f) => ({ ...f, issuedBy: e.target.value }))}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={!certForm.name.trim() || !certForm.number.trim()}
                onClick={() => {
                  addCertificate(nurse.id, certForm)
                  setCertForm({ name: '', number: '', issuedBy: '' })
                }}
                sx={{ flexShrink: 0 }}
              >
                Thêm
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Lịch rảnh ngoài giờ trực
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Khung giờ do điều dưỡng khai báo, bệnh viện phê duyệt trước khi đưa vào Nurse Matching.
            </Typography>
            <List dense>
              {nurse.availability.map((a) => (
                <ListItem
                  key={a.id}
                  disableGutters
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeAvailability(nurse.id, a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={`${weekdayLabel(a.weekday)}: ${a.start} - ${a.end}`} />
                </ListItem>
              ))}
              {nurse.availability.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Chưa có khung giờ rảnh nào.
                </Typography>
              )}
            </List>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
              <TextField
                select
                size="small"
                label="Thứ"
                value={availForm.weekday}
                onChange={(e) => setAvailForm((f) => ({ ...f, weekday: Number(e.target.value) }))}
                sx={{ minWidth: 120 }}
              >
                {WEEKDAYS.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="time"
                label="Từ"
                InputLabelProps={{ shrink: true }}
                value={availForm.start}
                onChange={(e) => setAvailForm((f) => ({ ...f, start: e.target.value }))}
              />
              <TextField
                size="small"
                type="time"
                label="Đến"
                InputLabelProps={{ shrink: true }}
                value={availForm.end}
                onChange={(e) => setAvailForm((f) => ({ ...f, end: e.target.value }))}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => addAvailability(nurse.id, availForm)}
                sx={{ flexShrink: 0 }}
              >
                Thêm
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={authorizeOpen}
        title="Cấp phép Authorized"
        confirmLabel="Cấp phép"
        onClose={() => setAuthorizeOpen(false)}
        onConfirm={handleAuthorize}
      >
        {authorizeError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {authorizeError}
          </Alert>
        )}
        <Typography variant="body2" sx={{ mb: 1 }}>
          Chọn phạm vi ca được phép nhận (theo cấp bậc/chuyên ngành):
        </Typography>
        <Stack>
          {nurse.specialties.map((s) => (
            <FormControlLabel
              key={s}
              control={
                <Checkbox
                  checked={selectedCareTypes.includes(s)}
                  onChange={() =>
                    setSelectedCareTypes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
                  }
                />
              }
              label={careTypeLabel(s)}
            />
          ))}
        </Stack>
      </ConfirmDialog>

      <ConfirmDialog
        open={suspendOpen}
        title="Tạm ngưng điều dưỡng?"
        description="Điều dưỡng sẽ không được đề xuất trong Nurse Matching cho đến khi được cấp phép lại."
        confirmLabel="Tạm ngưng"
        confirmColor="warning"
        onClose={() => setSuspendOpen(false)}
        onConfirm={() => {
          setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.SUSPENDED)
          setSuspendOpen(false)
        }}
      />

      <ConfirmDialog
        open={revokeOpen}
        title="Thu hồi quyền điều dưỡng?"
        description="Dùng khi điều dưỡng nghỉ việc hoặc vi phạm. Các ca đã đặt lịch dang dở sẽ cần được xử lý riêng."
        confirmLabel="Thu hồi"
        confirmColor="error"
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => {
          setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.REVOKED)
          setRevokeOpen(false)
        }}
      />

      <Divider sx={{ my: 3 }} />
    </>
  )
}
