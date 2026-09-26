import PageHead from '../../components/PageHead'
import { useAuth } from '../../auth/AuthContext'
import { useDb } from '../../lib/store'
import { getPricing, setPricing } from '../../lib/db'
import { CARE_TYPES } from '../../lib/constants'
import { Icon } from '../../lib/icons'

export default function PricingConfig() {
  const { session } = useAuth()
  const state = useDb()

  return (
    <>
      <PageHead eyebrow="Pricing" title="Giá dịch vụ tham khảo" description="Hiển thị cho bệnh nhân trước khi đặt lịch." />
      <div className="info-callout" style={{ marginBottom: 18 }}>
        <Icon.info />
        <span>Đây là giá tham khảo (Stage 1). Việc thanh toán vẫn diễn ra ngoài hệ thống, chưa xử lý giao dịch trong app.</span>
      </div>
      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loại dịch vụ</th>
                <th>Đơn vị tính</th>
                <th style={{ width: 200 }}>Giá (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {CARE_TYPES.filter((c) => c.id !== 'other').map((c) => {
                const pricing = getPricing(state, session.id, c.id)
                return (
                  <tr key={c.id}>
                    <td>{c.label}</td>
                    <td>
                      <input style={{ width: 90 }} value={pricing?.unit || 'buổi'} onChange={(e) => setPricing(session.id, c.id, e.target.value, pricing?.price || 0)} />
                    </td>
                    <td>
                      <input
                        type="number"
                        placeholder="Chưa cấu hình"
                        value={pricing?.price ?? ''}
                        onChange={(e) => setPricing(session.id, c.id, pricing?.unit || 'buổi', Number(e.target.value))}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
