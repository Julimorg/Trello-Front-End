import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import PageHeader from '../../components/PageHeader'
import { addHospital } from '../../lib/db'
import { DISTRICTS } from '../../lib/constants'

const initialForm = { name: '', address: '', district: DISTRICTS[0], phone: '' }

export default function HospitalForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)

  const canSubmit = form.name.trim() && form.address.trim() && form.phone.trim()

  const handleSubmit = () => {
    const id = addHospital(form)
    navigate(`/admin/hospitals/${id}`)
  }

  return (
    <>
      <PageHeader title="Thêm bệnh viện đối tác" />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Tên bệnh viện"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <TextField
            label="Địa chỉ"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          <TextField
            select
            label="Khu vực"
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
          >
            {DISTRICTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Button variant="contained" size="large" disabled={!canSubmit} onClick={handleSubmit}>
            Tạo tài khoản bệnh viện
          </Button>
        </Stack>
      </Paper>
    </>
  )
}
