import { useState } from 'react'
import dayjs from 'dayjs'
import { App, Button, Flex, Input, Modal, Typography } from 'antd'
import { HomeOutlined, MedicineBoxOutlined, PhoneOutlined, RightOutlined } from '@ant-design/icons'
import { useDb } from '../../lib/store'
import { attachSosLocation, getHospital, getNurse, getPatient, listBookingsByNurse, triggerSOS } from '../../lib/db'
import { getLocation } from '../../lib/geo'
import { useDraggableFab } from '../../lib/draggableFab'
import { SESSION_STATUS, SOS_TYPES } from '../../lib/constants'

const { Text, Title } = Typography

// The shift to attach an SOS to: today's session in progress, else today's next one.
function currentShift(state, nurseId) {
  const today = dayjs().format('YYYY-MM-DD')
  const nowTime = dayjs().format('HH:mm')
  const todays = listBookingsByNurse(state, nurseId)
    .flatMap((b) => b.sessions.filter((s) => s.nurseId === nurseId && s.date === today).map((s) => ({ booking: b, session: s })))
    .filter(({ session }) => session.status === SESSION_STATUS.CONFIRMED || session.status === SESSION_STATUS.REASSIGNED)
    .sort((a, b) => a.session.start.localeCompare(b.session.start))
  return todays.find(({ session }) => session.start <= nowTime && session.end >= nowTime) || todays.find(({ session }) => session.end >= nowTime) || todays[0] || null
}

// SOS for nurses, on every nurse page. Draggable like the patient's; the alert is recorded
// immediately and the GPS position attached when (if) the browser provides it.
export default function NurseSos({ nurseId }) {
  const state = useDb()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const { buttonRef, ringRef, consumeDrag } = useDraggableFab('careshift_sos_position_nurse')

  const shift = currentShift(state, nurseId)
  const patient = shift ? getPatient(state, shift.booking.patientId) : null
  const hospital = getHospital(state, getNurse(state, nurseId)?.hospitalId)
  const family = (patient?.familyContacts || []).filter((c) => c.status === 'Đã liên kết')

  const actions = [
    { type: SOS_TYPES.CALL_115, icon: <PhoneOutlined />, title: 'Gọi 115', hint: 'Tình huống cấp cứu y tế', done: 'Đã gọi 115' },
    { type: SOS_TYPES.NOTIFY_HOSPITAL, icon: <MedicineBoxOutlined />, title: 'Báo bệnh viện', hint: `Điều phối viên trực · ${hospital?.name || ''}`, done: 'Đã báo bệnh viện' },
    {
      type: SOS_TYPES.NOTIFY_FAMILY,
      icon: <HomeOutlined />,
      title: 'Báo người thân bệnh nhân',
      hint: !patient ? 'Không có ca chăm sóc hôm nay' : family.length ? family.map((c) => c.name).join(', ') : 'Bệnh nhân chưa liên kết người thân',
      done: 'Đã báo người thân',
      disabled: family.length === 0,
    },
  ]

  const send = (action) => {
    const eventId = triggerSOS({
      bookingId: shift?.booking.id,
      sessionId: shift?.session.id,
      nurseId,
      triggeredBy: 'nurse',
      type: action.type,
      note: note.trim(),
      location: null,
      contactIds: action.type === SOS_TYPES.NOTIFY_FAMILY ? family.map((c) => c.id) : [],
    })
    setOpen(false)
    setNote('')
    message.warning(`${action.done}. Sự cố đã được ghi nhận${patient ? ` cho ca của ${patient.name}` : ''}.`)
    getLocation().then((location) => location && attachSosLocation(eventId, location))
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="patient-sos"
        aria-label="Hỗ trợ khẩn cấp (có thể kéo thả)"
        onClick={() => {
          if (!consumeDrag()) setOpen(true)
        }}
      >
        <span ref={ringRef} className="patient-sos-ring" aria-hidden="true" />
        <span className="patient-sos-label">SOS</span> Khẩn cấp
      </button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered width={460} title={null}>
        <Flex vertical align="center" gap={4} style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="nurse-sos-icon">SOS</span>
          <Text type="danger" strong style={{ letterSpacing: '.1em', fontSize: 12 }}>
            HỖ TRỢ KHẨN CẤP
          </Text>
          <Title level={4} style={{ margin: 0 }}>
            Bạn cần liên hệ với ai?
          </Title>
          <Text type="secondary">
            {shift ? `Ca ${shift.session.start}–${shift.session.end}: ${patient?.name} · ${patient?.address}` : 'Hôm nay bạn không có ca chăm sóc nào.'}
          </Text>
        </Flex>
        <Input.TextArea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú cho bệnh viện (không bắt buộc): triệu chứng, tình huống…"
          style={{ marginBottom: 12 }}
        />
        <Flex vertical gap={8}>
          {actions.map((a) => (
            <Button key={a.type} size="large" className="nurse-sos-action" disabled={a.disabled} onClick={() => send(a)}>
              <span className="nurse-sos-action-icon">{a.icon}</span>
              <span className="nurse-sos-action-text">
                <b>{a.title}</b>
                <small>{a.hint}</small>
              </span>
              <RightOutlined />
            </Button>
          ))}
        </Flex>
        <Text type="secondary" style={{ display: 'block', marginTop: 14, fontSize: 12, textAlign: 'center' }}>
          CareShift không thay thế dịch vụ cấp cứu. Nếu có nguy cơ đe dọa tính mạng, hãy gọi 115 ngay.
        </Text>
      </Modal>
    </>
  )
}
