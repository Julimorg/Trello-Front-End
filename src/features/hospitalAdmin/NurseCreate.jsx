import { Link, useNavigate } from 'react-router-dom'
import { App, Alert, Button, Card, Form, Typography } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { usePageCrumbs } from '../../components/crumbs'
import { BasicFields, CertificateFields, ScheduleEditor } from './nurse-form-parts'
import { formToCert, scheduleRules, scheduleToSlots, validateForm } from './nurse-form-utils'
import { useAuth } from '../../auth/AuthContext'
import { addNurse } from '../../lib/db'

const { Text } = Typography

// "Thêm điều dưỡng" as a full page. "Thêm điều dưỡng" needs every field; "Lưu nháp" only needs the name.
export default function NurseCreate() {
  const { session } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  usePageCrumbs([{ label: 'Thêm điều dưỡng' }])

  const collect = () => {
    const v = form.getFieldsValue(true)
    return {
      name: (v.name || '').trim(),
      phone: (v.phone || '').trim(),
      rank: v.rank || '',
      experienceYears: v.experienceYears ?? 0,
      specialties: v.specialties || [],
      serviceAreas: v.serviceAreas || [],
      certificates: (v.certificates || []).filter((c) => c && (c.name || c.number || c.file)).map(formToCert),
      availability: scheduleToSlots(v.schedule),
    }
  }

  const saveDraft = async () => {
    if (!(await validateForm(form, ['name']))) return
    const id = addNurse(session.id, { ...collect(), isDraft: true })
    message.success('Đã lưu nháp hồ sơ. Bạn có thể hoàn tất sau.')
    navigate(`/hospital/admin/roster/${id}`)
  }

  const submit = async () => {
    if (!(await validateForm(form))) return
    const id = addNurse(session.id, { ...collect(), isDraft: false })
    message.success('Đã thêm điều dưỡng. Kiểm tra hồ sơ rồi bấm “Cấp phép” để nhận ca.')
    navigate(`/hospital/admin/roster/${id}`)
  }

  return (
    <>
      <Link to="/hospital/admin/roster" className="back-link">
        <ArrowLeftOutlined /> Danh sách điều dưỡng
      </Link>
      <PageHead eyebrow="Hospital roster" title="Thêm điều dưỡng" description="Nhập đầy đủ thông tin, chứng chỉ và lịch tham gia. Chưa đủ thông tin? Dùng “Lưu nháp” để hoàn tất sau." />

      <Form form={form} layout="vertical" requiredMark scrollToFirstError initialValues={{ certificates: [{}], schedule: [] }}>
        <Card title="Thông tin cơ bản">
          <BasicFields />
        </Card>

        <Card title="Chứng chỉ & văn bằng" style={{ marginTop: 16 }}>
          <Form.List name="certificates" rules={[{ validator: async (_, list) => (list && list.length ? undefined : Promise.reject(new Error('Cần ít nhất một chứng chỉ'))) }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, i) => (
                  <Card
                    key={field.key}
                    size="small"
                    type="inner"
                    style={{ marginBottom: 12 }}
                    title={`Chứng chỉ ${i + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                          Bỏ
                        </Button>
                      )
                    }
                  >
                    <CertificateFields prefix={[field.name]} />
                  </Card>
                ))}
                <Form.ErrorList errors={errors} />
                <Button icon={<PlusOutlined />} onClick={() => add({})}>
                  Thêm chứng chỉ
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Card title="Lịch tham gia điều dưỡng" style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            Chọn các ngày trong tuần và khung giờ điều dưỡng tham gia chăm sóc tại nhà. Bắt buộc có ít nhất 1 ngày.
          </Text>
          <Form.Item name="schedule" rules={scheduleRules} style={{ marginBottom: 0 }}>
            <ScheduleEditor />
          </Form.Item>
        </Card>

        <Alert type="info" showIcon style={{ marginTop: 16 }} title="Sau khi thêm, hồ sơ ở trạng thái “Chờ cấp phép”. Bệnh viện bấm “Cấp phép” trong hồ sơ để điều dưỡng nhận ca." />

        <div className="form-actions-bar">
          <Button onClick={() => navigate('/hospital/admin/roster')}>Hủy</Button>
          <Button onClick={saveDraft}>Lưu nháp</Button>
          <Button type="primary" onClick={submit}>
            Thêm điều dưỡng
          </Button>
        </div>
      </Form>
    </>
  )
}
