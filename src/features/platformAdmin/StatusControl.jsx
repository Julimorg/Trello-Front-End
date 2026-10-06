import { useState } from 'react'
import { App, Button, Dropdown, Input, Modal, Typography } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { PLATFORM_STATUS_META } from '../../lib/constants'

const { Text } = Typography

// "Trạng thái ▾" menu for Hoạt động / Tạm ngưng / Khóa. Moving away from "Hoạt động" asks for a
// reason (sent to the account owner and kept in the audit log).
export default function StatusControl({ status = 'active', entityName, onChange, size = 'small' }) {
  const { message } = App.useApp()
  const [target, setTarget] = useState(null)
  const [reason, setReason] = useState('')

  const apply = (next, why) => {
    onChange(next, why)
    message.success(`${entityName}: chuyển sang “${PLATFORM_STATUS_META[next].label}”`)
  }

  const items = Object.entries(PLATFORM_STATUS_META).map(([key, meta]) => ({
    key,
    disabled: key === status,
    label: (
      <span>
        <Text strong style={{ color: key === 'locked' ? '#cf3c43' : key === 'suspended' ? '#b96b08' : '#21845b' }}>
          {meta.label}
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {meta.hint}
        </Text>
      </span>
    ),
  }))

  return (
    <>
      <Dropdown
        trigger={['click']}
        menu={{
          items,
          onClick: ({ key, domEvent }) => {
            domEvent.stopPropagation()
            if (key === 'active') apply('active', '')
            else {
              setReason('')
              setTarget(key)
            }
          },
        }}
      >
        <Button size={size} onClick={(e) => e.stopPropagation()}>
          Trạng thái <DownOutlined />
        </Button>
      </Dropdown>
      <Modal
        open={Boolean(target)}
        title={target ? `${PLATFORM_STATUS_META[target].label}: ${entityName}` : ''}
        okText={target ? PLATFORM_STATUS_META[target].label : ''}
        okButtonProps={{ danger: target === 'locked', disabled: !reason.trim() }}
        cancelText="Hủy"
        onCancel={() => setTarget(null)}
        onOk={() => {
          apply(target, reason.trim())
          setTarget(null)
        }}
        destroyOnHidden
      >
        <Text type="secondary">{target && PLATFORM_STATUS_META[target].hint}. Lý do sẽ được gửi tới chủ tài khoản và lưu vào nhật ký.</Text>
        <Input.TextArea rows={3} autoFocus style={{ marginTop: 12 }} placeholder="Lý do (bắt buộc)" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Modal>
    </>
  )
}
