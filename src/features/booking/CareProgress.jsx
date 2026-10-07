import dayjs from 'dayjs'
import EmptyState from '../../components/EmptyState'
import { Icon } from '../../lib/icons'
import { TREND_META, VITAL_METRICS, inRange, trendOf } from './booking-shared'

const W = 220
const H = 54
const PAD = 6

// Small line chart of one measurement across visits.
function Sparkline({ values, color }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i) => (values.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (values.length - 1))
  const y = (v) => H - PAD - ((v - min) / span) * (H - PAD * 2)
  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === values.length - 1 ? 3.6 : 2.4} fill={i === values.length - 1 ? color : '#fff'} stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','))

// "Tiến triển": what the nurses measured visit by visit, with trends and their notes.
export default function CareProgress({ sessions }) {
  const recorded = sessions.filter((s) => s.observation)
  if (!recorded.length) {
    return (
      <section className="panel">
        <EmptyState icon={<Icon.chart />} title="Chưa có số liệu theo dõi" description="Sau mỗi buổi chăm sóc, điều dưỡng sẽ ghi lại chỉ số sinh hiệu và diễn biến tại đây." />
      </section>
    )
  }

  const metrics = VITAL_METRICS.map((m) => {
    const points = recorded.map((s) => ({ date: s.date, value: m.get(s.observation) })).filter((p) => typeof p.value === 'number')
    return { ...m, points }
  }).filter((m) => m.points.length > 0)

  const verdicts = metrics.filter((m) => m.points.length > 1).map((m) => trendOf(m, m.points.map((p) => p.value)))
  const better = verdicts.filter((v) => v === 'better').length
  const worse = verdicts.filter((v) => v === 'worse').length
  const overall = verdicts.length === 0 ? null : worse > better ? 'worse' : better > 0 ? 'better' : 'stable'
  const latest = recorded[recorded.length - 1]

  return (
    <>
      <section className="panel panel-body progress-verdict" style={{ marginBottom: 20 }}>
        <div>
          <h3 className="detail-heading" style={{ marginTop: 0 }}>
            Đánh giá chung
          </h3>
          {overall ? (
            <p className="progress-verdict-text">
              <span className="trend-pill" style={{ color: TREND_META[overall].color, background: TREND_META[overall].bg }}>
                {TREND_META[overall].label}
              </span>
              {overall === 'better' && ` ${better}/${verdicts.length} chỉ số theo dõi đang tiến triển tốt so với buổi đầu.`}
              {overall === 'stable' && ' Các chỉ số theo dõi đang giữ ổn định so với buổi đầu.'}
              {overall === 'worse' && ` ${worse} chỉ số cần được theo dõi thêm — hãy trao đổi với điều dưỡng ở buổi tới.`}
            </p>
          ) : (
            <p className="detail-text">Cần ít nhất 2 buổi có số liệu để so sánh tiến triển.</p>
          )}
        </div>
        <div className="progress-verdict-latest">
          <small>Ghi nhận gần nhất · {dayjs(latest.date).format('DD/MM/YYYY')}</small>
          <p>{latest.nurseNote || latest.observation.summary || 'Điều dưỡng chưa ghi chú diễn biến.'}</p>
        </div>
      </section>

      <div className="vital-grid">
        {metrics.map((m) => {
          const values = m.points.map((p) => p.value)
          const last = values[values.length - 1]
          const first = values[0]
          const verdict = trendOf(m, values)
          const delta = last - first
          return (
            <div className="vital-card" key={m.key}>
              <div className="vital-card-top">
                <span>{m.label}</span>
                {values.length > 1 && (
                  <span className="trend-pill" style={{ color: TREND_META[verdict].color, background: TREND_META[verdict].bg }}>
                    {TREND_META[verdict].label}
                  </span>
                )}
              </div>
              <div className="vital-card-value">
                <b>{m.key === 'systolic' ? latest.observation.vitals?.bp || fmt(last) : fmt(last)}</b>
                <small>{m.unit}</small>
              </div>
              <Sparkline values={values} color={TREND_META[verdict].color} />
              <div className="vital-card-foot">
                <span>
                  Buổi đầu {fmt(first)}
                  {values.length > 1 && ` · ${delta > 0 ? '+' : delta < 0 ? '−' : ''}${fmt(Math.abs(Math.round(delta * 10) / 10))}`}
                </span>
                <span style={{ color: inRange(m, last) ? '#21845b' : '#b96b08' }}>{m.normal ? (inRange(m, last) ? 'Trong ngưỡng' : 'Ngoài ngưỡng') : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <div>
            <h2>Diễn biến từng buổi</h2>
            <p>Ghi chú của điều dưỡng sau mỗi lần chăm sóc</p>
          </div>
        </div>
        <div className="observation-list">
          {[...recorded].reverse().map((s) => (
            <div className="observation" key={s.id}>
              <div className="observation-date">
                <b>{dayjs(s.date).format('DD/MM')}</b>
                <small>{dayjs(s.date).format('YYYY')}</small>
              </div>
              <div>
                <p className="observation-summary">{s.nurseNote || s.observation.summary || 'Điều dưỡng chưa ghi chú diễn biến.'}</p>
                <div className="observation-chips">
                  {s.observation.vitals?.bp && <span>HA {s.observation.vitals.bp}</span>}
                  {s.observation.vitals?.pulse && <span>Mạch {s.observation.vitals.pulse}</span>}
                  {s.observation.vitals?.temp && <span>{fmt(s.observation.vitals.temp)}°C</span>}
                  {s.observation.vitals?.spo2 && <span>SpO₂ {s.observation.vitals.spo2}%</span>}
                  {s.observation.vitals?.glucose && <span>Đường huyết {fmt(s.observation.vitals.glucose)}</span>}
                  {typeof s.observation.pain === 'number' && <span>Đau {s.observation.pain}/10</span>}
                  {(s.observation.extras || []).map((e) => (
                    <span key={e.label}>
                      {e.label}: {e.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
