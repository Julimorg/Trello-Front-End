import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { App, AutoComplete, Button, DatePicker, Descriptions, Empty, Flex, Form, Input, Modal, Tag, Typography, Upload } from 'antd'
import { DownloadOutlined, FilePdfOutlined, FileImageOutlined, InboxOutlined } from '@ant-design/icons'
import { formatDate } from '../../lib/format'
import { certificateStatus, formatFileSize } from './admin-shared'

const { Text } = Typography

const CERT_NAMES = [
  'Chứng chỉ hành nghề Điều dưỡng',
  'Chứng chỉ Hồi sức tim phổi cơ bản (BLS)',
  'Chứng chỉ Chăm sóc vết thương',
  'Chứng chỉ Phục hồi chức năng',
  'Chứng chỉ Chăm sóc người cao tuổi',
]
const MAX_FILE_MB = 10
// Larger files keep their metadata only so the shared demo state stays small.
const MAX_INLINE_MB = 1.5

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const FileIcon = ({ type }) => (type?.startsWith('image/') ? <FileImageOutlined /> : <FilePdfOutlined />)

// Add or edit a certificate, with the scan uploaded as PDF / JPG / PNG.
export function CertificateFormModal({ open, initial, onCancel, onSubmit }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!open) return
    form.setFieldsValue({
      name: initial?.name || CERT_NAMES[0],
      number: initial?.number || '',
      issuedBy: initial?.issuedBy || 'Sở Y tế TP.HCM',
      issuedAt: initial?.issuedAt ? dayjs(initial.issuedAt) : null,
      expiresAt: initial?.expiresAt ? dayjs(initial.expiresAt) : null,
    })
    setFile(initial?.file || null)
  }, [open, initial, form])

  const beforeUpload = async (raw) => {
    if (raw.size > MAX_FILE_MB * 1024 * 1024) {
      message.error(`Tệp vượt quá ${MAX_FILE_MB} MB`)
      return Upload.LIST_IGNORE
    }
    const inline = raw.size <= MAX_INLINE_MB * 1024 * 1024
    setFile({ name: raw.name, type: raw.type, size: raw.size, ...(inline ? { dataUrl: await readAsDataUrl(raw) } : {}) })
    return false
  }

  const submit = async () => {
    const values = await form.validateFields()
    onSubmit({
      name: values.name.trim(),
      number: values.number.trim(),
      issuedBy: values.issuedBy.trim(),
      issuedAt: values.issuedAt ? values.issuedAt.format('YYYY-MM-DD') : undefined,
      expiresAt: values.expiresAt ? values.expiresAt.format('YYYY-MM-DD') : undefined,
      file,
    })
  }

  return (
    <Modal open={open} title={initial ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ'} okText={initial ? 'Lưu thay đổi' : 'Thêm chứng chỉ'} cancelText="Hủy" onCancel={onCancel} onOk={submit} destroyOnHidden width={560}>
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item name="name" label="Tên chứng chỉ" rules={[{ required: true, whitespace: true, message: 'Nhập tên chứng chỉ' }]}>
          <AutoComplete options={CERT_NAMES.map((value) => ({ value }))} filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())} />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item name="number" label="Số chứng chỉ" rules={[{ required: true, whitespace: true, message: 'Nhập số chứng chỉ' }]} style={{ flex: 1 }}>
            <Input placeholder="VD: DD-2022-00987" />
          </Form.Item>
          <Form.Item name="issuedBy" label="Nơi cấp" rules={[{ required: true, whitespace: true, message: 'Nhập nơi cấp' }]} style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Flex>
        <Flex gap={12}>
          <Form.Item name="issuedAt" label="Ngày cấp" style={{ flex: 1 }}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="expiresAt"
            label="Hiệu lực đến"
            style={{ flex: 1 }}
            dependencies={['issuedAt']}
            rules={[
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || !getFieldValue('issuedAt') || value.isAfter(getFieldValue('issuedAt')) ? Promise.resolve() : Promise.reject(new Error('Phải sau ngày cấp')),
              }),
            ]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Không thời hạn" />
          </Form.Item>
        </Flex>
        <Form.Item label="Bản scan chứng chỉ">
          <Upload.Dragger accept=".pdf,.jpg,.jpeg,.png" maxCount={1} showUploadList={false} beforeUpload={beforeUpload}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Kéo thả hoặc bấm để chọn tệp</p>
            <p className="ant-upload-hint">PDF, JPG hoặc PNG — tối đa {MAX_FILE_MB} MB</p>
          </Upload.Dragger>
          {file && (
            <div className="cert-file-chip">
              <FileIcon type={file.type} />
              <span>
                <b>{file.name}</b>
                <small>
                  {formatFileSize(file.size)}
                  {!file.dataUrl ? ' · chỉ lưu thông tin tệp' : ''}
                </small>
              </span>
              <Button size="small" type="text" danger onClick={() => setFile(null)}>
                Gỡ tệp
              </Button>
            </div>
          )}
        </Form.Item>
      </Form>
    </Modal>
  )
}

// Read-only view of a certificate and its scan.
export function CertificateViewModal({ open, cert, onCancel, onEdit }) {
  if (!cert) return null
  const status = certificateStatus(cert)
  const file = cert.file
  return (
    <Modal
      open={open}
      title={cert.name}
      onCancel={onCancel}
      width={640}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>,
        <Button key="edit" type="primary" onClick={onEdit}>
          Sửa chứng chỉ
        </Button>,
      ]}
    >
      <Descriptions
        size="small"
        bordered
        column={1}
        items={[
          { key: 'number', label: 'Số chứng chỉ', children: <Text code>{cert.number}</Text> },
          { key: 'by', label: 'Nơi cấp', children: cert.issuedBy || '—' },
          { key: 'issued', label: 'Ngày cấp', children: formatDate(cert.issuedAt) || '—' },
          {
            key: 'exp',
            label: 'Hiệu lực đến',
            children: (
              <span>
                {formatDate(cert.expiresAt) || 'Không thời hạn'} <Tag color={status.color}>{status.label}</Tag>
              </span>
            ),
          },
        ]}
      />
      <div className="cert-preview">
        {!file ? (
          <Empty description="Chưa tải bản scan" />
        ) : file.dataUrl && file.type?.startsWith('image/') ? (
          <img src={file.dataUrl} alt={file.name} />
        ) : file.dataUrl && file.type === 'application/pdf' ? (
          <iframe src={file.dataUrl} title={file.name} />
        ) : (
          <Empty image={<FilePdfOutlined style={{ fontSize: 48, color: '#cf3c43' }} />} description={`${file.name} · ${formatFileSize(file.size)} — bản demo chỉ lưu thông tin tệp, không có nội dung xem trước.`} />
        )}
      </div>
      {file?.dataUrl && (
        <a href={file.dataUrl} download={file.name}>
          <Button icon={<DownloadOutlined />}>Tải tệp ({formatFileSize(file.size)})</Button>
        </a>
      )}
    </Modal>
  )
}
