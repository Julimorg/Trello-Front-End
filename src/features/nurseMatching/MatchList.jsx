import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import NurseProfileCard from './NurseProfileCard'
import { useDb } from '../../lib/store'
import { getCareRequest, getNurse, retryMatching } from '../../lib/db'
import { careTypeLabel } from '../../lib/format'
import { CARE_REQUEST_STATUS } from '../../lib/constants'

export default function MatchList() {
  const { id } = useParams()
  const navigate = useNavigate()
  const state = useDb()
  const request = getCareRequest(state, id)

  if (!request) {
    return <Alert severity="warning">Không tìm thấy yêu cầu chăm sóc này.</Alert>
  }

  const matchedNurses = request.matchedNurseIds.map((nid) => getNurse(state, nid)).filter(Boolean)
  const isColdStart = matchedNurses.length > 0 && matchedNurses.length <= 1

  return (
    <>
      <PageHeader
        title={`Điều dưỡng phù hợp cho: ${careTypeLabel(request.careType)}`}
        subtitle={`${request.district} · Bắt đầu ${request.desiredStartDate}`}
      />

      {isColdStart && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Khu vực này hiện có ít điều dưỡng được cấp phép nên danh sách gợi ý còn hạn chế.
        </Alert>
      )}

      {request.status === CARE_REQUEST_STATUS.NO_MATCH || matchedNurses.length === 0 ? (
        <EmptyState
          icon={<SearchOffIcon color="disabled" sx={{ fontSize: 48 }} />}
          title="Không tìm được điều dưỡng phù hợp"
          description="Hệ thống sẽ tự động chạy lại khi có điều dưỡng mới được cấp phép hoặc có lịch rảnh mới. Bạn cũng có thể thử tìm lại ngay hoặc liên hệ bệnh viện để được hỗ trợ thủ công."
          action={
            <Button variant="contained" onClick={() => retryMatching(id)}>
              Thử tìm lại
            </Button>
          }
        />
      ) : (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            {matchedNurses.map((nurse) => (
              <Grid xs={12} sm={6} key={nurse.id}>
                <NurseProfileCard
                  nurse={nurse}
                  careType={request.careType}
                  reason="Đúng chuyên môn, khu vực và lịch rảnh bạn yêu cầu"
                  onSelect={(selected) => navigate(`/patient/requests/${id}/book/${selected.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
    </>
  )
}
