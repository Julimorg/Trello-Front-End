import { useState } from 'react'
import dayjs from 'dayjs'
import { App, Input, Modal, Radio, Space, Typography } from 'antd'
import { reportCannotPerform } from '../../lib/db'
import { DECLINE_REASONS } from './nurse-shared'

const { Paragraph } = Typography

// The nurse cancels one upcoming visit. The hospital finds a replacement and the patient is told.
export default function CancelVisitModal({ open, booking, session, patientName, onCancel, onDone }) {
  const { message } = App.useApp()
  const [choice, setChoice] = useState(DECLINE_REASONS[0])
  const [other, setOther] = useState('')
  const reason = choice === 'other' ? other.trim() : choice
  if (!session) return null

  const submit = () => {
    reportCannotPerform({ bookingId: booking.id, sessionId: session.id, reason })
    message.info('Đã hủy buổi. Bệnh viện đang tìm điều dưỡng thay thế và đã thông báo cho bệnh nhân.')
    onDone?.()
  }

  return (
    <Modal
      open={open}
      title={`Hủy buổi ${dayjs(session.date).format('DD/MM')} (${session.start}–${session.end}) của ${patientName}?`}
      okText="Hủy buổi"
      okButtonProps={{ danger: true, disabled: !reason }}
      cancelText="Quay lại"
      onCancel={onCancel}
      onOk={submit}
      destroyOnHidden
    >
      <Paragraph type="secondary">Bệnh viện sẽ tìm điều dưỡng thay thế cho buổi này và bệnh nhân được thông báo. Các buổi khác trong liệu trình không đổi.</Paragraph>
      <Radio.Group value={choice} onChange={(e) => setChoice(e.target.value)}>
        <Space orientation="vertical">
          {DECLINE_REASONS.map((r) => (
            <Radio key={r} value={r}>
              {r}
            </Radio>
          ))}
          <Radio value="other">Khác</Radio>
        </Space>
      </Radio.Group>
      {choice === 'other' && <Input.TextArea style={{ marginTop: 12 }} rows={3} autoFocus placeholder="Nhập lý do" value={other} onChange={(e) => setOther(e.target.value)} />}
    </Modal>
  )
}
