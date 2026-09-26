import { useMemo } from 'react'
import dayjs from 'dayjs'
import PageHead from '../../components/PageHead'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getNurse, getPatient, listNursesByHospital } from '../../lib/db'
import { SESSION_STATUS } from '../../lib/constants'

const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export default function HospitalSchedule() {
  const { session } = useAuth()
  const state = useDb()
  const nurseIds = new Set(listNursesByHospital(state, session.id).map((n) => n.id))

  const weekDays = useMemo(() => {
    const start = dayjs().startOf('week').add(1, 'day')
    const allSessions = state.bookings.flatMap((b) => b.sessions.filter((s) => nurseIds.has(s.nurseId) && s.status !== SESSION_STATUS.CANNOT_PERFORM).map((s) => ({ ...s, patientId: b.patientId })))
    return Array.from({ length: 7 }).map((_, i) => {
      const date = start.add(i, 'day')
      const iso = date.format('YYYY-MM-DD')
      return { date, iso, slots: allSessions.filter((s) => s.date === iso) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bookings])

  return (
    <>
      <PageHead eyebrow="Workforce scheduling" title="Điều phối lịch" description="Tổng hợp các ca chăm sóc CareShift của toàn bộ điều dưỡng bệnh viện trong tuần." />

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>
              Tuần {weekDays[0]?.date.format('DD')}–{weekDays[6]?.date.format('DD/MM')}
            </h2>
            <p>Khung giờ CareShift được hiển thị màu xanh</p>
          </div>
        </div>
        <div className="schedule-grid" style={{ padding: 16 }}>
          {weekDays.map((d) => (
            <div className={`day${d.slots.length ? ' has-shift' : ''}`} key={d.iso}>
              <span>{WEEKDAY_SHORT[d.date.day()]}</span>
              <strong>{d.date.format('DD')}</strong>
              {d.slots.map((s) => (
                <div className="slot" key={s.id}>
                  {s.start} · {getNurse(state, s.nurseId)?.name.split(' ').pop()} · {getPatient(state, s.patientId)?.name.split(' ').pop()}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
