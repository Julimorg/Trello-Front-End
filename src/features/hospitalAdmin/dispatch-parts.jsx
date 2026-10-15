import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { App, Alert, Avatar, Button, Card, Drawer, Empty, Flex, Select, Space, Table, Tag, Typography } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, manualReassignSession } from '../../lib/db'
import { careTypeLabel, formatDate } from '../../lib/format'
import { initials } from './admin-shared'
import { ISO, REQUEST_PATH, SHIFT_PATH, SESSION_META, WEEKDAY, WEEKDAY_LONG, hoursText, loadLevel, minutesOf } from './dispatch-utils'

const { Text } = Typography
// ---------- Load calendar ----------

// One row per nurse, one column per day. Each cell is only a count + hours (colour = workload); the shifts
// themselves open in a drawer, so a busy week stays readable and cheap to render.
export function LoadCalendar({ nurses, shifts, weekStart, onOpenCell, onOpenDay }) {
  const today = dayjs().format(ISO)
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart])

  const { cells, dayTotals, nurseTotals } = useMemo(() => {
    const cells = new Map()
    const dayTotals = new Map()
    const nurseTotals = new Map()
    shifts.forEach((s) => {
      const key = `${s.nurseId}|${s.date}`
      const cell = cells.get(key) || { count: 0, minutes: 0, issue: 0, reassigned: 0 }
      cell.count += 1
      cell.minutes += minutesOf(s)
      if (s.status === 'cannot_perform') cell.issue += 1
      if (s.status === 'reassigned') cell.reassigned += 1
      cells.set(key, cell)
      dayTotals.set(s.date, (dayTotals.get(s.date) || 0) + 1)
      const n = nurseTotals.get(s.nurseId) || { count: 0, minutes: 0 }
      nurseTotals.set(s.nurseId, { count: n.count + 1, minutes: n.minutes + minutesOf(s) })
    })
    return { cells, dayTotals, nurseTotals }
  }, [shifts])

  const columns = [
    {
      title: 'Điều dưỡng',
      key: 'nurse',
      width: 200,
      fixed: 'left',
      sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
      render: (_, n) => (
        <Flex gap={8} align="center">
          <Avatar size={30} style={{ background: '#e7f5f2', color: '#0b6b68', fontWeight: 800, flex: '0 0 auto' }}>
            {initials(n.name)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Link to={`/hospital/admin/roster/${n.id}`}>
              <Text strong>{n.name}</Text>
            </Link>
          </div>
        </Flex>
      ),
    },
    ...days.map((d) => {
      const iso = d.format(ISO)
      return {
        title: (
          <button
            type="button"
            className={`dispatch-day${iso === today ? ' is-today' : ''}`}
            onClick={() => onOpenDay(iso)}
            title={`Xem tất cả ca ${WEEKDAY_LONG[d.day()]} ${d.format('DD/MM')}`}
          >
            <b>{WEEKDAY[d.day()]}</b>
            <span>{d.format('DD/MM')}</span>
            <em>{dayTotals.get(iso) || 0} ca</em>
          </button>
        ),
        key: iso,
        width: 92,
        align: 'center',
        onCell: () => ({ className: iso === today ? 'dispatch-today-col' : undefined }),
        render: (_, n) => {
          const cell = cells.get(`${n.id}|${iso}`)
          if (!cell) return <span className="dispatch-empty">·</span>
          return (
            <button
              type="button"
              className={`load-cell level-${loadLevel(cell.minutes)}${cell.issue ? ' has-issue' : ''}`}
              onClick={() => onOpenCell(n.id, iso)}
              aria-label={`${n.name}, ${WEEKDAY_LONG[d.day()]} ${d.format('DD/MM')}: ${cell.count} ca`}
            >
              <b>{cell.count} ca</b>
              <span>{hoursText(cell.minutes)}</span>
              {cell.issue > 0 && <i className="load-flag" title="Có ca cần người thay" />}
            </button>
          )
        },
      }
    }),
    {
      title: 'Cả tuần',
      key: 'total',
      width: 96,
      align: 'right',
      fixed: 'right',
      sorter: (a, b) => (nurseTotals.get(a.id)?.minutes || 0) - (nurseTotals.get(b.id)?.minutes || 0),
      render: (_, n) => {
        const t = nurseTotals.get(n.id)
        return t ? (
          <div className="dispatch-total">
            <b>{t.count} ca</b>
            <span>{hoursText(t.minutes)}</span>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        )
      },
    },
  ]

  return (
    <Table
      rowKey="id"
      size="small"
      className="dispatch-calendar"
      columns={columns}
      dataSource={nurses}
      pagination={nurses.length > 8 ? { pageSize: 8, size: 'small', showSizeChanger: false, showTotal: (t) => `${t} điều dưỡng` } : false}
      scroll={{ x: 200 + 92 * 7 + 96 }}
      locale={{ emptyText: 'Không có điều dưỡng nào khớp bộ lọc' }}
    />
  )
}

// ---------- Shift drawer ----------

