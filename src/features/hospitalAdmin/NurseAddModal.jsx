import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Checkbox, Col, Form, Input, InputNumber, Modal, Row, Select, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { CertificateFormModal } from './CertificateModals'
import { addCertificate, addNurse } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, NURSE_RANKS } from '../../lib/constants'

const { Text } = Typography

export default function NurseAddModal({ open, onClose, hospitalId }) {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [certs, setCerts] = useState([])
  const [certOpen, setCertOpen] = useState(false)

  const close = () => {
    form.resetFields()
    setCerts([])
    onClose()
  }

  const submit = async () => {
    const values = await form.validateFields()
    const id = addNurse(hospitalId, { ...values, name: values.name.trim(), phone: values.phone.trim(), experienceYears: values.experienceYears ?? 0 })
    certs.forEach((c) => addCertificate(id, c))
    message.success('Đã lưu hồ sơ. Điều dưỡng đang chờ xác minh văn bằng và chứng chỉ.')
    close()
    navigate(`/hospital/admin/roster/${id}`)
  }

  return (
    <Modal open={open} title="Thêm điều dưỡng" okText="Lưu hồ sơ" cancelText="Hủy" onCancel={close} onOk={submit} width={640} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark="optional" initialValues={{ rank: NURSE_RANKS[0], specialties: [], serviceAreas: [] }}>
        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, whitespace: true, message: 'Nhập số điện thoại' }]}>
              <Input placeholder="090 123 4567" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="rank" label="Cấp bậc">
              <Select options={NURSE_RANKS.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="experienceYears" label="Số năm kinh nghiệm">
              <InputNumber min={0} max={50} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="specialties" label="Chuyên môn" rules={[{ required: true, message: 'Chọn ít nhất một chuyên môn' }]}>
          <Checkbox.Group className="checkbox-grid" options={CARE_TYPES.filter((c) => c.id !== 'other').map((c) => ({ value: c.id, label: c.label }))} />
        </Form.Item>
        <Form.Item name="serviceAreas" label="Khu vực phục vụ" rules={[{ required: true, message: 'Chọn ít nhất một khu vực' }]}>
          <Select mode="multiple" placeholder="Chọn quận" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
        </Form.Item>
        <Form.Item label="Chứng chỉ & văn bằng">
          {certs.map((c, i) => (
            <div key={`${c.number}-${i}`} className="cert-file-chip">
              <SafetyCertificateOutlined />
              <span>
                <b>{c.name}</b>
                <small>
                  Số {c.number}
                  {c.file ? ` · ${c.file.name}` : ''}
                </small>
              </span>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => setCerts((list) => list.filter((_, j) => j !== i))} aria-label="Bỏ chứng chỉ" />
            </div>
          ))}
          <Button icon={<PlusOutlined />} onClick={() => setCertOpen(true)}>
            Thêm chứng chỉ (tải tệp)
          </Button>
          {certs.length === 0 && (
            <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>
              <Tag color="gold">Lưu ý</Tag>Cần ít nhất một chứng chỉ để bệnh viện cấp phép nhận ca.
            </Text>
          )}
        </Form.Item>
      </Form>
      <CertificateFormModal
        open={certOpen}
        onCancel={() => setCertOpen(false)}
        onSubmit={(cert) => {
          setCerts((list) => [...list, cert])
          setCertOpen(false)
        }}
      />
    </Modal>
  )
}
