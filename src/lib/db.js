import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import { getState, setState } from './store'
import {
  CARE_REQUEST_STATUS,
  NURSE_AUTH_STATUS,
  SESSION_STATUS,
  BOOKING_STATUS,
} from './constants'

const genId = (prefix) => `${prefix}-${uuid().slice(0, 8)}`
const now = () => new Date().toISOString()

// ---------- selectors ----------

export const getHospital = (state, id) => state.hospitals.find((h) => h.id === id)
export const getNurse = (state, id) => state.nurses.find((n) => n.id === id)
export const getPatient = (state, id) => state.patients.find((p) => p.id === id)
export const getCareRequest = (state, id) => state.careRequests.find((c) => c.id === id)
export const getBooking = (state, id) => state.bookings.find((b) => b.id === id)

export const listNursesByHospital = (state, hospitalId) =>
  state.nurses.filter((n) => n.hospitalId === hospitalId)

export const listCareRequestsByPatient = (state, patientId) =>
  state.careRequests
    .filter((c) => c.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export const listBookingsByPatient = (state, patientId) =>
  state.bookings.filter((b) => b.patientId === patientId)

export const listBookingsByNurse = (state, nurseId) =>
  state.bookings.filter((b) => b.sessions.some((s) => s.nurseId === nurseId))

export function computeBookingStatus(booking) {
  const today = dayjs().format('YYYY-MM-DD')
  const relevant = booking.sessions.filter((s) => s.status !== SESSION_STATUS.CANNOT_PERFORM)
  const allCompleted = relevant.length > 0 && relevant.every((s) => s.status === SESSION_STATUS.COMPLETED || s.date < today)
  if (allCompleted) return BOOKING_STATUS.COMPLETED
  const started = booking.sessions.some((s) => s.date <= today)
  return started ? BOOKING_STATUS.IN_PROGRESS : BOOKING_STATUS.CONFIRMED
}

export const listSosEventsForHospital = (state, hospitalId) => {
  const nurseIds = new Set(listNursesByHospital(state, hospitalId).map((n) => n.id))
  return state.sosEvents.filter((e) => {
    const booking = getBooking(state, e.bookingId)
    return booking && nurseIds.has(booking.nurseId)
  })
}

export const listNotificationsFor = (state, role, targetId) =>
  (state.notifications || [])
    .filter((n) => n.role === role && n.targetId === targetId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export function computeNorthStarMetrics(state) {
  const totalRequests = state.careRequests.length
  const completed = state.careRequests.filter((c) => c.status === CARE_REQUEST_STATUS.COMPLETED).length
  const authorizedNurses = state.nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED)
  const activeNurseIds = new Set(state.bookings.flatMap((b) => b.sessions.map((s) => s.nurseId)))
  const dormantNurses = authorizedNurses.filter((n) => !activeNurseIds.has(n.id))
  return {
    totalRequests,
    completed,
    completionRate: totalRequests ? completed / totalRequests : 0,
    authorizedNurseCount: authorizedNurses.length,
    dormantNurseCount: dormantNurses.length,
    dormantRate: authorizedNurses.length ? dormantNurses.length / authorizedNurses.length : 0,
    activeHospitals: state.hospitals.length,
  }
}

// ---------- notifications ----------

function notify(state, { role, targetId, message }) {
  state.notifications = [
    ...(state.notifications || []),
    { id: genId('ntf'), role, targetId, message, createdAt: now(), read: false },
  ]
}

// ---------- Care Request ----------

const HARD_FILTER_MATCH_LIMIT = 5

function nurseAvailabilityOverlaps(nurse, weekdays, timeSlot) {
  if (!timeSlot) return true
  const days = weekdays && weekdays.length ? weekdays : [0, 1, 2, 3, 4, 5, 6]
  return nurse.availability.some((slot) => {
    if (!days.includes(slot.weekday)) return false
    return slot.start <= timeSlot.start && slot.end >= timeSlot.end
  })
}

function runMatchingLogic(state, careRequest) {
  const candidates = state.nurses.filter((nurse) => {
    if (nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED) return false
    if (!nurse.authorizedCareTypes.includes(careRequest.careType)) return false
    if (!nurse.serviceAreas.includes(careRequest.district)) return false
    if (!nurseAvailabilityOverlaps(nurse, careRequest.weekdays, careRequest.timeSlot)) return false
    return true
  })

  const ranked = [...candidates].sort((a, b) => {
    if (b.experienceYears !== a.experienceYears) return b.experienceYears - a.experienceYears
    return (b.rating || 0) - (a.rating || 0)
  })

  return ranked.slice(0, HARD_FILTER_MATCH_LIMIT).map((n) => n.id)
}

export function createCareRequest(payload) {
  const id = genId('cr')
  setState((state) => {
    const careRequest = {
      id,
      patientId: payload.patientId,
      careType: payload.careType,
      district: payload.district,
      desiredStartDate: payload.desiredStartDate,
      frequency: payload.frequency,
      weekdays: payload.weekdays || [],
      timeSlot: payload.timeSlot,
      sessionDuration: payload.sessionDuration,
      notes: payload.notes || '',
      attachments: payload.attachments || [],
      status: CARE_REQUEST_STATUS.MATCHING,
      createdBy: payload.createdBy,
      matchedNurseIds: [],
      bookingId: null,
      lastMatchedAt: null,
      createdAt: now(),
    }
    const matchedNurseIds = runMatchingLogic(state, careRequest)
    careRequest.matchedNurseIds = matchedNurseIds
    careRequest.status = matchedNurseIds.length ? CARE_REQUEST_STATUS.MATCHED : CARE_REQUEST_STATUS.NO_MATCH
    careRequest.lastMatchedAt = now()

    matchedNurseIds.forEach((nurseId) => {
      notify(state, {
        role: 'nurse',
        targetId: nurseId,
        message: 'Bạn được đề xuất phù hợp cho một yêu cầu chăm sóc mới.',
      })
    })

    return { ...state, careRequests: [...state.careRequests, careRequest] }
  })
  return id
}

export function retryMatching(careRequestId) {
  setState((state) => {
    const careRequest = getCareRequest(state, careRequestId)
    if (!careRequest) return state
    const matchedNurseIds = runMatchingLogic(state, careRequest)
    const updated = {
      ...careRequest,
      matchedNurseIds,
      status: matchedNurseIds.length ? CARE_REQUEST_STATUS.MATCHED : CARE_REQUEST_STATUS.NO_MATCH,
      lastMatchedAt: now(),
    }
    matchedNurseIds.forEach((nurseId) => {
      notify(state, {
        role: 'nurse',
        targetId: nurseId,
        message: 'Bạn được đề xuất phù hợp cho một yêu cầu chăm sóc mới.',
      })
    })
    return {
      ...state,
      careRequests: state.careRequests.map((c) => (c.id === careRequestId ? updated : c)),
    }
  })
}

export function cancelCareRequest(careRequestId) {
  setState((state) => ({
    ...state,
    careRequests: state.careRequests.map((c) =>
      c.id === careRequestId && c.status !== CARE_REQUEST_STATUS.COMPLETED
        ? { ...c, status: CARE_REQUEST_STATUS.CANCELLED }
        : c,
    ),
  }))
}

// ---------- Booking & Scheduling ----------

function buildSessionDates({ startDate, endDate, frequency, weekdays }) {
  const dates = []
  const start = dayjs(startDate)
  const end = dayjs(endDate || startDate)
  if (frequency === 'once') {
    dates.push(start.format('YYYY-MM-DD'))
    return dates
  }
  let cursor = start
  while (cursor.isSame(end) || cursor.isBefore(end)) {
    if (frequency === 'daily' || (weekdays || []).includes(cursor.day())) {
      dates.push(cursor.format('YYYY-MM-DD'))
    }
    cursor = cursor.add(1, 'day')
  }
  return dates
}

export function createBooking({ careRequestId, nurseId, startDate, endDate, frequency, weekdays, timeSlot }) {
  const bookingId = genId('bk')
  setState((state) => {
    const careRequest = getCareRequest(state, careRequestId)
    if (!careRequest) return state
    const dates = buildSessionDates({ startDate, endDate, frequency, weekdays })
    const booking = {
      id: bookingId,
      careRequestId,
      patientId: careRequest.patientId,
      nurseId,
      status: BOOKING_STATUS.CONFIRMED,
      createdAt: now(),
      sessions: dates.map((date) => ({
        id: genId('sess'),
        date,
        start: timeSlot.start,
        end: timeSlot.end,
        status: SESSION_STATUS.CONFIRMED,
        nurseId,
      })),
    }
    notify(state, { role: 'nurse', targetId: nurseId, message: 'Bạn có một lịch chăm sóc mới đã được xác nhận.' })
    notify(state, {
      role: 'patient',
      targetId: careRequest.patientId,
      message: 'Lịch chăm sóc của bạn đã được xác nhận.',
    })
    return {
      ...state,
      bookings: [...state.bookings, booking],
      careRequests: state.careRequests.map((c) =>
        c.id === careRequestId ? { ...c, status: CARE_REQUEST_STATUS.COMPLETED, bookingId } : c,
      ),
    }
  })
  return bookingId
}

export function reportCannotPerform({ bookingId, sessionId, reason }) {
  setState((state) => {
    const booking = getBooking(state, bookingId)
    if (!booking) return state
    const session = booking.sessions.find((s) => s.id === sessionId)
    if (!session) return state
    const careRequest = getCareRequest(state, booking.careRequestId)
    const originalNurseId = session.nurseId

    const candidateIds = (careRequest?.matchedNurseIds || []).filter((nid) => nid !== originalNurseId)
    const replacement = candidateIds
      .map((nid) => getNurse(state, nid))
      .find((nurse) => {
        if (!nurse || nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED) return false
        const busy = state.bookings.some((b) =>
          b.sessions.some((s) => s.date === session.date && s.nurseId === nurse.id && s.status !== SESSION_STATUS.CANNOT_PERFORM),
        )
        return !busy
      })

    const history = [
      ...(session.history || []),
      { nurseId: originalNurseId, reason, reportedAt: now() },
    ]

    const updatedSession = replacement
      ? { ...session, status: SESSION_STATUS.REASSIGNED, nurseId: replacement.id, history }
      : { ...session, status: SESSION_STATUS.CANNOT_PERFORM, history, needsManualReassignment: true }

    const hospitalId = getNurse(state, originalNurseId)?.hospitalId
    notify(state, {
      role: 'patient',
      targetId: booking.patientId,
      message: replacement
        ? `Điều dưỡng đã đổi cho buổi ${session.date}. Điều dưỡng mới: ${replacement.name}.`
        : `Điều dưỡng báo không thể thực hiện buổi ${session.date}. Chúng tôi đang tìm người thay thế.`,
    })
    if (hospitalId) {
      notify(state, {
        role: 'hospital',
        targetId: hospitalId,
        message: replacement
          ? `Đã tự động đổi điều dưỡng cho buổi ${session.date} (booking ${bookingId}).`
          : `Cần hỗ trợ tìm điều dưỡng thay thế cho buổi ${session.date} (booking ${bookingId}).`,
      })
    }

    return {
      ...state,
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, sessions: b.sessions.map((s) => (s.id === sessionId ? updatedSession : s)) }
          : b,
      ),
    }
  })
}

