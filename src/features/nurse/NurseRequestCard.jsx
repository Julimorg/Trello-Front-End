import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Avatar, Button, Card, Descriptions, Flex, Input, Modal, Popconfirm, Radio, Space, Tag, Typography } from 'antd'
import { CheckOutlined, ClockCircleOutlined, CloseOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useDb } from '../../lib/store'
import { getBooking, getNurse, getPatient, respondToCareRequest } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { FREQUENCIES, WEEKDAYS } from '../../lib/constants'
import { NURSE_RESPONSE_WINDOW_MINUTES } from '../../Data/nurse/requests-data'
import { CLOSED_REASON, DECLINE_REASONS, RELATION_META, initials } from './nurse-shared'

const { Text, Paragraph } = Typography

function useMinuteClock(enabled) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return undefined
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [enabled])
  return now
}

function frequencyText(careRequest) {
  const base = FREQUENCIES.find((f) => f.id === careRequest.frequency)?.label || careRequest.frequency
  if (careRequest.frequency !== 'weekly' || !careRequest.weekdays?.length) return base.replace(' (chọn thứ)', '')
  return `Hàng tuần · ${careRequest.weekdays.map((d) => (WEEKDAYS.find((w) => w.id === d)?.label || '').replace('Thứ ', 'T').replace('Chủ nhật', 'CN')).join(', ')}`
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

export default function NurseRequestCard({ careRequest, relation, nurseId, highlighted, isNew, cardRef, compact = false }) {
  const state = useDb()
  const { message } = App.useApp()
  const [declineOpen, setDeclineOpen] = useState(false)
  const now = useMinuteClock(relation === 'pending')
  const patient = getPatient(state, careRequest.patientId)
  const meta = RELATION_META[relation]

  const askedAt = dayjs(careRequest.selectedAt || careRequest.createdAt)
  const minutesLeft = Math.min(NURSE_RESPONSE_WINDOW_MINUTES, Math.ceil((askedAt.valueOf() + NURSE_RESPONSE_WINDOW_MINUTES * 60000 - now) / 60000))
  const booking = careRequest.bookingId ? getBooking(state, careRequest.bookingId) : null
  const nextSession = booking?.sessions.find((s) => s.date >= dayjs().format('YYYY-MM-DD') && s.nurseId === nurseId)
  const declineReason = careRequest.declineReasons?.find((d) => d.nurseId === nurseId)?.reason
  const position = careRequest.matchedNurseIds.indexOf(nurseId) + 1

  const accept = () => {
    respondToCareRequest(careRequest.id, 'accept')
    message.success(`Đã nhận ca của ${patient?.name}. Bệnh nhân đã được thông báo.`)
  }
  const decline = (reason) => {
    respondToCareRequest(careRequest.id, 'decline', { reason })
    setDeclineOpen(false)
    message.info('Đã từ chối ca. Yêu cầu được chuyển tới điều dưỡng tiếp theo.')
  }

  let footer = null
  if (relation === 'pending') {
    footer = (
      <Flex justify="space-between" align="center" wrap gap={10}>
        <Tag icon={<ClockCircleOutlined />} color={minutesLeft > 0 ? 'gold' : 'red'}>
          {minutesLeft > 0 ? `Còn ${minutesLeft} phút để phản hồi` : 'Đã quá hạn phản hồi'}
        </Tag>
        <Space>
          <Button icon={<CloseOutlined />} onClick={() => setDeclineOpen(true)}>
            Từ chối
          </Button>
          <Popconfirm
            title="Nhận ca này?"
            description="Lịch chăm sóc sẽ được tạo và gửi cho bệnh nhân ngay."
            okText="Nhận ca"
            cancelText="Chưa"
            onConfirm={accept}
          >
            <Button type="primary" icon={<CheckOutlined />}>
              Nhận ca
            </Button>
          </Popconfirm>
        </Space>
      </Flex>
    )
  } else if (relation === 'suggested') {
    footer = (
      <Text type="secondary">
        Bạn là lựa chọn {position}/{careRequest.matchedNurseIds.length} trong danh sách đề xuất. Yêu cầu sẽ chuyển sang “Chờ phản hồi” khi bệnh nhân chọn bạn.
      </Text>
    )
  } else if (relation === 'accepted') {
    footer = (
      <Flex justify="space-between" align="center" wrap gap={10}>
        <Text type="secondary">{nextSession ? `Buổi tiếp theo: ${formatDate(nextSession.date)} · ${nextSession.start}` : 'Tất cả buổi đã hoàn thành'}</Text>
        <Space wrap>
          {nextSession && (
            <Link to={`/hospital/nurse/sessions/${nextSession.id}`}>
              <Button>Chi tiết buổi tới</Button>
            </Link>
          )}
          <Link to={`/hospital/nurse/schedule?date=${nextSession?.date || booking?.sessions[0]?.date || ''}`}>
            <Button>Xem trên lịch</Button>
          </Link>
        </Space>
      </Flex>
    )
  } else if (relation === 'declined') {
    const takenBy = careRequest.selectedNurseId ? getNurse(state, careRequest.selectedNurseId) : null
    footer = (
      <Text type="secondary">
        Bạn đã từ chối{declineReason ? ` · ${declineReason}` : ''}.{takenBy ? ` Yêu cầu đã chuyển tới ${takenBy.name}.` : ''}
      </Text>
    )
  } else {
    footer = <Text type="secondary">{CLOSED_REASON[careRequest.status] || 'Yêu cầu đã đóng'}</Text>
  }

  return (
    <div ref={cardRef} className={`nurse-request${highlighted ? ' is-highlighted' : ''}${isNew ? ' is-new' : ''}`} id={`req-${careRequest.id}`}>
      <Card size="small">
        <Flex gap={12} align="flex-start">
          <Avatar size={44} style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>
            {initials(patient?.name)}
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Flex justify="space-between" align="flex-start" gap={8} wrap>
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  {careTypeLabel(careRequest.careType)} · {patient?.name}
                </Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{careRequest.id} · {dayjs(careRequest.createdAt).fromNow()}
                  </Text>
                </div>
              </div>
              <Space size={4} wrap>
                {isNew && <Tag color="magenta">Mới</Tag>}
                <Tag color={meta.color}>{meta.label}</Tag>
              </Space>
            </Flex>
            <Descriptions
              size="small"
              column={compact ? { xs: 1, sm: 2 } : { xs: 1, sm: 2, md: 3 }}
              style={{ marginTop: 10 }}
              items={[
                { key: 'start', label: 'Bắt đầu', children: formatDate(careRequest.desiredStartDate) },
                { key: 'time', label: 'Khung giờ', children: `${careRequest.timeSlot?.start}–${careRequest.timeSlot?.end}` },
                { key: 'freq', label: 'Tần suất', children: frequencyText(careRequest) },
                {
                  key: 'area',
                  label: 'Khu vực',
                  children: (
                    <span>
                      <EnvironmentOutlined /> {patient?.address || careRequest.district}
                    </span>
                  ),
                },
                { key: 'cond', label: 'Bệnh nền', children: patient?.conditions || '—' },
              ].filter((item) => !compact || item.key !== 'cond')}
            />
            {careRequest.notes && (
              <Paragraph type="secondary" ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }} style={{ margin: '4px 0 0' }}>
                Ghi chú: {careRequest.notes}
              </Paragraph>
            )}
          </div>
        </Flex>
        <div className="nurse-request-footer">{footer}</div>
      </Card>
      <DeclineModal open={declineOpen} patientName={patient?.name} onCancel={() => setDeclineOpen(false)} onConfirm={decline} />
    </div>
  )
}
