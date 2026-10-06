import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Badge, Button, Card, DatePicker, Empty, Flex, Input, Pagination, Segmented, Select, Space, Typography } from 'antd'
import { FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import NurseRequestCard from './NurseRequestCard'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getPatient, listNurseRequests } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { NURSE_REQUEST_PAGE_SIZE, NURSE_REQUEST_SORTS, NURSE_REQUEST_TABS } from '../../Data/nurse/requests-data'

const { Text } = Typography
// Requests asked of the nurse within this window get a "Mới" tag.
const FRESH_MINUTES = 30
const normalize = (text) =>
  (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

const DEFAULT_FILTERS = { tab: 'all', search: '', careTypes: [], districts: [], range: null, sort: 'newest' }

export default function NurseRequests() {
  const { session } = useAuth()
  const state = useDb()
  const [params, setParams] = useSearchParams()
  const focusId = params.get('id')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const update = (patch) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const items = useMemo(() => listNurseRequests(state, session.id), [state, session.id])

  // Ids that appear while the page is open (realtime) are flagged as new.
  const knownIdsRef = useRef(null)
  const [liveIds, setLiveIds] = useState([])
  useEffect(() => {
    const ids = items.filter((i) => i.relation === 'pending' || i.relation === 'suggested').map((i) => i.careRequest.id)
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(ids)
      return
    }
    const fresh = ids.filter((id) => !knownIdsRef.current.has(id))
    if (fresh.length) {
      fresh.forEach((id) => knownIdsRef.current.add(id))
      setLiveIds((prev) => [...prev, ...fresh])
    }
  }, [items])

  const counts = useMemo(() => {
    const c = { all: items.length }
    items.forEach((i) => {
      c[i.relation] = (c[i.relation] || 0) + 1
    })
    return c
  }, [items])

  const careTypeOptions = useMemo(
    () => [...new Set(items.map((i) => i.careRequest.careType))].map((id) => ({ value: id, label: careTypeLabel(id) })),
    [items],
  )
  const districtOptions = useMemo(() => [...new Set(items.map((i) => i.careRequest.district))].map((d) => ({ value: d, label: d })), [items])

  const filtered = useMemo(() => {
    const q = normalize(filters.search.trim())
    const list = items.filter(({ careRequest: c, relation }) => {
      if (filters.tab !== 'all' && relation !== filters.tab) return false
      if (filters.careTypes.length && !filters.careTypes.includes(c.careType)) return false
      if (filters.districts.length && !filters.districts.includes(c.district)) return false
      if (filters.range) {
        const [from, to] = filters.range
        if (from && c.desiredStartDate < from.format('YYYY-MM-DD')) return false
        if (to && c.desiredStartDate > to.format('YYYY-MM-DD')) return false
      }
      if (!q) return true
      const patient = getPatient(state, c.patientId)
      return normalize([c.id, patient?.name, c.district, careTypeLabel(c.careType), c.notes, patient?.address].join(' ')).includes(q)
    })
    const byCreated = (a, b) => (b.careRequest.selectedAt || b.careRequest.createdAt).localeCompare(a.careRequest.selectedAt || a.careRequest.createdAt)
    const sorters = {
      newest: byCreated,
      oldest: (a, b) => -byCreated(a, b),
      'start-soon': (a, b) => a.careRequest.desiredStartDate.localeCompare(b.careRequest.desiredStartDate),
      'start-late': (a, b) => b.careRequest.desiredStartDate.localeCompare(a.careRequest.desiredStartDate),
    }
    return list.sort(sorters[filters.sort])
  }, [items, filters, state])

  // Deep link from a notification (?id=cr-…): show it on the right page and highlight it.
  const focusRef = useRef(null)
  useEffect(() => {
    if (!focusId) return
    const index = filtered.findIndex((i) => i.careRequest.id === focusId)
    if (index === -1) {
      if (filters !== DEFAULT_FILTERS && items.some((i) => i.careRequest.id === focusId)) setFilters(DEFAULT_FILTERS)
      return
    }
    const targetPage = Math.floor(index / NURSE_REQUEST_PAGE_SIZE) + 1
    if (targetPage !== page) setPage(targetPage)
    else focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, filtered, page, filters, items])

  const pageItems = filtered.slice((page - 1) * NURSE_REQUEST_PAGE_SIZE, page * NURSE_REQUEST_PAGE_SIZE)
  const isFiltered =
    filters.tab !== 'all' || filters.search.trim() !== '' || filters.careTypes.length > 0 || filters.districts.length > 0 || Boolean(filters.range) || filters.sort !== 'newest'
  const freshSince = dayjs().subtract(FRESH_MINUTES, 'minute')

  return (
    <>
      <PageHead
        eyebrow="Yêu cầu phù hợp"
        title="Ca chăm sóc mới"
        description="Toàn bộ yêu cầu liên quan tới bạn: chờ phản hồi, được đề xuất, đã nhận, đã từ chối. Yêu cầu mới xuất hiện ngay khi bệnh nhân gửi."
      />

      <Card className="nurse-toolbar" size="small">
        <Flex vertical gap={12}>
          <Segmented
            block
            value={filters.tab}
            onChange={(tab) => update({ tab })}
            options={NURSE_REQUEST_TABS.map((t) => ({
              value: t.key,
              label: (
                <span className="segmented-label">
                  {t.label}
                  <Badge count={counts[t.key] || 0} showZero color={t.key === 'pending' ? '#b96b08' : '#94a4a7'} size="small" />
                </span>
              ),
            }))}
          />
          <Flex gap={10} wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm bệnh nhân, mã yêu cầu, khu vực, ghi chú…"
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              style={{ flex: '1 1 260px' }}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder={
                <span>
                  <FilterOutlined /> Loại ca
                </span>
              }
              value={filters.careTypes}
              onChange={(careTypes) => update({ careTypes })}
              options={careTypeOptions}
              style={{ flex: '1 1 190px' }}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="Khu vực"
              value={filters.districts}
              onChange={(districts) => update({ districts })}
              options={districtOptions}
              style={{ flex: '1 1 160px' }}
            />
            <DatePicker.RangePicker
              value={filters.range}
              onChange={(range) => update({ range })}
              format="DD/MM/YYYY"
              placeholder={['Bắt đầu từ', 'Đến ngày']}
              style={{ flex: '1 1 240px' }}
            />
            <Select value={filters.sort} onChange={(sort) => update({ sort })} options={NURSE_REQUEST_SORTS.map((s) => ({ ...s }))} style={{ flex: '0 1 200px' }} />
            <Button icon={<ReloadOutlined />} disabled={!isFiltered} onClick={() => update(DEFAULT_FILTERS)}>
              Đặt lại
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Flex justify="space-between" align="center" style={{ margin: '16px 2px 10px' }}>
        <Text type="secondary">
          {filtered.length} yêu cầu{isFiltered ? ' khớp bộ lọc' : ''}
        </Text>
      </Flex>

      {pageItems.length === 0 ? (
        <Card>
          <Empty description={isFiltered ? 'Không có yêu cầu nào khớp bộ lọc' : 'Chưa có yêu cầu nào. Yêu cầu mới sẽ xuất hiện tại đây ngay khi bệnh nhân gửi.'} />
        </Card>
      ) : (
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          {pageItems.map(({ careRequest, relation }) => {
            const askedAt = dayjs(careRequest.selectedAt || careRequest.createdAt)
            const isNew =
              liveIds.includes(careRequest.id) || ((relation === 'pending' || relation === 'suggested') && askedAt.isAfter(freshSince))
            return (
              <NurseRequestCard
                key={careRequest.id}
                careRequest={careRequest}
                relation={relation}
                nurseId={session.id}
                isNew={isNew}
                highlighted={careRequest.id === focusId}
                cardRef={careRequest.id === focusId ? focusRef : undefined}
              />
            )
          })}
        </Space>
      )}

      {filtered.length > NURSE_REQUEST_PAGE_SIZE && (
        <Flex justify="center" style={{ marginTop: 18 }}>
          <Pagination current={page} pageSize={NURSE_REQUEST_PAGE_SIZE} total={filtered.length} onChange={setPage} showSizeChanger={false} />
        </Flex>
      )}

      {focusId && (
        <Flex justify="center" style={{ marginTop: 12 }}>
          <Button type="link" onClick={() => setParams({})}>
            Bỏ đánh dấu yêu cầu #{focusId}
          </Button>
        </Flex>
      )}
    </>
  )
}