export function requestReschedule({ bookingId, sessionId, note }) {
  setState((state) => {
    const booking = getBooking(state, bookingId)
    const session = booking?.sessions.find((s) => s.id === sessionId)
    const nurse = booking ? getNurse(state, booking.nurseId) : null
    if (booking && session && nurse) {
      notify(state, {
        role: 'hospital',
        targetId: nurse.hospitalId,
        message: `Bệnh nhân yêu cầu đổi lịch buổi ${session.date} (booking ${bookingId}): ${note}`,
      })
    }
    return { ...state }
  })
}

export function manualReassignSession({ bookingId, sessionId, nurseId }) {
  setState((state) => ({
    ...state,
    bookings: state.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            sessions: b.sessions.map((s) =>
              s.id === sessionId
                ? { ...s, status: SESSION_STATUS.REASSIGNED, nurseId, needsManualReassignment: false }
                : s,
            ),
          }
        : b,
    ),
  }))
}

// ---------- SOS ----------

export function triggerSOS({ bookingId, sessionId, triggeredBy, type, note, location }) {
  setState((state) => {
    const booking = getBooking(state, bookingId)
    const nurse = booking ? getNurse(state, booking.nurseId) : null
    const event = {
      id: genId('sos'),
      bookingId,
      sessionId,
      triggeredBy,
      type,
      note: note || '',
      location: location || null,
      createdAt: now(),
    }
    if (booking && nurse) {
      notify(state, {
        role: 'hospital',
        targetId: nurse.hospitalId,
        message: `Cảnh báo SOS trong ca đang diễn ra (booking ${bookingId}).`,
      })
      notify(state, {
        role: 'patient',
        targetId: booking.patientId,
        message: 'Có cảnh báo SOS được kích hoạt trong ca chăm sóc của bạn.',
      })
    }
    return { ...state, sosEvents: [...state.sosEvents, event] }
  })
}

