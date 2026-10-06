import { useState } from 'react'
import { App, Button, Flex, Modal, Typography } from 'antd'
import { AlertOutlined, HomeOutlined, MedicineBoxOutlined, PhoneOutlined, RightOutlined } from '@ant-design/icons'
import { useDb } from '../../lib/store'
import { attachSosLocation, getBooking, getHospital, getNurse, getPatient, triggerSOS } from '../../lib/db'
import { getLocation } from '../../lib/geo'
import { SOS_TYPES } from '../../lib/constants'

const { Text, Title } = Typography

// SOS for a nurse during today's shift. The alert is recorded immediately; the GPS
// position is attached when (if) the browser provides it.
export default function NurseSos({ bookingId, sessionId, nurseId }) {
  const state = useDb()
  const { message } = App.useApp()
  const [open, setOpen] = useState(false)
  const booking = getBooking(state, bookingId)
  const patient = booking ? getPatient(state, booking.patientId) : null
  const hospital = getHospital(state, getNurse(state, nurseId)?.hospitalId)
  const family = (patient?.familyContacts || []).filter((c) => c.status === 'Đã liên kết')

  const actions = [
    { type: SOS_TYPES.CALL_115, icon: <PhoneOutlined />, title: 'Gọi 115', hint: 'Tình huống cấp cứu y tế', done: 'Đã gọi 115' },
    { type: SOS_TYPES.NOTIFY_HOSPITAL, icon: <MedicineBoxOutlined />, title: 'Báo bệnh viện', hint: `Điều phối viên trực · ${hospital?.name || ''}`, done: 'Đã báo bệnh viện' },
    {
      type: SOS_TYPES.NOTIFY_FAMILY,
      icon: <HomeOutlined />,
      title: 'Báo người thân bệnh nhân',
      hint: family.length ? family.map((c) => c.name).join(', ') : 'Bệnh nhân chưa liên kết người thân',
      done: 'Đã báo người thân',
      disabled: family.length === 0,
    },
  ]

  const send = (action) => {
    const eventId = triggerSOS({
      bookingId,
      sessionId,
      triggeredBy: 'nurse',
      type: action.type,
      location: null,
      contactIds: action.type === SOS_TYPES.NOTIFY_FAMILY ? family.map((c) => c.id) : [],
    })
    setOpen(false)
    message.warning(`${action.done}. Sự cố đã được ghi nhận cho ca của ${patient?.name || 'bệnh nhân'}.`)
    getLocation().then((location) => location && attachSosLocation(eventId, location))
  }

  return (
    <>
      <button type="button" className="nurse-sos-button" onClick={() => setOpen(true)} aria-label="Khẩn cấp SOS">
        <AlertOutlined /> SOS
      </button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered width={460} title={null}>
        <Flex vertical align="center" gap={4} style={{ textAlign: 'center', marginBottom: 18 }}>
          <span className="nurse-sos-icon">SOS</span>
          <Text type="danger" strong style={{ letterSpacing: '.1em', fontSize: 12 }}>
            HỖ TRỢ KHẨN CẤP
          </Text>
          <Title level={4} style={{ margin: 0 }}>
            Bạn cần liên hệ với ai?
          </Title>
          <Text type="secondary">Ca đang diễn ra: {patient?.name} · {patient?.address}</Text>
        </Flex>
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
