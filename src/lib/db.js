import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import { getState, setState } from './store'
import {
  CARE_REQUEST_STATUS,
  NURSE_AUTH_STATUS,
  SESSION_STATUS,
  BOOKING_STATUS,
  RECURRING_SESSION_COUNT,
} from './constants'
import { careTypeLabel } from './format'

const genId = (prefix) => `${prefix}-${uuid().slice(0, 8)}`
const now = () => new Date().toISOString()

// ---------- selectors ----------

export const getHospital = (state, id) => state.hospitals.find((h) => h.id === id)
export const getNurse = (state, id) => state.nurses.find((n) => n.id === id)
export const getPatient = (state, id) => state.patients.find((p) => p.id === id)

// The single contact marked primary (it may still be awaiting confirmation), or null when none is set.
export const getPrimaryFamilyContact = (state, patientId) =>
  (getPatient(state, patientId)?.familyContacts || []).find((c) => c.primary) || null

export const getFamilyInvite = (state, code) =>
  (state.familyInvites || []).find((i) => i.code.toUpperCase() === String(code || '').toUpperCase()) || null

// 'active' | 'used' | 'revoked' | 'expired'
export const familyInviteStatus = (invite, now = Date.now()) => {
  if (invite.usedAt) return 'used'
  if (invite.revokedAt) return 'revoked'
  return new Date(invite.expiresAt).getTime() <= now ? 'expired' : 'active'
}

export const getActiveFamilyInvite = (state, patientId) =>
  (state.familyInvites || []).find((i) => i.patientId === patientId && familyInviteStatus(i) === 'active') || null
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

export const listPendingRequestsForNurse = (state, nurseId) =>
  state.careRequests.filter(
    (c) => c.status === CARE_REQUEST_STATUS.NURSE_PENDING && c.selectedNurseId === nurseId,
  )

// Every request a nurse has been involved in, tagged with how it relates to them:
// pending (waiting for their answer), suggested (on the shortlist, patient hasn't picked),
// accepted, declined, or closed (cancelled / given to another nurse).
export function listNurseRequests(state, nurseId) {
  return state.careRequests
    .map((c) => {
      const involved = c.matchedNurseIds.includes(nurseId) || c.selectedNurseId === nurseId || c.declinedNurseIds.includes(nurseId)
      if (!involved) return null
      let relation = 'closed'
      if (c.declinedNurseIds.includes(nurseId)) relation = 'declined'
      else if (c.status === CARE_REQUEST_STATUS.NURSE_PENDING && c.selectedNurseId === nurseId) relation = 'pending'
      else if (c.status === CARE_REQUEST_STATUS.COMPLETED && c.selectedNurseId === nurseId) relation = 'accepted'
      else if (c.status === CARE_REQUEST_STATUS.MATCHED) relation = 'suggested'
      return { careRequest: c, relation }
    })
    .filter(Boolean)
}

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
    if (e.nurseId && nurseIds.has(e.nurseId)) return true
    const booking = getBooking(state, e.bookingId)
    const session = booking?.sessions.find((s) => s.id === e.sessionId)
    return booking && nurseIds.has(session?.nurseId || booking.nurseId)
  })
}