// ---------- Hospital Roster Management ----------

export function addNurse(hospitalId, data) {
  const id = genId('nurse')
  setState((state) => ({
    ...state,
    nurses: [
      ...state.nurses,
      {
        id,
        hospitalId,
        name: data.name,
        rank: data.rank,
        phone: data.phone,
        experienceYears: Number(data.experienceYears) || 0,
        specialties: data.specialties || [],
        serviceAreas: data.serviceAreas || [],
        authStatus: NURSE_AUTH_STATUS.DRAFT,
        authorizedCareTypes: [],
        certificates: [],
        availability: [],
        rating: null,
      },
    ],
  }))
  return id
}

export function updateNurse(nurseId, patch) {
  setState((state) => ({
    ...state,
    nurses: state.nurses.map((n) => (n.id === nurseId ? { ...n, ...patch } : n)),
  }))
}

export function addCertificate(nurseId, cert) {
  setState((state) => ({
    ...state,
    nurses: state.nurses.map((n) =>
      n.id === nurseId ? { ...n, certificates: [...n.certificates, { id: genId('cert'), ...cert }] } : n,
    ),
  }))
}

export function removeCertificate(nurseId, certId) {
  setState((state) => ({
    ...state,
    nurses: state.nurses.map((n) =>
      n.id === nurseId ? { ...n, certificates: n.certificates.filter((c) => c.id !== certId) } : n,
    ),
  }))
}

