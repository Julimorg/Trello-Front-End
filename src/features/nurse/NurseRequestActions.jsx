import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { App, Button, Flex, Input, Modal, Popconfirm, Radio, Space, Tag, Typography } from 'antd'
import { CheckOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { respondToCareRequest } from '../../lib/db'
import { NURSE_RESPONSE_WINDOW_MINUTES } from '../../Data/nurse/requests-data'
import { DECLINE_REASONS } from './nurse-shared'

const { Paragraph } = Typography

function useMinuteClock() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])
  return now
}

function DeclineModal({ open, onCancel, onConfirm, patientName }) {
  const [choice, setChoice] = useState(DECLINE_REASONS[0])
  const [other, setOther] = useState('')
  const reason = choice === 'other' ? other.trim() : choice
  return (
    <Modal
      open={open}
      title={`Từ chối ca của ${patientName}?`}
      okText="Từ chối ca"
      okButtonProps={{ danger: true, disabled: !reason }}
      cancelText="Quay lại"
      onCancel={onCancel}
      onOk={() => onConfirm(reason)}
      destroyOnHidden
    >
      <Paragraph type="secondary">Lý do được gửi tới bệnh nhân. CareShift sẽ chuyển yêu cầu tới điều dưỡng phù hợp tiếp theo.</Paragraph>
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
      {choice === 'other' && (
        <Input.TextArea style={{ marginTop: 12 }} rows={3} autoFocus placeholder="Nhập lý do" value={other} onChange={(e) => setOther(e.target.value)} />
      )}
    </Modal>
  )
}

// Response window countdown + accept / decline for a request waiting on this nurse.
export default function NurseRequestActions({ careRequest, patientName }) {
  const { message } = App.useApp()
  const [declineOpen, setDeclineOpen] = useState(false)
  const now = useMinuteClock()
  const askedAt = dayjs(careRequest.selectedAt || careRequest.createdAt)
  const minutesLeft = Math.min(NURSE_RESPONSE_WINDOW_MINUTES, Math.ceil((askedAt.valueOf() + NURSE_RESPONSE_WINDOW_MINUTES * 60000 - now) / 60000))

  const accept = () => {
    respondToCareRequest(careRequest.id, 'accept')
    message.success(`Đã nhận ca của ${patientName}. Bệnh nhân đã được thông báo.`)
  }
  const decline = (reason) => {
    respondToCareRequest(careRequest.id, 'decline', { reason })
    setDeclineOpen(false)
    message.info('Đã từ chối ca. Yêu cầu được chuyển tới điều dưỡng tiếp theo.')
  }

  return (
    <Flex justify="space-between" align="center" wrap gap={10} className="nurse-request-actions">
      <Tag icon={<ClockCircleOutlined />} color={minutesLeft > 0 ? 'gold' : 'red'}>
        {minutesLeft > 0 ? `Còn ${minutesLeft} phút để phản hồi` : 'Đã quá hạn phản hồi'}
      </Tag>
      <Space>
        <Button icon={<CloseOutlined />} onClick={() => setDeclineOpen(true)}>
          Từ chối
        </Button>
        <Popconfirm title="Nhận ca này?" description="Lịch chăm sóc sẽ được tạo và gửi cho bệnh nhân ngay." okText="Nhận ca" cancelText="Chưa" onConfirm={accept}>
          <Button type="primary" icon={<CheckOutlined />}>
            Nhận ca
          </Button>
        </Popconfirm>
      </Space>
      <DeclineModal open={declineOpen} patientName={patientName} onCancel={() => setDeclineOpen(false)} onConfirm={decline} />
    </Flex>
  )
}
