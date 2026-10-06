import type { NurseProfileDetail } from './types'

// Data for "Hồ sơ nghề nghiệp" (/hospital/nurse/profile), keyed by nurse id from
// Data/patient/nurse-data.ts.

export const NURSE_PROFILE_DETAILS: Record<string, NurseProfileDetail> = {
  'nurse-hoa': {
    nurseId: 'nurse-hoa',
    dateOfBirth: '1997-08-21',
    gender: 'Nữ',
    email: 'hoa.tran@bv115.vn',
    address: '56 Nguyễn Xí, Bình Thạnh, TP.HCM',
    department: 'Khoa Phục hồi chức năng',
    licenseNumber: 'DD-2022-00987',
    licenseIssuedAt: '2022-04-12',
    licenseExpiresAt: '2027-04-12',
    licenseScope: 'Điều dưỡng đa khoa — chăm sóc phục hồi chức năng và người cao tuổi',
    education: [
      { degree: 'Cử nhân Điều dưỡng', school: 'Đại học Y khoa Phạm Ngọc Thạch', year: 2021 },
      { degree: 'Chứng chỉ Phục hồi chức năng cơ bản', school: 'Bệnh viện Nhân Dân 115', year: 2023 },
    ],
    workHistory: [
      { role: 'Điều dưỡng chính thức', place: 'Khoa Phục hồi chức năng — BV Nhân Dân 115', from: '2023-01', to: null, note: 'Phụ trách 12 giường, hướng dẫn tập vận động sau tai biến' },
      { role: 'Điều dưỡng thực hành', place: 'Khoa Nội tổng hợp — BV Nhân Dân 115', from: '2021-09', to: '2022-12' },
      { role: 'Thực tập sinh', place: 'Khoa Lão khoa — BV Thống Nhất', from: '2020-06', to: '2021-06' },
    ],
    languages: ['Tiếng Việt', 'Tiếng Anh giao tiếp'],
    skills: [
      { name: 'Tập vận động & di chuyển', level: 5 },
      { name: 'Chăm sóc người cao tuổi', level: 5 },
      { name: 'Phòng ngừa té ngã', level: 4 },
      { name: 'Đo sinh hiệu', level: 4 },
      { name: 'Chăm sóc loét tì đè', level: 3 },
    ],
    trainings: [
      { id: 'tr-hoa-1', name: 'Sơ cấp cứu cơ bản (BLS)', provider: 'Hội Hồi sức cấp cứu TP.HCM', date: '2025-11-08', hours: 16 },
      { id: 'tr-hoa-2', name: 'Kỹ thuật di chuyển bệnh nhân an toàn', provider: 'BV Nhân Dân 115', date: '2025-05-20', hours: 8 },
      { id: 'tr-hoa-3', name: 'Chăm sóc người bệnh Parkinson tại nhà', provider: 'CareShift Academy', date: '2026-03-02', hours: 6 },
    ],
    equipment: ['Máy đo huyết áp điện tử', 'Máy đo SpO₂', 'Đai hỗ trợ di chuyển'],
    transport: 'Xe máy — di chuyển tối đa 8 km',
    maxSessionsPerWeek: 18,
    acceptanceRate: 0.86,
    onTimeRate: 0.97,
  },
  'nurse-mai': {
    nurseId: 'nurse-mai',
    dateOfBirth: '1989-02-03',
    gender: 'Nữ',
    email: 'mai.nguyen@bv115.vn',
    address: '21 Phan Đăng Lưu, Phú Nhuận, TP.HCM',
    department: 'Khoa Ngoại tổng hợp',
    licenseNumber: 'DD-2017-00412',
    licenseIssuedAt: '2017-08-01',
    licenseExpiresAt: '2027-08-01',
    licenseScope: 'Điều dưỡng ngoại khoa — chăm sóc vết thương và hậu phẫu',
    education: [
      { degree: 'Cử nhân Điều dưỡng', school: 'Đại học Y Dược TP.HCM', year: 2012 },
      { degree: 'Chuyên khoa Điều dưỡng Ngoại', school: 'Đại học Y Dược TP.HCM', year: 2018 },
    ],
    workHistory: [
      { role: 'Điều dưỡng trưởng nhóm', place: 'Khoa Ngoại tổng hợp — BV Nhân Dân 115', from: '2019-03', to: null },
      { role: 'Điều dưỡng', place: 'Khoa Ngoại tổng hợp — BV Nhân Dân 115', from: '2012-09', to: '2019-02' },
    ],
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    skills: [
      { name: 'Thay băng vết thương phức tạp', level: 5 },
      { name: 'Chăm sóc hậu phẫu', level: 5 },
      { name: 'Đo sinh hiệu', level: 4 },
    ],
    trainings: [{ id: 'tr-mai-1', name: 'Chăm sóc vết thương nâng cao', provider: 'Hội Điều dưỡng Việt Nam', date: '2025-09-15', hours: 24 }],
    equipment: ['Bộ thay băng vô khuẩn', 'Máy đo huyết áp điện tử'],
    transport: 'Ô tô — di chuyển tối đa 12 km',
    maxSessionsPerWeek: 12,
    acceptanceRate: 0.78,
    onTimeRate: 0.99,
  },
}

export const SKILL_LEVEL_LABEL = ['', 'Cơ bản', 'Khá', 'Thành thạo', 'Giỏi', 'Chuyên sâu']
