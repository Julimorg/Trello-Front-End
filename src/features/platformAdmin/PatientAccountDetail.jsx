import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, Avatar, Badge, Button, Card, Col, Descriptions, Empty, Flex, Result, Row, Space, Statistic, Table, Tabs, Tag, Timeline, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, CheckCircleFilled, EditOutlined, StarFilled, WarningOutlined } from '@ant-design/icons'
import PatientEditModal from './PatientEditModal'
import StatusControl from './StatusControl'
import { useDb } from '../../lib/store'
import { computeBookingStatus, getHospital, getNurse, getPatient, setPatientAccountStatus } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { BOOKING_STATUS_LABEL, CARE_REQUEST_STATUS_LABEL, FREQUENCIES } from '../../lib/constants'
import { PLATFORM_STATUS_META, REPORT_STATUS_META, TONE_COLOR, ageOf } from './platform-shared'
import { SOS_STATUS_META, SOS_TYPE_META, initials } from '../hospitalAdmin/admin-shared'

const { Text, Title } = Typography

const nurseLabel = (state, id) => {
  const nurse = id && getNurse(state, id)
  if (!nurse) return <Text type="secondary">—</Text>
  return (
    <div>
      <Text>{nurse.name}</Text>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {getHospital(state, nurse.hospitalId)?.name}
        </Text>
      </div>
    </div>
  )
}

