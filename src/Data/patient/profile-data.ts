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
    insuranceNumber: 'HC4790123456789',
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
    insuranceNumber: 'HC4790987654321',
  },
]

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