export function addAvailability(nurseId, slot) {
  setState((state) => ({
    ...state,
    nurses: state.nurses.map((n) =>
      n.id === nurseId ? { ...n, availability: [...n.availability, { id: genId('avail'), ...slot }] } : n,
    ),
  }))
}

export function removeAvailability(nurseId, slotId) {
  setState((state) => ({
    ...state,
    nurses: state.nurses.map((n) =>
      n.id === nurseId ? { ...n, availability: n.availability.filter((a) => a.id !== slotId) } : n,
    ),
  }))
}

export function setNurseAuthStatus(nurseId, status, authorizedCareTypes) {
  const state = getState()
  const nurse = getNurse(state, nurseId)
  if (!nurse) return { ok: false, error: 'Không tìm thấy điều dưỡng.' }
  if (status === NURSE_AUTH_STATUS.AUTHORIZED && nurse.certificates.length === 0) {
    return { ok: false, error: 'Cần nhập tối thiểu 1 chứng chỉ hành nghề trước khi cấp phép.' }
  }
  setState((s) => ({
    ...s,
    nurses: s.nurses.map((n) =>
      n.id === nurseId
        ? {
            ...n,
            authStatus: status,
            authorizedCareTypes:
              status === NURSE_AUTH_STATUS.AUTHORIZED
                ? authorizedCareTypes && authorizedCareTypes.length
                  ? authorizedCareTypes
                  : n.specialties
                : status === NURSE_AUTH_STATUS.REVOKED || status === NURSE_AUTH_STATUS.SUSPENDED
                  ? []
                  : n.authorizedCareTypes,
          }
        : n,
    ),
  }))
  return { ok: true }
}

// ---------- Pricing ----------

export function setPricing(hospitalId, careType, unit, price) {
  setState((state) => {
    const existing = state.pricing.find((p) => p.hospitalId === hospitalId && p.careType === careType)
    if (existing) {
      return {
        ...state,
        pricing: state.pricing.map((p) => (p === existing ? { ...p, unit, price } : p)),
      }
    }
    return {
      ...state,
      pricing: [...state.pricing, { id: genId('price'), hospitalId, careType, unit, price }],
    }
  })
}

export const getPricing = (state, hospitalId, careType) =>
  state.pricing.find((p) => p.hospitalId === hospitalId && p.careType === careType)

// ---------- Platform Admin: hospitals / accounts ----------

export function addHospital(data) {
  const id = genId('hosp')
  setState((state) => ({
    ...state,
    hospitals: [
      ...state.hospitals,
      { id, name: data.name, address: data.address, district: data.district, phone: data.phone, status: 'active', createdAt: now() },
    ],
  }))
  return id
}

export function updateHospital(hospitalId, patch) {
  setState((state) => ({
    ...state,
    hospitals: state.hospitals.map((h) => (h.id === hospitalId ? { ...h, ...patch } : h)),
  }))
}

export function setHospitalStatus(hospitalId, status) {
  updateHospital(hospitalId, { status })
}

export function addPatient(data) {
  const id = genId('patient')
  setState((state) => ({
    ...state,
    patients: [...state.patients, { id, familyContacts: [], ...data }],
  }))
  return id
}

export function addFamilyContact(patientId, contact) {
  setState((state) => ({
    ...state,
    patients: state.patients.map((p) =>
      p.id === patientId
        ? { ...p, familyContacts: [...p.familyContacts, { id: genId('fc'), ...contact }] }
        : p,
    ),
  }))
}

export function removeFamilyContact(patientId, contactId) {
  setState((state) => ({
    ...state,
    patients: state.patients.map((p) =>
      p.id === patientId
        ? { ...p, familyContacts: p.familyContacts.filter((c) => c.id !== contactId) }
        : p,
    ),
  }))
}
