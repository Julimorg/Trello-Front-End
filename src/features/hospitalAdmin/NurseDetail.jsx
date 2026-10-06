import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Alert, App, Avatar, Button, Card, Checkbox, Col, Empty, Flex, Form, InputNumber, Input, Modal, Popconfirm, Result, Row, Select, Space, Table, Tag, TimePicker, Tooltip, Typography } from 'antd'
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { CertificateFormModal, CertificateViewModal } from './CertificateModals'
import { useDb } from '../../lib/store'
import {
  addAvailability,
  addCertificate,
  getHospital,
  getNurse,
  removeAvailability,
  removeCertificate,
  setNurseAuthStatus,
  updateCertificate,
  updateNurse,
} from '../../lib/db'
import { careTypeLabel, formatDate, weekdayLabel } from '../../lib/format'
import { CARE_TYPES, DISTRICTS, NURSE_AUTH_STATUS, NURSE_RANKS, WEEKDAYS } from '../../lib/constants'
import { AUTH_META, certificateStatus, initials } from './admin-shared'

const { Text, Title } = Typography
const CARE_OPTIONS = CARE_TYPES.filter((c) => c.id !== 'other').map((c) => ({ value: c.id, label: c.label }))

function BasicInfoCard({ nurse }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [dirty, setDirty] = useState(false)

  const reset = () => {
    form.setFieldsValue({ phone: nurse.phone, rank: nurse.rank, experienceYears: nurse.experienceYears, specialties: nurse.specialties, serviceAreas: nurse.serviceAreas })
    setDirty(false)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [nurse])

  const save = async () => {
    const values = await form.validateFields()
    updateNurse(nurse.id, { ...values, phone: values.phone.trim() })
    setDirty(false)
    message.success('Đã lưu thông tin điều dưỡng')
  }

  return (
    <Card title="Thông tin cơ bản">
      <Form form={form} layout="vertical" onValuesChange={() => setDirty(true)}>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, whitespace: true, message: 'Nhập số điện thoại' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="rank" label="Cấp bậc">
              <Select options={NURSE_RANKS.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="experienceYears" label="Số năm kinh nghiệm">
              <InputNumber min={0} max={50} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="specialties" label="Chuyên môn" rules={[{ required: true, message: 'Chọn ít nhất một chuyên môn' }]}>
          <Checkbox.Group options={CARE_OPTIONS} className="checkbox-grid" />
        </Form.Item>
        <Form.Item name="serviceAreas" label="Khu vực phục vụ" rules={[{ required: true, message: 'Chọn ít nhất một khu vực' }]}>
          <Select mode="multiple" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
        </Form.Item>
      </Form>
      {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (
        <Alert type="info" showIcon title={`Phạm vi ca được phép: ${nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || 'Chưa có'}`} style={{ marginBottom: 12 }} />
      )}
      <Flex justify="flex-end" gap={8}>
        <Button disabled={!dirty} onClick={reset}>
          Hoàn tác
        </Button>
        <Button type="primary" disabled={!dirty} onClick={save}>
          Lưu thay đổi
        </Button>
      </Flex>
    </Card>
  )
}

function CertificatesCard({ nurse }) {
  const { message } = App.useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)

  const openAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (cert) => {
    setViewing(null)
    setEditing(cert)
    setFormOpen(true)
  }
  const submit = (values) => {
    if (editing) {
      updateCertificate(nurse.id, editing.id, values)
      message.success('Đã cập nhật chứng chỉ')
    } else {
      addCertificate(nurse.id, values)
      message.success('Đã thêm chứng chỉ')
    }
    setFormOpen(false)
  }
  const viewingCert = viewing ? nurse.certificates.find((c) => c.id === viewing) : null

  return (
    <Card
      title="Chứng chỉ hành nghề"
      style={{ marginTop: 16 }}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Thêm chứng chỉ
        </Button>
      }
    >
      {nurse.certificates.length === 0 ? (
        <Empty description="Chưa có chứng chỉ nào. Cần ít nhất một chứng chỉ để cấp phép." />
      ) : (
        <div className="cert-list">
          {nurse.certificates.map((c) => {
            const status = certificateStatus(c)
            return (
              <div key={c.id} className={`cert-item is-${status.key}`}>
                <button type="button" className="cert-item-main" onClick={() => setViewing(c.id)}>
                  <SafetyCertificateOutlined className="cert-item-icon" />
                  <span>
                    <b>{c.name}</b>
                    <small>
                      Số {c.number} · {c.issuedBy}
                    </small>
                    <small>
                      {c.issuedAt ? `Cấp ${formatDate(c.issuedAt)}` : 'Chưa có ngày cấp'}
                      {c.expiresAt ? ` · Hết hạn ${formatDate(c.expiresAt)}` : ''}
                    </small>
                    {c.file && (
                      <small className="cert-item-file">
                        {c.file.type?.startsWith('image/') ? <FileImageOutlined /> : <FilePdfOutlined />} {c.file.name}
                      </small>
                    )}
                  </span>
                </button>
                <Flex vertical align="flex-end" gap={8}>
                  <Tag color={status.color}>{status.label}</Tag>
                  <Space size={4}>
                    <Tooltip title="Xem">
                      <Button size="small" icon={<EyeOutlined />} onClick={() => setViewing(c.id)} aria-label={`Xem ${c.name}`} />
                    </Tooltip>
                    <Tooltip title="Sửa">
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(c)} aria-label={`Sửa ${c.name}`} />
                    </Tooltip>
                    <Popconfirm
                      title="Xóa chứng chỉ này?"
                      description={nurse.certificates.length === 1 && nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED ? 'Đây là chứng chỉ duy nhất của điều dưỡng đang được cấp phép.' : 'Không thể hoàn tác.'}
                      okText="Xóa"
                      okButtonProps={{ danger: true }}
                      cancelText="Hủy"
                      onConfirm={() => {
                        removeCertificate(nurse.id, c.id)
                        message.success('Đã xóa chứng chỉ')
                      }}
                    >
                      <Tooltip title="Xóa">
                        <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Xóa ${c.name}`} />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </Flex>
              </div>
            )
          })}
        </div>
      )}
      <CertificateFormModal open={formOpen} initial={editing} onCancel={() => setFormOpen(false)} onSubmit={submit} />
      <CertificateViewModal open={Boolean(viewingCert)} cert={viewingCert} onCancel={() => setViewing(null)} onEdit={() => openEdit(viewingCert)} />
    </Card>
  )
}

function AvailabilityCard({ nurse }) {
  const [weekday, setWeekday] = useState(1)
  const [range, setRange] = useState([dayjs('2000-01-01T17:00'), dayjs('2000-01-01T20:00')])
  const valid = range?.[0] && range?.[1] && range[1].isAfter(range[0])
  const rows = [...nurse.availability].sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.start.localeCompare(b.start))
  return (
    <Card title="Lịch rảnh ngoài giờ trực">
      <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
        Bệnh viện phê duyệt trước khi đưa vào Nurse Matching.
      </Text>
      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={rows}
        locale={{ emptyText: 'Chưa có khung giờ rảnh' }}
        columns={[
          { title: 'Ngày', dataIndex: 'weekday', render: weekdayLabel },
          { title: 'Khung giờ', key: 'time', render: (_, a) => `${a.start} – ${a.end}` },
          {
            key: 'actions',
            align: 'right',
            render: (_, a) => (
              <Popconfirm title="Xóa khung giờ này?" okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={() => removeAvailability(nurse.id, a.id)}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="Xóa khung giờ" />
              </Popconfirm>
            ),
          },
        ]}
      />
      <Flex gap={8} wrap style={{ marginTop: 14 }}>
        <Select value={weekday} onChange={setWeekday} options={WEEKDAYS.map((w) => ({ value: w.id, label: w.label }))} style={{ width: 120 }} />
        <TimePicker.RangePicker format="HH:mm" minuteStep={15} value={range} onChange={setRange} style={{ flex: '1 1 180px' }} />
        <Button
          icon={<PlusOutlined />}
          disabled={!valid}
          onClick={() => addAvailability(nurse.id, { weekday, start: range[0].format('HH:mm'), end: range[1].format('HH:mm') })}
        >
          Thêm
        </Button>
      </Flex>
    </Card>
  )
}

export default function NurseDetail() {
  const { id } = useParams()
  const state = useDb()
  const { message } = App.useApp()
  const nurse = getNurse(state, id)
  const [authorizeOpen, setAuthorizeOpen] = useState(false)
  const [careTypes, setCareTypes] = useState([])
  const [authorizeError, setAuthorizeError] = useState('')

  if (!nurse) {
    return (
      <Result
        status="404"
        title="Không tìm thấy điều dưỡng"
        extra={
          <Link to="/hospital/admin/roster">
            <Button type="primary">Về danh sách điều dưỡng</Button>
          </Link>
        }
      />
    )
  }

  const hospital = getHospital(state, nurse.hospitalId)
  const meta = AUTH_META[nurse.authStatus]

  const authorize = () => {
    const result = setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.AUTHORIZED, careTypes)
    if (!result.ok) {
      setAuthorizeError(result.error)
      return
    }
    setAuthorizeOpen(false)
    message.success(`Đã cấp phép cho ${nurse.name}`)
  }

  return (
    <>
      <Link to="/hospital/admin/roster" className="back-link">
        <ArrowLeftOutlined /> Danh sách điều dưỡng
      </Link>

      <Card className="session-hero">
        <Flex gap={16} align="center" wrap>
          <Avatar size={64} style={{ background: 'linear-gradient(145deg,#d5f2ed,#b2ddd7)', color: '#0a6461', fontWeight: 800, fontSize: 20 }}>
            {initials(nurse.name)}
          </Avatar>
          <div style={{ flex: '1 1 260px' }}>
            <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
              HỒ SƠ ĐIỀU DƯỠNG · {nurse.id}
            </Text>
            <Title level={3} style={{ margin: '2px 0' }}>
              {nurse.name}
            </Title>
            <Space size={6} wrap>
              <Tag color={meta.color}>{meta.label}</Tag>
              <Text type="secondary">
                {nurse.rank} · {hospital?.name}
              </Text>
            </Space>
          </div>
          <Space wrap>
            {nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED && (
              <Button
                type="primary"
                onClick={() => {
                  setCareTypes(nurse.specialties)
                  setAuthorizeError('')
                  setAuthorizeOpen(true)
                }}
              >
                Cấp phép
              </Button>
            )}
            {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (
              <Popconfirm
                title="Tạm ngưng điều dưỡng?"
                description="Điều dưỡng sẽ không được đề xuất trong matching cho đến khi được cấp phép lại."
                okText="Tạm ngưng"
                cancelText="Hủy"
                onConfirm={() => setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.SUSPENDED)}
              >
                <Button>Tạm ngưng</Button>
              </Popconfirm>
            )}
            {nurse.authStatus !== NURSE_AUTH_STATUS.REVOKED && (
              <Popconfirm
                title="Thu hồi quyền điều dưỡng?"
                description="Dùng khi nghỉ việc hoặc vi phạm. Ca đã đặt lịch cần xử lý riêng."
                okText="Thu hồi"
                okButtonProps={{ danger: true }}
                cancelText="Hủy"
                onConfirm={() => setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.REVOKED)}
              >
                <Button danger>Thu hồi quyền</Button>
              </Popconfirm>
            )}
          </Space>
        </Flex>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} xl={15}>
          <BasicInfoCard nurse={nurse} />
          <CertificatesCard nurse={nurse} />
        </Col>
        <Col xs={24} xl={9}>
          <AvailabilityCard nurse={nurse} />
        </Col>
      </Row>

      <Modal open={authorizeOpen} title="Cấp phép nhận ca" okText="Cấp phép" cancelText="Hủy" onCancel={() => setAuthorizeOpen(false)} onOk={authorize} okButtonProps={{ disabled: careTypes.length === 0 }}>
        {authorizeError && <Alert type="error" showIcon title={authorizeError} style={{ marginBottom: 12 }} />}
        <Text>Chọn phạm vi ca được phép nhận (theo cấp bậc / chuyên ngành):</Text>
        <Checkbox.Group
          style={{ display: 'grid', gap: 8, marginTop: 10 }}
          value={careTypes}
          onChange={setCareTypes}
          options={nurse.specialties.map((s) => ({ value: s, label: careTypeLabel(s) }))}
        />
      </Modal>
    </>
  )
}
