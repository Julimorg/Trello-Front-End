import type { PatientProfile } from './types'

// Data for "Hồ sơ cá nhân" (/patient/profile). Ids are the patient ids every other
// patient data file references.

export const PATIENT_PROFILES: PatientProfile[] = [
  {
    id: 'patient-an',
    name: 'Nguyễn Văn An',
    phone: '091-234-5678',
    email: 'an.nguyen@example.com',
    district: 'Bình Thạnh',
    address: '12 Điện Biên Phủ, Bình Thạnh',
    dateOfBirth: '1958-03-14',
    gender: 'Nam',
    bloodType: 'O+',
    allergies: 'Penicillin',
    conditions: 'Tăng huyết áp, sau phẫu thuật ruột thừa',
  },
  {
    id: 'patient-thu',
    name: 'Trần Thị Thu',
    phone: '092-345-6789',
    email: 'thu.tran@example.com',
    district: 'Quận 5',
    address: '45 Trần Hưng Đạo, Quận 5',
    dateOfBirth: '1962-11-02',
    gender: 'Nữ',
    bloodType: 'A+',
    allergies: 'Không',
    conditions: 'Tiểu đường type 2',
  },
  // Patients served by nurse Trần Thị Hoa (see Data/nurse/*): Bình Thạnh & Thủ Đức.
  {
    id: 'patient-lien',
    name: 'Lê Thị Liên',
    phone: '093-111-2201',
    email: 'lien.le@example.com',
    district: 'Bình Thạnh',
    address: '88 Xô Viết Nghệ Tĩnh, Bình Thạnh',
    dateOfBirth: '1941-06-20',
    gender: 'Nữ',
    bloodType: 'B+',
    allergies: 'Không',
    conditions: 'Thoái hóa khớp gối, suy giảm trí nhớ nhẹ',
  },
  {
    id: 'patient-hanh',
    name: 'Phạm Văn Hạnh',
    phone: '093-111-2202',
    email: 'hanh.pham@example.com',
    district: 'Thủ Đức',
    address: '15 Võ Văn Ngân, Thủ Đức',
    dateOfBirth: '1955-01-09',
    gender: 'Nam',
    bloodType: 'O+',
    allergies: 'Aspirin',
    conditions: 'Phục hồi sau tai biến, yếu nửa người trái',
  },
  {
    id: 'patient-dung',
    name: 'Võ Thị Dung',
    phone: '093-111-2203',
    email: 'dung.vo@example.com',
    district: 'Bình Thạnh',
    address: '210 Bạch Đằng, Bình Thạnh',
    dateOfBirth: '1948-09-30',
    gender: 'Nữ',
    bloodType: 'A-',
    allergies: 'Hải sản',
    conditions: 'Tăng huyết áp, loãng xương',
  },
  {
    id: 'patient-khanh',
    name: 'Đỗ Minh Khánh',
    phone: '093-111-2204',
    email: 'khanh.do@example.com',
    district: 'Thủ Đức',
    address: '7 Lê Văn Việt, Thủ Đức',
    dateOfBirth: '1979-12-12',
    gender: 'Nam',
    bloodType: 'AB+',
    allergies: 'Không',
    conditions: 'Gãy xương đùi, đang tập vật lý trị liệu',
  },
  {
    id: 'patient-tuan',
    name: 'Ngô Văn Tuấn',
    phone: '093-111-2205',
    email: 'tuan.ngo@example.com',
    district: 'Thủ Đức',
    address: '3 Đặng Văn Bi, Thủ Đức',
    dateOfBirth: '1939-04-18',
    gender: 'Nam',
    bloodType: 'O-',
    allergies: 'Không',
    conditions: 'Parkinson giai đoạn đầu',
  },
]

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

/** Nurses each patient has marked "đáng tin cậy" — must be nurses who have cared for them (see booking-data.ts). */
export const TRUSTED_NURSES: Record<string, string[]> = {
  'patient-an': ['nurse-mai', 'nurse-thao'],
  'patient-lien': ['nurse-hoa'],
}
