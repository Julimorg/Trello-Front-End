import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import PatientThemeProvider from '../../patient/PatientThemeProvider'
import { useToast } from '../../components/ToastProvider'
import { useDb } from '../../lib/store'
import { createCareRequest, getPatient } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, FREQUENCIES, WEEKDAYS } from '../../lib/constants'
import { careTypeLabel, weekdayLabel } from '../../lib/format'
import { CARE_OPTION_META } from '../../Data/patient/care-request-data'
import { Icon } from '../../lib/icons'

const STEPS = ['Nhu cầu', 'Thời gian', 'Xác nhận']

function draftKey(patientId) {
  return `careshift_draft_carerequest_${patientId}`
}

const initialForm = {
  careType: '',
  otherNote: '',
  district: DISTRICTS[0],
  desiredStartDate: '',
  timeStart: '14:00',
  timeEnd: '15:30',
  frequency: 'once',
  weekdays: [],
  notes: '',
  consent: false,
}

function WizardContent({ open, onClose, patientId, createdBy, onCreated }) {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const patientDistrict = getPatient(useDb(), patientId)?.district

  useEffect(() => {
    if (!open) return
    // Default the care location to the patient's own district when there is no saved draft.
    const base = DISTRICTS.includes(patientDistrict) ? { ...initialForm, district: patientDistrict } : initialForm
    try {
      const raw = localStorage.getItem(draftKey(patientId))
      setForm(raw ? { ...base, ...JSON.parse(raw) } : base)
    } catch {
      setForm(base)
    }
    setStep(0)
  }, [open, patientId, patientDistrict])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const handleClose = () => {
    try {
      localStorage.setItem(draftKey(patientId), JSON.stringify(form))
    } catch {
      // ignore
    }
    onClose()
  }

  const timeValid = form.timeStart && form.timeEnd && form.timeEnd > form.timeStart
  const step1Valid = Boolean(form.careType && form.district && (form.careType !== 'other' || form.otherNote.trim()))
  const step2Filled = Boolean(form.desiredStartDate && timeValid && form.frequency && (form.frequency !== 'weekly' || form.weekdays.length > 0))
  const step2Valid = step2Filled && form.consent
  const canNext = step === 0 ? step1Valid : step === 1 ? step2Valid : true

  const submit = () => {
    const id = createCareRequest({
      patientId,
      careType: form.careType,
      district: form.district,
      desiredStartDate: form.desiredStartDate,
      frequency: form.frequency,
      weekdays: form.frequency === 'weekly' ? form.weekdays : [],
      timeSlot: { start: form.timeStart, end: form.timeEnd },
      notes: form.careType === 'other' ? `[Khác: ${form.otherNote}] ${form.notes}` : form.notes,
      createdBy,
    })
    try {
      localStorage.removeItem(draftKey(patientId))
    } catch {
      // ignore
    }
    toast('Đã tạo yêu cầu chăm sóc', 'CareShift đang tìm điều dưỡng phù hợp trong khu vực bạn chọn.')
    setForm(initialForm)
    onCreated?.(id)
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" aria-labelledby="careModalTitle">
      <div className="modal-head" style={{ paddingBottom: 12 }}>
        <div>
          <span className="eyebrow">Yêu cầu chăm sóc mới</span>
          <h2 id="careModalTitle">Bạn cần hỗ trợ điều gì?</h2>
        </div>
        <IconButton aria-label="Đóng" onClick={handleClose} sx={{ border: '1px solid var(--line)', borderRadius: '10px' }}>
          <Icon.close />
        </IconButton>
      </div>
      <Stepper activeStep={step} alternativeLabel sx={{ px: 2, pb: 2, borderBottom: '1px solid #edf2f2' }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="wizard-panel active">
        {step === 0 && (
          <>
            <span className="field-label">
              Loại chăm sóc <em>*</em>
            </span>
            <div className="care-options">
              {CARE_TYPES.map((c) => (
                <button key={c.id} type="button" className={form.careType === c.id ? 'selected' : ''} onClick={() => update({ careType: c.id })}>
                  <span>{CARE_OPTION_META[c.id]?.glyph}</span>
                  <b>{c.label}</b>
                  <small>{CARE_OPTION_META[c.id]?.hint}</small>
                </button>
              ))}
            </div>
            {form.careType === 'other' && (
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Mô tả nhu cầu"
                required
                value={form.otherNote}
                onChange={(e) => update({ otherNote: e.target.value })}
                sx={{ mb: 2 }}
              />
            )}
            <TextField select fullWidth required label="Khu vực chăm sóc" value={form.district} onChange={(e) => update({ district: e.target.value })}>
              {DISTRICTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </>
        )}

        {step === 1 && (
          <div className="wizard-fields">
            <DatePicker
              label="Ngày chăm sóc *"
              disablePast
              value={form.desiredStartDate ? dayjs(form.desiredStartDate) : null}
              onChange={(v) => update({ desiredStartDate: v && v.isValid() ? v.format('YYYY-MM-DD') : '' })}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField select fullWidth label="Tần suất" value={form.frequency} onChange={(e) => update({ frequency: e.target.value })}>
              {FREQUENCIES.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="time"
              label="Giờ bắt đầu *"
              value={form.timeStart}
              onChange={(e) => update({ timeStart: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="time"
              label="Giờ kết thúc *"
              value={form.timeEnd}
              error={Boolean(form.timeStart && form.timeEnd) && !timeValid}
              helperText={form.timeStart && form.timeEnd && !timeValid ? 'Giờ kết thúc phải sau giờ bắt đầu' : ' '}
              onChange={(e) => update({ timeEnd: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {form.frequency === 'weekly' && (
              <div className="field-full">
                <span className="field-label">
                  Lặp lại vào <em>*</em>
                </span>
                <div className="chip-row">
                  {WEEKDAYS.map((w) => {
                    const active = form.weekdays.includes(w.id)
                    return (
                      <Chip
                        key={w.id}
                        label={w.label}
                        clickable
                        color={active ? 'primary' : 'default'}
                        variant={active ? 'filled' : 'outlined'}
                        onClick={() => update({ weekdays: active ? form.weekdays.filter((d) => d !== w.id) : [...form.weekdays, w.id] })}
                      />
                    )
                  })}
                </div>
              </div>
            )}
            <TextField
              className="field-full"
              multiline
              minRows={3}
              label="Ghi chú cho điều dưỡng"
              placeholder="Ví dụ: bệnh nhân vừa phẫu thuật, cần thay băng và theo dõi vết mổ..."
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
            <FormControlLabel
              className="field-full wizard-consent"
              control={<Checkbox checked={form.consent} onChange={(e) => update({ consent: e.target.checked })} />}
              label="Tôi đồng ý chia sẻ thông tin yêu cầu này với các điều dưỡng phù hợp đã được xác minh."
            />
          </div>
        )}

        {step === 2 && (
          <>
            <div className="review-card">
              <h3>Tóm tắt yêu cầu</h3>
              {[
                ['Nhu cầu', form.careType === 'other' ? form.otherNote : careTypeLabel(form.careType)],
                ['Khu vực', form.district],
                ['Thời gian', `${form.desiredStartDate ? dayjs(form.desiredStartDate).format('DD/MM/YYYY') : '—'} · ${form.timeStart}–${form.timeEnd}`],
                [
                  'Tần suất',
                  FREQUENCIES.find((f) => f.id === form.frequency)?.label +
                    (form.frequency === 'weekly' && form.weekdays.length ? ` (${form.weekdays.map(weekdayLabel).join(', ')})` : ''),
                ],
                ['Ghi chú', form.notes || '—'],
              ].map(([label, value]) => (
                <div className="review-row" key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="info-callout">
              <Icon.info />
              <span>CareShift chỉ gợi ý điều dưỡng đã được bệnh viện xác minh, đúng chuyên môn và đang rảnh theo lịch.</span>
            </div>
          </>
        )}
      </div>

      <div className="modal-actions wizard-actions">
        {step === 1 && !step2Valid && (
          <small className="wizard-hint">
            {step2Filled ? 'Vui lòng đánh dấu đồng ý chia sẻ thông tin để tiếp tục.' : 'Vui lòng điền đủ ngày, giờ và tần suất để tiếp tục.'}
          </small>
        )}
        <Button variant="outlined" sx={{ visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => setStep(step - 1)}>
          Quay lại
        </Button>
        <Button variant="contained" disabled={!canNext} onClick={() => (step < 2 ? setStep(step + 1) : submit())}>
          {step === 2 ? 'Tìm điều dưỡng' : 'Tiếp tục'}
        </Button>
      </div>
    </Dialog>
  )
}

// Self-themed so it renders the same from the hospital portal (create-on-behalf) too.
export default function CareRequestWizardModal({ open, onClose, patientId, createdBy = 'patient', onCreated }) {
  return (
    <PatientThemeProvider>
      <WizardContent open={open} onClose={onClose} patientId={patientId} createdBy={createdBy} onCreated={onCreated} />
    </PatientThemeProvider>
  )
}
