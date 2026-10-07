import { useState } from 'react'
import { App, Button, Card, Col, Descriptions, Input, InputNumber, Row, Slider, Space, Typography } from 'antd'
import { updateSessionWork } from '../../lib/db'

const { Text } = Typography

const EMPTY = { bp: '', pulse: null, temp: null, spo2: null, glucose: null, pain: null }

const fromObservation = (o) => ({
  bp: o?.vitals?.bp || '',
  pulse: o?.vitals?.pulse ?? null,
  temp: o?.vitals?.temp ?? null,
  spo2: o?.vitals?.spo2 ?? null,
  glucose: o?.vitals?.glucose ?? null,
  pain: o?.pain ?? null,
})

// Vital signs and pain recorded during a visit. The patient sees these on their "Tiến triển" tab.
export default function ObservationCard({ booking, session, editable }) {
  const { message } = App.useApp()
  const [draft, setDraft] = useState(() => ({ ...EMPTY, ...fromObservation(session.observation) }))
  const bpOk = !draft.bp || /^\d{2,3}\/\d{2,3}$/.test(draft.bp.trim())
  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }))

  const save = () => {
    const vitals = {}
    if (draft.bp.trim()) vitals.bp = draft.bp.trim()
    ;['pulse', 'temp', 'spo2', 'glucose'].forEach((k) => {
      if (draft[k] !== null && draft[k] !== undefined) vitals[k] = draft[k]
    })
    const observation = {
      ...(session.observation || {}),
      summary: session.nurseNote || session.observation?.summary || '',
      ...(Object.keys(vitals).length ? { vitals } : {}),
      ...(draft.pain !== null ? { pain: draft.pain } : {}),
    }
    updateSessionWork(booking.id, session.id, { observation })
    message.success('Đã lưu chỉ số — bệnh nhân sẽ thấy trong mục Tiến triển')
  }

  if (!editable) {
    const o = session.observation
    const v = o?.vitals || {}
    return (
      <Card title="Chỉ số & theo dõi" style={{ marginTop: 16 }}>
        {o ? (
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 2 }}
            items={[
              { key: 'bp', label: 'Huyết áp', children: v.bp ? `${v.bp} mmHg` : '—' },
              { key: 'pulse', label: 'Mạch', children: v.pulse ? `${v.pulse} lần/phút` : '—' },
              { key: 'temp', label: 'Nhiệt độ', children: v.temp ? `${v.temp} °C` : '—' },
              { key: 'spo2', label: 'SpO₂', children: v.spo2 ? `${v.spo2}%` : '—' },
              { key: 'glucose', label: 'Đường huyết', children: v.glucose ? `${v.glucose} mmol/L` : '—' },
              { key: 'pain', label: 'Mức đau', children: typeof o.pain === 'number' ? `${o.pain}/10` : '—' },
            ]}
          />
        ) : (
          <Text type="secondary">Không có chỉ số được ghi nhận cho buổi này.</Text>
        )}
      </Card>
    )
  }

  return (
    <Card title="Chỉ số & theo dõi" extra={<Text type="secondary">Hiển thị cho bệnh nhân</Text>} style={{ marginTop: 16 }}>
      <Row gutter={[12, 12]}>
        <Col xs={12} md={8}>
          <Text type="secondary">Huyết áp (mmHg)</Text>
          <Input placeholder="120/80" value={draft.bp} status={bpOk ? undefined : 'error'} onChange={(e) => set('bp')(e.target.value)} />
        </Col>
        <Col xs={12} md={8}>
          <Text type="secondary">Mạch (lần/phút)</Text>
          <InputNumber min={20} max={220} style={{ width: '100%' }} value={draft.pulse} onChange={set('pulse')} />
        </Col>
        <Col xs={12} md={8}>
          <Text type="secondary">Nhiệt độ (°C)</Text>
          <InputNumber min={34} max={42} step={0.1} style={{ width: '100%' }} value={draft.temp} onChange={set('temp')} />
        </Col>
        <Col xs={12} md={8}>
          <Text type="secondary">SpO₂ (%)</Text>
          <InputNumber min={50} max={100} style={{ width: '100%' }} value={draft.spo2} onChange={set('spo2')} />
        </Col>
        <Col xs={12} md={8}>
          <Text type="secondary">Đường huyết (mmol/L)</Text>
          <InputNumber min={1} max={40} step={0.1} style={{ width: '100%' }} value={draft.glucose} onChange={set('glucose')} />
        </Col>
        <Col xs={24} md={8}>
          <Text type="secondary">Mức đau: {draft.pain === null ? 'chưa ghi' : `${draft.pain}/10`}</Text>
          <Slider min={0} max={10} value={draft.pain ?? 0} onChange={set('pain')} />
        </Col>
      </Row>
      <Space style={{ marginTop: 8 }}>
        <Button type="primary" disabled={!bpOk} onClick={save}>
          Lưu chỉ số
        </Button>
        {!bpOk && <Text type="danger">Huyết áp theo dạng 120/80</Text>}
      </Space>
    </Card>
  )
}
