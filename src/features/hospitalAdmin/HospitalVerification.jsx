import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, App, Avatar, Button, Card, Checkbox, Empty, Flex, Modal, Space, Tag, Typography } from 'antd'
import { FilePdfOutlined, FileImageOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { CertificateViewModal } from './CertificateModals'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listNursesByHospital, setNurseAuthStatus } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS } from '../../lib/constants'
import { certificateStatus, compareByGivenName, initials } from './admin-shared'

const { Text } = Typography

export default function HospitalVerification() {
  const { session } = useAuth()
  const state = useDb()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const pending = listNursesByHospital(state, session.id)
    .filter((n) => n.authStatus === NURSE_AUTH_STATUS.DRAFT)
    .sort((a, b) => compareByGivenName(a.name, b.name))
  const [target, setTarget] = useState(null)
  const [careTypes, setCareTypes] = useState([])
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState(null)

  const verify = () => {
    const result = setNurseAuthStatus(target.id, NURSE_AUTH_STATUS.AUTHORIZED, careTypes)
    if (!result.ok) {
      setError(result.error)
      return
    }
    message.success(`Đã cấp phép cho ${target.name}. Điều dưỡng đã vào nguồn matching.`)
    setTarget(null)
  }

  return (
    <>
      <PageHead eyebrow="Credential verification" title="Xác minh hồ sơ" description="Đối chiếu chứng chỉ trước khi cấp quyền nhận ca trên CareShift." />
      {pending.length === 0 ? (
        <Card>
          <Empty description="Không có hồ sơ nào chờ xác minh" />
        </Card>
      ) : (
        <Flex vertical gap={12}>
          {pending.map((n) => (
            <Card key={n.id} size="small">
              <Flex gap={14} align="flex-start" wrap>
                <Avatar size={48} style={{ background: '#fff4df', color: '#b96b08', fontWeight: 800 }}>
                  {initials(n.name)}
                </Avatar>
                <div style={{ flex: '1 1 320px' }}>
                  <Text strong style={{ fontSize: 15 }}>
                    {n.name}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {n.rank} · {n.phone} · {n.serviceAreas.join(', ')}
                    </Text>
                  </div>
                  <Flex gap={4} wrap style={{ marginTop: 8 }}>
                    {n.specialties.map((s) => (
                      <Tag key={s} color="cyan">
                        {careTypeLabel(s)}
                      </Tag>
                    ))}
                  </Flex>
                  <div className="verify-certs">
                    {n.certificates.length === 0 ? (
                      <Alert type="warning" showIcon title="Chưa nộp chứng chỉ hành nghề — cần bổ sung trước khi cấp phép." />
                    ) : (
                      n.certificates.map((c) => {
                        const st = certificateStatus(c)
                        return (
                          <button key={c.id} type="button" className="cert-file-chip is-button" onClick={() => setViewing({ nurseId: n.id, certId: c.id })}>
                            {c.file?.type?.startsWith('image/') ? <FileImageOutlined /> : c.file ? <FilePdfOutlined /> : <SafetyCertificateOutlined />}
                            <span>
                              <b>{c.name}</b>
                              <small>
                                Số {c.number} · {c.issuedBy}
                              </small>
                            </span>
                            <Tag color={st.color}>{st.label}</Tag>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
                <Space wrap>
                  <Link to={`/hospital/admin/roster/${n.id}`}>
                    <Button>Yêu cầu bổ sung</Button>
                  </Link>
                  <Button
                    type="primary"
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => {
                      setError('')
                      setCareTypes(n.specialties)
                      setTarget(n)
                    }}
                  >
                    Xác minh &amp; cấp phép
                  </Button>
                </Space>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      <Modal open={Boolean(target)} title={target ? `Cấp phép cho ${target.name}` : ''} okText="Cấp phép" cancelText="Hủy" onCancel={() => setTarget(null)} onOk={verify} okButtonProps={{ disabled: careTypes.length === 0 }}>
        {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 12 }} />}
        <Text>Phạm vi ca được phép nhận:</Text>
        <Checkbox.Group style={{ display: 'grid', gap: 8, marginTop: 10 }} value={careTypes} onChange={setCareTypes} options={(target?.specialties || []).map((s) => ({ value: s, label: careTypeLabel(s) }))} />
      </Modal>
      {(() => {
        const nurse = viewing ? pending.find((n) => n.id === viewing.nurseId) : null
        const cert = nurse?.certificates.find((c) => c.id === viewing.certId)
        return (
          <CertificateViewModal
            open={Boolean(cert)}
            cert={cert}
            onCancel={() => setViewing(null)}
            onEdit={() => {
              setViewing(null)
              navigate(`/hospital/admin/roster/${nurse.id}`)
            }}
          />
        )
      })()}
    </>
  )
}
