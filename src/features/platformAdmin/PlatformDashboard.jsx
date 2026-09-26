import { useMemo } from 'react'
import dayjs from 'dayjs'
import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useDb } from '../../lib/store'
import { computeNorthStarMetrics } from '../../lib/db'
import { CARE_REQUEST_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function PlatformDashboard() {
  const state = useDb()
  const metrics = computeNorthStarMetrics(state)

  const chart = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => dayjs().subtract(6 - i, 'day'))
    const counts = days.map((d) => {
      const iso = d.format('YYYY-MM-DD')
      const requests = state.careRequests.filter((r) => r.createdAt.slice(0, 10) === iso).length
      return { label: WEEKDAY_SHORT[d.day()], value: requests }
    })
    const max = Math.max(1, ...counts.map((c) => c.value))
    return { counts, max }
  }, [state.careRequests])

  const nonCancelled = state.careRequests.filter((r) => r.status !== CARE_REQUEST_STATUS.CANCELLED)
  const successRate = nonCancelled.length ? Math.round((metrics.completed / nonCancelled.length) * 100) : 0

  const flaggedHospitals = state.hospitals.filter((h) => {
    const nurses = state.nurses.filter((n) => n.hospitalId === h.id)
    return nurses.length > 0 && nurses.filter((n) => n.authStatus === 'authorized').length / nurses.length < 0.5
  })
  const expiringCertCount = state.nurses.reduce((sum, n) => sum + n.certificates.length, 0) > 0 ? Math.max(0, state.nurses.length - metrics.authorizedNurseCount) : 0

  return (
    <>
      <PageHead
        eyebrow="CareShift Operations"
        title="Sức khỏe nền tảng"
        description="Giám sát cung–cầu, đối tác và các tín hiệu cần can thiệp."
        action={<StatusBadge label="Hệ thống ổn định" tone="success" />}
      />

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-top">
            <span>Bệnh viện đối tác</span>
            <span className="metric-icon">
              <Icon.building />
            </span>
          </div>
          <strong>{String(metrics.activeHospitals).padStart(2, '0')}</strong>
          <small>Mục tiêu Phase 1: 1 bệnh viện ký chính thức</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Điều dưỡng đã duyệt</span>
            <span className="metric-icon blue">
              <Icon.users />
            </span>
          </div>
          <strong>{String(metrics.authorizedNurseCount).padStart(2, '0')}</strong>
          <small>Mục tiêu Phase 1: 30–50 điều dưỡng</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Yêu cầu chăm sóc</span>
            <span className="metric-icon amber">
              <Icon.file />
            </span>
          </div>
          <strong>{metrics.totalRequests}</strong>
          <small>Mục tiêu Phase 1: ≥ 300 yêu cầu</small>
        </div>
        <div className="metric">
          <div className="metric-top">
            <span>Tỷ lệ hoàn thành (North Star)</span>
            <span className="metric-icon red">
              <Icon.chart />
            </span>
          </div>
          <strong>{Math.round(metrics.completionRate * 100)}%</strong>
          <small>Mục tiêu Phase 1: ≥ 40%</small>
        </div>
      </div>

      <div className="platform-health">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Yêu cầu chăm sóc</h2>
              <p>7 ngày gần nhất</p>
            </div>
            <StatusBadge label="Theo ngày" tone="info" />
          </div>
          <div className="health-chart">
            <div className="bars">
              {chart.counts.map((c, i) => (
                <div className="bar" key={i} style={{ height: `${Math.max(6, (c.value / chart.max) * 100)}%` }} data-value={`${c.value} yêu cầu`} />
              ))}
            </div>
            <div className="bar-labels">
              {chart.counts.map((c, i) => (
                <span key={i}>{c.label}</span>
              ))}
            </div>
          </div>
        </section>
        <section className="panel health-score">
          <div className="score-ring" style={{ background: `conic-gradient(var(--teal) 0 ${successRate}%, #e3ecec ${successRate}%)` }}>
            <strong>{successRate}%</strong>
          </div>
          <h3>Tỷ lệ hoàn thành yêu cầu</h3>
          <p>{metrics.completed} / {nonCancelled.length} yêu cầu đã hoàn tất</p>
        </section>
      </div>

      <h2 className="section-title">Cảnh báo vận hành</h2>
      <section className="panel">
        <div className="attention-list">
          {flaggedHospitals.length > 0 ? (
            flaggedHospitals.map((h) => (
              <div className="attention-item" key={h.id}>
                <span className="attention-icon red">
                  <Icon.bell />
                </span>
                <span>
                  <b>{h.name}: dưới 50% điều dưỡng được cấp phép</b>
                  <small>Cần rà soát hồ sơ xác minh</small>
                </span>
                <StatusBadge label="Cần xử lý" tone="danger" />
              </div>
            ))
          ) : (
            <div className="attention-item">
              <span className="attention-icon">
                <Icon.check />
              </span>
              <span>
                <b>Không có bệnh viện nào cần rà soát</b>
                <small>Tỷ lệ cấp phép ổn định trên toàn hệ thống</small>
              </span>
            </div>
          )}
          <div className="attention-item">
            <span className="attention-icon">
              <Icon.shield />
            </span>
            <span>
              <b>{expiringCertCount} điều dưỡng chưa được cấp phép</b>
              <small>Cần xác minh chứng chỉ hành nghề</small>
            </span>
            <StatusBadge label="Theo dõi" tone="pending" />
          </div>
        </div>
      </section>
    </>
  )
}
