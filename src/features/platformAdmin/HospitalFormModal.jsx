import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { App, Button, Col, DatePicker, Divider, Form, Input, InputNumber, Modal, Row, Select, Space, Typography, Upload } from 'antd'
import { DeleteOutlined, FilePdfOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { addHospital, updateHospital } from '../../lib/db'
import { DISTRICTS } from '../../lib/constants'
import { PARTNER_REGIONS } from '../../Data/admin/partner-data'

const { Text } = Typography
const SCOPE_OPTIONS = ['Chăm sóc tại nhà ngoài giờ', 'Phục hồi chức năng', 'Chăm sóc người cao tuổi', 'Hậu phẫu', 'Chăm sóc vết thương', 'Hỗ trợ vận động', 'Theo dõi sinh hiệu']
const MAX_INLINE_MB = 1.5

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const toForm = (h) => ({
  name: h.name,
  type: h.type,
  licenseNumber: h.licenseNumber,
  taxCode: h.taxCode,
  beds: h.beds,
  phone: h.phone,
  email: h.email,
  website: h.website,
  address: h.address,
  district: h.district,
  region: h.region,
  repName: h.representative?.name,
  repTitle: h.representative?.title,
  repPhone: h.representative?.phone,
  repEmail: h.representative?.email,
  contractNumber: h.contract?.number,
  signedAt: h.contract?.signedAt ? dayjs(h.contract.signedAt) : null,
  term: h.contract?.startDate ? [dayjs(h.contract.startDate), dayjs(h.contract.endDate)] : null,
  scope: h.contract?.scope || [],
  branches: h.branches || [],
})

// Add a partner hospital or edit one ("Thay đổi thông tin").
export default function HospitalFormModal({ open, hospital, onClose, onSaved }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    if (hospital) form.setFieldsValue(toForm(hospital))
    else form.setFieldsValue({ type: 'Công lập', region: PARTNER_REGIONS[0], district: DISTRICTS[0], scope: ['Chăm sóc tại nhà ngoài giờ'], branches: [] })
    setFile(hospital?.contract?.file || null)
  }, [open, hospital, form])

  const submit = async () => {
    const v = await form.validateFields()
    const data = {
      name: v.name.trim(),
      type: v.type,
      licenseNumber: v.licenseNumber?.trim() || '',
      taxCode: v.taxCode?.trim() || '',
      beds: v.beds || 0,
      phone: v.phone.trim(),
      email: v.email?.trim() || '',
      website: v.website?.trim() || '',
      address: v.address.trim(),
      district: v.district,
      region: v.region,
      representative: { name: v.repName.trim(), title: v.repTitle?.trim() || '', phone: v.repPhone?.trim() || '', email: v.repEmail?.trim() || '' },
      contract: {
        ...(hospital?.contract || { signatures: [] }),
        number: v.contractNumber.trim(),
        signedAt: v.signedAt ? v.signedAt.format('YYYY-MM-DD') : '',
        startDate: v.term[0].format('YYYY-MM-DD'),
        endDate: v.term[1].format('YYYY-MM-DD'),
        scope: v.scope,
        file,
      },
      branches: (v.branches || []).map((b, i) => ({ id: b.id || `br-${Date.now().toString(36)}-${i}`, district: b.district || v.district, ...b })),
    }
    if (hospital) {
      updateHospital(hospital.id, data, { auditAction: 'Thay đổi thông tin bệnh viện' })
      message.success('Đã lưu thông tin bệnh viện')
      onSaved?.(hospital.id)
    } else {
      const id = addHospital({ ...data, staff: [] })
      message.success('Đã thêm bệnh viện đối tác')
      onSaved?.(id)
    }
    onClose()
  }

  return (
    <Modal open={open} title={hospital ? `Thay đổi thông tin · ${hospital.name}` : 'Thêm bệnh viện đối tác'} okText="Lưu" cancelText="Hủy" onCancel={onClose} onOk={submit} width={820} destroyOnHidden styles={{ body: { maxHeight: '68vh', overflowY: 'auto', paddingRight: 8 } }}>
      <Form form={form} layout="vertical">
        <Divider titlePlacement="start" plain>
          Thông tin bệnh viện
        </Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="name" label="Tên bệnh viện" rules={[{ required: true, whitespace: true, message: 'Nhập tên bệnh viện' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="type" label="Loại hình">
              <Select options={['Công lập', 'Tư nhân'].map((v) => ({ value: v, label: v }))} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="beds" label="Số giường">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="licenseNumber" label="Giấy phép hoạt động">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="taxCode" label="Mã số thuế">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="phone" label="Điện thoại" rules={[{ required: true, whitespace: true, message: 'Nhập số điện thoại' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email liên hệ" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="website" label="Website">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="address" label="Địa chỉ" rules={[{ required: true, whitespace: true, message: 'Nhập địa chỉ' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="district" label="Quận / huyện">
              <Select showSearch options={[...new Set([...DISTRICTS, 'Quận 10', 'Tân Bình'])].map((d) => ({ value: d, label: d }))} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="region" label="Khu vực">
              <Select options={PARTNER_REGIONS.map((r) => ({ value: r, label: r }))} />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          Người đại diện
        </Divider>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="repName" label="Họ tên" rules={[{ required: true, whitespace: true, message: 'Nhập tên người đại diện' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="repTitle" label="Chức vụ">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="repPhone" label="Điện thoại">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="repEmail" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider titlePlacement="start" plain>
          Hợp đồng
        </Divider>
        <Row gutter={12}>
          <Col xs={24} md={8}>
            <Form.Item name="contractNumber" label="Số hợp đồng" rules={[{ required: true, whitespace: true, message: 'Nhập số hợp đồng' }]}>
              <Input placeholder="HĐ-CS-2026-..." />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item name="signedAt" label="Ngày ký">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item name="term" label="Thời hạn hợp đồng" rules={[{ required: true, message: 'Chọn thời hạn' }]}>
              <DatePicker.RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="scope" label="Phạm vi dịch vụ">
              <Select mode="tags" options={SCOPE_OPTIONS.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Col>
        </Row>
        <Space align="center" wrap>
          <Upload
            accept=".pdf"
            maxCount={1}
            showUploadList={false}
            beforeUpload={async (raw) => {
              const inline = raw.size <= MAX_INLINE_MB * 1024 * 1024
              setFile({ name: raw.name, size: raw.size, url: inline ? await readAsDataUrl(raw) : '' })
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>{file ? 'Thay file hợp đồng (PDF)' : 'Tải file hợp đồng (PDF)'}</Button>
          </Upload>
          {file && (
            <Text>
              <FilePdfOutlined style={{ color: '#cf3c43' }} /> {file.name}
            </Text>
          )}
        </Space>

        <Divider titlePlacement="start" plain>
          Chi nhánh
        </Divider>
        <Form.List name="branches">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Row key={field.key} gutter={8} align="top">
                  <Col xs={24} md={6}>
                    <Form.Item name={[field.name, 'name']} rules={[{ required: true, message: 'Tên chi nhánh' }]}>
                      <Input placeholder="Tên chi nhánh" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name={[field.name, 'address']} rules={[{ required: true, message: 'Địa chỉ' }]}>
                      <Input placeholder="Địa chỉ" />
                    </Form.Item>
                  </Col>
                  <Col xs={10} md={4}>
                    <Form.Item name={[field.name, 'phone']}>
                      <Input placeholder="Điện thoại" />
                    </Form.Item>
                  </Col>
                  <Col xs={10} md={5}>
                    <Form.Item name={[field.name, 'manager']}>
                      <Input placeholder="Phụ trách" />
                    </Form.Item>
                  </Col>
                  <Col xs={4} md={1}>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} aria-label="Xóa chi nhánh" />
                  </Col>
                </Row>
              ))}
              <Button icon={<PlusOutlined />} onClick={() => add({ name: '', address: '', phone: '', manager: '' })}>
                Thêm chi nhánh
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}
