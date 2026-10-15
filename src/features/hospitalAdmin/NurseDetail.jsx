import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, App, Avatar, Button, Card, Checkbox, Col, Empty, Flex, Form, Result, Row, Space, Tag, Tooltip, Typography } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, FileImageOutlined, FilePdfOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { usePageCrumbs } from '../../components/crumbs'
import { BasicFields, ScheduleEditor } from './nurse-form-parts'
import { scheduleRules, scheduleToSlots, slotsToSchedule, validateForm } from './nurse-form-utils'
import { useDb } from '../../lib/store'
import { getHospital, getNurse, removeCertificate, setNurseAuthStatus, updateNurse } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { NURSE_AUTH_STATUS } from '../../lib/constants'
import { certificateStatus, initials, nurseAuthMeta } from './admin-shared'

const { Text, Title } = Typography

const toFormValues = (nurse) => ({
  name: nurse.name,
  phone: nurse.phone,
  rank: nurse.rank || undefined,
  experienceYears: nurse.experienceYears,
  specialties: nurse.specialties,
  serviceAreas: nurse.serviceAreas,
  schedule: slotsToSchedule(nurse.availability),
})

function CertificatesCard({ nurse }) {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const base = `/hospital/admin/roster/${nurse.id}/certificates`
  return (
    <Card
      title="Chứng chỉ hành nghề"
      style={{ marginTop: 16 }}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${base}/new`)}>
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
                <button type="button" className="cert-item-main" onClick={() => navigate(`${base}/${c.id}`)}>
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
                    <Tooltip title="Xem / sửa">
                      <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`${base}/${c.id}`)} aria-label={`Sửa ${c.name}`} />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Xóa ${c.name}`}
                        onClick={() => {
                          removeCertificate(nurse.id, c.id)
                          message.success('Đã xóa chứng chỉ')
                        }}
                      />
                    </Tooltip>
                  </Space>
                </Flex>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// Grants the licence. The scope is picked inline instead of in a popup.
function AuthorizeCard({ nurse }) {
  const { message } = App.useApp()
  const [careTypes, setCareTypes] = useState(nurse.specialties)
  const [error, setError] = useState('')
  const missing = [
    nurse.isDraft && 'Hồ sơ đang là bản nháp — bấm “Cập nhật” để hoàn tất',
    nurse.certificates.length === 0 && 'Chưa có chứng chỉ hành nghề',
    nurse.availability.length === 0 && 'Chưa có lịch tham gia điều dưỡng',
  ].filter(Boolean)

  const authorize = () => {
    const result = setNurseAuthStatus(nurse.id, NURSE_AUTH_STATUS.AUTHORIZED, careTypes)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    message.success(`Đã cấp phép cho ${nurse.name}`)
  }

  return (
    <Card title="Cấp phép nhận ca" style={{ marginTop: 16 }}>
      {missing.length > 0 && <Alert type="warning" showIcon style={{ marginBottom: 12 }} title="Chưa đủ điều kiện cấp phép" description={missing.join(' · ')} />}
      {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 12 }} />}
      <Text>Phạm vi ca được phép nhận (theo cấp bậc / chuyên ngành):</Text>
      <Checkbox.Group style={{ display: 'grid', gap: 8, margin: '10px 0 14px' }} value={careTypes} onChange={setCareTypes} options={nurse.specialties.map((s) => ({ value: s, label: careTypeLabel(s) }))} />
      <Button type="primary" disabled={careTypes.length === 0} onClick={authorize}>
        Cấp phép
      </Button>
    </Card>
  )
}

