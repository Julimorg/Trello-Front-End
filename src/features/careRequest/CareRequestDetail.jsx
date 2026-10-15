import { useParams } from 'react-router-dom'
import PageHead from '../../components/PageHead'
import BackButton from '../../components/BackButton'
import CareRequestBody from './CareRequestBody'
import { useDb } from '../../lib/store'
import { getCareRequest } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'

import { usePageCrumbs } from '../../components/crumbs'

export default function CareRequestDetail() {
  const { id } = useParams()
  const state = useDb()
  const careRequest = getCareRequest(state, id)
  usePageCrumbs(careRequest ? [{ label: `Yêu cầu #${careRequest.id}` }] : [])

  if (!careRequest) {
    return (
      <div className="empty-state">
        <h3>Không tìm thấy yêu cầu chăm sóc này</h3>
        <BackButton fallback="/patient/request" />
      </div>
    )
  }

  return (
    <>
      <PageHead eyebrow="Care Request" title={careTypeLabel(careRequest.careType)} description={`Chi tiết yêu cầu #${careRequest.id}`} action={<BackButton fallback="/patient/request" />} />
      <section className="panel">
        <div className="active-care">
          <CareRequestBody careRequest={careRequest} />
        </div>
      </section>
    </>
  )
}
