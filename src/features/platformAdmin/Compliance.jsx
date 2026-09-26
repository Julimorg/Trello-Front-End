import PageHead from '../../components/PageHead'
import StatusBadge from '../../components/StatusBadge'
import { useDb } from '../../lib/store'
import { getHospital } from '../../lib/db'
import { NURSE_AUTH_STATUS } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function Compliance() {
  const state = useDb()
  const noCertNurses = state.nurses.filter((n) => n.certificates.length === 0)
  const unspotChecked = state.nurses.filter((n) => n.authStatus === NURSE_AUTH_STATUS.AUTHORIZED && !n.spotCheckedAt)

  return (
    <>
      <PageHead eyebrow="CareShift" title="Tuân thủ & chính sách" description="Quản lý quy tắc cấp phép, thời hạn chứng chỉ và nhật ký can thiệp." />

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Hồ sơ thiếu chứng chỉ</h2>
              <p>Không thể cấp phép cho đến khi bổ sung</p>
            </div>
          </div>
          <div className="attention-list">
            {noCertNurses.length === 0 && (
              <div className="attention-item">
                <span className="attention-icon">
                  <Icon.check />
                </span>
                <span>
                  <b>Không có hồ sơ nào thiếu chứng chỉ</b>
                </span>
              </div>
            )}
            {noCertNurses.map((n) => (
              <div className="attention-item" key={n.id}>
                <span className="attention-icon red">
                  <Icon.file />
                </span>
                <span>
                  <b>{n.name}</b>
                  <small>{getHospital(state, n.hospitalId)?.name}</small>
                </span>
                <StatusBadge label="Thiếu văn bằng" tone="danger" />
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Spot-check định kỳ</h2>
              <p>Đội vận hành nền tảng kiểm tra chéo, không xác minh lại từng hồ sơ</p>
            </div>
          </div>
          <div className="attention-list">
            {unspotChecked.length === 0 && (
              <div className="attention-item">
                <span className="attention-icon">
                  <Icon.check />
                </span>
                <span>
                  <b>Tất cả điều dưỡng đã cấp phép đã được spot-check</b>
                </span>
              </div>
            )}
            {unspotChecked.map((n) => (
              <div className="attention-item" key={n.id}>
                <span className="attention-icon">
                  <Icon.shield />
                </span>
                <span>
                  <b>{n.name}</b>
                  <small>{getHospital(state, n.hospitalId)?.name}</small>
                </span>
                <StatusBadge label="Chưa kiểm tra" tone="pending" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
