import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Avatar, Card, Col, Descriptions, Empty, Flex, Progress, Rate, Row, Statistic, Table, Tabs, Tag, Timeline, Typography } from 'antd'
import {
  BookOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getHospital, getNurse, getPatient, getPricing, listBookingsByNurse } from '../../lib/db'
import { careTypeLabel, formatCurrency, formatDate, weekdayLabel } from '../../lib/format'
import { NURSE_AUTH_STATUS_LABEL, SESSION_STATUS } from '../../lib/constants'
import { NURSE_PROFILE_DETAILS, SKILL_LEVEL_LABEL } from '../../Data/nurse/profile-data'
import { initials } from './nurse-shared'

const { Text, Paragraph, Title } = Typography

// Nurses without an extended record still get a coherent page built from their base profile.
function fallbackDetail(nurse) {
  return {
    nurseId: nurse.id,
    email: '—',
    address: '—',
    department: '—',
    dateOfBirth: null,
    gender: null,
    licenseNumber: nurse.certificates[0]?.number || '—',
    licenseIssuedAt: null,
    licenseExpiresAt: null,
    licenseScope: nurse.rank,
    education: [],
    workHistory: [],
    languages: ['Tiếng Việt'],
    skills: nurse.specialties.map((id) => ({ name: careTypeLabel(id), level: 4 })),
    trainings: [],
    equipment: [],
    transport: '—',
    maxSessionsPerWeek: 10,
    responseTimeMinutes: null,
    acceptanceRate: null,
    onTimeRate: null,
    reviews: [],
  }
}

const AUTH_COLOR = { authorized: 'green', draft: 'gold', suspended: 'red', revoked: 'red' }

