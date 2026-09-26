import PageHead from '../../components/PageHead'
import EmptyState from '../../components/EmptyState'
import NursePendingCard from './NursePendingCard'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { listPendingRequestsForNurse } from '../../lib/db'
import { Icon } from '../../lib/icons'

export default function NurseRequests() {
  const { session } = useAuth()
  const state = useDb()
  const pending = listPendingRequestsForNurse(state, session.id)

  return (
    <>
      <PageHead eyebrow="Yêu cầu phù hợp" title="Ca chăm sóc mới" description="Chỉ hiển thị ca đúng chuyên môn, khu vực và lịch rảnh đã được bệnh viện duyệt." />
      {pending.length === 0 ? (
        <section className="panel">
          <EmptyState icon={<Icon.bell />} title="Không có ca mới" description="Yêu cầu phù hợp sẽ xuất hiện tại đây và gửi thông báo cho bạn." />
        </section>
      ) : (
        pending.map((r) => <NursePendingCard key={r.id} careRequest={r} />)
      )}
    </>
  )
}
