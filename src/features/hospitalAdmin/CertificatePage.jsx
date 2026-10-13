import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { App, Button, Card, Form, Result, Tag } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { CertificateFields } from './nurse-form-parts'
import { certToForm, formToCert, validateForm } from './nurse-form-utils'
import { useDb } from '../../lib/store'
import { addCertificate, getNurse, removeCertificate, updateCertificate } from '../../lib/db'
import { certificateStatus } from './admin-shared'

// Add / view / edit one certificate on its own page (no popup). All fields are required.
export default function CertificatePage() {
  const { id, certId } = useParams()
  const state = useDb()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loaded, setLoaded] = useState(false)
  const nurse = getNurse(state, id)
  const isNew = certId === 'new'
  const cert = isNew ? null : nurse?.certificates.find((c) => c.id === certId)
  const back = `/hospital/admin/roster/${id}`

  useEffect(() => {
    if (loaded || !nurse || (!isNew && !cert)) return
    form.setFieldsValue(isNew ? { issuedBy: 'Sở Y tế TP.HCM' } : certToForm(cert))
    setLoaded(true)
  }, [loaded, nurse, cert, isNew, form])

  if (!nurse || (!isNew && !cert)) {
    return (
      <Result
        status="404"
        title="Không tìm thấy chứng chỉ"
        extra={
          <Link to={nurse ? back : '/hospital/admin/roster'}>
            <Button type="primary">Quay lại hồ sơ</Button>
          </Link>
        }
      />
    )
  }

  const status = cert ? certificateStatus(cert) : null

  const submit = async () => {
    const raw = await validateForm(form)
    if (!raw) return
    const values = formToCert(raw)
    if (isNew) {
      addCertificate(nurse.id, values)
      message.success('Đã thêm chứng chỉ')
    } else {
      updateCertificate(nurse.id, cert.id, values)
      message.success('Đã cập nhật chứng chỉ')
    }
    navigate(back)
  }

  return (
    <>
      <Link to={back} className="back-link">
        <ArrowLeftOutlined /> Hồ sơ {nurse.name}
      </Link>
      <PageHead
        eyebrow={`Chứng chỉ · ${nurse.name}`}
        title={isNew ? 'Thêm chứng chỉ' : cert.name}
        description={status ? undefined : 'Nhập đầy đủ thông tin và tải lên bản scan chứng chỉ.'}
        action={status && <Tag color={status.color}>{status.label}</Tag>}
      />
      <Card>
        <Form form={form} layout="vertical" requiredMark scrollToFirstError style={{ maxWidth: 720 }}>
          <CertificateFields />
        </Form>
      </Card>
      <div className="form-actions-bar">
        {!isNew && (
          <Button
            danger
            icon={<DeleteOutlined />}
            style={{ marginRight: 'auto' }}
            onClick={() => {
              removeCertificate(nurse.id, cert.id)
              message.success('Đã xóa chứng chỉ')
              navigate(back)
            }}
          >
            Xóa chứng chỉ
          </Button>
        )}
        <Button onClick={() => navigate(back)}>Hủy</Button>
        <Button type="primary" onClick={submit}>
          {isNew ? 'Thêm chứng chỉ' : 'Cập nhật chứng chỉ'}
        </Button>
      </div>
    </>
  )
}
