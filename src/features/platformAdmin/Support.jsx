import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Avatar, Button, Card, Col, Descriptions, Drawer, Empty, Flex, Input, Row, Select, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import { CheckOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { replyTicket, updateTicket } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { DEFAULT_SETTINGS } from '../../Data/admin/settings-data'
import { TICKET_CATEGORIES, TICKET_PRIORITY_META, TICKET_STATUS_META } from '../../Data/admin/support-data'
import { initials } from '../hospitalAdmin/admin-shared'
import { normalize } from './platform-shared'

const { Text, Paragraph } = Typography
const AGENTS = ['Linh Phạm', 'Hà Nguyễn']
const ROLE_LABEL = { patient: 'Bệnh nhân', nurse: 'Điều dưỡng', hospital: 'Bệnh viện' }
const CANNED = [
  { label: 'Đã nhận yêu cầu', text: 'Chào bạn, CareShift đã nhận được yêu cầu và đang kiểm tra. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.' },
  { label: 'Cần thêm thông tin', text: 'Để hỗ trợ nhanh hơn, bạn vui lòng cho chúng tôi biết thêm thời điểm xảy ra sự việc và ảnh chụp màn hình (nếu có) nhé.' },
  { label: 'Đã khắc phục', text: 'Chúng tôi đã khắc phục sự cố. Bạn vui lòng thử lại và báo cho chúng tôi nếu vẫn còn vấn đề.' },
  { label: 'Cảm ơn góp ý', text: 'Cảm ơn bạn đã góp ý. CareShift đã ghi nhận và sẽ cân nhắc trong các bản cập nhật tới.' },
]

const userLink = (t) => (t.requesterRole === 'patient' ? `/admin/accounts/${t.requesterId}` : t.requesterRole === 'hospital' ? `/admin/hospitals/${t.requesterId}` : '/admin/nurses')

// "Hỗ trợ khách hàng": inbox of requests from patients, nurses and hospital admins.
export default function Support() {
  const { message } = App.useApp()
  const state = useDb()
  const [params, setParams] = useSearchParams()
  const settings = { ...DEFAULT_SETTINGS, ...state.settings }
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(null)
  const [priority, setPriority] = useState(null)
  const [category, setCategory] = useState(null)
  const [role, setRole] = useState(null)
  const [mine, setMine] = useState(null)
  const [draft, setDraft] = useState('')

  const tickets = useMemo(() => state.tickets || [], [state.tickets])
  const openId = params.get('ticket')
  const open = tickets.find((t) => t.id === openId) || null
  const setOpen = (id) => {
    setDraft('')
    setParams(id ? { ticket: id } : {}, { replace: true })
  }

  const now = Date.now()
  // First reply overdue = nobody from CareShift has answered and the SLA has passed.
  const overdue = (t) => t.status !== 'resolved' && !t.messages.some((m) => m.from === 'admin') && now - new Date(t.createdAt).getTime() > settings.supportSlaHours * 3600000

  const rows = useMemo(() => {
    const q = normalize(search.trim())
    return tickets
      .filter(
        (t) =>
          (!status || t.status === status) &&
          (!priority || t.priority === priority) &&
          (!category || t.category === category) &&
          (!role || t.requesterRole === role) &&
          (!mine || (mine === 'none' ? !t.assignee : t.assignee === mine)) &&
          (!q || normalize(`${t.subject} ${t.requesterName} ${t.id} ${t.messages.map((m) => m.text).join(' ')}`).includes(q)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [tickets, search, status, priority, category, role, mine])

  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    waiting: tickets.filter((t) => t.status === 'waiting').length,
    overdue: tickets.filter(overdue).length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  const send = () => {
    if (!draft.trim()) return
    replyTicket(open.id, { from: 'admin', author: open.assignee || AGENTS[0], text: draft.trim() })
    setDraft('')
    message.success(`Đã gửi trả lời cho ${open.requesterName}`)
  }

  const columns = [
    {
      title: 'Yêu cầu',
      key: 'subject',
      render: (_, t) => (
        <div>
          <Text strong>{t.subject}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.id} · {t.requesterName} ({ROLE_LABEL[t.requesterRole]})
            </Text>
          </div>
        </div>
      ),
    },
    { title: 'Loại', dataIndex: 'category', width: 170, render: (v) => <Tag className="tag-wrap">{v}</Tag> },
    { title: 'Ưu tiên', key: 'p', width: 120, sorter: (a, b) => ['low', 'normal', 'high', 'urgent'].indexOf(a.priority) - ['low', 'normal', 'high', 'urgent'].indexOf(b.priority), render: (_, t) => <Tag color={TICKET_PRIORITY_META[t.priority].color}>{TICKET_PRIORITY_META[t.priority].label}</Tag> },
    { title: 'Trạng thái', key: 's', width: 140, render: (_, t) => <Tag color={TICKET_STATUS_META[t.status].color}>{TICKET_STATUS_META[t.status].label}</Tag> },
    {
      title: 'SLA',
      key: 'sla',
      width: 130,
      render: (_, t) =>
        overdue(t) ? (
          <Tooltip title={`Chưa trả lời quá ${settings.supportSlaHours} giờ`}>
            <Tag color="red">Quá hạn</Tag>
          </Tooltip>
        ) : t.messages.some((m) => m.from === 'admin') ? (
          <Tag color="green" icon={<CheckOutlined />}>
            Đã phản hồi
          </Tag>
        ) : (
          <Tag>Trong hạn</Tag>
        ),
    },
    { title: 'Phụ trách', dataIndex: 'assignee', width: 130, render: (v) => v || <Text type="secondary">Chưa phân công</Text> },
    { title: 'Cập nhật', dataIndex: 'updatedAt', width: 150, sorter: (a, b) => a.updatedAt.localeCompare(b.updatedAt), render: (v) => <Tooltip title={formatDateTime(v)}>{dayjs(v).fromNow()}</Tooltip> },
  ]

  return (
    <>
      <PageHead eyebrow="Customer support" title="Hỗ trợ khách hàng" description="Hộp thư yêu cầu từ bệnh nhân, điều dưỡng và bệnh viện. Trả lời tại đây, người dùng nhận thông báo ngay." />
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          ['Mới', counts.open, '#cf3c43', 'open'],
          ['Đang xử lý', counts.in_progress, undefined, 'in_progress'],
          ['Chờ người dùng phản hồi', counts.waiting, undefined, 'waiting'],
          [`Quá hạn trả lời (> ${settings.supportSlaHours} giờ)`, counts.overdue, '#cf3c43', null],
          ['Đã giải quyết', counts.resolved, '#21845b', 'resolved'],
        ].map(([title, value, color, filter]) => (
          <Col xs={12} md={8} xl={{ flex: '20%' }} key={title}>
            <Card size="small" hoverable onClick={() => setStatus(filter)}>
              <Statistic title={title} value={value} styles={{ content: { color: value && color ? color : undefined } }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm chủ đề, người gửi, nội dung" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 260px' }} />
          <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={Object.entries(TICKET_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 150px' }} />
          <Select allowClear placeholder="Ưu tiên" value={priority} onChange={setPriority} options={Object.entries(TICKET_PRIORITY_META).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 140px' }} />
          <Select allowClear placeholder="Loại" value={category} onChange={setCategory} options={TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))} style={{ flex: '0 1 190px' }} />
          <Select allowClear placeholder="Người gửi" value={role} onChange={setRole} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} style={{ flex: '0 1 140px' }} />
          <Select allowClear placeholder="Phụ trách" value={mine} onChange={setMine} options={[{ value: 'none', label: 'Chưa phân công' }, ...AGENTS.map((a) => ({ value: a, label: a }))]} style={{ flex: '0 1 160px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1020 }}
          onRow={(t) => ({ onClick: () => setOpen(t.id), style: { cursor: 'pointer' } })}
          locale={{ emptyText: 'Không có yêu cầu hỗ trợ nào' }}
        />
      </Card>

      <Drawer open={Boolean(open)} onClose={() => setOpen(null)} size={560} destroyOnHidden title={open ? open.subject : ''}>
        {open && (
          <>
            <Descriptions
              size="small"
              column={2}
              items={[
                { key: 'id', label: 'Mã', children: <Text code>{open.id}</Text> },
                { key: 'from', label: 'Người gửi', children: <Link to={userLink(open)}>{open.requesterName}</Link> },
                { key: 'role', label: 'Vai trò', children: ROLE_LABEL[open.requesterRole] },
                { key: 'cat', label: 'Loại', children: open.category },
                { key: 'created', label: 'Tạo lúc', children: formatDateTime(open.createdAt), span: 2 },
              ]}
            />
            <Row gutter={8} style={{ margin: '14px 0' }}>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Trạng thái
                </Text>
                <Select style={{ width: '100%' }} value={open.status} onChange={(v) => updateTicket(open.id, { status: v })} options={Object.entries(TICKET_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} />
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ưu tiên
                </Text>
                <Select style={{ width: '100%' }} value={open.priority} onChange={(v) => updateTicket(open.id, { priority: v })} options={Object.entries(TICKET_PRIORITY_META).map(([value, m]) => ({ value, label: m.label }))} />
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Phụ trách
                </Text>
                <Select style={{ width: '100%' }} allowClear placeholder="Chưa phân công" value={open.assignee || undefined} onChange={(v) => updateTicket(open.id, { assignee: v || null })} options={AGENTS.map((a) => ({ value: a, label: a }))} />
              </Col>
            </Row>

            <div className="thread">
              {open.messages.map((m) => (
                <div key={m.id} className={`thread-msg ${m.from === 'admin' ? 'is-admin' : ''}`}>
                  <Avatar size="small" style={{ background: m.from === 'admin' ? '#0b6b68' : '#eaf1fc', color: m.from === 'admin' ? '#fff' : '#2b69c9', flex: '0 0 auto' }}>
                    {initials(m.author)}
                  </Avatar>
                  <div className="thread-bubble">
                    <Text strong style={{ fontSize: 12 }}>
                      {m.author}
                    </Text>
                    <Paragraph style={{ margin: '2px 0' }}>{m.text}</Paragraph>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatDateTime(m.at)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            {open.status === 'resolved' ? (
              <Flex justify="space-between" align="center" style={{ marginTop: 12 }}>
                <Text type="secondary">Yêu cầu đã giải quyết. Gửi trả lời mới sẽ không mở lại.</Text>
                <Button onClick={() => updateTicket(open.id, { status: 'in_progress' })}>Mở lại</Button>
              </Flex>
            ) : null}
            <Select
              style={{ width: '100%', marginTop: 14 }}
              placeholder="Chèn câu trả lời mẫu"
              allowClear
              value={undefined}
              onChange={(text) => text && setDraft(text)}
              options={CANNED.map((c) => ({ value: c.text, label: c.label }))}
            />
            <Input.TextArea rows={4} style={{ marginTop: 8 }} placeholder="Nhập nội dung trả lời…" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Space style={{ marginTop: 10 }} wrap>
              <Button type="primary" icon={<SendOutlined />} disabled={!draft.trim()} onClick={send}>
                Gửi trả lời
              </Button>
              {open.status !== 'resolved' && (
                <Button
                  icon={<CheckOutlined />}
                  onClick={() => {
                    updateTicket(open.id, { status: 'resolved' })
                    message.success('Đã đánh dấu giải quyết')
                  }}
                >
                  Đánh dấu đã giải quyết
                </Button>
              )}
            </Space>
          </>
        )}
        {!open && <Empty />}
      </Drawer>
    </>
  )
}
