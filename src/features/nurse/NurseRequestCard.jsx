import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { Avatar, Button, Card, Descriptions, Flex, Space, Tag, Typography } from 'antd'
import { EnvironmentOutlined, EyeOutlined } from '@ant-design/icons'
import NurseRequestActions from './NurseRequestActions'
import { useDb } from '../../lib/store'
import { getBooking, getNurse, getPatient } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { CLOSED_REASON, frequencyText, initials, requestStage } from './nurse-shared'

const { Text, Paragraph } = Typography

export default function NurseRequestCard({ careRequest, relation, nurseId, highlighted, isNew, cardRef, compact = false }) {
  const state = useDb()
  const patient = getPatient(state, careRequest.patientId)
  const stage = requestStage(state, careRequest, relation)
  const detailHref = `/hospital/nurse/requests/${careRequest.id}`

  const booking = careRequest.bookingId ? getBooking(state, careRequest.bookingId) : null
  const nextSession = booking?.sessions.find((s) => s.date >= dayjs().format('YYYY-MM-DD') && s.nurseId === nurseId)
  const declineReason = careRequest.declineReasons?.find((d) => d.nurseId === nurseId)?.reason
  const position = careRequest.matchedNurseIds.indexOf(nurseId) + 1
  const detailButton = (
    <Link to={detailHref}>
      <Button icon={<EyeOutlined />}>Xem chi tiết</Button>
    </Link>
  )

  let summary = null
  if (relation === 'suggested') {
    summary = `Bạn là lựa chọn ${position}/${careRequest.matchedNurseIds.length} trong danh sách đề xuất. Yêu cầu chuyển sang “Chờ phản hồi” khi bệnh nhân chọn bạn.`
  } else if (relation === 'accepted') {
    summary = nextSession ? `Buổi tiếp theo: ${formatDate(nextSession.date)} · ${nextSession.start}` : 'Tất cả buổi đã kết thúc — xem lại những việc đã làm.'
  } else if (relation === 'declined') {
    const takenBy = careRequest.selectedNurseId ? getNurse(state, careRequest.selectedNurseId) : null
    summary = `Bạn đã từ chối${declineReason ? ` · ${declineReason}` : ''}.${takenBy ? ` Yêu cầu đã chuyển tới ${takenBy.name}.` : ''}`
  } else if (relation === 'closed') {
    summary = CLOSED_REASON[careRequest.status] || 'Yêu cầu đã đóng'
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
                <Link to={detailHref} className="nurse-request-title">
                  {careTypeLabel(careRequest.careType)} · {patient?.name}
                </Link>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{careRequest.id} · {dayjs(careRequest.createdAt).fromNow()}
                  </Text>
                </div>
              </div>
              <Space size={4} wrap>
                {isNew && <Tag color="magenta">Mới</Tag>}
                <Tag color={stage.color}>{stage.label}</Tag>
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
        <div className="nurse-request-footer">
          {relation === 'pending' ? (
            <Flex justify="space-between" align="center" wrap gap={10}>
              {detailButton}
              <NurseRequestActions careRequest={careRequest} patientName={patient?.name} />
            </Flex>
          ) : (
            <Flex justify="space-between" align="center" wrap gap={10}>
              <Text type="secondary" style={{ flex: '1 1 260px' }}>
                {summary}
              </Text>
              {detailButton}
            </Flex>
          )}
        </div>
      </Card>
    </div>
  )
}
