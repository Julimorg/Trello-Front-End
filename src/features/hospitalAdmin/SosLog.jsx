import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Badge, Button, Card, Descriptions, Drawer, Flex, Input, Segmented, Space, Table, Tag, Timeline, Typography } from 'antd'
import { CheckOutlined, EnvironmentOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getBooking, getCareRequest, getPatient, getSosNurse, listSosEventsForHospital, updateSosStatus } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { SOS_STATUS_META, compareText } from './admin-shared'

const { Text, Paragraph } = Typography

function SosDetailDrawer({ event, open, onClose }) {
  const state = useDb()
  const { message } = App.useApp()
  const [note, setNote] = useState('')
  useEffect(() => setNote(event?.resolution || ''), [event?.id, event?.resolution])
  if (!event) return null

  const status = event.status || 'open'
  const booking = getBooking(state, event.bookingId)
  const session = booking?.sessions.find((s) => s.id === event.sessionId)
  const careRequest = booking ? getCareRequest(state, booking.careRequestId) : null
  const patient = getPatient(state, event.patientId || booking?.patientId)
  const nurse = getSosNurse(state, event)
  const contacts = patient?.familyContacts || []

  const act = (next) => {
    updateSosStatus(event.id, next, note.trim())
    message.success(next === 'resolved' ? 'Đã đánh dấu xử lý xong. Điều dưỡng đã được thông báo.' : 'Đã tiếp nhận cảnh báo.')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={560}
      title={
        <Space>
          <span>Cảnh báo SOS · {event.id}</span>
          <Tag color={SOS_STATUS_META[status].color}>{SOS_STATUS_META[status].label}</Tag>
        </Space>
      }
      extra={
        status !== 'resolved' && (
          <Space>
            {status === 'open' && <Button onClick={() => act('acknowledged')}>Tiếp nhận</Button>}
            <Button type="primary" icon={<CheckOutlined />} onClick={() => act('resolved')}>
              Đã xử lý xong
            </Button>
          </Space>
        )
      }
    >
      <div className="sos-note-box">
        <Text type="secondary" style={{ fontSize: 12 }}>
          Ghi chú từ điều dưỡng
        </Text>
        <Paragraph style={{ margin: '4px 0 0', fontSize: 15 }}>{event.note || 'Không có ghi chú kèm theo.'}</Paragraph>
      </div>

      <Descriptions
        size="small"
        bordered
        column={1}
        style={{ marginTop: 16 }}
        items={[
          { key: 'time', label: 'Thời điểm', children: `${formatDateTime(event.createdAt)} (${dayjs(event.createdAt).fromNow()})` },
          { key: 'by', label: 'Người kích hoạt', children: nurse ? <Link to={`/hospital/admin/roster/${nurse.id}`}>Điều dưỡng {nurse.name}</Link> : '—' },
          {
            key: 'patient',
            label: 'Bệnh nhân',
            children: patient ? (
              <span>
                <b>{patient.name}</b>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {patient.phone}
                </Text>
              </span>
            ) : (
              '—'
            ),
          },
          {
            key: 'session',
            label: 'Ca chăm sóc',
            children: session ? `${careTypeLabel(careRequest?.careType)} · ${formatDate(session.date)} ${session.start}–${session.end}` : 'Không gắn với ca nào',
          },
          {
            key: 'loc',
            label: 'Vị trí',
            children: patient?.address ? (
              <span>
                <EnvironmentOutlined /> {patient.address}
              </span>
            ) : (
              <Text type="secondary">Không có địa chỉ</Text>
            ),
          },
          {
            key: 'contacts',
            label: 'Người thân được báo',
            children: contacts.length ? (
              <Flex vertical gap={6}>
                {contacts.map((c) => (
                  <span key={c.id}>
                    <b>{c.name}</b> · {c.relation}
                    {c.primary && (
                      <Tag color="gold" style={{ marginLeft: 6 }}>
                        Ưu tiên
                      </Tag>
                    )}
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {c.phone}
                    </Text>
                  </span>
                ))}
              </Flex>
            ) : (
              <Text type="secondary">Bệnh nhân chưa có người thân liên kết</Text>
            ),
          },
        ]}
      />

      <Text strong style={{ display: 'block', margin: '18px 0 8px' }}>
        Ghi chú xử lý của bệnh viện
      </Text>
      <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Đã liên hệ ai, hướng xử lý, kết quả…" disabled={status === 'resolved'} />
      {status === 'resolved' && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Đã đóng — ghi chú không thể chỉnh sửa.
        </Text>
      )}

      <Text strong style={{ display: 'block', margin: '18px 0 8px' }}>
        Diễn biến
      </Text>
      <Timeline
        items={[
          { key: 'raised', color: 'red', content: `Kích hoạt SOS · ${formatDateTime(event.createdAt)}` },
          ...(event.acknowledgedAt ? [{ key: 'ack', color: 'gold', content: `Bệnh viện tiếp nhận · ${formatDateTime(event.acknowledgedAt)}` }] : []),
          ...(event.resolvedAt ? [{ key: 'res', color: 'green', content: `Đã xử lý xong · ${formatDateTime(event.resolvedAt)}` }] : []),
        ]}
      />
    </Drawer>
  )
}