// Lists the shifts behind a calendar cell (one nurse, one day) or a whole day. Rendered only when opened.
export function ShiftDrawer({ target, shifts, nurseById, onClose }) {
  const open = Boolean(target)
  const list = useMemo(() => {
    if (!target) return []
    return shifts
      .filter((s) => s.date === target.date && (!target.nurseId || s.nurseId === target.nurseId))
      .sort((a, b) => (nurseById.get(a.nurseId)?.name || '').localeCompare(nurseById.get(b.nurseId)?.name || '', 'vi') || a.start.localeCompare(b.start))
  }, [target, shifts, nurseById])

  const d = target ? dayjs(target.date) : null
  const nurse = target?.nurseId ? nurseById.get(target.nurseId) : null
  const minutes = list.reduce((sum, s) => sum + minutesOf(s), 0)

  // Group by nurse when looking at a whole day.
  const groups = useMemo(() => {
    const map = new Map()
    list.forEach((s) => map.set(s.nurseId, [...(map.get(s.nurseId) || []), s]))
    return [...map.entries()]
  }, [list])

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={460}
      destroyOnHidden
      title={
        d && (
          <div>
            <div>
              {WEEKDAY_LONG[d.day()]}, {d.format('DD/MM/YYYY')}
            </div>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              {nurse ? `${nurse.name} · ` : ''}
              {list.length} ca · {hoursText(minutes)}
            </Text>
          </div>
        )
      }
    >
      {list.length === 0 ? (
        <Empty description="Không có ca nào" />
      ) : (
        <Flex vertical gap={16}>
          {groups.map(([nurseId, items]) => (
            <div key={nurseId}>
              {!nurse && (
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Link to={`/hospital/admin/roster/${nurseId}`}>
                    <Text strong>{nurseById.get(nurseId)?.name}</Text>
                  </Link>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {items.length} ca · {hoursText(items.reduce((sum, s) => sum + minutesOf(s), 0))}
                  </Text>
                </Flex>
              )}
              <Flex vertical gap={8}>
                {items.map((s) => (
                  <div key={s.id} className={`shift-row is-${s.status}`}>
                    <div className="shift-row-time">
                      <b>{s.start}</b>
                      <span>{s.end}</span>
                    </div>
                    <div className="shift-row-main">
                      <Flex justify="space-between" gap={8} align="flex-start">
                        <Text strong>{s.patient?.name}</Text>
                        <Tag color={SESSION_META[s.status]?.color} style={{ marginInlineEnd: 0 }}>
                          {SESSION_META[s.status]?.label}
                        </Tag>
                      </Flex>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {careTypeLabel(s.careRequest?.careType)} · {hoursText(minutesOf(s))}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                        {s.patient?.address || s.careRequest?.district}
                      </Text>
                      <Space size={8} style={{ marginTop: 6 }}>
                        <Link to={SHIFT_PATH(s.id)}>
                          <Button size="small" type="primary" ghost>
                            Xem chi tiết ca
                          </Button>
                        </Link>
                        {s.careRequest && (
                          <Link to={REQUEST_PATH(s.careRequest.id)}>
                            <Button size="small" type="link">
                              Yêu cầu #{s.careRequest.id}
                            </Button>
                          </Link>
                        )}
                      </Space>
                    </div>
                  </div>
                ))}
              </Flex>
            </div>
          ))}
        </Flex>
      )}
    </Drawer>
  )
}

// ---------- Reassign panel ----------

function ReassignRow({ booking, sessionItem, candidates }) {
  const state = useDb()
  const { message } = App.useApp()
  const [pick, setPick] = useState(null)
  const careRequest = getCareRequest(state, booking.careRequestId)
  const patient = getPatient(state, booking.patientId)
  const last = sessionItem.history?.[sessionItem.history.length - 1]
  const original = getNurse(state, last?.nurseId)
  return (
    <div className="reassign-row">
      <div style={{ flex: '1 1 300px', minWidth: 0 }}>
        <Text strong>
          {patient?.name} · {careTypeLabel(careRequest?.careType)}
        </Text>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDate(sessionItem.date)} · {sessionItem.start}–{sessionItem.end} · Điều dưỡng cũ: {original?.name || '—'}
          </Text>
        </div>
        {last?.reason && (
          <Text type="warning" style={{ fontSize: 12 }}>
            Lý do: {last.reason}
          </Text>
        )}
      </div>
      <Space wrap align="start">
        <Select
          placeholder="Chọn điều dưỡng mới"
          value={pick}
          onChange={setPick}
          options={candidates.map((n) => ({ value: n.id, label: n.name }))}
          style={{ width: 210 }}
          notFoundContent="Không có điều dưỡng phù hợp"
        />
        <Button
          type="primary"
          icon={<SwapOutlined />}
          disabled={!pick}
          onClick={() => {
            manualReassignSession({ bookingId: booking.id, sessionId: sessionItem.id, nurseId: pick })
            message.success(`Đã giao buổi chăm sóc cho ${getNurse(state, pick)?.name}`)
          }}
        >
          Xác nhận
        </Button>
      </Space>
    </div>
  )
}

// Sessions nobody can take. Shows the first few, the rest behind "Xem thêm".
export function ReassignPanel({ items, candidatesFor }) {
  const state = useDb()
  const [all, setAll] = useState(false)
  if (items.length === 0) return null
  const visible = all ? items : items.slice(0, 3)
  return (
    <Card id="reassign-panel" size="small" className="reassign-panel" style={{ marginBottom: 16 }} title={<span>Ca cần đổi điều dưỡng · {items.length}</span>}>
      <Alert type="warning" showIcon style={{ marginBottom: 10 }} title="Các buổi dưới đây chưa có điều dưỡng thực hiện — chọn người thay để bệnh nhân không bị bỏ ca." />
      <Flex vertical>
        {visible.map(({ booking, sessionItem }) => (
          <ReassignRow key={sessionItem.id} booking={booking} sessionItem={sessionItem} candidates={candidatesFor(getCareRequest(state, booking.careRequestId)?.careType)} />
        ))}
      </Flex>
      {items.length > 3 && (
        <Button type="link" onClick={() => setAll((v) => !v)} style={{ paddingLeft: 0 }}>
          {all ? 'Thu gọn' : `Xem thêm ${items.length - 3} ca`}
        </Button>
      )}
    </Card>
  )
}
