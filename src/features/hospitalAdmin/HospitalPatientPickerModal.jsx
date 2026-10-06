import { useState } from 'react'
import { Form, Input, Modal, Segmented, Select } from 'antd'
import { addPatient } from '../../lib/db'
import { useDb } from '../../lib/store'
import { DISTRICTS } from '../../lib/constants'
import { compareByGivenName } from './admin-shared'

// Step 1 of "Tạo thay bệnh nhân": pick an existing patient or register a new one.
export default function HospitalPatientPickerModal({ open, onClose, onPicked }) {
  const state = useDb()
  const [mode, setMode] = useState('existing')
  const [form] = Form.useForm()

  const submit = async () => {
    const values = await form.validateFields()
    if (mode === 'existing') {
      onPicked(values.patientId)
    } else {
      onPicked(addPatient({ name: values.name.trim(), phone: values.phone.trim(), district: values.district, address: values.address?.trim() || '' }))
    }
    form.resetFields()
  }

  return (
    <Modal open={open} title="Tạo yêu cầu thay bệnh nhân" okText="Tiếp tục" cancelText="Hủy" onCancel={onClose} onOk={submit} destroyOnHidden>
      <Segmented
        block
        value={mode}
        onChange={setMode}
        options={[
          { value: 'existing', label: 'Bệnh nhân đã có' },
          { value: 'new', label: 'Bệnh nhân mới' },
        ]}
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" initialValues={{ district: DISTRICTS[0] }}>
        {mode === 'existing' ? (
          <Form.Item name="patientId" label="Chọn bệnh nhân" rules={[{ required: true, message: 'Chọn một bệnh nhân' }]}>
            <Select
              showSearch
              placeholder="Tìm theo tên"
              optionFilterProp="label"
              options={[...state.patients].sort((a, b) => compareByGivenName(a.name, b.name)).map((p) => ({ value: p.id, label: `${p.name} · ${p.district}` }))}
            />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, whitespace: true, message: 'Nhập họ tên' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, whitespace: true, message: 'Nhập số điện thoại' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="district" label="Khu vực">
              <Select options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
            </Form.Item>
            <Form.Item name="address" label="Địa chỉ">
              <Input />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}
