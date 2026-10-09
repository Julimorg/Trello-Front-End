import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Button, Card, Col, Empty, Flex, Progress, Row, Segmented, Space, Statistic, Table, Tag, Tooltip, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { careTypeLabel } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { CARE_REQUEST_STATUS, CARE_TYPES, DISTRICTS, NURSE_AUTH_STATUS, SESSION_STATUS } from '../../lib/constants'
import { compareText } from '../hospitalAdmin/admin-shared'

const { Text } = Typography
const RANGES = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
  { value: 0, label: 'Tất cả' },
]

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const median = (list) => {
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const minutesText = (m) => {
  if (m === null) return '—'
  if (m < 60) return `${Math.round(m)} phút`
  if (m < 1440) return `${(m / 60).toFixed(1).replace('.0', '')} giờ`
  return `${(m / 1440).toFixed(1).replace('.0', '')} ngày`
}

// "Phân tích & chỉ số": is the product validating? Goals, funnel, supply vs demand, demand mix.
export default function Analytics() {
  const state = useDb()
  const [range, setRange] = useState(30)

  const data = useMemo(() => {
    const since = range ? dayjs().subtract(range, 'day').startOf('day') : null
    const requests = state.careRequests.filter((c) => !since || dayjs(c.createdAt).isAfter(since))
    const nonCancelled = requests.filter((c) => c.status !== CARE_REQUEST_STATUS.CANCELLED)
    const accepted = requests.filter((c) => c.status === CARE_REQUEST_STATUS.COMPLETED)
    const declines = requests.reduce((sum, c) => sum + (c.declinedNurseIds?.length || 0), 0)
    const noMatch = requests.filter((c) => c.status === CARE_REQUEST_STATUS.NO_MATCH).length

    // Minutes between asking a nurse and the booking being confirmed.
    const accepts = accepted
      .map((c) => {
        const booking = state.bookings.find((b) => b.id === c.bookingId)
        return booking ? (new Date(booking.createdAt) - new Date(c.selectedAt || c.createdAt)) / 60000 : null
      })
      .filter((m) => m !== null && m >= 0)

    const funnel = [
      { key: 'created', label: 'Yêu cầu được tạo', count: requests.length },
      { key: 'matched', label: 'Có điều dưỡng phù hợp', count: requests.filter((c) => c.matchedNurseIds.length > 0 || c.selectedNurseId).length },
      { key: 'selected', label: 'Bệnh nhân đã chọn điều dưỡng', count: requests.filter((c) => c.selectedNurseId).length },
      { key: 'accepted', label: 'Điều dưỡng chấp nhận', count: accepted.length },
      {
        key: 'done',
        label: 'Có buổi chăm sóc hoàn thành',
        count: accepted.filter((c) => state.bookings.find((b) => b.id === c.bookingId)?.sessions.some((s) => s.status === SESSION_STATUS.COMPLETED || s.status === SESSION_STATUS.REASSIGNED)).length,
      },
    ]

    const authorized = state.nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && (n.accountStatus || 'active') === 'active')
    const districts = [...new Set([...DISTRICTS, ...requests.map((c) => c.district)])].map((d) => {
      const demand = requests.filter((c) => c.district === d).length
      const supply = authorized.filter((n) => n.serviceAreas.includes(d)).length
      return { district: d, demand, supply, ratio: supply ? demand / supply : demand ? Infinity : 0 }
    })

    const careMix = CARE_TYPES.map((t) => ({ ...t, count: requests.filter((c) => c.careType === t.id).length })).sort((a, b) => b.count - a.count)

    const reasons = {}
    requests.forEach((c) => (c.declineReasons || []).forEach((r) => (reasons[r.reason] = (reasons[r.reason] || 0) + 1)))
    const declineReasons = Object.entries(reasons).sort((a, b) => b[1] - a[1])

    const monthStart = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const sessionsByNurse = {}
    state.bookings.forEach((b) => b.sessions.forEach((s) => s.date >= monthStart && s.status !== SESSION_STATUS.CANNOT_PERFORM && (sessionsByNurse[s.nurseId] = (sessionsByNurse[s.nurseId] || 0) + 1)))
    const utilization = authorized.map((n) => ({ ...n, sessions: sessionsByNurse[n.id] || 0 })).sort((a, b) => b.sessions - a.sessions)

    const days = Array.from({ length: 14 }).map((_, i) => dayjs().subtract(13 - i, 'day'))
    const trend = days.map((d) => {
      const iso = d.format('YYYY-MM-DD')
      return { label: d.format('DD/MM'), created: state.careRequests.filter((c) => c.createdAt.slice(0, 10) === iso).length, sessions: state.bookings.flatMap((b) => b.sessions).filter((s) => s.date === iso && s.status === SESSION_STATUS.COMPLETED).length }
    })

    return {
      requests,
      nonCancelled,
      accepted,
      declines,
      noMatch,
      acceptRate: pct(accepted.length, accepted.length + declines),
      completionRate: pct(accepted.length, nonCancelled.length),
      medianAccept: median(accepts),
      funnel,
      districts,
      careMix,
      declineReasons,
      utilization,
      authorized,
      trend,
    }
  }, [state, range])

  // Phase 1 "validate" targets, measured over the whole platform (not the selected range).
  const allNonCancelled = state.careRequests.filter((c) => c.status !== CARE_REQUEST_STATUS.CANCELLED)
  const allCompleted = state.careRequests.filter((c) => c.status === CARE_REQUEST_STATUS.COMPLETED)
  const goals = [
    { key: 'hosp', title: 'Bệnh viện đối tác đang hoạt động', value: state.hospitals.filter((h) => h.status === 'active').length, target: 1, unit: '' },
    { key: 'nurse', title: 'Điều dưỡng được cấp phép', value: state.nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED).length, target: 30, unit: '' },
    { key: 'req', title: 'Yêu cầu chăm sóc', value: state.careRequests.length, target: 300, unit: '' },
    { key: 'rate', title: 'Tỷ lệ hoàn thành (North Star)', value: pct(allCompleted.length, allNonCancelled.length), target: 40, unit: '%' },
  ]

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.created), ...data.trend.map((t) => t.sessions))
  const maxCare = Math.max(1, ...data.careMix.map((c) => c.count))

  const exportKpis = () =>
    downloadCsv(
      `careshift-chi-so-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Chỉ số', value: (r) => r[0] },
        { title: 'Giá trị', value: (r) => r[1] },
      ],
      [
        ['Khoảng thời gian', RANGES.find((r) => r.value === range).label],
        ['Yêu cầu được tạo', data.requests.length],
        ['Điều dưỡng chấp nhận', data.accepted.length],
        ['Tỷ lệ chấp nhận (%)', data.acceptRate],
        ['Tỷ lệ hoàn thành (%)', data.completionRate],
        ['Thời gian chấp nhận trung vị', minutesText(data.medianAccept)],
        ['Chờ chọn thay thế', data.noMatch],
        ...data.funnel.map((f) => [`Phễu: ${f.label}`, f.count]),
        ...data.districts.map((d) => [`Khu vực ${d.district}: cầu / cung`, `${d.demand} yêu cầu / ${d.supply} điều dưỡng`]),
      ],
    )

  return (
    <>
      <PageHead
        eyebrow="Analytics"
        title="Phân tích & chỉ số"
        description="Sản phẩm đã chứng minh được nhu cầu chưa? Theo dõi mục tiêu giai đoạn 1, phễu chuyển đổi và cân bằng cung – cầu theo khu vực."
        action={
          <Space wrap>
            <Segmented options={RANGES} value={range} onChange={setRange} />
            <Button icon={<DownloadOutlined />} onClick={exportKpis}>
              Xuất CSV
            </Button>
          </Space>
        }
      />

      <Card title="Mục tiêu giai đoạn 1 (Validate)" style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]}>
          {goals.map((g) => {
            const percent = Math.min(100, pct(g.value, g.target))
            return (
              <Col xs={24} sm={12} xl={6} key={g.key}>
                <Text type="secondary">{g.title}</Text>
                <Flex align="baseline" gap={6}>
                  <Text style={{ fontSize: 26, fontWeight: 700 }}>
                    {g.value}
                    {g.unit}
                  </Text>
                  <Text type="secondary">
                    / mục tiêu {g.target}
                    {g.unit}
                  </Text>
                </Flex>
                <Progress percent={percent} size="small" strokeColor={percent >= 100 ? '#21845b' : '#0b6b68'} />
              </Col>
            )
          })}
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          ['Yêu cầu mới', data.requests.length, ''],
          ['Tỷ lệ điều dưỡng chấp nhận', data.acceptRate, '%'],
          ['Tỷ lệ hoàn thành', data.completionRate, '%'],
          ['Thời gian chấp nhận (trung vị)', minutesText(data.medianAccept), ''],
          ['Đang chờ chọn thay thế', data.noMatch, ''],
        ].map(([title, value, suffix]) => (
          <Col xs={12} md={8} xl={{ flex: '20%' }} key={title}>
            <Card size="small">
              <Statistic title={title} value={value} suffix={suffix} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Phễu chuyển đổi">
            {data.funnel.map((f, i) => {
              const prev = i ? data.funnel[i - 1].count : f.count
              return (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <Flex justify="space-between">
                    <Text>{f.label}</Text>
                    <Text strong>
                      {f.count}
                      {i > 0 && (
                        <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>
                          {' '}
                          · {pct(f.count, prev)}% bước trước
                        </Text>
                      )}
                    </Text>
                  </Flex>
                  <Progress percent={pct(f.count, data.funnel[0].count)} showInfo={false} strokeColor={['#0b6b68', '#1c8a85', '#2b69c9', '#21845b', '#6646bd'][i]} />
                </div>
              )
            })}
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bước nào tụt mạnh nhất chính là nơi nên sửa trước.
            </Text>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Yêu cầu tạo & buổi hoàn thành · 14 ngày">
            <div className="health-chart" style={{ padding: 0 }}>
              <div className="bars" style={{ height: 150, gap: 6 }}>
                {data.trend.map((t) => (
                  <Tooltip key={t.label} title={`${t.label}: ${t.created} yêu cầu mới · ${t.sessions} buổi hoàn thành`}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%' }}>
                      <div className="bar" style={{ height: `${Math.max(4, (t.created / maxTrend) * 100)}%` }} />
                      <div className="bar" style={{ height: `${Math.max(4, (t.sessions / maxTrend) * 100)}%`, background: 'linear-gradient(to top,#2b69c9,#7fa6e6)' }} />
                    </div>
                  </Tooltip>
                ))}
              </div>
              <div className="bar-labels" style={{ gap: 6 }}>
                {data.trend.map((t) => (
                  <span key={t.label}>{t.label.slice(0, 2)}</span>
                ))}
              </div>
            </div>
            <Space size={16} style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <i className="legend-dot" style={{ background: '#0b6b68' }} /> Yêu cầu mới
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <i className="legend-dot" style={{ background: '#2b69c9' }} /> Buổi hoàn thành
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Cung – cầu theo khu vực" styles={{ body: { padding: 0 } }}>
            <Table
              rowKey="district"
              size="middle"
              pagination={false}
              scroll={{ x: 560 }}
              dataSource={data.districts}
              columns={[
                { title: 'Khu vực', dataIndex: 'district', sorter: (a, b) => compareText(a.district, b.district), render: (v) => <Text strong>{v}</Text> },
                { title: 'Yêu cầu', dataIndex: 'demand', sorter: (a, b) => a.demand - b.demand, defaultSortOrder: 'descend' },
                { title: 'Điều dưỡng sẵn sàng', dataIndex: 'supply', sorter: (a, b) => a.supply - b.supply },
                {
                  title: 'Đánh giá',
                  key: 'st',
                  render: (_, r) =>
                    r.demand === 0 && r.supply === 0 ? (
                      <Tag>Chưa có hoạt động</Tag>
                    ) : r.supply === 0 ? (
                      <Tag color="red">Thiếu nhân lực</Tag>
                    ) : r.ratio > 4 ? (
                      <Tag color="orange">Quá tải ({r.ratio.toFixed(1)} yêu cầu/điều dưỡng)</Tag>
                    ) : r.demand === 0 ? (
                      <Tag color="blue">Dư nhân lực</Tag>
                    ) : (
                      <Tag color="green">Cân bằng</Tag>
                    ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Nhu cầu theo loại chăm sóc">
            {data.careMix.every((c) => c.count === 0) ? (
              <Empty description="Chưa có yêu cầu trong khoảng này" />
            ) : (
              data.careMix.map((c) => (
                <div key={c.id} style={{ marginBottom: 10 }}>
                  <Flex justify="space-between">
                    <Text>{careTypeLabel(c.id)}</Text>
                    <Text strong>{c.count}</Text>
                  </Flex>
                  <Progress percent={pct(c.count, maxCare)} showInfo={false} size="small" strokeColor="#0b6b68" />
                </div>
              ))
            )}
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title={`Lý do điều dưỡng từ chối (${data.declines})`}>
            {data.declineReasons.length === 0 ? (
              <Empty description="Chưa có lượt từ chối nào" />
            ) : (
              data.declineReasons.map(([reason, count]) => (
                <Flex key={reason} justify="space-between" style={{ padding: '6px 0', borderBottom: '1px solid #edf2f2' }}>
                  <Text>{reason}</Text>
                  <Tag>{count}</Tag>
                </Flex>
              ))
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Điều dưỡng: số buổi trong 30 ngày">
            {data.utilization.slice(0, 8).map((n) => (
              <div key={n.id} style={{ marginBottom: 8 }}>
                <Flex justify="space-between">
                  <Text>{n.name}</Text>
                  <Text strong>{n.sessions} buổi</Text>
                </Flex>
                <Progress percent={pct(n.sessions, Math.max(1, data.utilization[0]?.sessions || 1))} showInfo={false} size="small" strokeColor={n.sessions === 0 ? '#cf3c43' : '#2b69c9'} />
              </div>
            ))}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.utilization.filter((n) => n.sessions === 0).length} điều dưỡng được cấp phép nhưng chưa có buổi nào — cần kích hoạt hoặc kiểm tra lịch rảnh.
            </Text>
          </Card>
        </Col>
      </Row>
    </>
  )
}