export default function SosLog() {
  const { session } = useAuth()
  const state = useDb()
  const { message } = App.useApp()
  const [params, setParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const openId = params.get('id')

  const events = useMemo(() => listSosEventsForHospital(state, session.id).filter((e) => e.triggeredBy === 'nurse').sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [state, session.id])
  const counts = events.reduce((acc, e) => ({ ...acc, [e.status || 'open']: (acc[e.status || 'open'] || 0) + 1 }), {})

  const rows = events
    .map((e) => {
      const booking = getBooking(state, e.bookingId)
      return { event: e, patient: getPatient(state, e.patientId || booking?.patientId), nurse: getSosNurse(state, e) }
    })
    .filter(({ event, patient, nurse }) => {
      if (statusFilter !== 'all' && (event.status || 'open') !== statusFilter) return false
      const q = search.trim().toLowerCase()
      return !q || `${patient?.name} ${nurse?.name} ${event.note} ${event.id}`.toLowerCase().includes(q)
    })

  const openEvent = events.find((e) => e.id === openId) || null

  const columns = [
    { title: 'Thời điểm', key: 'time', width: 150, sorter: (a, b) => a.event.createdAt.localeCompare(b.event.createdAt), render: (_, r) => <span title={formatDateTime(r.event.createdAt)}>{dayjs(r.event.createdAt).fromNow()}</span> },
    { title: 'Bệnh nhân', key: 'patient', width: 170, sorter: (a, b) => compareText(a.patient?.name, b.patient?.name), render: (_, r) => r.patient?.name || '—' },
    { title: 'Điều dưỡng', key: 'nurse', width: 170, sorter: (a, b) => compareText(a.nurse?.name, b.nurse?.name), render: (_, r) => r.nurse?.name || '—' },
    {
      title: 'Ghi chú',
      key: 'note',
      render: (_, r) => (
        <Text ellipsis={{ tooltip: r.event.note }} style={{ maxWidth: 260 }} type={r.event.note ? undefined : 'secondary'}>
          {r.event.note || '—'}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, r) => {
        const m = SOS_STATUS_META[r.event.status || 'open']
        return <Tag color={m.color}>{m.label}</Tag>
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      align: 'right',
      render: (_, r) => (
        <Space size={6}>
          {(r.event.status || 'open') === 'open' && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                updateSosStatus(r.event.id, 'acknowledged')
                message.success('Đã tiếp nhận cảnh báo')
              }}
            >
              Tiếp nhận
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              setParams({ id: r.event.id })
            }}
          >
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <PageHead eyebrow="Emergency" title="Cảnh báo SOS" description="Sự cố khẩn cấp từ các ca chăm sóc của bệnh viện. Bấm “Xem chi tiết” để đọc ghi chú, thông tin người thân và cập nhật xử lý." />
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap justify="space-between">
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: `Tất cả (${events.length})` },
              {
                value: 'open',
                label: (
                  <span>
                    Chưa xử lý <Badge count={counts.open || 0} size="small" />
                  </span>
                ),
              },
              { value: 'acknowledged', label: `Đang xử lý (${counts.acknowledged || 0})` },
              { value: 'resolved', label: `Đã xử lý (${counts.resolved || 0})` },
            ]}
          />
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm bệnh nhân, điều dưỡng, ghi chú…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '0 1 320px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(r) => r.event.id}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 980 }}
          rowClassName={(r) => ((r.event.status || 'open') === 'open' ? 'sos-row-open' : '')}
          onRow={(r) => ({ onClick: () => setParams({ id: r.event.id }), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Không có cảnh báo SOS nào' }}
        />
      </Card>
      <SosDetailDrawer event={openEvent} open={Boolean(openEvent)} onClose={() => setParams({})} />
    </>
  )
}