// Nurse on duty for an SOS event (the session's nurse, else the booking's, else who raised it).
export function getSosNurse(state, event) {
  const booking = getBooking(state, event.bookingId)
  const session = booking?.sessions.find((s) => s.id === event.sessionId)
  return getNurse(state, session?.nurseId || booking?.nurseId || event.nurseId)
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

function notify(state, { role, targetId, message, link }) {
  state.notifications = [
    ...(state.notifications || []),
    { id: genId('ntf'), role, targetId, message, link, createdAt: now(), read: false },
  ]
}

const nurseRequestLink = (careRequestId) => `/hospital/nurse/requests?id=${careRequestId}`

function requestSummary(state, careRequest) {
  const patient = getPatient(state, careRequest.patientId)
  return `${patient?.name || 'Bệnh nhân'} · ${careTypeLabel(careRequest.careType)} tại ${careRequest.district}`
}

// Platform-admin audit trail ("Nhật ký hoạt động").
const ADMIN_ACTOR = 'Linh Phạm'
function audit(state, { action, targetType, targetId, targetName, detail, actor = ADMIN_ACTOR }) {
  state.auditLogs = [...(state.auditLogs || []), { id: genId('au'), at: now(), actor, action, targetType, targetId, targetName, detail }]
}

const STATUS_WORD = { active: 'Hoạt động', suspended: 'Tạm ngưng', locked: 'Khóa' }

export function markNotificationsRead(role, targetId) {
  setState((state) => {
    const hasUnread = (state.notifications || []).some((n) => n.role === role && n.targetId === targetId && !n.read)
    if (!hasUnread) return state
    return {
      ...state,
      notifications: state.notifications.map((n) => (n.role === role && n.targetId === targetId ? { ...n, read: true } : n)),
    }
  })
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

// A nurse can be offered new care only when licensed by their hospital and neither the
// nurse account nor the partner hospital is suspended / locked by the platform.
export function canTakeNewCare(state, nurse) {
  if (nurse.authStatus !== NURSE_AUTH_STATUS.AUTHORIZED) return false
  if ((nurse.accountStatus || 'active') !== 'active') return false
  return (getHospital(state, nurse.hospitalId)?.status || 'active') === 'active'
}

function runMatchingLogic(state, careRequest) {
  const candidates = state.nurses.filter((nurse) => {
    if (!canTakeNewCare(state, nurse)) return false
    if (!nurse.authorizedCareTypes.includes(careRequest.careType)) return false
    if (!nurse.serviceAreas.includes(careRequest.district)) return false
    if (!nurseAvailabilityOverlaps(nurse, careRequest.weekdays, careRequest.timeSlot)) return false
    return true
  })

  const ranked = [...candidates].sort((a, b) => {
    if (b.experienceYears !== a.experienceYears) return b.experienceYears - a.experienceYears
    return (b.rating || 0) - (a.rating || 0)
  })

  return ranked.slice(0, state.settings?.matchLimit || HARD_FILTER_MATCH_LIMIT).map((n) => n.id)
}

// Ranked fallbacks for a request that has no full match (or whose matches all declined).
// Care-type authorisation stays a hard requirement when possible; district and availability
// are relaxed and reported back as reasons so the patient can judge each alternative.
const ALTERNATIVE_LIMIT = 6

export function getAlternativeNurses(state, careRequest, limit = ALTERNATIVE_LIMIT) {
  const excluded = new Set([...(careRequest.declinedNurseIds || []), careRequest.selectedNurseId].filter(Boolean))
  const scored = state.nurses
    .filter((n) => canTakeNewCare(state, n) && !excluded.has(n.id))
    .map((nurse) => {
      const typeOk = nurse.authorizedCareTypes.includes(careRequest.careType)
      const areaOk = nurse.serviceAreas.includes(careRequest.district)
      const timeOk = nurseAvailabilityOverlaps(nurse, careRequest.weekdays, careRequest.timeSlot)
      const score = Math.round((typeOk ? 40 : 0) + (areaOk ? 25 : 0) + (timeOk ? 20 : 0) + ((nurse.rating || 4) / 5) * 15)
      return {
        nurse,
        typeOk,
        score,
        reasons: [
          typeOk
            ? { ok: true, label: 'Được cấp phép đúng loại ca' }
            : { ok: false, label: 'Bệnh viện cần xác nhận chuyên môn cho loại ca này' },
          areaOk ? { ok: true, label: `Phục vụ ${careRequest.district}` } : { ok: false, label: `Khu vực gần: ${nurse.serviceAreas.slice(0, 2).join(', ')}` },
          timeOk ? { ok: true, label: 'Lịch rảnh khớp khung giờ' } : { ok: false, label: 'Cần thỏa thuận lại giờ' },
        ],
      }
    })
  // Prefer nurses authorised for the care type; only fall back to others when none exist.
  const pool = scored.some((s) => s.typeOk) ? scored.filter((s) => s.typeOk) : scored
  return pool.sort((a, b) => b.score - a.score || b.nurse.experienceYears - a.nurse.experienceYears).slice(0, limit)
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
      selectedNurseId: null,
      declinedNurseIds: [],
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
        message: `Yêu cầu mới phù hợp với bạn: ${requestSummary(state, careRequest)}. Đang chờ bệnh nhân chọn điều dưỡng.`,
        link: nurseRequestLink(id),
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
        message: `Yêu cầu mới phù hợp với bạn: ${requestSummary(state, careRequest)}. Đang chờ bệnh nhân chọn điều dưỡng.`,
        link: nurseRequestLink(careRequestId),
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
        ? { ...c, status: CARE_REQUEST_STATUS.CANCELLED, cancelledAt: now() }
        : c,
    ),
  }))
}

