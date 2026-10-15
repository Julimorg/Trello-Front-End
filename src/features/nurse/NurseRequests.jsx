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
const FILTER_PARAMS = ['tab', 'q', 'types', 'districts', 'from', 'to', 'sort', 'page']
const DATE_FMT = 'YYYY-MM-DD'
const list = (value) => (value ? value.split('|') : [])

// The filters live in the URL so that coming back from a request's detail page restores them.
function readFilters(params) {
  const from = params.get('from')
  const to = params.get('to')
  return {
    tab: params.get('tab') || DEFAULT_FILTERS.tab,
    search: params.get('q') || '',
    careTypes: list(params.get('types')),
    districts: list(params.get('districts')),
    range: from || to ? [from ? dayjs(from) : null, to ? dayjs(to) : null] : null,
    sort: params.get('sort') || DEFAULT_FILTERS.sort,
  }
}

export default function NurseRequests() {
  const { session } = useAuth()
  const state = useDb()
  const [params, setParams] = useSearchParams()
  const focusId = params.get('id')
  const filters = useMemo(() => readFilters(params), [params])
  const page = Math.max(1, Number(params.get('page')) || 1)

  const writeParams = (mutate) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        mutate(next)
        return next
      },
      { replace: true },
    )
  const setPage = (n) => writeParams((q) => (n > 1 ? q.set('page', String(n)) : q.delete('page')))
  const update = (patch) =>
    writeParams((q) => {
      const f = { ...readFilters(q), ...patch }
      const put = (key, value, empty) => (value && value !== empty && value.length !== 0 ? q.set(key, Array.isArray(value) ? value.join('|') : value) : q.delete(key))
      put('tab', f.tab, DEFAULT_FILTERS.tab)
      put('q', f.search)
      put('types', f.careTypes)
      put('districts', f.districts)
      put('from', f.range?.[0]?.format(DATE_FMT))
      put('to', f.range?.[1]?.format(DATE_FMT))
      put('sort', f.sort, DEFAULT_FILTERS.sort)
      q.delete('page')
      q.delete('id')
    })
  const resetFilters = () =>
    writeParams((q) => {
      FILTER_PARAMS.forEach((key) => q.delete(key))
      q.delete('id')
    })

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
    const result = items.filter(({ careRequest: c, relation }) => {
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
    return result.sort(sorters[filters.sort] || sorters.newest)
  }, [items, filters, state])

  // Deep link from a notification (?id=cr-…): show it on the right page and highlight it.
  const focusRef = useRef(null)
  const focusedIdRef = useRef(null)
  useEffect(() => {
    if (!focusId) {
      focusedIdRef.current = null
      return
    }
    // Jump to the request once; afterwards the nurse can page / filter freely.
    if (focusedIdRef.current === focusId) return
    const index = filtered.findIndex((i) => i.careRequest.id === focusId)
    if (index === -1) {
      if (items.some((i) => i.careRequest.id === focusId) && FILTER_PARAMS.some((key) => params.has(key))) resetFilters()
      return
    }
    const targetPage = Math.floor(index / NURSE_REQUEST_PAGE_SIZE) + 1
    if (targetPage !== page) {
      setPage(targetPage)
      return
    }
    focusedIdRef.current = focusId
    focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, filtered, page, items])

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
              style={{ flex: '1 1 320px' }}
            />
            <Select value={filters.sort} onChange={(sort) => update({ sort })} options={NURSE_REQUEST_SORTS.map((s) => ({ ...s }))} style={{ flex: '0 1 200px' }} />
            <Button icon={<ReloadOutlined />} disabled={!isFiltered} onClick={resetFilters}>
              Đặt lại
            </Button>
          </Flex>
          <Flex gap={10} wrap>
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
              style={{ flex: '1 1 220px' }}
            />
            <Select
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="Khu vực"
              value={filters.districts}
              onChange={(districts) => update({ districts })}
              options={districtOptions}
              style={{ flex: '1 1 200px' }}
            />
            <DatePicker.RangePicker
              value={filters.range}
              onChange={(range) => update({ range })}
              format="DD/MM/YYYY"
              placeholder={['Bắt đầu từ', 'Đến ngày']}
              style={{ flex: '1 1 280px' }}
            />
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
          <Button type="link" onClick={() => writeParams((q) => q.delete('id'))}>
            Bỏ đánh dấu yêu cầu #{focusId}
          </Button>
        </Flex>
      )}
    </>
  )
}
