import { useEffect } from 'react'
import { Alert, App, Button, Card, Checkbox, Col, Divider, Form, Input, InputNumber, Row, Space, Switch, Typography } from 'antd'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { updateSettings } from '../../lib/db'
import { CARE_TYPES, DISTRICTS, RECURRING_SESSION_COUNT } from '../../lib/constants'
import { DEFAULT_SETTINGS } from '../../Data/admin/settings-data'

// 'Khác' is always offered, so it is not switchable.
const ROLLOUT_CARE_TYPES = CARE_TYPES.filter((c) => c.id !== 'other')

const { Text } = Typography

// "Cấu hình hệ thống": parameters that change platform behaviour immediately for every portal.
export default function Settings() {
  const { message } = App.useApp()
  const state = useDb()
  const [form] = Form.useForm()
  const maintenance = Form.useWatch('maintenanceMode', form)
  const settings = { ...DEFAULT_SETTINGS, ...state.settings }
  // The form shows what is ON; settings store what is switched off.
  const toForm = (v) => ({ ...v, enabledCareTypes: ROLLOUT_CARE_TYPES.map((c) => c.id).filter((id) => !(v.disabledCareTypes || []).includes(id)) })

  useEffect(() => {
    form.setFieldsValue(toForm(settings))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings])

  const save = async () => {
    const { enabledCareTypes, ...v } = await form.validateFields()
    updateSettings({ ...v, disabledCareTypes: ROLLOUT_CARE_TYPES.map((c) => c.id).filter((id) => !enabledCareTypes.includes(id)), maintenanceMessage: v.maintenanceMessage?.trim() || DEFAULT_SETTINGS.maintenanceMessage })
    message.success('Đã lưu cấu hình — áp dụng ngay cho các yêu cầu mới')
  }

  return (
    <>
      <PageHead
        eyebrow="CareShift"
        title="Cấu hình hệ thống"
        description="Thông số điều phối, ngưỡng cảnh báo và chế độ bảo trì. Mọi thay đổi được ghi vào nhật ký hoạt động."
        action={
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                form.setFieldsValue(toForm(DEFAULT_SETTINGS))
                message.info('Đã nạp giá trị mặc định — bấm “Lưu thay đổi” để áp dụng')
              }}
            >
              Về mặc định
            </Button>
            <Button type="primary" size="large" icon={<SaveOutlined />} onClick={save}>
              Lưu thay đổi
            </Button>
          </Space>
        }
      />
      <Form form={form} layout="vertical" initialValues={toForm(settings)}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="Điều phối chăm sóc (Nurse Matching)">
              <Form.Item name="matchLimit" label="Số điều dưỡng gợi ý tối đa mỗi yêu cầu" rules={[{ required: true }]}>
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="responseWindowMinutes" label="Thời gian điều dưỡng phải phản hồi (phút)" extra="Hết thời gian này yêu cầu quay lại để bệnh nhân chọn người khác" rules={[{ required: true }]}>
                <InputNumber min={1} max={120} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Số buổi mặc định cho liệu trình định kỳ">
                <InputNumber disabled value={RECURRING_SESSION_COUNT} style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Ngưỡng cảnh báo">
              <Form.Item name="sosEscalationMinutes" label="SOS chưa xử lý quá (phút) được coi là quá hạn" rules={[{ required: true }]}>
                <InputNumber min={1} max={120} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="contractWarningDays" label="Cảnh báo hợp đồng sắp hết hạn trước (ngày)" rules={[{ required: true }]}>
                <InputNumber min={7} max={365} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="supportSlaHours" label="Trả lời yêu cầu hỗ trợ trong vòng (giờ)" rules={[{ required: true }]}>
                <InputNumber min={1} max={72} style={{ width: '100%' }} />
              </Form.Item>
              <Text type="secondary">Hiển thị ở Tổng quan, Trung tâm vận hành, Hỗ trợ và danh sách Bệnh viện đối tác.</Text>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Khu vực đang triển khai" extra={<Text type="secondary">Bệnh nhân chỉ đặt được ở khu vực đang mở</Text>}>
              <Form.Item name="openDistricts" rules={[{ type: 'array', min: 1, message: 'Mở ít nhất một khu vực' }]} style={{ marginBottom: 0 }}>
                <Checkbox.Group options={DISTRICTS.map((d) => ({ value: d, label: d }))} className="checkbox-grid" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="Dịch vụ đang cung cấp" extra={<Text type="secondary">“Khác” luôn khả dụng</Text>}>
              <Form.Item name="enabledCareTypes" rules={[{ type: 'array', min: 1, message: 'Bật ít nhất một dịch vụ' }]} style={{ marginBottom: 0 }}>
                <Checkbox.Group options={ROLLOUT_CARE_TYPES.map((c) => ({ value: c.id, label: c.label }))} className="checkbox-grid" />
              </Form.Item>
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Chế độ bảo trì">
              <Form.Item name="maintenanceMode" valuePropName="checked" style={{ marginBottom: 12 }}>
                <Switch checkedChildren="Đang bảo trì" unCheckedChildren="Bình thường" />
              </Form.Item>
              <Form.Item name="maintenanceMessage" label="Nội dung hiển thị cho người dùng">
                <Input.TextArea rows={2} maxLength={200} showCount />
              </Form.Item>
              <Divider style={{ margin: '8px 0 12px' }} />
              {maintenance ? (
                <Alert type="warning" showIcon title="Banner bảo trì sẽ hiện ở đầu mọi cổng bệnh nhân, điều dưỡng và bệnh viện. Cảnh báo SOS vẫn hoạt động." />
              ) : (
                <Text type="secondary">Bật để hiện banner thông báo bảo trì cho người dùng (không chặn đăng nhập hay SOS).</Text>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </>
  )
}