export default function NurseProfile() {
  const { session } = useAuth()
  const state = useDb()
  const nurse = getNurse(state, session.id)
  const detail = nurse ? NURSE_PROFILE_DETAILS[nurse.id] || fallbackDetail(nurse) : null

  const sessionStats = useMemo(() => {
    const monthPrefix = dayjs().format('YYYY-MM')
    const mine = listBookingsByNurse(state, session.id).flatMap((b) => b.sessions.filter((s) => s.nurseId === session.id))
    return {
      thisMonth: mine.filter((s) => s.date.startsWith(monthPrefix)).length,
      completed: mine.filter((s) => s.status === SESSION_STATUS.COMPLETED).length,
      upcoming: mine.filter((s) => s.date >= dayjs().format('YYYY-MM-DD') && s.status === SESSION_STATUS.CONFIRMED).length,
    }
  }, [state, session.id])

  if (!nurse) return null
  const hospital = getHospital(state, nurse.hospitalId)
  const licenseDaysLeft = detail.licenseExpiresAt ? dayjs(detail.licenseExpiresAt).diff(dayjs(), 'day') : null
  const age = detail.dateOfBirth ? dayjs().diff(dayjs(detail.dateOfBirth), 'year') : null

  const personal = (
    <Descriptions
      bordered
      size="small"
      column={{ xs: 1, md: 2 }}
      items={[
        { key: 'name', label: 'Họ và tên', children: nurse.name },
        { key: 'dob', label: 'Ngày sinh', children: detail.dateOfBirth ? `${formatDate(detail.dateOfBirth)} (${age} tuổi)` : '—' },
        { key: 'gender', label: 'Giới tính', children: detail.gender || '—' },
        { key: 'phone', label: 'Điện thoại', children: <><PhoneOutlined /> {nurse.phone}</> },
        { key: 'email', label: 'Email công việc', children: <><MailOutlined /> {detail.email}</> },
        { key: 'address', label: 'Địa chỉ', children: <><EnvironmentOutlined /> {detail.address}</> },
        { key: 'hospital', label: 'Bệnh viện', children: hospital?.name },
        { key: 'dept', label: 'Khoa / phòng', children: detail.department },
        { key: 'rank', label: 'Chức danh', children: nurse.rank },
        { key: 'exp', label: 'Kinh nghiệm', children: `${nurse.experienceYears} năm` },
        { key: 'lang', label: 'Ngôn ngữ', children: detail.languages.map((l) => <Tag key={l}>{l}</Tag>) },
        { key: 'transport', label: 'Di chuyển', children: <><CarOutlined /> {detail.transport}</> },
      ]}
    />
  )

  const license = (
    <Flex vertical gap={16}>
      <Descriptions
        bordered
        size="small"
        column={{ xs: 1, md: 2 }}
        items={[
          { key: 'no', label: 'Số chứng chỉ hành nghề', children: <Text code>{detail.licenseNumber}</Text> },
          {
            key: 'status',
            label: 'Trạng thái xác minh',
            children: <Tag color={AUTH_COLOR[nurse.authStatus]}>{NURSE_AUTH_STATUS_LABEL[nurse.authStatus]?.label || nurse.authStatus}</Tag>,
          },
          { key: 'issued', label: 'Ngày cấp', children: formatDate(detail.licenseIssuedAt) || '—' },
          {
            key: 'expires',
            label: 'Hiệu lực đến',
            children: detail.licenseExpiresAt ? (
              <span>
                {formatDate(detail.licenseExpiresAt)}{' '}
                <Tag color={licenseDaysLeft < 90 ? 'red' : licenseDaysLeft < 365 ? 'gold' : 'green'}>còn {licenseDaysLeft} ngày</Tag>
              </span>
            ) : (
              '—'
            ),
          },
          { key: 'scope', label: 'Phạm vi hành nghề', children: detail.licenseScope, span: 'filled' },
        ]}
      />
      <div>
        <Title level={5}>Chứng chỉ đã đối chiếu</Title>
        {nurse.certificates.length ? (
          nurse.certificates.map((c) => (
            <Flex key={c.id} gap={10} align="center" className="cert-row">
              <SafetyCertificateOutlined style={{ color: '#21845b', fontSize: 20 }} />
              <div>
                <Text strong>{c.name}</Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Số {c.number} · Cấp bởi {c.issuedBy}
                  </Text>
                </div>
              </div>
            </Flex>
          ))
        ) : (
          <Text type="secondary">Chưa có chứng chỉ nào được ghi nhận.</Text>
        )}
      </div>
      <div>
        <Title level={5}>Đào tạo liên tục</Title>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Chưa có khóa đào tạo' }}
          dataSource={detail.trainings}
          scroll={{ x: 520 }}
          columns={[
            { title: 'Khóa học', dataIndex: 'name' },
            { title: 'Đơn vị', dataIndex: 'provider' },
            { title: 'Ngày', dataIndex: 'date', render: formatDate, width: 110 },
            { title: 'Số giờ', dataIndex: 'hours', width: 80, align: 'right' },
          ]}
        />
      </div>
    </Flex>
  )

  const experience = (
    <Row gutter={[24, 16]}>
      <Col xs={24} md={12}>
        <Title level={5}>
          <BookOutlined /> Học vấn
        </Title>
        {detail.education.length ? (
          <Timeline
            items={detail.education.map((e) => ({
              key: e.degree,
              content: (
                <>
                  <Text strong>{e.degree}</Text>
                  <div>
                    <Text type="secondary">
                      {e.school} · {e.year}
                    </Text>
                  </div>
                </>
              ),
            }))}
          />
        ) : (
          <Text type="secondary">Chưa cập nhật</Text>
        )}
      </Col>
      <Col xs={24} md={12}>
        <Title level={5}>
          <IdcardOutlined /> Quá trình công tác
        </Title>
        {detail.workHistory.length ? (
          <Timeline
            items={detail.workHistory.map((w) => ({
              key: w.role + w.from,
              color: w.to ? 'gray' : 'green',
              content: (
                <>
                  <Text strong>{w.role}</Text>
                  <div>
                    <Text type="secondary">{w.place}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {w.from} → {w.to || 'nay'}
                  </Text>
                  {w.note && <Paragraph style={{ margin: '2px 0 0', fontSize: 12 }}>{w.note}</Paragraph>}
                </>
              ),
            }))}
          />
        ) : (
          <Text type="secondary">Chưa cập nhật</Text>
        )}
      </Col>
    </Row>
  )

  const expertise = (
    <Row gutter={[24, 16]}>
      <Col xs={24} md={12}>
        <Title level={5}>Loại ca được cấp phép & đơn giá</Title>
        {nurse.authorizedCareTypes.length ? (
          nurse.authorizedCareTypes.map((c) => {
            const price = getPricing(state, nurse.hospitalId, c)
            return (
              <Flex key={c} justify="space-between" className="cert-row">
                <Text>
                  <CheckCircleOutlined style={{ color: '#21845b' }} /> {careTypeLabel(c)}
                </Text>
                <Text strong>{price ? `${formatCurrency(price.price)}/${price.unit}` : '—'}</Text>
              </Flex>
            )
          })
        ) : (
          <Text type="secondary">Chưa được cấp phép ca nào.</Text>
        )}
        <Title level={5} style={{ marginTop: 18 }}>
          Khu vực phục vụ
        </Title>
        <Flex gap={6} wrap>
          {nurse.serviceAreas.map((a) => (
            <Tag key={a} icon={<EnvironmentOutlined />} color="cyan">
              {a}
            </Tag>
          ))}
        </Flex>
        <Title level={5} style={{ marginTop: 18 }}>
          Thiết bị mang theo
        </Title>
        <Flex gap={6} wrap>
          {detail.equipment.length ? detail.equipment.map((e) => <Tag key={e}>{e}</Tag>) : <Text type="secondary">Chưa cập nhật</Text>}
        </Flex>
      </Col>
      <Col xs={24} md={12}>
        <Title level={5}>Kỹ năng</Title>
        {detail.skills.map((s) => (
          <div key={s.name} className="skill-row">
            <Flex justify="space-between">
              <Text>{s.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {SKILL_LEVEL_LABEL[s.level]}
              </Text>
            </Flex>
            <Progress percent={s.level * 20} showInfo={false} size="small" strokeColor="#0b6b68" />
          </div>
        ))}
      </Col>
    </Row>
  )

  const availability = (
    <Table
      size="small"
      rowKey="id"
      pagination={false}
      locale={{ emptyText: 'Chưa có khung giờ rảnh' }}
      dataSource={[...nurse.availability].sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))}
      columns={[
        { title: 'Ngày', dataIndex: 'weekday', render: weekdayLabel },
        { title: 'Từ', dataIndex: 'start', width: 90 },
        { title: 'Đến', dataIndex: 'end', width: 90 },
        {
          title: 'Thời lượng',
          key: 'len',
          render: (_, a) => {
            const [sh, sm] = a.start.split(':').map(Number)
            const [eh, em] = a.end.split(':').map(Number)
            return `${(eh * 60 + em - sh * 60 - sm) / 60} giờ`
          },
        },
      ]}
      footer={() => <Text type="secondary">Tối đa {detail.maxSessionsPerWeek} ca/tuần · Lịch rảnh do bệnh viện phê duyệt trước khi đưa vào Nurse Matching.</Text>}
    />
  )

  const reviews = detail.reviews.length ? (
    <Flex vertical gap={12}>
      {detail.reviews.map((r) => {
        const patient = getPatient(state, r.patientId)
        return (
          <Card size="small" key={r.id}>
            <Flex justify="space-between" wrap gap={8}>
              <Text strong>{patient?.name}</Text>
              <Rate disabled value={r.rating} style={{ fontSize: 14 }} />
            </Flex>
            <Paragraph style={{ margin: '6px 0 2px' }}>“{r.comment}”</Paragraph>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDate(r.createdAt)}
              {r.bookingId ? ` · Liệu trình #${r.bookingId}` : ''}
            </Text>
          </Card>
        )
      })}
    </Flex>
  ) : (
    <Empty description="Chưa có đánh giá" />
  )

  return (
    <>
      <Card className="nurse-profile-hero">
        <Flex gap={18} align="center" wrap>
          <Avatar size={76} style={{ background: 'linear-gradient(145deg,#d5f2ed,#b2ddd7)', color: '#0a6461', fontWeight: 800, fontSize: 24 }}>
            {initials(nurse.name)}
          </Avatar>
          <div style={{ flex: '1 1 260px' }}>
            <Text type="secondary" style={{ letterSpacing: '.1em', fontSize: 12, fontWeight: 700 }}>
              HỒ SƠ NGHỀ NGHIỆP
            </Text>
            <Title level={3} style={{ margin: '2px 0' }}>
              {nurse.name}
            </Title>
            <Text type="secondary">
              {nurse.rank} · {detail.department} · {hospital?.name}
            </Text>
            <Flex gap={6} wrap style={{ marginTop: 8 }}>
              <Tag color={AUTH_COLOR[nurse.authStatus]} icon={<SafetyCertificateOutlined />}>
                {NURSE_AUTH_STATUS_LABEL[nurse.authStatus]?.label || nurse.authStatus}
              </Tag>
              {nurse.specialties.map((s) => (
                <Tag key={s}>{careTypeLabel(s)}</Tag>
              ))}
            </Flex>
          </div>
          <Flex vertical align="flex-end" gap={2}>
            <Flex align="center" gap={6}>
              <StarFilled style={{ color: '#f5a623', fontSize: 22 }} />
              <Text strong style={{ fontSize: 26 }}>
                {nurse.rating ?? '—'}
              </Text>
            </Flex>
            <Text type="secondary">{nurse.reviewCount} đánh giá</Text>
          </Flex>
        </Flex>
        {nurse.bio && <Paragraph style={{ margin: '16px 0 0' }}>{nurse.bio}</Paragraph>}
      </Card>

      <Row gutter={[16, 16]} style={{ margin: '16px 0' }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Ca đã hoàn thành" value={nurse.completedCases} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Ca trong tháng này" value={sessionStats.thisMonth} suffix={<Text type="secondary" style={{ fontSize: 13 }}>· {sessionStats.upcoming} sắp tới</Text>} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Phản hồi trung bình" value={detail.responseTimeMinutes ?? '—'} suffix={detail.responseTimeMinutes ? 'phút' : ''} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Flex justify="space-around" align="center">
              <Progress type="circle" size={58} percent={Math.round((detail.acceptanceRate ?? 0) * 100)} strokeColor="#0b6b68" />
              <Progress type="circle" size={58} percent={Math.round((detail.onTimeRate ?? 0) * 100)} strokeColor="#21845b" />
            </Flex>
            <Flex justify="space-around">
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tỉ lệ nhận ca
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> Đúng giờ
              </Text>
            </Flex>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            { key: 'personal', label: 'Thông tin cá nhân', children: personal },
            { key: 'license', label: 'Giấy phép & chứng chỉ', children: license },
            { key: 'experience', label: 'Học vấn & kinh nghiệm', children: experience },
            { key: 'expertise', label: 'Chuyên môn & kỹ năng', children: expertise },
            { key: 'availability', label: 'Lịch rảnh', children: availability },
            { key: 'reviews', label: `Đánh giá (${detail.reviews.length})`, children: reviews },
          ]}
        />
      </Card>
    </>
  )
}
