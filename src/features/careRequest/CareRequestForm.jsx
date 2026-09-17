import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../auth/AuthContext'
import { createCareRequest } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, FREQUENCIES, WEEKDAYS } from '../../lib/constants'

const STEPS = ['Loại nhu cầu', 'Khu vực & thời gian', 'Ghi chú & xác nhận']

function draftKey(patientId) {
  return `careshift_draft_carerequest_${patientId}`
}

const initialForm = {
  careType: '',
  otherCareTypeNote: '',
  district: '',
  desiredStartDate: '',
  frequency: 'once',
  weekdays: [],
  timeStart: '17:00',
  timeEnd: '19:00',
  sessionDuration: 60,
  notes: '',
}

export default function CareRequestForm() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(session.id))
      if (raw) {
        setForm(JSON.parse(raw))
        setDraftLoaded(true)
      }
    } catch {
      // ignore
    }
  }, [session.id])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey(session.id), JSON.stringify(form))
    } catch {
      // ignore
    }
  }

  const canProceedStep0 = form.careType && (form.careType !== 'other' || form.otherCareTypeNote.trim())
  const canProceedStep1 =
    form.district &&
    form.desiredStartDate &&
    form.frequency &&
    (form.frequency !== 'weekly' || form.weekdays.length > 0) &&
    form.timeStart &&
    form.timeEnd

  const handleNext = () => {
    saveDraft()
    setActiveStep((s) => s + 1)
  }
  const handleBack = () => setActiveStep((s) => s - 1)

  const handleSubmit = () => {
    const id = createCareRequest({
      patientId: session.id,
      careType: form.careType,
      district: form.district,
      desiredStartDate: form.desiredStartDate,
      frequency: form.frequency,
      weekdays: form.frequency === 'weekly' ? form.weekdays : [],
      timeSlot: { start: form.timeStart, end: form.timeEnd },
      sessionDuration: form.sessionDuration,
      notes: form.careType === 'other' ? `[Khác: ${form.otherCareTypeNote}] ${form.notes}` : form.notes,
      createdBy: 'patient',
    })
    try {
      localStorage.removeItem(draftKey(session.id))
    } catch {
      // ignore
    }
    navigate(`/patient/requests/${id}`)
  }

  return (
    <>
      <PageHeader title="Tạo yêu cầu chăm sóc" subtitle="Chỉ mất vài bước để tìm điều dưỡng phù hợp" />
      {draftLoaded && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setDraftLoaded(false)}>
          Đã khôi phục bản nháp bạn đang thực hiện dở.
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Bạn cần loại chăm sóc nào?</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {CARE_TYPES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  clickable
                  color={form.careType === c.id ? 'primary' : 'default'}
                  onClick={() => update({ careType: c.id })}
                  sx={{ fontSize: 15, py: 2.5 }}
                />
              ))}
            </Box>
            {form.careType === 'other' && (
              <TextField
                label="Mô tả nhu cầu của bạn"
                multiline
                minRows={2}
                value={form.otherCareTypeNote}
                onChange={(e) => update({ otherCareTypeNote: e.target.value })}
              />
            )}
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2.5}>
            <TextField
              select
              label="Khu vực"
              value={form.district}
              onChange={(e) => update({ district: e.target.value })}
            >
              {DISTRICTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Ngày bắt đầu mong muốn"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.desiredStartDate}
              onChange={(e) => update({ desiredStartDate: e.target.value })}
            />
            <TextField
              select
              label="Tần suất"
              value={form.frequency}
              onChange={(e) => update({ frequency: e.target.value })}
            >
              {FREQUENCIES.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.label}
                </MenuItem>
              ))}
            </TextField>
            {form.frequency === 'weekly' && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Chọn các ngày trong tuần
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {WEEKDAYS.map((w) => (
                    <Chip
                      key={w.id}
                      label={w.label}
                      clickable
                      color={form.weekdays.includes(w.id) ? 'primary' : 'default'}
                      onClick={() =>
                        update({
                          weekdays: form.weekdays.includes(w.id)
                            ? form.weekdays.filter((d) => d !== w.id)
                            : [...form.weekdays, w.id],
                        })
                      }
                    />
                  ))}
                </Box>
              </Box>
            )}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Giờ bắt đầu mỗi buổi"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.timeStart}
                onChange={(e) => update({ timeStart: e.target.value })}
                fullWidth
              />
              <TextField
                label="Giờ kết thúc mỗi buổi"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={form.timeEnd}
                onChange={(e) => update({ timeEnd: e.target.value })}
                fullWidth
              />
            </Stack>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2.5}>
            <TextField
              label="Ghi chú / chỉ định bác sĩ (không bắt buộc)"
              multiline
              minRows={3}
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Tóm tắt yêu cầu
              </Typography>
              <Typography variant="body2">
                Loại nhu cầu: {CARE_TYPES.find((c) => c.id === form.careType)?.label}
              </Typography>
              <Typography variant="body2">Khu vực: {form.district}</Typography>
              <Typography variant="body2">Ngày bắt đầu: {form.desiredStartDate}</Typography>
              <Typography variant="body2">
                Tần suất: {FREQUENCIES.find((f) => f.id === form.frequency)?.label}
              </Typography>
              <Typography variant="body2">
                Khung giờ: {form.timeStart} - {form.timeEnd}
              </Typography>
            </Paper>
          </Stack>
        )}

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
          <Button onClick={handleBack} disabled={activeStep === 0}>
            Quay lại
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={saveDraft} color="inherit">
              Lưu nháp
            </Button>
            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={activeStep === 0 ? !canProceedStep0 : !canProceedStep1}
              >
                Tiếp tục
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit}>
                Gửi yêu cầu
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </>
  )
}
