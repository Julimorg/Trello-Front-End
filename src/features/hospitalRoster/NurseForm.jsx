import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthContext'
import { addNurse } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, NURSE_RANKS } from '../../lib/constants'

const initialForm = { name: '', rank: NURSE_RANKS[0], phone: '', experienceYears: '', specialties: [], serviceAreas: [] }

export default function NurseForm() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)

  const toggle = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))

  const canSubmit = form.name.trim() && form.phone.trim() && form.specialties.length > 0 && form.serviceAreas.length > 0

  const handleSubmit = () => {
    const id = addNurse(session.id, form)
    navigate(`/hospital/admin/nurses/${id}`)
  }

  return (
    <>
      <PageHeader title="Thêm điều dưỡng mới" subtitle="Nhập thông tin cơ bản, sau đó bổ sung chứng chỉ để cấp phép" />
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Họ tên"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Cấp bậc"
              value={form.rank}
              onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
              fullWidth
            >
              {NURSE_RANKS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Số điện thoại"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Số năm kinh nghiệm"
              type="number"
              value={form.experienceYears}
              onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
              fullWidth
            />
          </Stack>

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
                  color={form.specialties.includes(c.id) ? 'primary' : 'default'}
                  onClick={() => toggle('specialties', c.id)}
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
                  color={form.serviceAreas.includes(d) ? 'primary' : 'default'}
                  onClick={() => toggle('serviceAreas', d)}
                />
              ))}
            </Box>
          </Box>

          <Button variant="contained" size="large" disabled={!canSubmit} onClick={handleSubmit}>
            Lưu &amp; tiếp tục
          </Button>
        </Stack>
      </Paper>
    </>
  )
}
