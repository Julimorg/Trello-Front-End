import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import PageHead from '../../components/PageHead'
import { useToast } from '../../components/ToastProvider'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getPatient, updatePatient } from '../../lib/db'
import { DISTRICTS } from '../../lib/constants'
import { BLOOD_TYPES } from '../../Data/patient/profile-data'
import PatientSupport from './PatientSupport'

const FIELDS = ['name', 'phone', 'email', 'address', 'district', 'dateOfBirth', 'gender', 'bloodType', 'allergies', 'conditions', 'insuranceNumber']

function pick(patient) {
  return Object.fromEntries(FIELDS.map((f) => [f, patient?.[f] ?? '']))
}

export default function PatientProfile() {
  const { session } = useAuth()
  const toast = useToast()
  const state = useDb()
  const patient = getPatient(state, session.id)
  const [form, setForm] = useState(() => pick(patient))

  useEffect(() => {
    setForm(pick(patient))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  if (!patient) return null

  const dirty = FIELDS.some((f) => (patient[f] ?? '') !== form[f])
  const valid = form.name.trim() && form.phone.trim()
  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = () => {
    updatePatient(patient.id, form)
    toast('Đã lưu thay đổi', 'Thông tin hồ sơ của bạn đã được cập nhật.')
  }

  return (
    <>
      <PageHead
        eyebrow="CareShift"
        title="Hồ sơ bệnh nhân"
        description="Thông tin liên hệ và dữ liệu sức khỏe được chia sẻ với điều dưỡng theo từng ca."
        action={
          <Button variant="contained" disabled={!dirty || !valid} onClick={save}>
            Lưu thay đổi
          </Button>
        }
      />
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Thông tin cá nhân</h2>
            <p>Dùng để điều dưỡng liên hệ và đến đúng địa chỉ</p>
          </div>
        </div>
        <div className="panel-body profile-grid">
          <TextField label="Họ và tên" required value={form.name} onChange={(e) => update({ name: e.target.value })} />
          <TextField label="Số điện thoại" required value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          <TextField label="Email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
          <DatePicker
            label="Ngày sinh"
            disableFuture
            value={form.dateOfBirth ? dayjs(form.dateOfBirth) : null}
            onChange={(v) => update({ dateOfBirth: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
          />
          <TextField select label="Giới tính" value={form.gender} onChange={(e) => update({ gender: e.target.value })}>
            <MenuItem value="Nam">Nam</MenuItem>
            <MenuItem value="Nữ">Nữ</MenuItem>
          </TextField>
          <TextField select label="Khu vực" value={form.district} onChange={(e) => update({ district: e.target.value })}>
            {DISTRICTS.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          <TextField className="field-full" label="Địa chỉ chăm sóc" value={form.address} onChange={(e) => update({ address: e.target.value })} />
        </div>
        <div className="panel-head" style={{ borderTop: '1px solid #edf2f2' }}>
          <div>
            <h2>Thông tin sức khỏe</h2>
            <p>Chỉ chia sẻ với điều dưỡng được giao ca</p>
          </div>
        </div>
        <div className="panel-body profile-grid">
          <TextField select label="Nhóm máu" value={form.bloodType} onChange={(e) => update({ bloodType: e.target.value })}>
            {BLOOD_TYPES.map((b) => (
              <MenuItem key={b} value={b}>
                {b}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Số thẻ BHYT" value={form.insuranceNumber} onChange={(e) => update({ insuranceNumber: e.target.value })} />
          <TextField label="Dị ứng" value={form.allergies} onChange={(e) => update({ allergies: e.target.value })} />
          <TextField label="Bệnh nền / tình trạng hiện tại" value={form.conditions} onChange={(e) => update({ conditions: e.target.value })} />
        </div>
      </section>
      <PatientSupport patient={patient} />
    </>
  )
}
