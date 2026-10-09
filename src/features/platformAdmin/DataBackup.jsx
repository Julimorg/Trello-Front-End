import { useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import { Alert, App, Button, Card, Col, Flex, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import { CloudDownloadOutlined, CloudUploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'
import PageHead from '../../components/PageHead'
import { STORAGE_SCHEMA, getState, resetState, restoreState, useDb, useRealtimeStatus } from '../../lib/store'
import { withDataAudit } from '../../lib/db'
import { downloadCsv, downloadJson } from '../../lib/csv'
import { careTypeLabel, formatDateTime } from '../../lib/format'

const { Text } = Typography

const COLLECTIONS = [
  { key: 'hospitals', label: 'Bệnh viện đối tác' },
  { key: 'nurses', label: 'Điều dưỡng' },
  { key: 'patients', label: 'Bệnh nhân' },
  { key: 'careRequests', label: 'Yêu cầu chăm sóc' },
  { key: 'bookings', label: 'Lịch chăm sóc' },
  { key: 'sosEvents', label: 'Cảnh báo SOS' },
  { key: 'reports', label: 'Báo cáo tuân thủ' },
  { key: 'tickets', label: 'Yêu cầu hỗ trợ' },
  { key: 'notifications', label: 'Thông báo' },
  { key: 'broadcasts', label: 'Thông báo hệ thống' },
  { key: 'auditLogs', label: 'Nhật ký hoạt động' },
  { key: 'familyInvites', label: 'Lời mời liên kết' },
]
const REQUIRED = ['hospitals', 'nurses', 'patients', 'careRequests', 'bookings']

const kb = (n) => `${(n / 1024).toFixed(n > 10240 ? 0 : 1)} KB`

// "Dữ liệu & sao lưu": health of the data layer, backup / restore and quick CSV exports.
export default function DataBackup() {
  const { message, modal } = App.useApp()
  const state = useDb()
  const realtime = useRealtimeStatus()
  const fileRef = useRef(null)

  const stats = useMemo(() => {
    const rows = COLLECTIONS.map((c) => {
      const data = state[c.key] || []
      return { ...c, count: data.length, bytes: JSON.stringify(data).length }
    })
    return { rows, total: rows.reduce((s, r) => s + r.count, 0), bytes: JSON.stringify(state).length }
  }, [state])

  const backup = () => {
    downloadJson(`careshift-backup-${dayjs().format('YYYYMMDD-HHmm')}.json`, { meta: { app: 'careshift', schema: STORAGE_SCHEMA, exportedAt: new Date().toISOString(), records: stats.total }, state: getState() })
    message.success('Đã tải bản sao lưu')
  }

  const onFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      message.error('File không phải JSON hợp lệ')
      return
    }
    if (parsed?.meta?.app !== 'careshift' || !parsed.state) return message.error('Đây không phải file sao lưu của CareShift')
    if (parsed.meta.schema !== STORAGE_SCHEMA) return message.error(`Phiên bản dữ liệu không khớp (${parsed.meta.schema} ≠ ${STORAGE_SCHEMA}). Hãy dùng bản sao lưu từ cùng phiên bản.`)
    if (REQUIRED.some((k) => !Array.isArray(parsed.state[k]))) return message.error('File sao lưu thiếu dữ liệu bắt buộc')
    modal.confirm({
      title: 'Khôi phục dữ liệu?',
      content: `Toàn bộ dữ liệu hiện tại sẽ bị thay bằng bản sao lưu lúc ${formatDateTime(parsed.meta.exportedAt)} (${parsed.meta.records ?? '?'} bản ghi) trên mọi thiết bị đang mở. Hãy tải bản sao lưu hiện tại trước nếu cần.`,
      okText: 'Khôi phục',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        restoreState(withDataAudit(parsed.state, { action: 'Khôi phục dữ liệu từ bản sao lưu', detail: file.name }))
        message.success('Đã khôi phục dữ liệu')
      },
    })
  }

  const reset = () =>
    modal.confirm({
      title: 'Đặt lại dữ liệu demo?',
      content: 'Toàn bộ dữ liệu hiện tại (kể cả nhật ký hoạt động) sẽ bị xóa và nạp lại dữ liệu mẫu trên mọi thiết bị đang mở.',
      okText: 'Đặt lại',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        resetState()
        message.success('Đã đặt lại dữ liệu demo')
      },
    })

  const exportCollection = (c) => {
    downloadJson(`careshift-${c.key}-${dayjs().format('YYYYMMDD')}.json`, state[c.key] || [])
  }

  const exportSessions = () =>
    downloadCsv(
      `careshift-cac-buoi-cham-soc-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Mã buổi', value: (r) => r.s.id },
        { title: 'Mã lịch', value: (r) => r.b.id },
        { title: 'Bệnh nhân', value: (r) => state.patients.find((p) => p.id === r.b.patientId)?.name },
        { title: 'Điều dưỡng', value: (r) => state.nurses.find((n) => n.id === r.s.nurseId)?.name },
        { title: 'Dịch vụ', value: (r) => careTypeLabel(state.careRequests.find((c) => c.id === r.b.careRequestId)?.careType) },
        { title: 'Ngày', value: (r) => r.s.date },
        { title: 'Giờ', value: (r) => `${r.s.start}-${r.s.end}` },
        { title: 'Trạng thái', value: (r) => r.s.status },
      ],
      state.bookings.flatMap((b) => b.sessions.map((s) => ({ b, s }))),
    )
  const exportRequests = () =>
    downloadCsv(
      `careshift-yeu-cau-${dayjs().format('YYYYMMDD')}.csv`,
      [
        { title: 'Mã', value: (c) => c.id },
        { title: 'Bệnh nhân', value: (c) => state.patients.find((p) => p.id === c.patientId)?.name },
        { title: 'Dịch vụ', value: (c) => careTypeLabel(c.careType) },
        { title: 'Khu vực', value: (c) => c.district },
        { title: 'Bắt đầu', value: (c) => c.desiredStartDate },
        { title: 'Tần suất', value: (c) => c.frequency },
        { title: 'Trạng thái', value: (c) => c.status },
        { title: 'Điều dưỡng', value: (c) => state.nurses.find((n) => n.id === c.selectedNurseId)?.name },
        { title: 'Tạo lúc', value: (c) => formatDateTime(c.createdAt) },
      ],
      state.careRequests,
    )

  const live = realtime.status === 'online'

  return (
    <>
      <PageHead eyebrow="Data" title="Dữ liệu & sao lưu" description="Sức khỏe tầng dữ liệu, sao lưu / khôi phục toàn bộ hệ thống và xuất dữ liệu cho báo cáo." />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} xl={6}>
          <Card size="small">
            <Statistic title="Đồng bộ thời gian thực" value={live ? 'Đang kết nối' : realtime.status === 'connecting' ? 'Đang kết nối…' : 'Ngoại tuyến'} styles={{ content: { fontSize: 20, color: live ? '#21845b' : '#b96b08' } }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {live ? `${realtime.clients} thiết bị đang mở` : 'Chỉ đồng bộ giữa các tab cùng trình duyệt'}
            </Text>
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card size="small">
            <Statistic title="Tổng bản ghi" value={stats.total} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {COLLECTIONS.length} bảng dữ liệu
            </Text>
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card size="small">
            <Statistic title="Dung lượng lưu trữ" value={kb(stats.bytes)} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Trình duyệt giới hạn khoảng 5 MB
            </Text>
          </Card>
        </Col>
        <Col xs={12} xl={6}>
          <Card size="small">
            <Statistic title="Phiên bản dữ liệu" value={STORAGE_SCHEMA.replace('careshift_db_', '')} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Đổi khi cấu trúc dữ liệu thay đổi
            </Text>
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Dữ liệu demo lưu trong trình duyệt và đồng bộ qua máy chủ thời gian thực"
        description="Khi chuyển sang backend thật, trang này sẽ trỏ tới cơ sở dữ liệu: sao lưu tự động, khôi phục theo thời điểm. Hiện tại hãy tải bản sao lưu trước khi thử nghiệm lớn."
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card title="Sao lưu" size="small" style={{ height: '100%' }}>
            <Text type="secondary">Tải toàn bộ dữ liệu thành một file JSON.</Text>
            <div style={{ marginTop: 12 }}>
              <Button type="primary" icon={<CloudDownloadOutlined />} onClick={backup}>
                Tải bản sao lưu
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Khôi phục" size="small" style={{ height: '100%' }}>
            <Text type="secondary">Nạp lại từ file sao lưu. Áp dụng ngay trên mọi thiết bị.</Text>
            <div style={{ marginTop: 12 }}>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
              <Button icon={<CloudUploadOutlined />} onClick={() => fileRef.current?.click()}>
                Chọn file sao lưu
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Đặt lại dữ liệu demo" size="small" style={{ height: '100%' }}>
            <Text type="secondary">Xóa mọi thay đổi và nạp lại dữ liệu mẫu ban đầu.</Text>
            <div style={{ marginTop: 12 }}>
              <Button danger icon={<DeleteOutlined />} onClick={reset}>
                Đặt lại
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title="Bảng dữ liệu"
        extra={
          <Space wrap>
            <Button size="small" icon={<DownloadOutlined />} onClick={exportRequests}>
              CSV yêu cầu
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={exportSessions}>
              CSV buổi chăm sóc
            </Button>
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="key"
          size="middle"
          pagination={false}
          dataSource={stats.rows}
          scroll={{ x: 520 }}
          columns={[
            { title: 'Bảng', dataIndex: 'label', render: (v, r) => <div><Text strong>{v}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>{r.key}</Text></div></div> },
            { title: 'Bản ghi', dataIndex: 'count', sorter: (a, b) => a.count - b.count, width: 110 },
            { title: 'Dung lượng', dataIndex: 'bytes', sorter: (a, b) => a.bytes - b.bytes, width: 130, render: (v) => <Tag>{kb(v)}</Tag> },
            { title: '', key: 'a', width: 130, render: (_, r) => <Button size="small" onClick={() => exportCollection(r)}>Tải JSON</Button> },
          ]}
        />
      </Card>
      <Flex style={{ marginTop: 10 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Khôi phục và đặt lại được áp dụng cho mọi thiết bị đang kết nối. Lần khôi phục được ghi vào Nhật ký hoạt động; đặt lại sẽ xóa luôn nhật ký.
        </Text>
      </Flex>
    </>
  )
}
