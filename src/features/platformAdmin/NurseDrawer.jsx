import { Link } from 'react-router-dom'
import { Alert, Descriptions, Drawer, Flex, Tag, Tooltip, Typography } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { useDb } from '../../lib/store'
import { listBookingsByNurse } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { PLATFORM_STATUS_META } from './platform-shared'
import { AUTH_META, certificateStatus } from '../hospitalAdmin/admin-shared'

const { Text, Title, Paragraph } = Typography

export function StatusTag({ status, reason }) {
  const meta = PLATFORM_STATUS_META[status || 'active']
  return (
    <Tooltip title={reason}>
      <Tag color={meta.color}>{meta.label}</Tag>
    </Tooltip>
  )
}

export default function NurseDrawer({ nurse, onClose }) {
  const state = useDb()
  if (!nurse) return null
  const sessions = listBookingsByNurse(state, nurse.id).flatMap((b) => b.sessions.filter((s) => s.nurseId === nurse.id))
  const reports = (state.reports || []).filter((r) => r.subjectType === 'nurse' && r.subjectId === nurse.id)
  return (
    <Drawer open onClose={onClose} size={560} title={nurse.name} extra={<StatusTag status={nurse.accountStatus} reason={nurse.accountStatusReason} />}>
      <Descriptions
        size="small"
        bordered
        column={1}
        items={[
          { key: 'id', label: 'Mã', children: <Text code>{nurse.id}</Text> },
          { key: 'rank', label: 'Cấp bậc', children: nurse.rank },
          { key: 'phone', label: 'Điện thoại', children: nurse.phone },
          { key: 'exp', label: 'Kinh nghiệm', children: `${nurse.experienceYears} năm` },
          { key: 'auth', label: 'Cấp phép (bệnh viện)', children: <Tag color={AUTH_META[nurse.authStatus].color}>{AUTH_META[nurse.authStatus].label}</Tag> },
          { key: 'scope', label: 'Phạm vi ca', children: nurse.authorizedCareTypes.map(careTypeLabel).join(', ') || '—' },
          { key: 'areas', label: 'Khu vực', children: nurse.serviceAreas.join(', ') },
          { key: 'sessions', label: 'Số ca CareShift', children: `${sessions.length} ca (${sessions.filter((s) => s.status === 'completed').length} đã hoàn thành)` },
        ]}
      />
      <Title level={5} style={{ marginTop: 18 }}>
        Chứng chỉ
      </Title>
      {nurse.certificates.length === 0 ? (
        <Alert type="warning" showIcon title="Chưa có chứng chỉ hành nghề" />
      ) : (
        nurse.certificates.map((c) => {
          const st = certificateStatus(c)
          return (
            <Flex key={c.id} justify="space-between" className="cert-row" gap={8}>
              <span>
                <SafetyCertificateOutlined /> {c.name} · <Text code>{c.number}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {c.issuedBy} · hết hạn {formatDate(c.expiresAt) || '—'}
                  </Text>
                </div>
              </span>
              <Tag color={st.color}>{st.label}</Tag>
            </Flex>
          )
        })
      )}
      <Title level={5} style={{ marginTop: 18 }}>
        Báo cáo liên quan ({reports.length})
      </Title>
      {reports.length === 0 ? (
        <Text type="secondary">Không có báo cáo nào.</Text>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="cert-row">
            <Text strong>{r.title}</Text>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(r.createdAt)} · {r.category} · {r.status}
              </Text>
            </div>
          </div>
        ))
      )}
      <Paragraph style={{ marginTop: 16 }}>
        <Link to="/admin/compliance">Mở trang Tuân thủ & chính sách →</Link>
      </Paragraph>
    </Drawer>
  )
}