// Admin view of one patient account (/admin/accounts/:id).
export default function PatientAccountDetail() {
  const { id } = useParams()
  const state = useDb()
  const patient = getPatient(state, id)
  const [editOpen, setEditOpen] = useState(false)

  if (!patient) {
    return (
      <Result
        status="404"
        title="Không tìm thấy tài khoản"
        extra={
          <Link to="/admin/accounts">
            <Button type="primary">Về danh sách tài khoản</Button>
          </Link>
        }
      />
    )
  }

  const account = patient.account || { status: 'active' }
  const meta = PLATFORM_STATUS_META[account.status || 'active']
  const requests = state.careRequests.filter((c) => c.patientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const bookings = state.bookings.filter((b) => b.patientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const sessions = bookings.flatMap((b) => b.sessions)
  const sos = (state.sosEvents || []).filter((e) => e.patientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const reports = (state.reports || []).filter((r) => r.reporterId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const family = patient.familyContacts || []
  const logs = (state.auditLogs || []).filter((l) => l.targetId === id).sort((a, b) => b.at.localeCompare(a.at))
  const today = dayjs().format('YYYY-MM-DD')

  const tabs = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Descriptions
              title="Thông tin cá nhân"
              bordered
              size="small"
              column={1}
              items={[
                { key: 'id', label: 'Mã tài khoản', children: patient.id },
                { key: 'dob', label: 'Ngày sinh', children: `${formatDate(patient.dateOfBirth)} (${ageOf(patient.dateOfBirth)} tuổi)` },
                { key: 'gender', label: 'Giới tính', children: patient.gender },
                { key: 'phone', label: 'Điện thoại', children: patient.phone },
                { key: 'email', label: 'Email', children: patient.email || '—' },
                { key: 'addr', label: 'Địa chỉ', children: patient.address },
                { key: 'district', label: 'Khu vực', children: patient.district },
              ]}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Descriptions
              title="Thông tin y tế"
              bordered
              size="small"
              column={1}
              items={[
                { key: 'blood', label: 'Nhóm máu', children: patient.bloodType || '—' },
                { key: 'allergy', label: 'Dị ứng', children: patient.allergies && patient.allergies !== 'Không' ? <Tag color="red">{patient.allergies}</Tag> : 'Không' },
                { key: 'cond', label: 'Bệnh nền', children: patient.conditions || '—' },
                { key: 'bhyt', label: 'Số BHYT', children: patient.insuranceNumber || '—' },
              ]}
            />
            <Descriptions
              style={{ marginTop: 16 }}
              title="Tài khoản"
              bordered
              size="small"
              column={1}
              items={[
                { key: 'joined', label: 'Ngày tham gia', children: formatDateTime(account.joinedAt) },
                { key: 'last', label: 'Hoạt động gần nhất', children: account.lastActiveAt ? `${formatDateTime(account.lastActiveAt)} (${dayjs(account.lastActiveAt).fromNow()})` : '—' },
                {
                  key: 'verify',
                  label: 'Xác minh danh tính',
                  children: account.verified ? <Tag color="green">{account.verifiedBy}</Tag> : <Tag color="orange">Chưa xác minh</Tag>,
                },
              ]}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: 'family',
      label: `Người thân (${family.length})`,
      children: (
        <Table
          rowKey="id"
          size="middle"
          pagination={false}
          dataSource={family}
          scroll={{ x: 760 }}
          locale={{ emptyText: 'Chưa liên kết người thân' }}
          columns={[
            {
              title: 'Người thân',
              key: 'name',
              render: (_, c) => (
                <Space>
                  <Text strong>{c.name}</Text>
                  {c.primary && (
                    <Tag color="gold" icon={<StarFilled />}>
                      Ưu tiên
                    </Tag>
                  )}
                </Space>
              ),
            },
            { title: 'Quan hệ', dataIndex: 'relation', width: 120 },
            { title: 'Điện thoại', dataIndex: 'phone', width: 140 },
            { title: 'Quyền', key: 'perm', render: (_, c) => <Flex gap={4} wrap>{(c.permissions || []).map((p) => <Tag key={p} className="tag-wrap">{p}</Tag>)}</Flex> },
            { title: 'Liên kết', dataIndex: 'status', width: 130, render: (v) => <Tag color={v === 'Đã liên kết' ? 'green' : 'orange'}>{v}</Tag> },
          ]}
        />
      ),
    },
    {
      key: 'requests',
      label: `Yêu cầu chăm sóc (${requests.length})`,
      children: (
        <Table
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          dataSource={requests}
          scroll={{ x: 960 }}
          locale={{ emptyText: 'Chưa có yêu cầu' }}
          columns={[
            { title: 'Mã', dataIndex: 'id', width: 130, render: (v) => <Text code>#{v}</Text> },
            { title: 'Dịch vụ', key: 'care', render: (_, c) => careTypeLabel(c.careType) },
            {
              title: 'Lịch mong muốn',
              key: 'when',
              width: 200,
              sorter: (a, b) => a.desiredStartDate.localeCompare(b.desiredStartDate),
              render: (_, c) => (
                <div>
                  <Text>
                    {formatDate(c.desiredStartDate)} · {c.timeSlot.start}–{c.timeSlot.end}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {FREQUENCIES.find((f) => f.id === c.frequency)?.label || c.frequency}
                    </Text>
                  </div>
                </div>
              ),
            },
            { title: 'Điều dưỡng', key: 'nurse', width: 210, render: (_, c) => nurseLabel(state, c.selectedNurseId) },
            {
              title: 'Trạng thái',
              key: 'status',
              width: 200,
              render: (_, c) => {
                const s = CARE_REQUEST_STATUS_LABEL[c.status]
                return <Tag color={TONE_COLOR[s?.tone]}>{s?.label || c.status}</Tag>
              },
            },
            { title: 'Tạo lúc', dataIndex: 'createdAt', width: 150, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), render: formatDateTime },
          ]}
        />
      ),
    },
    {
      key: 'bookings',
      label: `Lịch chăm sóc (${bookings.length})`,
      children: (
        <Table
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          dataSource={bookings}
          scroll={{ x: 900 }}
          locale={{ emptyText: 'Chưa có lịch chăm sóc' }}
          expandable={{
            expandedRowRender: (b) => (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={[...b.sessions].sort((x, y) => x.date.localeCompare(y.date))}
                columns={[
                  { title: 'Ngày', dataIndex: 'date', render: formatDate },
                  { title: 'Giờ', key: 'time', render: (_, s) => `${s.start}–${s.end}` },
                  { title: 'Điều dưỡng', key: 'nurse', render: (_, s) => getNurse(state, s.nurseId)?.name || '—' },
                  {
                    title: 'Trạng thái',
                    key: 'st',
                    render: (_, s) => (
                      <Tag color={s.status === 'completed' ? 'default' : s.status === 'cannot_perform' ? 'red' : s.date < today ? 'gold' : 'green'}>
                        {{ confirmed: s.date < today ? 'Chưa ghi nhận' : 'Đã xác nhận', completed: 'Hoàn tất', cannot_perform: 'Không thể thực hiện', reassigned: 'Đã đổi điều dưỡng' }[s.status]}
                      </Tag>
                    ),
                  },
                ]}
              />
            ),
          }}
          columns={[
            { title: 'Mã lịch', dataIndex: 'id', width: 120, render: (v) => <Text code>{v}</Text> },
            { title: 'Dịch vụ', key: 'care', render: (_, b) => careTypeLabel(state.careRequests.find((c) => c.id === b.careRequestId)?.careType) },
            { title: 'Điều dưỡng', key: 'nurse', width: 210, render: (_, b) => nurseLabel(state, b.nurseId) },
            {
              title: 'Tiến độ',
              key: 'progress',
              width: 130,
              render: (_, b) => `${b.sessions.filter((s) => s.status === 'completed').length}/${b.sessions.length} buổi`,
            },
            {
              title: 'Trạng thái',
              key: 'status',
              width: 140,
              render: (_, b) => {
                const s = BOOKING_STATUS_LABEL[computeBookingStatus(b)]
                return <Tag color={TONE_COLOR[s?.tone]}>{s?.label}</Tag>
              },
            },
          ]}
        />
      ),
    },
    {
      key: 'sos',
      label: (
        <span>
          SOS <Badge count={sos.filter((e) => (e.status || 'open') !== 'resolved').length} size="small" />
        </span>
      ),
      children: (
        <Table
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          dataSource={sos}
          scroll={{ x: 900 }}
          locale={{ emptyText: 'Chưa có cảnh báo SOS' }}
          columns={[
            { title: 'Thời điểm', dataIndex: 'createdAt', width: 150, render: formatDateTime },
            { title: 'Loại', dataIndex: 'type', width: 180, render: (v) => <Tag color={SOS_TYPE_META[v]?.color}>{SOS_TYPE_META[v]?.label || v}</Tag> },
            { title: 'Người kích hoạt', dataIndex: 'triggeredBy', width: 140, render: (v, e) => (v === 'nurse' ? `Điều dưỡng ${getNurse(state, e.nurseId)?.name || ''}` : 'Bệnh nhân') },
            { title: 'Ghi chú', dataIndex: 'note', render: (v, e) => <div>{v || <Text type="secondary">—</Text>}{e.resolution && <div><Text type="secondary" style={{ fontSize: 12 }}>Xử lý: {e.resolution}</Text></div>}</div> },
            { title: 'Trạng thái', key: 'status', width: 120, render: (_, e) => <Tag color={SOS_STATUS_META[e.status || 'open'].color}>{SOS_STATUS_META[e.status || 'open'].label}</Tag> },
          ]}
        />
      ),
    },
    {
      key: 'reports',
      label: `Báo cáo đã gửi (${reports.length})`,
      children: (
        <Table
          rowKey="id"
          size="middle"
          pagination={false}
          dataSource={reports}
          scroll={{ x: 860 }}
          locale={{ emptyText: 'Chưa gửi báo cáo nào' }}
          columns={[
            { title: 'Báo cáo', key: 'title', render: (_, r) => <div><Text strong>{r.title}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{r.category}</Text></div></div> },
            { title: 'Đối tượng', key: 'subject', width: 220, render: (_, r) => (r.subjectType === 'nurse' ? nurseLabel(state, r.subjectId) : getHospital(state, r.subjectId)?.name) },
            { title: 'Ngày gửi', dataIndex: 'createdAt', width: 150, render: formatDateTime },
            { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (v) => <Tag color={REPORT_STATUS_META[v].color}>{REPORT_STATUS_META[v].label}</Tag> },
          ]}
        />
      ),
    },
    {
      key: 'log',
      label: (
        <span>
          Nhật ký <Badge count={logs.length} size="small" color="#94a4a7" />
        </span>
      ),
      children: logs.length ? (
        <Timeline
          items={logs.map((l) => ({
            key: l.id,
            content: (
              <>
                <Text strong>{l.action}</Text>
                {l.detail && (
                  <div>
                    <Text type="secondary">{l.detail}</Text>
                  </div>
                )}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(l.at)} · {l.actor}
                  </Text>
                </div>
              </>
            ),
          }))}
        />
      ) : (
        <Empty description="Chưa có thao tác quản trị nào" />
      ),
    },
  ]

  return (
    <>
      <Link to="/admin/accounts" className="back-link">
        <ArrowLeftOutlined /> Tài khoản người dùng
      </Link>
      <Card className="session-hero">
        <Flex justify="space-between" gap={16} wrap>
          <Flex gap={14} align="center" style={{ flex: '1 1 380px' }}>
            <Avatar size={60} style={{ background: '#eaf1fc', color: '#2b69c9', fontWeight: 800, fontSize: 20, flex: '0 0 auto' }}>
              {initials(patient.name)}
            </Avatar>
            <div>
              <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
                BỆNH NHÂN · {patient.id.toUpperCase()}
              </Text>
              <Title level={3} style={{ margin: '2px 0' }}>
                {patient.name}
              </Title>
              <Space size={6} wrap>
                <Tooltip title={account.statusReason}>
                  <Tag color={meta.color}>{meta.label}</Tag>
                </Tooltip>
                {account.verified ? (
                  <Tag color="green" icon={<CheckCircleFilled />}>
                    Đã xác minh
                  </Tag>
                ) : (
                  <Tag color="orange" icon={<WarningOutlined />}>
                    Chưa xác minh
                  </Tag>
                )}
                <Text type="secondary">
                  {patient.gender} · {ageOf(patient.dateOfBirth)} tuổi · {patient.district}
                </Text>
              </Space>
            </div>
          </Flex>
          <Space wrap>
            <StatusControl size="middle" status={account.status || 'active'} entityName={patient.name} onChange={(next, reason) => setPatientAccountStatus(patient.id, next, reason)} />
            <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
              Sửa thông tin
            </Button>
          </Space>
        </Flex>
        {(account.status || 'active') !== 'active' && (
          <Alert
            style={{ marginTop: 14 }}
            type={account.status === 'locked' ? 'error' : 'warning'}
            showIcon
            title={`${meta.label}: ${meta.hint}`}
            description={account.statusReason ? `Lý do: ${account.statusReason}` : undefined}
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ margin: '16px 0' }}>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Yêu cầu đã tạo" value={requests.length} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Buổi chăm sóc" value={sessions.filter((s) => s.status === 'completed').length} suffix={<Text type="secondary" style={{ fontSize: 13 }}>/ {sessions.length} hoàn tất</Text>} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Người thân liên kết" value={family.length} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Cảnh báo SOS" value={sos.length} styles={{ content: { color: sos.some((e) => (e.status || 'open') !== 'resolved') ? '#cf3c43' : undefined } }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs items={tabs} />
      </Card>
      <PatientEditModal open={editOpen} patient={patient} onClose={() => setEditOpen(false)} />
    </>
  )
}
