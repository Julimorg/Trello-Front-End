import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Badge, Button, Card, Col, Empty, Flex, Row, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd'
import { BellOutlined, CheckCircleFilled, SendOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { useDb } from '../../lib/store'
import { getHospital, getNurse, getPatient, getSosNurse, opsNotify } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { CARE_REQUEST_STATUS, SESSION_STATUS } from '../../lib/constants'
import { DEFAULT_SETTINGS } from '../../Data/admin/settings-data'
import { SOS_STATUS_META } from '../hospitalAdmin/admin-shared'

const { Text } = Typography

// Minutes since an ISO time, as "18 phút" / "2 giờ 5 phút".
const ago = (iso, now) => {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))
  if (m < 60) return `${m} phút`
  if (m < 1440) return `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}`
  return `${Math.floor(m / 1440)} ngày`
}

// "Trung tâm vận hành": everything that is stuck or on fire right now, with a one-click nudge for each item.
export default function OperationsCenter() {
  const { message } = App.useApp()
  const state = useDb()
  const settings = { ...DEFAULT_SETTINGS, ...state.settings }
  const [now, setNow] = useState(() => Date.now())
  const [sent, setSent] = useState(() => new Set())
  const today = dayjs(now).format('YYYY-MM-DD')

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const queues = useMemo(() => {
    const sos = (state.sosEvents || [])
      .filter((e) => (e.status || 'open') !== 'resolved')
      .map((e) => {
        const nurse = getSosNurse(state, e)
        return { ...e, patient: getPatient(state, e.patientId), nurse, hospital: nurse ? getHospital(state, nurse.hospitalId) : null }
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const pending = state.careRequests
      .filter((c) => c.status === CARE_REQUEST_STATUS.NURSE_PENDING && c.selectedNurseId)
      .map((c) => {
        const askedAt = c.selectedAt || c.createdAt
        const waited = Math.round((now - new Date(askedAt).getTime()) / 60000)
        return { ...c, askedAt, waited, overdue: waited > settings.responseWindowMinutes, nurse: getNurse(state, c.selectedNurseId), patient: getPatient(state, c.patientId) }
      })
      .sort((a, b) => b.waited - a.waited)

    const noMatch = state.careRequests
      .filter((c) => c.status === CARE_REQUEST_STATUS.NO_MATCH)
      .map((c) => ({ ...c, patient: getPatient(state, c.patientId) }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const reassign = state.bookings
      .flatMap((b) => b.sessions.filter((s) => s.status === SESSION_STATUS.CANNOT_PERFORM).map((s) => ({ ...s, booking: b })))
      .map((s) => {
        const nurse = getNurse(state, s.nurseId)
        return { ...s, nurse, hospital: nurse ? getHospital(state, nurse.hospitalId) : null, patient: getPatient(state, s.booking.patientId), careRequest: state.careRequests.find((c) => c.id === s.booking.careRequestId) }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    const tickets = (state.tickets || []).filter((t) => t.status === 'open' || (t.status === 'in_progress' && !t.assignee)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const board = state.bookings
      .flatMap((b) => b.sessions.filter((s) => s.date === today).map((s) => ({ ...s, booking: b })))
      .map((s) => {
        const nurse = getNurse(state, s.nurseId)
        const startAt = dayjs(`${s.date}T${s.start}:00`).valueOf()
        const endAt = dayjs(`${s.date}T${s.end}:00`).valueOf()
        let phase = 'upcoming'
        if (s.status === SESSION_STATUS.COMPLETED) phase = 'done'
        else if (s.status === SESSION_STATUS.CANNOT_PERFORM) phase = 'issue'
        else if (now > endAt) phase = 'late'
        else if (now >= startAt) phase = 'running'
        return { ...s, nurse, startAt, phase, patient: getPatient(state, s.booking.patientId), careRequest: state.careRequests.find((c) => c.id === s.booking.careRequestId) }
      })
      .sort((a, b) => a.startAt - b.startAt)

    return { sos, pending, noMatch, reassign, tickets, board }
  }, [state, now, today, settings.responseWindowMinutes])

  const nudge = (key, args, successText) => {
    opsNotify(args)
    setSent((prev) => new Set(prev).add(key))
    message.success(successText)
  }
  const NudgeButton = ({ id, args, label, text }) =>
    sent.has(id) ? (
      <Tag color="green" icon={<CheckCircleFilled />}>
        Đã gửi
      </Tag>
    ) : (
      <Button size="small" type="primary" ghost icon={<SendOutlined />} onClick={() => nudge(id, args, text)}>
        {label}
      </Button>
    )

  const overduePending = queues.pending.filter((p) => p.overdue)
  const openSos = queues.sos.filter((e) => (e.status || 'open') === 'open')

  const columnsSos = [
    { title: 'Thời gian', key: 'at', width: 120, render: (_, e) => <Text type={dayjs(now).diff(e.createdAt, 'minute') >= settings.sosEscalationMinutes && (e.status || 'open') === 'open' ? 'danger' : undefined}>{ago(e.createdAt, now)} trước</Text> },
    { title: 'Bệnh nhân', key: 'patient', render: (_, e) => e.patient?.name || '—' },
    { title: 'Điều dưỡng / BV', key: 'nurse', render: (_, e) => <div>{e.nurse?.name || '—'}<div><Text type="secondary" style={{ fontSize: 12 }}>{e.hospital?.name}</Text></div></div> },
    { title: 'Ghi chú', dataIndex: 'note', ellipsis: true, render: (v) => v || <Text type="secondary">—</Text> },
    { title: 'Trạng thái', key: 'st', width: 120, render: (_, e) => <Tag color={SOS_STATUS_META[e.status || 'open'].color}>{SOS_STATUS_META[e.status || 'open'].label}</Tag> },
    {
      title: '',
      key: 'act',
      width: 150,
      render: (_, e) =>
        e.hospital ? (
          <NudgeButton
            id={`sos-${e.id}`}
            label="Báo bệnh viện"
            text={`Đã báo ${e.hospital.name}`}
            args={{ role: 'hospital', targetId: e.hospital.id, message: `SOS của ${e.patient?.name || 'bệnh nhân'} đã ${ago(e.createdAt, now)} chưa được xử lý — vui lòng liên hệ ngay.`, link: '/hospital/admin/sos-log', action: 'Nhắc xử lý SOS', targetType: 'sos', auditTargetId: e.id, targetName: e.patient?.name || 'SOS', detail: e.hospital.name }}
          />
        ) : null,
    },
  ]

  const columnsPending = [
    { title: 'Chờ', key: 'w', width: 130, render: (_, r) => <Tag color={r.overdue ? 'red' : 'gold'}>{ago(r.askedAt, now)}{r.overdue ? ' · quá hạn' : ''}</Tag> },
    { title: 'Yêu cầu', key: 'req', render: (_, r) => <div><Text strong>{careTypeLabel(r.careType)}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{r.patient?.name} · {r.district} · #{r.id}</Text></div></div> },
    { title: 'Điều dưỡng được hỏi', key: 'nurse', render: (_, r) => r.nurse?.name || '—' },
    {
      title: '',
      key: 'act',
      width: 150,
      render: (_, r) =>
        r.nurse ? (
          <NudgeButton
            id={`pend-${r.id}`}
            label="Nhắc điều dưỡng"
            text={`Đã nhắc ${r.nurse.name}`}
            args={{ role: 'nurse', targetId: r.nurse.id, message: `Yêu cầu ${careTypeLabel(r.careType)} của ${r.patient?.name} đang chờ bạn phản hồi (đã ${ago(r.askedAt, now)}).`, link: `/hospital/nurse/requests?id=${r.id}`, action: 'Nhắc điều dưỡng phản hồi', targetType: 'request', auditTargetId: r.id, targetName: `#${r.id}`, detail: r.nurse.name }}
          />
        ) : null,
    },
  ]

  const columnsNoMatch = [
    { title: 'Chờ', key: 'w', width: 120, render: (_, r) => <Tag color="orange">{ago(r.createdAt, now)}</Tag> },
    { title: 'Yêu cầu', key: 'req', render: (_, r) => <div><Text strong>{careTypeLabel(r.careType)}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{r.patient?.name} · {r.district} · #{r.id}</Text></div></div> },
    { title: 'Đã đề xuất', key: 'alt', width: 120, render: (_, r) => `${r.matchedNurseIds.length} điều dưỡng` },
    {
      title: '',
      key: 'act',
      width: 180,
      render: (_, r) => (
        <NudgeButton
          id={`nom-${r.id}`}
          label="Nhắc chọn thay thế"
          text={`Đã nhắc ${r.patient?.name}`}
          args={{ role: 'patient', targetId: r.patientId, message: `Yêu cầu ${careTypeLabel(r.careType)} của bạn đang chờ chọn điều dưỡng thay thế.`, link: `/patient/request/${r.id}`, action: 'Nhắc bệnh nhân chọn thay thế', targetType: 'request', auditTargetId: r.id, targetName: `#${r.id}`, detail: r.patient?.name }}
        />
      ),
    },
  ]

  const columnsReassign = [
    { title: 'Ngày', key: 'd', width: 130, render: (_, s) => <div>{dayjs(s.date).format('DD/MM/YYYY')}<div><Text type="secondary" style={{ fontSize: 12 }}>{s.start}–{s.end}</Text></div></div> },
    { title: 'Ca', key: 'c', render: (_, s) => <div><Text strong>{s.careRequest ? careTypeLabel(s.careRequest.careType) : 'Buổi chăm sóc'}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{s.patient?.name}</Text></div></div> },
    { title: 'Điều dưỡng báo không đi', key: 'n', render: (_, s) => <div>{s.nurse?.name}<div><Text type="secondary" style={{ fontSize: 12 }}>{s.history?.[s.history.length - 1]?.reason}</Text></div></div> },
    {
      title: '',
      key: 'act',
      width: 150,
      render: (_, s) =>
        s.hospital ? (
          <NudgeButton
            id={`re-${s.id}`}
            label="Nhắc bệnh viện"
            text={`Đã nhắc ${s.hospital.name}`}
            args={{ role: 'hospital', targetId: s.hospital.id, message: `Ca ${dayjs(s.date).format('DD/MM')} ${s.start} của ${s.patient?.name} cần điều dưỡng thay thế.`, link: '/hospital/admin/schedule', action: 'Nhắc điều phối ca thay thế', targetType: 'request', auditTargetId: s.booking.careRequestId, targetName: `#${s.booking.careRequestId}`, detail: s.hospital.name }}
          />
        ) : null,
    },
  ]

  const columnsTickets = [
    { title: 'Yêu cầu hỗ trợ', key: 's', render: (_, t) => <div><Link to={`/admin/support?ticket=${t.id}`}><Text strong>{t.subject}</Text></Link><div><Text type="secondary" style={{ fontSize: 12 }}>{t.requesterName} · {t.category}</Text></div></div> },
    { title: 'Chờ', key: 'w', width: 110, render: (_, t) => <Tag color={t.priority === 'urgent' || t.priority === 'high' ? 'red' : 'default'}>{ago(t.createdAt, now)}</Tag> },
    { title: '', key: 'a', width: 110, render: (_, t) => <Link to={`/admin/support?ticket=${t.id}`}><Button size="small">Xử lý</Button></Link> },
  ]

  const tableProps = { rowKey: 'id', size: 'middle', pagination: false, scroll: { x: 640 } }
  const tabLabel = (text, count, danger) => (
    <span>
      {text} <Badge count={count} showZero={false} color={danger ? '#cf3c43' : '#b96b08'} size="small" />
    </span>
  )

  const phaseMeta = {
    done: { label: 'Hoàn tất', color: 'default' },
    running: { label: 'Đang chăm sóc', color: 'green' },
    upcoming: { label: 'Sắp tới', color: 'blue' },
    late: { label: 'Quá giờ, chưa hoàn tất', color: 'red' },
    issue: { label: 'Cần thay điều dưỡng', color: 'volcano' },
  }

  return (
    <>
      <PageHead eyebrow="Operations" title="Trung tâm vận hành" description="Mọi việc đang chờ can thiệp: SOS, yêu cầu quá hạn phản hồi, ca cần thay người và hỗ trợ khách hàng. Tự cập nhật theo thời gian thực." />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          ['SOS chưa xử lý', openSos.length, openSos.length ? '#cf3c43' : undefined],
          [`Quá ${settings.responseWindowMinutes} phút chưa phản hồi`, overduePending.length, overduePending.length ? '#cf3c43' : undefined],
          ['Chờ chọn thay thế', queues.noMatch.length, queues.noMatch.length ? '#b96b08' : undefined],
          ['Ca cần thay điều dưỡng', queues.reassign.length, queues.reassign.length ? '#b96b08' : undefined],
          ['Hỗ trợ mới', queues.tickets.length, queues.tickets.length ? '#b96b08' : undefined],
        ].map(([title, value, color]) => (
          <Col xs={12} md={8} xl={{ flex: '20%' }} key={title}>
            <Card size="small">
              <Statistic title={title} value={value} styles={{ content: { color } }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card styles={{ body: { padding: '0 0 8px' } }}>
            <Tabs
              style={{ padding: '0 16px' }}
              items={[
                { key: 'sos', label: tabLabel('SOS', queues.sos.length, true), children: <Table {...tableProps} columns={columnsSos} dataSource={queues.sos} locale={{ emptyText: <Empty description="Không có SOS nào đang mở" /> }} scroll={{ x: 820 }} /> },
                { key: 'pending', label: tabLabel('Chờ phản hồi', queues.pending.length, overduePending.length > 0), children: <Table {...tableProps} columns={columnsPending} dataSource={queues.pending} locale={{ emptyText: <Empty description="Không có yêu cầu nào đang chờ điều dưỡng" /> }} /> },
                { key: 'nomatch', label: tabLabel('Chưa có điều dưỡng', queues.noMatch.length), children: <Table {...tableProps} columns={columnsNoMatch} dataSource={queues.noMatch} locale={{ emptyText: <Empty description="Không có yêu cầu nào chờ chọn thay thế" /> }} /> },
                { key: 'reassign', label: tabLabel('Cần thay người', queues.reassign.length), children: <Table {...tableProps} columns={columnsReassign} dataSource={queues.reassign} locale={{ emptyText: <Empty description="Không có ca nào cần thay điều dưỡng" /> }} /> },
                { key: 'tickets', label: tabLabel('Hỗ trợ', queues.tickets.length), children: <Table {...tableProps} columns={columnsTickets} dataSource={queues.tickets} locale={{ emptyText: <Empty description="Không có yêu cầu hỗ trợ mới" /> }} /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title={<Space><BellOutlined /> Ca hôm nay <Tag>{queues.board.length}</Tag></Space>}>
            {queues.board.length === 0 ? (
              <Empty description="Hôm nay không có ca chăm sóc" />
            ) : (
              <div className="board-list">
                {queues.board.map((s) => (
                  <div className="board-item" key={s.id}>
                    <div className="board-time">
                      <b>{s.start}</b>
                      <small>{s.end}</small>
                    </div>
                    <div className="board-main">
                      <Text strong>{s.careRequest ? careTypeLabel(s.careRequest.careType) : 'Buổi chăm sóc'}</Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {s.patient?.name} · {s.nurse?.name}
                        </Text>
                      </div>
                    </div>
                    <Tag color={phaseMeta[s.phase].color}>{phaseMeta[s.phase].label}</Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
      <Flex style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Ngưỡng cảnh báo lấy từ Cấu hình hệ thống (phản hồi {settings.responseWindowMinutes} phút, SOS {settings.sosEscalationMinutes} phút). Mỗi lần nhắc được gửi thông báo cho người nhận và ghi vào Nhật ký hoạt động.
        </Text>
      </Flex>
    </>
  )
}
