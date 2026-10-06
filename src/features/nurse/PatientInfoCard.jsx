import dayjs from 'dayjs'
import { Avatar, Button, Card, Descriptions, Empty, Flex, Tag, Typography } from 'antd'
import { PhoneOutlined, TeamOutlined } from '@ant-design/icons'
import { formatDate } from '../../lib/format'
import { initials } from './nurse-shared'

const { Text } = Typography

// Patient record + linked family contacts, shared by the request and session detail pages.
export default function PatientInfoCard({ patient, showFamily = true }) {
  const age = patient?.dateOfBirth ? dayjs().diff(dayjs(patient.dateOfBirth), 'year') : null
  const family = (patient?.familyContacts || []).filter((c) => c.status === 'Đã liên kết')
  return (
    <>
      <Card title="Thông tin bệnh nhân">
        <Flex gap={12} align="center" style={{ marginBottom: 14 }}>
          <Avatar size={52} style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800 }}>
            {initials(patient?.name)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 16 }}>
              {patient?.name}
            </Text>
            <div>
              <Text type="secondary">
                {patient?.gender}
                {age !== null ? ` · ${age} tuổi` : ''}
              </Text>
            </div>
          </div>
        </Flex>
        <Descriptions
          size="small"
          column={1}
          items={[
            { key: 'dob', label: 'Ngày sinh', children: formatDate(patient?.dateOfBirth) || '—' },
            { key: 'phone', label: 'Điện thoại', children: patient?.phone },
            { key: 'district', label: 'Khu vực', children: patient?.district },
            { key: 'blood', label: 'Nhóm máu', children: patient?.bloodType || '—' },
            {
              key: 'allergy',
              label: 'Dị ứng',
              children: patient?.allergies && patient.allergies !== 'Không' ? <Tag color="red">{patient.allergies}</Tag> : <Text type="secondary">Không</Text>,
            },
            { key: 'cond', label: 'Bệnh nền', children: patient?.conditions || '—' },
            { key: 'bhyt', label: 'BHYT', children: <Text code>{patient?.insuranceNumber || '—'}</Text> },
          ]}
        />
      </Card>

      {showFamily && (
        <Card
          title={
            <span>
              <TeamOutlined /> Người thân liên hệ
            </span>
          }
          style={{ marginTop: 16 }}
        >
          {family.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có người thân liên kết" />
          ) : (
            family.map((c) => (
              <Flex key={c.id} justify="space-between" align="center" className="cert-row" gap={8}>
                <div>
                  <Text strong>{c.name}</Text>
                  {c.primary && (
                    <Tag color="green" style={{ marginLeft: 6 }}>
                      Ưu tiên
                    </Tag>
                  )}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {c.relation} · {c.phone}
                    </Text>
                  </div>
                </div>
                <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} aria-label={`Gọi ${c.name}`}>
                  <Button shape="circle" icon={<PhoneOutlined />} />
                </a>
              </Flex>
            ))
          )}
        </Card>
      )}
    </>
  )
}
