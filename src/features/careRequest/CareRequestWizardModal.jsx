import { useEffect, useState } from 'react'
import Modal, { ModalCloseButton } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { createCareRequest } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, FREQUENCIES, WEEKDAYS } from '../../lib/constants'
import { careTypeLabel, weekdayLabel } from '../../lib/format'

const CARE_TYPE_GLYPH = {
  'wound-dressing': '✚',
  'vitals-monitoring': '♡',
  'mobility-support': '↗',
  medication: '℞',
  'post-surgery': '✛',
  'elderly-care': '⌂',
  other: '…',
}

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
  consent: true,
}

export default function CareRequestWizardModal({ open, onClose, patientId, createdBy = 'patient', onCreated }) {
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem(draftKey(patientId))
      if (raw) setForm(JSON.parse(raw))
    } catch {
      // ignore
    }
    setStep(1)
  }, [open, patientId])

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))
  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey(patientId), JSON.stringify(form))
    } catch {
      // ignore
    }
  }

  const canNext1 = form.careType && (form.careType !== 'other' || form.otherNote.trim())
  const canNext2 = form.desiredStartDate && form.timeStart && form.timeEnd && (form.frequency !== 'weekly' || form.weekdays.length > 0)

  const handleClose = () => {
    saveDraft()
    onClose()
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
      return
    }
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
    <Modal open={open} onClose={handleClose} className="care-wizard" labelledBy="careModalTitle">
      <div className="modal-head">
        <div>
          <span className="eyebrow">Yêu cầu chăm sóc mới</span>
          <h2 id="careModalTitle">Bạn cần hỗ trợ điều gì?</h2>
        </div>
        <ModalCloseButton onClose={handleClose} />
      </div>

      <div className="wizard-progress">
        <span style={{ width: `${step * 33.333}%` }} />
      </div>
      <div className="wizard-steps">
        <span className={step >= 1 ? 'active' : ''}>1. Nhu cầu</span>
        <span className={step >= 2 ? 'active' : ''}>2. Thời gian</span>
        <span className={step >= 3 ? 'active' : ''}>3. Xác nhận</span>
      </div>

      {step === 1 && (
        <div className="wizard-panel active">
          <span className="field-label">
            Loại chăm sóc <em>*</em>
          </span>
          <div className="care-options">
            {CARE_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={form.careType === c.id ? 'selected' : ''}
                onClick={() => update({ careType: c.id })}
              >
                <span>{CARE_TYPE_GLYPH[c.id]}</span>
                <b>{c.label}</b>
              </button>
            ))}
          </div>
          {form.careType === 'other' && (
            <label>
              <span className="field-label">Mô tả nhu cầu</span>
              <textarea rows={3} value={form.otherNote} onChange={(e) => update({ otherNote: e.target.value })} />
            </label>
          )}
          <div className="field-grid">
            <label>
              <span className="field-label">
                Khu vực chăm sóc <em>*</em>
              </span>
              <select value={form.district} onChange={(e) => update({ district: e.target.value })}>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-panel active">
          <div className="field-grid">
            <label>
              <span className="field-label">
                Ngày chăm sóc <em>*</em>
              </span>
              <input type="date" value={form.desiredStartDate} onChange={(e) => update({ desiredStartDate: e.target.value })} />
            </label>
            <label>
              <span className="field-label">
                Giờ bắt đầu <em>*</em>
              </span>
              <input type="time" value={form.timeStart} onChange={(e) => update({ timeStart: e.target.value })} />
            </label>
          </div>
          <div className="field-grid">
            <label>
              <span className="field-label">Tần suất</span>
              <select value={form.frequency} onChange={(e) => update({ frequency: e.target.value })}>
                {FREQUENCIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Giờ kết thúc mỗi buổi</span>
              <input type="time" value={form.timeEnd} onChange={(e) => update({ timeEnd: e.target.value })} />
            </label>
          </div>
          {form.frequency === 'weekly' && (
            <div className="chip-row" style={{ marginBottom: 16 }}>
              {WEEKDAYS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`chip-select${form.weekdays.includes(w.id) ? ' selected' : ''}`}
                  onClick={() =>
                    update({
                      weekdays: form.weekdays.includes(w.id)
                        ? form.weekdays.filter((d) => d !== w.id)
                        : [...form.weekdays, w.id],
                    })
                  }
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}
          <label>
            <span className="field-label">Ghi chú cho điều dưỡng</span>
            <textarea
              rows={4}
              placeholder="Ví dụ: bệnh nhân vừa phẫu thuật, cần thay băng và theo dõi vết mổ..."
              value={form.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </label>
          <label className="consent">
            <input type="checkbox" checked={form.consent} onChange={(e) => update({ consent: e.target.checked })} />
            <span>Tôi đồng ý chia sẻ thông tin yêu cầu này với các điều dưỡng phù hợp đã được xác minh.</span>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-panel active">
          <div className="review-card">
            <h3>Tóm tắt yêu cầu</h3>
            {[
              ['Nhu cầu', form.careType === 'other' ? form.otherNote : careTypeLabel(form.careType)],
              ['Khu vực', form.district],
              ['Thời gian', `${form.desiredStartDate || '—'} · ${form.timeStart}–${form.timeEnd}`],
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
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v6M12 7h.01" />
            </svg>
            <span>CareShift chỉ gợi ý điều dưỡng đã được bệnh viện xác minh, đúng chuyên môn và đang rảnh theo lịch.</span>
          </div>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn ghost" style={{ visibility: step === 1 ? 'hidden' : 'visible' }} onClick={() => setStep(step - 1)}>
          Quay lại
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : false}
          onClick={handleNext}
        >
          {step === 3 ? 'Tìm điều dưỡng' : 'Tiếp tục'}
        </button>
      </div>
    </Modal>
  )
}
