import { useEffect } from 'react'
import dayjs from 'dayjs'
import { App, Col, DatePicker, Divider, Form, Input, Modal, Row, Select, Switch } from 'antd'
import { adminUpdatePatient } from '../../lib/db'
import { DISTRICTS } from '../../lib/constants'

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Chưa rõ']
const VERIFY_METHODS = ['eKYC CCCD', 'Bệnh viện xác nhận', 'Admin xác minh thủ công']

// "Sửa thông tin" for a patient account (platform admin). Every save goes to the audit log.
export default function PatientEditModal({ open, patient, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const verified = Form.useWatch('verified', form)

  useEffect(() => {
    if (!open || !patient) return
    form.resetFields()
    form.setFieldsValue({
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth ? dayjs(patient.dateOfBirth) : null,
      gender: patient.gender,
      district: patient.district,
      address: patient.address,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      conditions: patient.conditions,
      insuranceNumber: patient.insuranceNumber,
      verified: Boolean(patient.account?.verified),
      verifiedBy: patient.account?.verifiedBy || VERIFY_METHODS[2],
    })
  }, [open, patient, form])

  const submit = async () => {
    const v = await form.validateFields()
    adminUpdatePatient(patient.id, {
      name: v.name.trim(),
      phone: v.phone.trim(),
      email: v.email?.trim() || '',
      dateOfBirth: v.dateOfBirth ? v.dateOfBirth.format('YYYY-MM-DD') : '',
      gender: v.gender,
      district: v.district,
      address: v.address.trim(),
      bloodType: v.bloodType,
      allergies: v.allergies?.trim() || 'Không',
      conditions: v.conditions?.trim() || '',
      insuranceNumber: v.insuranceNumber?.trim() || '',
      account: { ...patient.account, verified: v.verified, verifiedBy: v.verified ? v.verifiedBy : null },
    })
    message.success('Đã lưu thông tin bệnh nhân')
    onClose()
  }

  return (
    <Modal open={open} title={patient ? `Sửa thông tin · ${patient.name}` : ''} okText="Lưu" cancelText="Hủy" onCancel={onClose} onOk={submit} width={760} destroyOnHidden styles={{ body: { maxHeight: '68vh', overflowY: 'auto', paddingRight: 8 } }}>
      <Form form={form} layout="vertical">
        <Divider titlePlacement="start" plain>
          Thông tin cá nhân
        </Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="dateOfBirth" label="Ngày sinh">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs())} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="gender" label="Giới tính">
              <Select options={['Nam', 'Nữ'].map((g) => ({ value: g, label: g }))} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, whitespace: true, message: 'Nhập số điện thoại' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, whitespace: true, message: 'Nhập địa chỉ' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="district" label="Quận / huyện">
              <Select showSearch options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          Thông tin y tế
        </Divider>
        <Row gutter={12}>
          <Col xs={12} md={6}>
            <Form.Item name="bloodType" label="Nhóm máu">
              <Select options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="insuranceNumber" label="Số BHYT">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item name="allergies" label="Dị ứng">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="conditions" label="Bệnh nền / tình trạng">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          Xác minh danh tính
        </Divider>
        <Row gutter={12} align="middle">
          <Col xs={24} md={8}>
            <Form.Item name="verified" label="Đã xác minh" valuePropName="checked">
              <Switch checkedChildren="Đã xác minh" unCheckedChildren="Chưa" />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item name="verifiedBy" label="Phương thức xác minh">
              <Select disabled={!verified} options={VERIFY_METHODS.map((m) => ({ value: m, label: m }))} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
