import { v4 as uuid } from 'uuid'
import {
  CARE_REQUEST_STATUS,
  NURSE_AUTH_STATUS,
  SESSION_STATUS,
  BOOKING_STATUS,
  HOSPITAL_STATUS,
} from './constants'

// Deterministic ids so seed data reads nicely while still unique per entity.
const id = (prefix) => `${prefix}-${uuid().slice(0, 8)}`

export function seedState() {
  const hosp1 = 'hosp-115'
  const hosp2 = 'hosp-ydvn'

  const hospitals = [
    {
      id: hosp1,
      name: 'Bệnh viện Nhân Dân 115',
      address: '527 Sư Vạn Hạnh, Bình Thạnh',
      district: 'Bình Thạnh',
      phone: '028-1234-5678',
      status: HOSPITAL_STATUS.ACTIVE,
      createdAt: '2026-06-01T00:00:00.000Z',
    },
    {
      id: hosp2,
      name: 'Bệnh viện Đại học Y Dược',
      address: '215 Hồng Bàng, Quận 5',
      district: 'Quận 5',
      phone: '028-8765-4321',
      status: HOSPITAL_STATUS.ACTIVE,
      createdAt: '2026-06-15T00:00:00.000Z',
    },
  ]

  const nurse1 = 'nurse-mai'
  const nurse2 = 'nurse-hoa'
  const nurse3 = 'nurse-binh'
  const nurse4 = 'nurse-lan'
  const nurse5 = 'nurse-tam'
  const nurse6 = 'nurse-yen'

  const nurses = [
    {
      id: nurse1,
      hospitalId: hosp1,
      name: 'Nguyễn Thị Mai',
      rank: 'Điều dưỡng chính thức',
      phone: '090-111-2233',
      experienceYears: 6,
      specialties: ['wound-dressing', 'post-surgery', 'vitals-monitoring'],
      serviceAreas: ['Bình Thạnh', 'Phú Nhuận', 'Quận 1'],
      authStatus: NURSE_AUTH_STATUS.AUTHORIZED,
      authorizedCareTypes: ['wound-dressing', 'post-surgery', 'vitals-monitoring'],
      certificates: [
        { id: id('cert'), name: 'Chứng chỉ hành nghề Điều dưỡng', number: 'DD-2019-00231', issuedBy: 'Sở Y tế TP.HCM' },
      ],
      availability: [
        { id: id('avail'), weekday: 1, start: '17:00', end: '21:00' },
        { id: id('avail'), weekday: 3, start: '17:00', end: '21:00' },
        { id: id('avail'), weekday: 6, start: '08:00', end: '17:00' },
      ],
      rating: 4.8,
    },
    {
      id: nurse2,
      hospitalId: hosp1,
      name: 'Trần Thị Hoa',
      rank: 'Điều dưỡng chính thức',
      phone: '090-222-3344',
      experienceYears: 3,
      specialties: ['mobility-support', 'elderly-care'],
      serviceAreas: ['Bình Thạnh', 'Thủ Đức'],
      authStatus: NURSE_AUTH_STATUS.AUTHORIZED,
      authorizedCareTypes: ['mobility-support', 'elderly-care'],
      certificates: [
        { id: id('cert'), name: 'Chứng chỉ hành nghề Điều dưỡng', number: 'DD-2022-00987', issuedBy: 'Sở Y tế TP.HCM' },
      ],
      availability: [
        { id: id('avail'), weekday: 2, start: '18:00', end: '22:00' },
        { id: id('avail'), weekday: 4, start: '18:00', end: '22:00' },
      ],
      rating: 4.5,
    },
    {
      id: nurse3,
      hospitalId: hosp1,
      name: 'Lê Văn Bình',
      rank: 'Y tá',
      phone: '090-333-4455',
      experienceYears: 1,
      specialties: ['vitals-monitoring', 'medication'],
      serviceAreas: ['Bình Thạnh'],
      authStatus: NURSE_AUTH_STATUS.DRAFT,
      authorizedCareTypes: [],
      certificates: [],
      availability: [],
      rating: null,
    },
    {
      id: nurse4,
      hospitalId: hosp2,
      name: 'Phạm Thị Lan',
      rank: 'Điều dưỡng chính thức',
      phone: '090-444-5566',
      experienceYears: 8,
      specialties: ['post-surgery', 'wound-dressing', 'medication'],
      serviceAreas: ['Quận 5', 'Quận 3', 'Quận 1'],
      authStatus: NURSE_AUTH_STATUS.AUTHORIZED,
      authorizedCareTypes: ['post-surgery', 'wound-dressing', 'medication'],
      certificates: [
        { id: id('cert'), name: 'Chứng chỉ hành nghề Điều dưỡng', number: 'DD-2016-00120', issuedBy: 'Sở Y tế TP.HCM' },
        { id: id('cert'), name: 'Chứng chỉ Chăm sóc vết thương nâng cao', number: 'WC-2020-0456', issuedBy: 'Hội Điều dưỡng VN' },
      ],
      availability: [
        { id: id('avail'), weekday: 1, start: '17:30', end: '21:30' },
        { id: id('avail'), weekday: 5, start: '17:30', end: '21:30' },
        { id: id('avail'), weekday: 0, start: '08:00', end: '18:00' },
      ],
      rating: 4.9,
    },
    {
      id: nurse5,
      hospitalId: hosp2,
      name: 'Đỗ Minh Tâm',
      rank: 'Điều dưỡng chính thức',
      phone: '090-555-6677',
      experienceYears: 4,
      specialties: ['elderly-care', 'mobility-support', 'vitals-monitoring'],
      serviceAreas: ['Quận 5', 'Quận 7'],
      authStatus: NURSE_AUTH_STATUS.AUTHORIZED,
      authorizedCareTypes: ['elderly-care', 'mobility-support', 'vitals-monitoring'],
      certificates: [
        { id: id('cert'), name: 'Chứng chỉ hành nghề Điều dưỡng', number: 'DD-2021-00789', issuedBy: 'Sở Y tế TP.HCM' },
      ],
      availability: [
        { id: id('avail'), weekday: 2, start: '17:00', end: '20:00' },
        { id: id('avail'), weekday: 3, start: '17:00', end: '20:00' },
        { id: id('avail'), weekday: 6, start: '13:00', end: '18:00' },
      ],
      rating: 4.6,
    },
    {
      id: nurse6,
      hospitalId: hosp2,
      name: 'Vũ Thị Yến',
      rank: 'Điều dưỡng chính thức',
      phone: '090-666-7788',
      experienceYears: 5,
      specialties: ['wound-dressing', 'medication'],
      serviceAreas: ['Quận 5'],
      authStatus: NURSE_AUTH_STATUS.SUSPENDED,
      authorizedCareTypes: ['wound-dressing', 'medication'],
      certificates: [
        { id: id('cert'), name: 'Chứng chỉ hành nghề Điều dưỡng', number: 'DD-2019-00456', issuedBy: 'Sở Y tế TP.HCM' },
      ],
      availability: [{ id: id('avail'), weekday: 4, start: '17:00', end: '20:00' }],
      rating: 4.2,
    },
  ]

  const patient1 = 'patient-an'
  const patient2 = 'patient-thu'

  const patients = [
    {
      id: patient1,
      name: 'Nguyễn Văn An',
      phone: '091-234-5678',
      district: 'Bình Thạnh',
      address: '12 Điện Biên Phủ, Bình Thạnh',
      familyContacts: [
        { id: id('fc'), name: 'Nguyễn Thị Bích (con gái)', phone: '091-234-9999', relation: 'Con gái' },
      ],
    },
    {
      id: patient2,
      name: 'Trần Thị Thu',
      phone: '092-345-6789',
      district: 'Quận 5',
      address: '45 Trần Hưng Đạo, Quận 5',
      familyContacts: [
        { id: id('fc'), name: 'Trần Văn Long (con trai)', phone: '092-345-1111', relation: 'Con trai' },
      ],
    },
  ]

  const sampleRequestId = id('cr')
  const sampleBookingId = id('bk')

  const careRequests = [
    {
      id: sampleRequestId,
      patientId: patient1,
      careType: 'post-surgery',
      district: 'Bình Thạnh',
      desiredStartDate: '2026-08-10',
      frequency: 'weekly',
      weekdays: [1, 3],
      timeSlot: { start: '17:00', end: '19:00' },
      sessionDuration: 60,
      notes: 'Bệnh nhân vừa mổ ruột thừa, cần thay băng và theo dõi vết mổ.',
      attachments: [],
      status: CARE_REQUEST_STATUS.COMPLETED,
      createdBy: 'patient',
      matchedNurseIds: [nurse1],
      bookingId: sampleBookingId,
      createdAt: '2026-08-05T09:00:00.000Z',
    },
  ]

  const bookings = [
    {
      id: sampleBookingId,
      careRequestId: sampleRequestId,
      patientId: patient1,
      nurseId: nurse1,
      status: BOOKING_STATUS.IN_PROGRESS,
      createdAt: '2026-08-05T09:30:00.000Z',
      sessions: [
        {
          id: id('sess'),
          date: '2026-08-10',
          start: '17:00',
          end: '19:00',
          status: SESSION_STATUS.COMPLETED,
          nurseId: nurse1,
        },
        {
          id: id('sess'),
          date: '2026-08-12',
          start: '17:00',
          end: '19:00',
          status: SESSION_STATUS.REASSIGNED,
          nurseId: nurse2,
          history: [
            { nurseId: nurse1, reason: 'Đột xuất có ca trực tại bệnh viện', reportedAt: '2026-08-11T20:00:00.000Z' },
          ],
        },
        {
          id: id('sess'),
          date: '2026-08-17',
          start: '17:00',
          end: '19:00',
          status: SESSION_STATUS.CONFIRMED,
          nurseId: nurse1,
        },
      ],
    },
  ]

  const sosEvents = [
    {
      id: id('sos'),
      bookingId: sampleBookingId,
      sessionId: bookings[0].sessions[0].id,
      triggeredBy: 'nurse',
      type: 'call_doctor',
      note: 'Vết mổ có dấu hiệu sưng đỏ nhẹ, đã gọi bác sĩ phụ trách tư vấn.',
      location: { lat: 10.8, lng: 106.71 },
      createdAt: '2026-08-10T18:10:00.000Z',
    },
  ]

  const pricing = [
    { id: id('price'), hospitalId: hosp1, careType: 'wound-dressing', unit: 'buổi', price: 150000 },
    { id: id('price'), hospitalId: hosp1, careType: 'post-surgery', unit: 'buổi', price: 250000 },
    { id: id('price'), hospitalId: hosp1, careType: 'vitals-monitoring', unit: 'buổi', price: 120000 },
    { id: id('price'), hospitalId: hosp1, careType: 'mobility-support', unit: 'buổi', price: 180000 },
    { id: id('price'), hospitalId: hosp1, careType: 'elderly-care', unit: 'buổi', price: 200000 },
    { id: id('price'), hospitalId: hosp2, careType: 'post-surgery', unit: 'buổi', price: 280000 },
    { id: id('price'), hospitalId: hosp2, careType: 'wound-dressing', unit: 'buổi', price: 160000 },
    { id: id('price'), hospitalId: hosp2, careType: 'elderly-care', unit: 'buổi', price: 210000 },
  ]

  return {
    hospitals,
    nurses,
    patients,
    careRequests,
    bookings,
    sosEvents,
    pricing,
    notifications: [],
  }
}
