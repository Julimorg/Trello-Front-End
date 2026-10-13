import dayjs from 'dayjs'
import { App, AutoComplete, Button, Checkbox, Col, DatePicker, Empty, Flex, Form, Input, InputNumber, Row, Select, Switch, TimePicker, Typography, Upload } from 'antd'
import { FileImageOutlined, FilePdfOutlined, InboxOutlined } from '@ant-design/icons'
import { CARE_TYPES, DISTRICTS, NURSE_RANKS, WEEKDAYS } from '../../lib/constants'
import { formatFileSize } from './admin-shared'
import { CERT_NAMES, DEFAULT_RANGE, asTime } from './nurse-form-utils'

const { Text } = Typography

// ---------- Certificates ----------

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

// Form.Item child: the uploaded scan, as { name, type, size, dataUrl? }.
export function CertFileInput({ value, onChange }) {
  const { message } = App.useApp()
  const beforeUpload = async (raw) => {
    if (raw.size > MAX_FILE_MB * 1024 * 1024) {
      message.error(`Tệp vượt quá ${MAX_FILE_MB} MB`)
      return Upload.LIST_IGNORE
    }
    const inline = raw.size <= MAX_INLINE_MB * 1024 * 1024
    onChange?.({ name: raw.name, type: raw.type, size: raw.size, ...(inline ? { dataUrl: await readAsDataUrl(raw) } : {}) })
    return false
  }
  return (
    <>
      <Upload.Dragger accept=".pdf,.jpg,.jpeg,.png" maxCount={1} showUploadList={false} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Kéo thả hoặc bấm để chọn tệp</p>
        <p className="ant-upload-hint">PDF, JPG hoặc PNG — tối đa {MAX_FILE_MB} MB</p>
      </Upload.Dragger>
      {value && (
        <div className="cert-file-chip">
          <FileIcon type={value.type} />
          <span>
            <b>{value.name}</b>
            <small>
              {formatFileSize(value.size)}
              {!value.dataUrl ? ' · chỉ lưu thông tin tệp' : ''}
            </small>
          </span>
          <Button size="small" type="text" danger onClick={() => onChange?.(null)}>
            Gỡ tệp
          </Button>
        </div>
      )}
      {value?.dataUrl && (
        <div className="cert-preview">
          {value.type?.startsWith('image/') ? <img src={value.dataUrl} alt={value.name} /> : value.type === 'application/pdf' ? <iframe src={value.dataUrl} title={value.name} /> : <Empty description={value.name} />}
        </div>
      )}
    </>
  )
}

const required = (message) => [{ required: true, whitespace: true, message }]

// Every certificate field is required. `prefix` is the Form.List path ([] for a stand-alone form).
export function CertificateFields({ prefix = [] }) {
  const path = (key) => [...prefix, key]
  return (
    <>
      <Form.Item name={path('name')} label="Tên chứng chỉ" rules={required('Nhập tên chứng chỉ')}>
        <AutoComplete options={CERT_NAMES.map((value) => ({ value }))} filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())} />
      </Form.Item>
      <Flex gap={12} wrap>
        <Form.Item name={path('number')} label="Số chứng chỉ" rules={required('Nhập số chứng chỉ')} style={{ flex: '1 1 220px' }}>
          <Input placeholder="VD: DD-2022-00987" />
        </Form.Item>
        <Form.Item name={path('issuedBy')} label="Nơi cấp" rules={required('Nhập nơi cấp')} style={{ flex: '1 1 220px' }}>
          <Input placeholder="Sở Y tế TP.HCM" />
        </Form.Item>
      </Flex>
      <Flex gap={12} wrap>
        <Form.Item name={path('issuedAt')} label="Ngày cấp" rules={[{ required: true, message: 'Chọn ngày cấp' }]} style={{ flex: '1 1 220px' }}>
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs())} />
        </Form.Item>
        <Form.Item
          name={path('expiresAt')}
          label="Hiệu lực đến"
          style={{ flex: '1 1 220px' }}
          dependencies={[path('issuedAt')]}
          rules={[
            { required: true, message: 'Chọn ngày hết hạn' },
            ({ getFieldValue }) => ({
              validator: (_, value) => (!value || !getFieldValue(path('issuedAt')) || value.isAfter(getFieldValue(path('issuedAt'))) ? Promise.resolve() : Promise.reject(new Error('Phải sau ngày cấp'))),
            }),
          ]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>
      </Flex>
      <Form.Item name={path('file')} label="Bản scan chứng chỉ" rules={[{ required: true, message: 'Tải lên bản scan chứng chỉ' }]}>
        <CertFileInput />
      </Form.Item>
    </>
  )
}

// ---------- Participation schedule (lịch tham gia) ----------

// Form.Item child. value: [{ weekday, start, end }], one entry per weekday that the nurse takes part in.
export function ScheduleEditor({ value = [], onChange }) {
  const byDay = new Map(value.map((s) => [s.weekday, s]))
  const set = (weekday, next) => {
    const rest = value.filter((s) => s.weekday !== weekday)
    onChange?.(next ? [...rest, next] : rest)
  }
  return (
    <div className="schedule-editor">
      {WEEKDAYS.map((w) => {
        const slot = byDay.get(w.id)
        return (
          <div key={w.id} className={`schedule-row${slot ? ' is-on' : ''}`}>
            <Switch size="small" checked={Boolean(slot)} onChange={(on) => set(w.id, on ? { weekday: w.id, start: DEFAULT_RANGE[0], end: DEFAULT_RANGE[1] } : null)} aria-label={`Tham gia ${w.label}`} />
            <Text strong={Boolean(slot)} className="schedule-day">
              {w.label}
            </Text>
            {slot ? (
              <TimePicker.RangePicker
                allowClear={false}
                format="HH:mm"
                minuteStep={15}
                value={[asTime(slot.start), asTime(slot.end)]}
                onChange={(range) => range?.[0] && range?.[1] && set(w.id, { weekday: w.id, start: range[0].format('HH:mm'), end: range[1].format('HH:mm') })}
                style={{ flex: '1 1 180px', maxWidth: 260 }}
              />
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Không tham gia
              </Text>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Basic profile ----------

const CARE_OPTIONS = CARE_TYPES.filter((c) => c.id !== 'other').map((c) => ({ value: c.id, label: c.label }))

// Every field is required to submit a complete profile.
export function BasicFields() {
  return (
    <>
      <Row gutter={12}>
        <Col xs={24} sm={12}>
          <Form.Item name="name" label="Họ và tên" rules={required('Nhập họ tên')}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="phone" label="Số điện thoại" rules={required('Nhập số điện thoại')}>
            <Input placeholder="090 123 4567" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="rank" label="Cấp bậc" rules={[{ required: true, message: 'Chọn cấp bậc' }]}>
            <Select placeholder="Chọn cấp bậc" options={NURSE_RANKS.map((r) => ({ value: r, label: r }))} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="experienceYears" label="Số năm kinh nghiệm" rules={[{ required: true, type: 'number', message: 'Nhập số năm kinh nghiệm' }]}>
            <InputNumber min={0} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="specialties" label="Chuyên môn" rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một chuyên môn' }]}>
        <Checkbox.Group className="checkbox-grid" options={CARE_OPTIONS} />
      </Form.Item>
      <Form.Item name="serviceAreas" label="Khu vực phục vụ" rules={[{ required: true, type: 'array', min: 1, message: 'Chọn ít nhất một khu vực' }]}>
        <Select mode="multiple" placeholder="Chọn quận" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
      </Form.Item>
    </>
  )
}
