import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import NurseProfileCard from './NurseProfileCard'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getNurse, listCareRequestsByPatient } from '../../lib/db'
import { Icon } from '../../lib/icons'

export default function PatientNurses() {
  const { session } = useAuth()
  const state = useDb()
  const requests = listCareRequestsByPatient(state, session.id)
  const nurseIds = [...new Set(requests.flatMap((r) => r.matchedNurseIds))]
  const nurses = nurseIds.map((id) => getNurse(state, id)).filter(Boolean)

  return (
    <>
      <PageHead eyebrow="Verified profiles" title="Điều dưỡng tin cậy" description="Các hồ sơ đã được đề xuất cho bạn qua các yêu cầu chăm sóc trước đây." />
      {nurses.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.user />} title="Chưa có hồ sơ nào" description="Sau khi tạo yêu cầu chăm sóc, các điều dưỡng phù hợp sẽ xuất hiện tại đây." />
        </section>
      ) : (
        <div className="match-grid">
          {nurses.map((n) => (
            <NurseProfileCard key={n.id} nurse={n} />
          ))}
        </div>
      )}
    </>
  )
}