// ---------- Nurse response & Booking & Scheduling ----------
//
// A patient picks one nurse from the matched list; that sends the request to the
// nurse for a yes/no response (mirrors the CareShift design reference) rather than
// auto-confirming. Only once the nurse accepts does a real Booking (with concrete
// sessions) get created. A decline cascades to the next matched nurse.

function buildSessionDates({ startDate, frequency, weekdays, count }) {
  if (frequency === 'once') return [dayjs(startDate).format('YYYY-MM-DD')]
  const dates = []
  let cursor = dayjs(startDate)
  let guard = 0
  while (dates.length < count && guard < count * 14) {
    if (frequency === 'daily' || (weekdays || []).includes(cursor.day())) {
      dates.push(cursor.format('YYYY-MM-DD'))
    }
    cursor = cursor.add(1, 'day')
    guard += 1
  }
  return dates
}

export function selectNurseForCareRequest(careRequestId, nurseId) {
  setState((state) => {
    const careRequest = getCareRequest(state, careRequestId)
    const nurse = getNurse(state, nurseId)
    if (!careRequest || !nurse) return state
    notify(state, {
      role: 'nurse',
      targetId: nurseId,
      message: `${requestSummary(state, careRequest)} — bệnh nhân đã chọn bạn. Phản hồi trong 15 phút.`,
      link: nurseRequestLink(careRequestId),
    })
    notify(state, {
      role: 'patient',
      targetId: careRequest.patientId,
      message: `Đã gửi yêu cầu đến ${nurse.name}. Điều dưỡng có 15 phút để chấp nhận hoặc từ chối.`,
      link: `/patient/request/${careRequestId}`,
    })
    return {
      ...state,
      careRequests: state.careRequests.map((c) =>
        c.id === careRequestId
          ? {
              ...c,
              selectedNurseId: nurseId,
              selectedAt: now(),
              matchedNurseIds: c.matchedNurseIds.includes(nurseId) ? c.matchedNurseIds : [...c.matchedNurseIds, nurseId],
              status: CARE_REQUEST_STATUS.NURSE_PENDING,
            }
          : c,
      ),
    }
  })
}

export function respondToCareRequest(careRequestId, decision, { reason } = {}) {
  let bookingId = null
  setState((state) => {
    const careRequest = getCareRequest(state, careRequestId)
    if (!careRequest || !careRequest.selectedNurseId) return state
    const nurseId = careRequest.selectedNurseId
    const nurse = getNurse(state, nurseId)

    if (decision === 'accept') {
      bookingId = genId('bk')
      const dates = buildSessionDates({
        startDate: careRequest.desiredStartDate,
        frequency: careRequest.frequency,
        weekdays: careRequest.weekdays,
        count: RECURRING_SESSION_COUNT,
      })
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
          start: careRequest.timeSlot.start,
          end: careRequest.timeSlot.end,
          status: SESSION_STATUS.CONFIRMED,
          nurseId,
        })),
      }
      notify(state, {
        role: 'patient',
        targetId: careRequest.patientId,
        message: `${nurse?.name || 'Điều dưỡng'} đã xác nhận nhận ca. Lịch chăm sóc đã được tạo.`,
        link: `/patient/bookings/${bookingId}`,
      })
      if (nurse) {
        notify(state, {
          role: 'hospital',
          targetId: nurse.hospitalId,
          message: `${nurse.name} đã nhận 1 ca chăm sóc mới qua CareShift.`,
        })
      }
      return {
        ...state,
        bookings: [...state.bookings, booking],
        careRequests: state.careRequests.map((c) =>
          c.id === careRequestId
            ? { ...c, status: CARE_REQUEST_STATUS.COMPLETED, bookingId, selectedNurseId: nurseId }
            : c,
        ),
      }
    }

    // decline: cascade to the next matched nurse who hasn't declined yet
    const declinedNurseIds = [...careRequest.declinedNurseIds, nurseId]
    const declineReasons = [...(careRequest.declineReasons || []), { nurseId, reason: reason || '', at: now() }]
    const nextNurseId = careRequest.matchedNurseIds.find((id) => !declinedNurseIds.includes(id))
    const declinedBy = `${nurse?.name || 'Điều dưỡng'} đã từ chối yêu cầu${reason ? ` (${reason})` : ''}.`
    notify(state, {
      role: 'patient',
      targetId: careRequest.patientId,
      message: nextNurseId
        ? `${declinedBy} Đang gửi tới ${getNurse(state, nextNurseId)?.name || 'điều dưỡng phù hợp tiếp theo'}.`
        : `${declinedBy} Hãy chọn một điều dưỡng thay thế được gợi ý.`,
      link: `/patient/request/${careRequestId}`,
    })
    if (nextNurseId) {
      notify(state, {
        role: 'nurse',
        targetId: nextNurseId,
        message: `${requestSummary(state, careRequest)} — được chuyển tới bạn. Phản hồi trong 15 phút.`,
        link: nurseRequestLink(careRequestId),
      })
    }
    return {
      ...state,
      careRequests: state.careRequests.map((c) =>
        c.id === careRequestId
          ? {
              ...c,
              declinedNurseIds,
              declineReasons,
              selectedNurseId: nextNurseId || null,
              selectedAt: nextNurseId ? now() : null,
              status: nextNurseId ? CARE_REQUEST_STATUS.NURSE_PENDING : CARE_REQUEST_STATUS.NO_MATCH,
            }
          : c,
      ),
    }
  })
  return bookingId
}

