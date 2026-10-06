import { App, Button, Card, Col, Form, Input, Row, Select, Table, Tag, Typography } from 'antd'
import { NotificationOutlined, SendOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { getHospital, sendBroadcast } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { BROADCAST_AUDIENCES } from '../../Data/admin/broadcast-data'

const { Text } = Typography
const AUDIENCE_LABEL = Object.fromEntries(BROADCAST_AUDIENCES.map((a) => [a.value, a.label]))
const AUDIENCE_COLOR = { all: 'purple', patients: 'blue', nurses: 'cyan', hospitals: 'gold' }

// Counts who a broadcast would reach, mirroring sendBroadcast in lib/db.js.
function countRecipients(state, audience, hospitalId) {
  const patients = state.patients.length
  const nurses = state.nurses.filter((n) => !hospitalId || n.hospitalId === hospitalId).length
  const hospitals = hospitalId ? 1 : state.hospitals.length
  return { all: patients + nurses + hospitals, patients, nurses, hospitals }[audience] || 0
}

// "Thông báo hệ thống": send an announcement to every patient / nurse / hospital admin.
export default function Broadcasts() {
  const { modal, message } = App.useApp()
  const state = useDb()
  const [form] = Form.useForm()
  const audience = Form.useWatch('audience', form) || 'all'
  const hospitalId = Form.useWatch('hospitalId', form) || null
  const scoped = audience === 'nurses' || audience === 'hospitals'
  const reach = countRecipients(state, audience, scoped ? hospitalId : null)
  const history = [...(state.broadcasts || [])].sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  const submit = async () => {
    const v = await form.validateFields()
    modal.confirm({
      title: 'Gửi thông báo?',
      content: `“${v.title.trim()}” sẽ được gửi tới ${reach} người nhận (${AUDIENCE_LABEL[v.audience].toLowerCase()}). Không thể thu hồi sau khi gửi.`,
      okText: 'Gửi ngay',
      cancelText: 'Hủy',
      onOk: () => {
        const sent = sendBroadcast({ title: v.title.trim(), message: v.message.trim(), audience: v.audience, hospitalId: scoped ? v.hospitalId || null : null })
        message.success(`Đã gửi tới ${sent} người nhận`)
        form.resetFields()
      },
    })
  }

  return (
    <>
      <PageHead eyebrow="Announcements" title="Thông báo hệ thống" description="Gửi thông báo tới bệnh nhân, điều dưỡng hoặc admin bệnh viện: bảo trì, thay đổi chính sách, nhắc việc." />
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card
            title={
              <span>
                <NotificationOutlined /> Soạn thông báo
              </span>
            }
          >
            <Form form={form} layout="vertical" initialValues={{ audience: 'all' }}>
              <Form.Item name="audience" label="Người nhận">
                <Select options={BROADCAST_AUDIENCES.map((a) => ({ value: a.value, label: a.label }))} />
              </Form.Item>
              {scoped && (
                <Form.Item name="hospitalId" label="Giới hạn theo bệnh viện" extra="Bỏ trống để gửi cho toàn mạng lưới">
                  <Select allowClear placeholder="Tất cả bệnh viện" options={state.hospitals.map((h) => ({ value: h.id, label: h.name }))} />
                </Form.Item>
              )}
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, whitespace: true, message: 'Nhập tiêu đề' }]}>
                <Input maxLength={80} showCount placeholder="VD: Bảo trì hệ thống đêm 15/10" />
              </Form.Item>
              <Form.Item name="message" label="Nội dung" rules={[{ required: true, whitespace: true, message: 'Nhập nội dung' }]}>
                <Input.TextArea rows={5} maxLength={500} showCount />
              </Form.Item>
              <Button type="primary" block size="large" icon={<SendOutlined />} onClick={submit}>
                Gửi tới {reach} người nhận
              </Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} xl={15}>
          <Card title="Lịch sử gửi" styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="id"
              dataSource={history}
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              scroll={{ x: 720 }}
              locale={{ emptyText: 'Chưa gửi thông báo nào' }}
              columns={[
                {
                  title: 'Thông báo',
                  key: 'title',
                  render: (_, b) => (
                    <div>
                      <Text strong>{b.title}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {b.message}
                        </Text>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Người nhận',
                  key: 'aud',
                  width: 190,
                  filters: BROADCAST_AUDIENCES.map((a) => ({ value: a.value, text: a.label })),
                  onFilter: (v, b) => b.audience === v,
                  render: (_, b) => (
                    <div>
                      <Tag color={AUDIENCE_COLOR[b.audience]}>{AUDIENCE_LABEL[b.audience]}</Tag>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {b.recipients} người{b.hospitalId ? ` · ${getHospital(state, b.hospitalId)?.name}` : ''}
                        </Text>
                      </div>
                    </div>
                  ),
                },
                { title: 'Gửi lúc', key: 'at', width: 160, sorter: (a, b) => a.sentAt.localeCompare(b.sentAt), render: (_, b) => <div>{formatDateTime(b.sentAt)}<div><Text type="secondary" style={{ fontSize: 12 }}>{b.sentBy}</Text></div></div> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}