export default function NurseDetail() {
  const { id } = useParams()
  const state = useDb()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [dirty, setDirty] = useState(false)
  const [formError, setFormError] = useState('')
  const nurse = getNurse(state, id)
  usePageCrumbs(nurse ? [{ label: nurse.name }] : [])

  const reset = () => {
    if (!nurse) return
    form.resetFields()
    form.setFieldsValue(toFormValues(nurse))
    setDirty(false)
    setFormError('')
  }
  // Reload the form when another tab / the relay changes this nurse's stored data.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [nurse?.id, nurse?.name, nurse?.phone, nurse?.rank, nurse?.experienceYears, nurse?.isDraft, JSON.stringify(nurse?.availability), JSON.stringify(nurse?.specialties), JSON.stringify(nurse?.serviceAreas)])

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
  const meta = nurseAuthMeta(nurse)

  const patchFrom = (v) => ({
    name: (v.name || nurse.name).trim(),
    phone: (v.phone || '').trim(),
    rank: v.rank || '',
    experienceYears: v.experienceYears ?? 0,
    specialties: v.specialties || [],
    serviceAreas: v.serviceAreas || [],
    availability: scheduleToSlots(v.schedule).map((s, i) => ({ id: nurse.availability.find((a) => a.weekday === s.weekday)?.id || `avail-${nurse.id}-${s.weekday}-${i}`, ...s })),
  })

  const update = async () => {
    const values = await validateForm(form)
    if (!values) return
    if (nurse.certificates.length === 0) {
      setFormError('Cần ít nhất một chứng chỉ hành nghề — hãy thêm chứng chỉ ở phần bên dưới rồi cập nhật lại.')
      return
    }
    updateNurse(nurse.id, { ...patchFrom(values), isDraft: false })
    setDirty(false)
    setFormError('')
    message.success('Đã cập nhật hồ sơ điều dưỡng')
  }

  const saveDraft = async () => {
    if (!(await validateForm(form, ['name']))) return
    updateNurse(nurse.id, { ...patchFrom(form.getFieldsValue(true)), isDraft: true })
    setDirty(false)
    message.success('Đã lưu nháp')
  }

  const revoke = (status) => {
    setNurseAuthStatus(nurse.id, status)
    message.success(status === NURSE_AUTH_STATUS.SUSPENDED ? 'Đã tạm ngưng điều dưỡng' : 'Đã thu hồi quyền điều dưỡng')
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
            {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && <Button onClick={() => revoke(NURSE_AUTH_STATUS.SUSPENDED)}>Tạm ngưng</Button>}
            {nurse.authStatus !== NURSE_AUTH_STATUS.REVOKED && (
              <Button danger onClick={() => revoke(NURSE_AUTH_STATUS.REVOKED)}>
                Thu hồi quyền
              </Button>
            )}
          </Space>
        </Flex>
      </Card>

      <Form form={form} layout="vertical" requiredMark onValuesChange={() => setDirty(true)} scrollToFirstError>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} xl={15}>
            <Card title="Thông tin cơ bản">
              <BasicFields />
              {nurse.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && <Alert type="info" showIcon title={`Phạm vi ca được phép: ${nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || 'Chưa có'}`} />}
            </Card>
            <CertificatesCard nurse={nurse} />
          </Col>
          <Col xs={24} xl={9}>
            <Card title="Lịch tham gia điều dưỡng">
              <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
                Mỗi ngày trong tuần một khung giờ. Bắt buộc có ít nhất 1 ngày; bệnh viện duyệt trước khi đưa vào Nurse Matching.
              </Text>
              <Form.Item name="schedule" rules={scheduleRules} style={{ marginBottom: 0 }}>
                <ScheduleEditor />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>

      {nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED && <AuthorizeCard key={nurse.id + nurse.authStatus} nurse={nurse} />}

      {formError && <Alert type="error" showIcon title={formError} style={{ marginTop: 16 }} />}
      <div className="form-actions-bar">
        <Button disabled={!dirty} onClick={reset}>
          Hoàn tác
        </Button>
        {nurse.isDraft && <Button onClick={saveDraft}>Lưu nháp</Button>}
        <Button type="primary" disabled={!dirty && !nurse.isDraft} onClick={update}>
          Cập nhật
        </Button>
      </div>
    </>
  )
}