// ---------- Session (one visit) ----------

export function findSession(state, sessionId) {
  for (const booking of state.bookings) {
    const session = booking.sessions.find((s) => s.id === sessionId)
    if (session) return { booking, session }
  }
  return null
}

function patchSession(state, bookingId, sessionId, patch) {
  return {
    ...state,
    bookings: state.bookings.map((b) =>
      b.id === bookingId ? { ...b, sessions: b.sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)) } : b,
    ),
  }
}

export function updateSessionWork(bookingId, sessionId, patch) {
  setState((state) => patchSession(state, bookingId, sessionId, patch))
}

export function completeSession(bookingId, sessionId) {
  setState((state) => {
    const booking = getBooking(state, bookingId)
    const session = booking?.sessions.find((s) => s.id === sessionId)
    if (!session) return state
    const nurse = getNurse(state, session.nurseId)
    notify(state, {
      role: 'patient',
      targetId: booking.patientId,
      message: `${nurse?.name || 'Điều dưỡng'} đã hoàn thành buổi chăm sóc ${dayjs(session.date).format('DD/MM')} (${session.start}–${session.end}).`,
      link: `/patient/bookings/${bookingId}`,
    })
    return patchSession(state, bookingId, sessionId, { status: SESSION_STATUS.COMPLETED, completedAt: now() })
  })
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
      link: `/patient/bookings/${bookingId}`,
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

// Works with or without a booking: the patient-app SOS button is available on every
// page, so when it is pressed outside a session we attach today's session if any.
export function triggerSOS({ bookingId, sessionId, patientId, nurseId, triggeredBy, type, note, location, contactIds = [] }) {
  const eventId = genId('sos')
  setState((state) => {
    let booking = bookingId ? getBooking(state, bookingId) : null
    let session = booking?.sessions.find((s) => s.id === sessionId) || null
    if (!booking && patientId) {
      const today = dayjs().format('YYYY-MM-DD')
      booking = state.bookings.find((b) => b.patientId === patientId && b.sessions.some((s) => s.date === today))
      session = booking?.sessions.find((s) => s.date === today) || null
    }
    const ownerPatientId = patientId || booking?.patientId || null
    const nurse = booking ? getNurse(state, session?.nurseId || booking.nurseId) : nurseId ? getNurse(state, nurseId) : null
    const event = {
      id: eventId,
      patientId: ownerPatientId,
      bookingId: booking?.id || null,
      sessionId: session?.id || null,
      nurseId: nurse?.id || null,
      status: 'open',
      triggeredBy,
      type,
      contactIds,
      note: note || '',
      location: location || null,
      createdAt: now(),
    }
    if (nurse) {
      notify(state, {
        role: 'hospital',
        targetId: nurse.hospitalId,
        message: `Cảnh báo SOS từ ${triggeredBy === 'nurse' ? `điều dưỡng ${nurse.name}` : 'bệnh nhân'}${booking ? ` trong ca chăm sóc ${booking.id}` : ''}.`,
        link: `/hospital/admin/sos-log?id=${eventId}`,
      })
    }
    if (ownerPatientId) {
      notify(state, {
        role: 'patient',
        targetId: ownerPatientId,
        message: 'Đã ghi nhận cảnh báo SOS của bạn.',
        link: booking ? `/patient/bookings/${booking.id}` : undefined,
      })
    }
    return { ...state, sosEvents: [...state.sosEvents, event] }
  })
  return eventId
}

// Location is attached after the fact so raising the alert never waits on GPS.
export function attachSosLocation(eventId, location) {
  setState((state) => ({
    ...state,
    sosEvents: state.sosEvents.map((e) => (e.id === eventId ? { ...e, location } : e)),
  }))
}

// Hospital coordinator handling an SOS: acknowledge (đang xử lý) or resolve, with a note.
export function updateSosStatus(eventId, status, resolution) {
  setState((state) => {
    const event = state.sosEvents.find((e) => e.id === eventId)
    if (!event) return state
    const nurse = getSosNurse(state, event)
    const at = now()
    const patch = {
      status,
      ...(resolution !== undefined ? { resolution } : {}),
      ...(status === 'acknowledged' && !event.acknowledgedAt ? { acknowledgedAt: at } : {}),
      ...(status === 'resolved' ? { resolvedAt: at, acknowledgedAt: event.acknowledgedAt || at } : {}),
    }
    if (nurse && event.triggeredBy === 'nurse') {
      notify(state, {
        role: 'nurse',
        targetId: nurse.id,
        message: status === 'resolved' ? `Bệnh viện đã xử lý xong cảnh báo SOS của bạn.${resolution ? ` ${resolution}` : ''}` : 'Bệnh viện đã tiếp nhận cảnh báo SOS của bạn và đang xử lý.',
      })
    }
    return { ...state, sosEvents: state.sosEvents.map((e) => (e.id === eventId ? { ...e, ...patch } : e)) }
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
        reviewCount: 0,
        completedCases: 0,
        bio: '',
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

export function updateCertificate(nurseId, certId, patch) {
  setState((state) => ({
    ...state,
    nurses: state.nurses.map((n) =>
      n.id === nurseId ? { ...n, certificates: n.certificates.map((c) => (c.id === certId ? { ...c, ...patch } : c)) } : n,
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

// ---------- Platform Admin: hospitals / accounts ----------

export function addHospital(data) {
  const id = genId('hosp')
  setState((state) => {
    const hospital = { branches: [], staff: [], status: 'active', ...data, id, createdAt: now() }
    audit(state, { action: 'Thêm bệnh viện đối tác', targetType: 'hospital', targetId: id, targetName: hospital.name, detail: hospital.contract?.number })
    return { ...state, hospitals: [...state.hospitals, hospital] }
  })
  return id
}

export function updateHospital(hospitalId, patch, { auditAction = 'Cập nhật thông tin' } = {}) {
  setState((state) => {
    const hospital = getHospital(state, hospitalId)
    if (!hospital) return state
    audit(state, { action: auditAction, targetType: 'hospital', targetId: hospitalId, targetName: hospital.name, detail: Object.keys(patch).join(', ') })
    return { ...state, hospitals: state.hospitals.map((h) => (h.id === hospitalId ? { ...h, ...patch } : h)) }
  })
}

// Hoạt động / Tạm ngưng (no new care) / Khóa (no sign-in) for a partner hospital.
export function setHospitalStatus(hospitalId, status, reason = '') {
  setState((state) => {
    const hospital = getHospital(state, hospitalId)
    if (!hospital) return state
    audit(state, { action: `Đổi trạng thái → ${STATUS_WORD[status]}`, targetType: 'hospital', targetId: hospitalId, targetName: hospital.name, detail: reason })
    notify(state, { role: 'hospital', targetId: hospitalId, message: `CareShift đã chuyển trạng thái bệnh viện sang “${STATUS_WORD[status]}”.${reason ? ` Lý do: ${reason}` : ''}` })
    return {
      ...state,
      hospitals: state.hospitals.map((h) => (h.id === hospitalId ? { ...h, status, statusReason: reason, statusChangedAt: now() } : h)),
    }
  })
}

export function setStaffStatus(hospitalId, staffId, status) {
  setState((state) => {
    const hospital = getHospital(state, hospitalId)
    const member = hospital?.staff?.find((m) => m.id === staffId)
    if (!member) return state
    audit(state, { action: `Đổi trạng thái → ${STATUS_WORD[status]}`, targetType: 'staff', targetId: staffId, targetName: `${member.name} (${hospital.name})` })
    return {
      ...state,
      hospitals: state.hospitals.map((h) => (h.id === hospitalId ? { ...h, staff: h.staff.map((m) => (m.id === staffId ? { ...m, status } : m)) } : h)),
    }
  })
}

export function setNurseAccountStatus(nurseId, status, reason = '') {
  setState((state) => {
    const nurse = getNurse(state, nurseId)
    if (!nurse) return state
    audit(state, { action: `Đổi trạng thái tài khoản → ${STATUS_WORD[status]}`, targetType: 'nurse', targetId: nurseId, targetName: nurse.name, detail: reason })
    notify(state, { role: 'nurse', targetId: nurseId, message: `Tài khoản của bạn đã chuyển sang “${STATUS_WORD[status]}”.${reason ? ` Lý do: ${reason}` : ''}` })
    return { ...state, nurses: state.nurses.map((n) => (n.id === nurseId ? { ...n, accountStatus: status, accountStatusReason: reason } : n)) }
  })
}

export function setPatientAccountStatus(patientId, status, reason = '') {
  setState((state) => {
    const patient = getPatient(state, patientId)
    if (!patient) return state
    audit(state, { action: `Đổi trạng thái → ${STATUS_WORD[status]}`, targetType: 'patient', targetId: patientId, targetName: patient.name, detail: reason })
    notify(state, { role: 'patient', targetId: patientId, message: `Tài khoản của bạn đã chuyển sang “${STATUS_WORD[status]}”.${reason ? ` Lý do: ${reason}` : ''}` })
    return {
      ...state,
      patients: state.patients.map((p) => (p.id === patientId ? { ...p, account: { ...p.account, status, statusReason: reason } } : p)),
    }
  })
}

// Admin edit of a patient's profile (recorded in the audit log, unlike the patient's own edits).
export function adminUpdatePatient(patientId, patch) {
  setState((state) => {
    const patient = getPatient(state, patientId)
    if (!patient) return state
    audit(state, { action: 'Cập nhật thông tin', targetType: 'patient', targetId: patientId, targetName: patient.name, detail: Object.keys(patch).join(', ') })
    return { ...state, patients: state.patients.map((p) => (p.id === patientId ? { ...p, ...patch } : p)) }
  })
}

// Sends one notification per recipient in the audience; returns the recipient count.
export function sendBroadcast({ title, message, audience, hospitalId = null }) {
  let recipients = 0
  setState((state) => {
    const targets = []
    const hospitalsInScope = state.hospitals.filter((h) => !hospitalId || h.id === hospitalId)
    if (audience === 'all' || audience === 'patients') state.patients.forEach((p) => targets.push({ role: 'patient', targetId: p.id }))
    if (audience === 'all' || audience === 'nurses')
      state.nurses.filter((n) => !hospitalId || n.hospitalId === hospitalId).forEach((n) => targets.push({ role: 'nurse', targetId: n.id }))
    if (audience === 'all' || audience === 'hospitals') hospitalsInScope.forEach((h) => targets.push({ role: 'hospital', targetId: h.id }))
    targets.forEach((t) => notify(state, { ...t, message: `📢 ${title}: ${message}` }))
    recipients = targets.length
    const broadcast = { id: genId('bc'), title, message, audience, hospitalId, sentAt: now(), sentBy: ADMIN_ACTOR, recipients }
    audit(state, { action: 'Gửi thông báo hệ thống', targetType: 'broadcast', targetId: broadcast.id, targetName: title, detail: `${recipients} người nhận` })
    return { ...state, broadcasts: [...(state.broadcasts || []), broadcast] }
  })
  return recipients
}

export function updateSettings(patch) {
  setState((state) => {
    audit(state, { action: 'Cập nhật cấu hình', targetType: 'settings', targetId: null, targetName: 'Cấu hình hệ thống', detail: Object.keys(patch).join(', ') })
    return { ...state, settings: { ...state.settings, ...patch } }
  })
}

export function addPatient(data) {
  const id = genId('patient')
  setState((state) => ({
    ...state,
    patients: [...state.patients, { id, familyContacts: [], ...data }],
  }))
  return id
}

export function updatePatient(patientId, patch) {
  setState((state) => ({
    ...state,
    patients: state.patients.map((p) => (p.id === patientId ? { ...p, ...patch } : p)),
  }))
}

// Only one contact may be primary: adding a primary contact demotes the others.
const withContact = (contacts, contact) => [
  ...(contact.primary ? contacts.map((c) => ({ ...c, primary: false })) : contacts),
  contact,
]

export function addFamilyContact(patientId, contact) {
  const id = genId('fc')
  setState((state) => ({
    ...state,
    patients: state.patients.map((p) =>
      p.id === patientId
        ? {
            ...p,
            familyContacts: withContact(p.familyContacts, {
              id,
              status: 'Chờ xác nhận',
              primary: false,
              permissions: [],
              ...contact,
            }),
          }
        : p,
    ),
  }))
  return id
}

// Pass null to remove the primary contact entirely.
export function setPrimaryFamilyContact(patientId, contactId) {
  setState((state) => ({
    ...state,
    patients: state.patients.map((p) =>
      p.id === patientId
        ? { ...p, familyContacts: p.familyContacts.map((c) => ({ ...c, primary: c.id === contactId })) }
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

// ---------- family QR invites ----------

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function genInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return `CS-${Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('')}`
}

// Creates a fresh invite and revokes the patient's previous active one, so only one QR works at a time.
export function createFamilyInvite(patientId, { permissions, ttlMinutes }) {
  const now = new Date()
  const invite = {
    code: genInviteCode(),
    patientId,
    permissions,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMinutes * 60000).toISOString(),
  }
  setState((state) => ({
    ...state,
    familyInvites: [
      ...(state.familyInvites || []).map((i) =>
        i.patientId === patientId && familyInviteStatus(i) === 'active' ? { ...i, revokedAt: invite.createdAt } : i,
      ),
      invite,
    ],
  }))
  return invite
}

export function updateFamilyInvite(code, patch) {
  setState((state) => ({
    ...state,
    familyInvites: (state.familyInvites || []).map((i) => (i.code === code ? { ...i, ...patch } : i)),
  }))
}

// A relative accepts an invite: they become a linked contact right away (scanning the QR is the confirmation).
export function acceptFamilyInvite(code, { name, phone, relation }) {
  const invite = getFamilyInvite(getState(), code)
  if (!invite) return { error: 'not_found' }
  const status = familyInviteStatus(invite)
  if (status !== 'active') return { error: status }

  const contactId = genId('fc')
  const usedAt = new Date().toISOString()
  setState((state) => {
    const next = {
      ...state,
      familyInvites: state.familyInvites.map((i) => (i.code === invite.code ? { ...i, usedAt, contactId } : i)),
      patients: state.patients.map((p) =>
        p.id === invite.patientId
          ? {
              ...p,
              familyContacts: withContact(p.familyContacts, {
                id: contactId,
                name,
                phone,
                relation,
                status: 'Đã liên kết',
                primary: false,
                permissions: invite.permissions,
                inviteCode: invite.code,
              }),
            }
          : p,
      ),
    }
    notify(next, {
      role: 'patient',
      targetId: invite.patientId,
      message: `${name} đã quét mã QR và liên kết tài khoản với bạn.`,
      link: '/patient/family',
    })
    return next
  })
  return { contactId, patientId: invite.patientId }
}

// ---------- Compliance reports (platform admin) ----------

export function updateReport(reportId, patch) {
  setState((state) => {
    const report = (state.reports || []).find((r) => r.id === reportId)
    if (!report) return state
    if (patch.status && patch.status !== report.status) {
      audit(state, { action: `Báo cáo → ${{ open: 'Mới', investigating: 'Đang xem xét', resolved: 'Đã xử lý', dismissed: 'Bác bỏ' }[patch.status]}`, targetType: 'report', targetId: reportId, targetName: report.title, detail: patch.resolution })
    }
    return { ...state, reports: state.reports.map((r) => (r.id === reportId ? { ...r, ...patch, updatedAt: now() } : r)) }
  })
}

// ---------- Platform Admin: operations center ----------

// One-click nudge from the operations center: notifies a user and records it in the audit log.
export function opsNotify({ role, targetId, message, link, action, targetType, auditTargetId, targetName, detail }) {
  setState((state) => {
    notify(state, { role, targetId, message, link })
    audit(state, { action, targetType, targetId: auditTargetId, targetName, detail })
    return state
  })
}

// ---------- Support tickets ----------

const TICKET_ROLE_LINK = { patient: '/patient/profile', nurse: '/hospital/nurse/profile', hospital: '/hospital/admin/overview' }

// A patient / nurse / hospital admin asks for help ("Liên hệ hỗ trợ").
export function createTicket({ requesterRole, requesterId, requesterName, subject, category, message, priority = 'normal' }) {
  const id = `tk-${Date.now().toString(36).slice(-5)}`
  setState((state) => ({
    ...state,
    tickets: [
      ...(state.tickets || []),
      {
        id,
        subject,
        category,
        priority,
        status: 'open',
        requesterRole,
        requesterId,
        requesterName,
        assignee: null,
        createdAt: now(),
        updatedAt: now(),
        messages: [{ id: genId('m'), from: 'requester', author: requesterName, text: message, at: now() }],
      },
    ],
  }))
  setState((state) => {
    notify(state, { role: 'admin', targetId: 'platform', message: `Hỗ trợ mới từ ${requesterName}: ${subject}`, link: `/admin/support?ticket=${id}` })
    return state
  })
  return id
}

const getTicket = (state, id) => (state.tickets || []).find((t) => t.id === id)

// from: 'admin' (support agent) or 'requester'. An admin reply moves an open ticket to "Chờ phản hồi" and
// notifies the person; a requester reply reopens a waiting / resolved ticket.
export function replyTicket(ticketId, { from, author, text }) {
  setState((state) => {
    const ticket = getTicket(state, ticketId)
    if (!ticket) return state
    const status = from === 'admin' ? (ticket.status === 'resolved' ? 'resolved' : 'waiting') : ticket.status === 'waiting' || ticket.status === 'resolved' ? 'in_progress' : ticket.status
    if (from === 'requester') notify(state, { role: 'admin', targetId: 'platform', message: `${author} phản hồi yêu cầu hỗ trợ “${ticket.subject}”.`, link: `/admin/support?ticket=${ticketId}` })
    if (from === 'admin') {
      notify(state, { role: ticket.requesterRole, targetId: ticket.requesterId, message: `Hỗ trợ CareShift đã trả lời yêu cầu “${ticket.subject}”.`, link: TICKET_ROLE_LINK[ticket.requesterRole] })
      audit(state, { action: 'Trả lời hỗ trợ', targetType: 'ticket', targetId: ticketId, targetName: ticket.subject, detail: ticket.requesterName })
    }
    return {
      ...state,
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, status, assignee: t.assignee || (from === 'admin' ? author : null), updatedAt: now(), messages: [...t.messages, { id: genId('m'), from, author, text, at: now() }] } : t,
      ),
    }
  })
}

export function updateTicket(ticketId, patch) {
  setState((state) => {
    const ticket = getTicket(state, ticketId)
    if (!ticket) return state
    if (patch.status && patch.status !== ticket.status) {
      const label = { open: 'Mới', in_progress: 'Đang xử lý', waiting: 'Chờ phản hồi', resolved: 'Đã giải quyết' }[patch.status]
      audit(state, { action: `Hỗ trợ → ${label}`, targetType: 'ticket', targetId: ticketId, targetName: ticket.subject })
      if (patch.status === 'resolved') notify(state, { role: ticket.requesterRole, targetId: ticket.requesterId, message: `Yêu cầu hỗ trợ “${ticket.subject}” đã được giải quyết.`, link: TICKET_ROLE_LINK[ticket.requesterRole] })
    }
    if (patch.assignee !== undefined && patch.assignee !== ticket.assignee) audit(state, { action: 'Phân công hỗ trợ', targetType: 'ticket', targetId: ticketId, targetName: ticket.subject, detail: patch.assignee || 'Bỏ phân công' })
    return { ...state, tickets: state.tickets.map((t) => (t.id === ticketId ? { ...t, ...patch, updatedAt: now() } : t)) }
  })
}

// ---------- Data & backup ----------

// Records a data operation (backup / restore) in the audit log. For a restore, returns the next state to load.
export function withDataAudit(state, { action, detail }) {
  const copy = { ...state }
  audit(copy, { action, targetType: 'data', targetId: null, targetName: 'Dữ liệu hệ thống', detail })
  return copy
}
