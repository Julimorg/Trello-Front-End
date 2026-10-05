import type { FamilyContact, FamilyInvite } from './types'
import { timestampAt } from './date-utils'

// Data for "Người thân liên kết" (/patient/family) and the SOS "Báo người thân" list.
// Keys are patient ids from profile-data.ts.

export const FAMILY_CONTACTS: Record<string, FamilyContact[]> = {
  'patient-an': [
    {
      id: 'fc-an-1',
      name: 'Nguyễn Thị Bích',
      phone: '091-234-9999',
      relation: 'Con gái',
      status: 'Đã liên kết',
      primary: true,
      permissions: ['Nhận cảnh báo SOS', 'Xem lịch chăm sóc', 'Xem trạng thái yêu cầu'],
    },
    {
      id: 'fc-an-2',
      name: 'Nguyễn Văn Hùng',
      phone: '091-876-5432',
      relation: 'Con trai',
      status: 'Đã liên kết',
      primary: false,
      permissions: ['Nhận cảnh báo SOS', 'Xem lịch chăm sóc'],
    },
    {
      id: 'fc-an-3',
      name: 'Trần Thị Lan',
      phone: '090-882-4316',
      relation: 'Vợ / Chồng',
      status: 'Đã liên kết',
      primary: false,
      permissions: ['Nhận cảnh báo SOS'],
      inviteCode: 'CS-LAN4K7',
    },
    {
      id: 'fc-an-4',
      name: 'Nguyễn Hoàng Minh',
      phone: 'minh.nguyen@example.com',
      relation: 'Anh / Chị / Em',
      status: 'Chờ xác nhận',
      primary: false,
      permissions: ['Nhận cảnh báo SOS', 'Xem lịch chăm sóc'],
    },
  ],
  'patient-thu': [
    {
      id: 'fc-thu-1',
      name: 'Trần Văn Long',
      phone: '092-345-1111',
      relation: 'Con trai',
      status: 'Đã liên kết',
      primary: true,
      permissions: ['Nhận cảnh báo SOS', 'Xem lịch chăm sóc'],
    },
    {
      id: 'fc-thu-2',
      name: 'Trần Thị Mai',
      phone: '092-345-2222',
      relation: 'Con',
      status: 'Chờ xác nhận',
      primary: false,
      permissions: ['Nhận cảnh báo SOS'],
    },
  ],
}

export const FAMILY_RELATIONS = ['Vợ / Chồng', 'Con', 'Con trai', 'Con gái', 'Cha / Mẹ', 'Anh / Chị / Em', 'Người giám hộ', 'Khác']

export const FAMILY_PERMISSIONS = [
  { id: 'emergency', label: 'Nhận cảnh báo SOS', hint: 'Vị trí và thông tin ca đang diễn ra' },
  { id: 'schedule', label: 'Xem lịch chăm sóc', hint: 'Lịch đã xác nhận và thay đổi quan trọng' },
  { id: 'status', label: 'Xem trạng thái yêu cầu', hint: 'Tiến độ matching và xác nhận điều dưỡng' },
] as const

// QR invites: a relative scans the code (or opens the link) to link their account.
// fc-an-3 (Trần Thị Lan) was linked through the used invite below.
export const FAMILY_INVITE_TTL_MINUTES = 10

export const FAMILY_INVITES: FamilyInvite[] = [
  {
    code: 'CS-LAN4K7',
    patientId: 'patient-an',
    permissions: ['Nhận cảnh báo SOS'],
    createdAt: timestampAt(-40, '19:02'),
    expiresAt: timestampAt(-40, '19:12'),
    usedAt: timestampAt(-40, '19:05'),
    contactId: 'fc-an-3',
  },
]
