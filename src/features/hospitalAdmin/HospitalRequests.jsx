import { useState } from 'react'
import { App, Alert, Button, Card, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd'
import { PlusOutlined, SearchOutlined, SwapOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import CareRequestWizardModal from '../careRequest/CareRequestWizardModal'
import HospitalPatientPickerModal from './HospitalPatientPickerModal'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, getPatient, listNursesByHospital, manualReassignSession } from '../../lib/db'
import { careTypeLabel, formatDate, formatDateTime } from '../../lib/format'
import { CARE_REQUEST_STATUS_LABEL, NURSE_AUTH_STATUS } from '../../lib/constants'
import { compareByGivenName } from './admin-shared'

const { Text, Title } = Typography

const REQUEST_STATUS_COLOR = {
  created: 'default',
  matching: 'processing',
  matched: 'blue',
  nurse_pending: 'gold',
  no_match: 'orange',
  cancelled: 'default',
  completed: 'green',
}

function ReassignCard({ booking, sessionItem, candidates }) {
  const state = useDb()
  const { message } = App.useApp()
  const [pick, setPick] = useState(null)
  const careRequest = getCareRequest(state, booking.careRequestId)
  const patient = getPatient(state, booking.patientId)
  const last = sessionItem.history?.[sessionItem.history.length - 1]
  const original = getNurse(state, last?.nurseId)
  return (
    <Card size="small">
      <Flex justify="space-between" gap={12} wrap>
        <div style={{ flex: '1 1 320px' }}>
          <Text strong>
            {patient?.name} · {careTypeLabel(careRequest?.careType)}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Buổi {formatDate(sessionItem.date)} · {sessionItem.start}–{sessionItem.end} · Điều dưỡng cũ: {original?.name || '—'}
            </Text>
          </div>
          {last?.reason && <Alert type="warning" showIcon title={`Lý do: ${last.reason}`} style={{ marginTop: 8 }} />}
        </div>
        <Space wrap align="start">
          <Select
            placeholder="Chọn điều dưỡng thay thế"
            value={pick}
            onChange={setPick}
            options={candidates.map((n) => ({ value: n.id, label: n.name }))}
            style={{ width: 230 }}
            notFoundContent="Không có điều dưỡng phù hợp"
          />
          <Button
            type="primary"
            icon={<SwapOutlined />}
            disabled={!pick}
            onClick={() => {
              manualReassignSession({ bookingId: booking.id, sessionId: sessionItem.id, nurseId: pick })
              message.success('Đã đổi điều dưỡng cho buổi chăm sóc')
            }}
          >
            Xác nhận đổi
          </Button>
        </Space>
      </Flex>
    </Card>
  )
}

export default function HospitalRequests() {
  const { session } = useAuth()
  const state = useDb()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [wizardPatientId, setWizardPatientId] = useState(null)
  const [status, setStatus] = useState(null)
  const [search, setSearch] = useState('')

  const hospitalNurses = listNursesByHospital(state, session.id)
  const hospitalNurseIds = new Set(hospitalNurses.map((n) => n.id))
  const cannotPerform = state.bookings.flatMap((b) => b.sessions.filter((s) => s.needsManualReassignment && hospitalNurseIds.has(s.nurseId)).map((s) => ({ booking: b, sessionItem: s })))
  const candidatesFor = (careType) =>
    hospitalNurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && n.authorizedCareTypes.includes(careType)).sort((a, b) => compareByGivenName(a.name, b.name))

  const q = search.trim().toLowerCase()
  const requests = state.careRequests
    .filter((r) => r.matchedNurseIds.some((id) => hospitalNurseIds.has(id)) || (r.selectedNurseId && hospitalNurseIds.has(r.selectedNurseId)) || r.createdBy === 'hospital')
    .map((r) => ({ ...r, patient: getPatient(state, r.patientId), nurse: r.selectedNurseId ? getNurse(state, r.selectedNurseId) : null }))
    .filter((r) => (!status || r.status === status) && (!q || `${r.id} ${r.patient?.name} ${r.nurse?.name} ${careTypeLabel(r.careType)}`.toLowerCase().includes(q)))

  const columns = [
    { title: 'Mã', dataIndex: 'id', render: (id) => <Text strong>#{id}</Text> },
    { title: 'Bệnh nhân', key: 'patient', sorter: (a, b) => compareByGivenName(a.patient?.name, b.patient?.name), render: (_, r) => r.patient?.name },
    { title: 'Nhu cầu', key: 'care', render: (_, r) => careTypeLabel(r.careType) },
    { title: 'Bắt đầu', key: 'start', sorter: (a, b) => a.desiredStartDate.localeCompare(b.desiredStartDate), render: (_, r) => `${formatDate(r.desiredStartDate)} · ${r.timeSlot?.start}` },
    { title: 'Điều dưỡng', key: 'nurse', render: (_, r) => r.nurse?.name || <Text type="secondary">—</Text> },
    { title: 'Tạo bởi', key: 'by', render: (_, r) => (r.createdBy === 'hospital' ? <Tag color="purple">Bệnh viện</Tag> : <Tag>Bệnh nhân</Tag>) },
    { title: 'Tạo lúc', key: 'created', sorter: (a, b) => a.createdAt.localeCompare(b.createdAt), defaultSortOrder: 'descend', render: (_, r) => formatDateTime(r.createdAt) },
    { title: 'Trạng thái', key: 'status', render: (_, r) => <Tag color={REQUEST_STATUS_COLOR[r.status]}>{CARE_REQUEST_STATUS_LABEL[r.status]?.label || r.status}</Tag> },
  ]

  return (
    <>
      <PageHead
        eyebrow="Care requests"
        title="Yêu cầu chăm sóc"
        description="Yêu cầu liên quan tới điều dưỡng của bệnh viện, do bệnh viện tạo thay, hoặc đang cần hỗ trợ điều phối."
        action={
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
            Tạo thay bệnh nhân
          </Button>
        }
      />

      {cannotPerform.length > 0 && (
        <>
          <Title level={5}>Ca cần hỗ trợ đổi điều dưỡng ({cannotPerform.length})</Title>
          <Flex vertical gap={10} style={{ marginBottom: 20 }}>
            {cannotPerform.map(({ booking, sessionItem }) => (
              <ReassignCard key={sessionItem.id} booking={booking} sessionItem={sessionItem} candidates={candidatesFor(getCareRequest(state, booking.careRequestId)?.careType)} />
            ))}
          </Flex>
        </>
      )}

      <Card className="nurse-toolbar" size="small" style={{ marginBottom: 16 }}>
        <Flex gap={10} wrap>
          <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm mã, bệnh nhân, điều dưỡng, loại ca" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 260px' }} />
          <Select allowClear placeholder="Trạng thái" value={status} onChange={setStatus} options={Object.entries(CARE_REQUEST_STATUS_LABEL).map(([value, m]) => ({ value, label: m.label }))} style={{ flex: '0 1 240px' }} />
        </Flex>
      </Card>
      <Card styles={{ body: { padding: 0 } }}>
        <Table rowKey="id" columns={columns} dataSource={requests} pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 980 }} locale={{ emptyText: 'Chưa có yêu cầu liên quan' }} />
      </Card>

      <HospitalPatientPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={(patientId) => {
          setPickerOpen(false)
          setWizardPatientId(patientId)
        }}
      />
      <CareRequestWizardModal open={Boolean(wizardPatientId)} onClose={() => setWizardPatientId(null)} patientId={wizardPatientId} createdBy="hospital" onCreated={() => setWizardPatientId(null)} />
    </>
  )
}
