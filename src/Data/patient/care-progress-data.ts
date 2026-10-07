import type { CareTypeId, SessionObservation } from './types'

// Data for the richer "Lịch chăm sóc" pages (/patient/bookings and /patient/bookings/:id):
// the care plan shown for each kind of care, and what nurses recorded in past visits.
// Observation keys are session ids from booking-data.ts ("<bookingId>-s<index>").

export interface CarePlan {
  /** What the course of care is meant to achieve. */
  goals: string[]
  /** What the patient / family should do between visits. */
  instructions: string[]
  /** Signs that should be reported to the nurse or hospital right away. */
  warningSigns: string[]
  /** One-line description of what visits look like. */
  summary: string
}

export const CARE_PLANS: Record<CareTypeId, CarePlan> = {
  'wound-dressing': {
    summary: 'Điều dưỡng làm sạch, đánh giá và thay băng vết thương theo chỉ định bác sĩ.',
    goals: ['Vết thương sạch, không nhiễm trùng', 'Theo dõi tốc độ liền thương', 'Giảm đau khi thay băng'],
    instructions: ['Giữ băng khô ráo, không tự tháo băng', 'Không bôi thuốc hoặc đắp lá khi chưa hỏi ý kiến', 'Uống đủ nước, ăn đủ đạm để mau liền thương'],
    warningSigns: ['Vết thương sưng đỏ, chảy mủ hoặc có mùi', 'Sốt trên 38°C', 'Đau tăng nhanh, chảy máu thấm băng'],
  },
  'vitals-monitoring': {
    summary: 'Đo và ghi lại các chỉ số sinh hiệu, so sánh với các lần trước và báo bác sĩ nếu bất thường.',
    goals: ['Huyết áp và đường huyết trong ngưỡng an toàn', 'Phát hiện sớm dấu hiệu bất thường', 'Theo dõi hiệu quả sau khi đổi thuốc'],
    instructions: ['Nghỉ ngơi 5 phút trước khi đo', 'Dùng thuốc đúng giờ, đúng liều', 'Ghi lại các triệu chứng khó chịu để điều dưỡng ghi nhận'],
    warningSigns: ['Huyết áp trên 180/110 hoặc dưới 90/60', 'Chóng mặt, đau ngực, khó thở', 'Đường huyết dưới 3,9 hoặc trên 13 mmol/L'],
  },
  'mobility-support': {
    summary: 'Tập vận động có hỗ trợ, phòng té ngã và hướng dẫn bài tập tự tập tại nhà.',
    goals: ['Tăng sức cơ và biên độ khớp', 'Đi lại vững hơn, giảm nguy cơ té ngã', 'Tự thực hiện bài tập tại nhà'],
    instructions: ['Mang giày dép chống trơn khi tập', 'Tập các bài đã hướng dẫn mỗi ngày 2 lần', 'Dừng tập và nghỉ nếu đau tăng hoặc choáng'],
    warningSigns: ['Đau khớp tăng, sưng nóng', 'Té ngã hoặc suýt té', 'Tê yếu một bên người'],
  },
  medication: {
    summary: 'Đối chiếu đơn thuốc, hỗ trợ dùng thuốc đúng giờ và theo dõi tác dụng phụ.',
    goals: ['Dùng thuốc đúng giờ, đúng liều', 'Phát hiện sớm tác dụng phụ', 'Duy trì thói quen tuân thủ điều trị'],
    instructions: ['Để thuốc ở nơi khô mát, có nhãn rõ ràng', 'Không tự ý ngưng hoặc đổi liều', 'Báo điều dưỡng mọi thuốc/thực phẩm chức năng mới'],
    warningSigns: ['Nổi mẩn, ngứa, khó thở sau dùng thuốc', 'Buồn nôn, chóng mặt kéo dài', 'Quên hoặc dùng nhầm liều'],
  },
  'post-surgery': {
    summary: 'Theo dõi vết mổ, mức độ đau, nhiệt độ và hỗ trợ vận động nhẹ sau phẫu thuật.',
    goals: ['Vết mổ liền tốt, không nhiễm trùng', 'Kiểm soát đau ở mức nhẹ', 'Vận động trở lại từng bước'],
    instructions: ['Không nâng vật nặng, không làm việc gắng sức', 'Giữ vết mổ khô, thay băng theo hướng dẫn', 'Đi lại nhẹ nhàng mỗi ngày theo chỉ dẫn của điều dưỡng'],
    warningSigns: ['Sốt trên 38°C hoặc rét run', 'Vết mổ đỏ, chảy dịch, bục chỉ', 'Đau bụng tăng, nôn nhiều'],
  },
  'elderly-care': {
    summary: 'Hỗ trợ sinh hoạt hằng ngày, ăn uống, thuốc men và phòng loét tì đè cho người cao tuổi.',
    goals: ['Sinh hoạt hằng ngày an toàn, thoải mái', 'Ăn uống và dùng thuốc đều đặn', 'Da nguyên vẹn, không loét tì đè'],
    instructions: ['Đổi tư thế mỗi 2 giờ nếu nằm nhiều', 'Cho uống đủ nước trong ngày', 'Giữ môi trường đủ sáng, sàn nhà khô ráo'],
    warningSigns: ['Lú lẫn đột ngột, ngủ li bì', 'Bỏ ăn, uống rất ít nước', 'Da đỏ, trợt loét ở vùng tì đè'],
  },
  other: {
    summary: 'Điều dưỡng thực hiện công việc theo mô tả của bạn trong yêu cầu chăm sóc.',
    goals: ['Hoàn thành đúng nội dung đã thống nhất'],
    instructions: ['Trao đổi thêm với điều dưỡng nếu nhu cầu thay đổi'],
    warningSigns: ['Bất kỳ dấu hiệu bất thường nào — dùng nút SOS nếu khẩn cấp'],
  },
}

const obs = (summary: string, rest: Omit<SessionObservation, 'summary'> = {}): SessionObservation => ({ summary, ...rest })

export const SESSION_OBSERVATIONS: Record<string, SessionObservation> = {
  // bk-2014 — vitals check after a medication change
  'bk-2014-s1': obs('Huyết áp còn cao nhẹ, đường huyết ổn. Đã dặn uống thuốc sau ăn và đo lại sau 3 ngày.', {
    vitals: { bp: '142/90', pulse: 82, temp: 36.7, spo2: 97, glucose: 7.4 },
  }),

  // bk-2001 — post-surgery, 4 visits: pain and temperature falling
  'bk-2001-s1': obs('Vết mổ hơi sưng, khô, không dịch. Bệnh nhân còn đau khi đứng dậy.', { vitals: { bp: '135/85', pulse: 88, temp: 37.4, spo2: 97 }, pain: 6 }),
  'bk-2001-s2': obs('Điều dưỡng thay thế: vết mổ khô, giảm sưng. Đã thay băng và hướng dẫn đi lại nhẹ.', { vitals: { bp: '132/84', pulse: 84, temp: 37.1, spo2: 98 }, pain: 4 }),
  'bk-2001-s3': obs('Vết mổ liền tốt, không còn sưng. Bệnh nhân tự đi lại trong nhà được.', { vitals: { bp: '130/82', pulse: 80, temp: 36.8, spo2: 98 }, pain: 3 }),
  'bk-2001-s4': obs('Vết mổ liền, da khô sạch. Kết thúc liệu trình, hẹn tái khám theo lịch bác sĩ.', { vitals: { bp: '128/80', pulse: 76, temp: 36.7, spo2: 98 }, pain: 1 }),

  // bk-2013 — single wound dressing
  'bk-2013-s1': obs('Vết thương sạch, dịch ít. Đã thay băng, bệnh nhân không đau nhiều.', { vitals: { bp: '130/80', pulse: 78, temp: 36.6, spo2: 98 }, pain: 3, extras: [{ label: 'Kích thước vết thương', value: '3 × 2 cm' }] }),

  // bk-2002 — daily wound dressing for 4 days
  'bk-2002-s1': obs('Vết thương còn rỉ dịch vàng ít, viền hơi đỏ. Đã làm sạch và thay băng.', { vitals: { bp: '134/84', pulse: 84, temp: 37.0, spo2: 97 }, pain: 5, extras: [{ label: 'Kích thước vết thương', value: '4 × 3 cm' }] }),
  'bk-2002-s2': obs('Dịch giảm, viền đỏ nhạt dần. Bệnh nhân đỡ đau khi thay băng.', { vitals: { bp: '132/82', pulse: 82, temp: 36.9, spo2: 98 }, pain: 4, extras: [{ label: 'Kích thước vết thương', value: '4 × 3 cm' }] }),
  'bk-2002-s3': obs('Vết thương khô, bắt đầu lên da non ở mép.', { vitals: { bp: '130/80', pulse: 78, temp: 36.7, spo2: 98 }, pain: 3, extras: [{ label: 'Kích thước vết thương', value: '3,5 × 2,5 cm' }] }),
  'bk-2002-s4': obs('Vết thương khô, da non phủ đều. Hoàn tất thay băng liên tục, tiếp tục giữ khô.', { vitals: { bp: '128/80', pulse: 76, temp: 36.6, spo2: 98 }, pain: 2, extras: [{ label: 'Kích thước vết thương', value: '3 × 2 cm' }] }),

  // bk-2004 — elderly care in the evenings
  'bk-2004-s1': obs('Hỗ trợ vệ sinh, bữa tối và thuốc. Bệnh nhân ăn được nửa khẩu phần, hơi mệt.', { vitals: { bp: '138/86', pulse: 80, temp: 36.7, spo2: 97 }, extras: [{ label: 'Lượng nước uống', value: '800 ml' }] }),
  'bk-2004-s2': obs('Ăn hết khẩu phần, tinh thần tốt. Đã nhắc và hỗ trợ uống thuốc đúng giờ.', { vitals: { bp: '134/84', pulse: 78, temp: 36.6, spo2: 98 }, extras: [{ label: 'Lượng nước uống', value: '1.100 ml' }] }),
  'bk-2004-s3': obs('Điều dưỡng thay thế: sinh hoạt ổn, da lưng không đỏ. Bệnh nhân ngủ sớm sau uống thuốc.', { vitals: { bp: '132/82', pulse: 76, temp: 36.6, spo2: 98 }, extras: [{ label: 'Lượng nước uống', value: '1.200 ml' }] }),
  'bk-2004-s4': obs('Bệnh nhân tự ngồi dậy dễ hơn, ăn uống tốt, thuốc dùng đều.', { vitals: { bp: '130/80', pulse: 74, temp: 36.6, spo2: 98 }, extras: [{ label: 'Lượng nước uống', value: '1.300 ml' }] }),

  // bk-2006 — mobility after knee replacement
  'bk-2006-s1': obs('Tập khởi động khớp và đi với khung tập 5 phút. Đầu gối còn cứng, đau khi gập.', { vitals: { bp: '128/80', pulse: 82, temp: 36.6, spo2: 98 }, pain: 5, extras: [{ label: 'Quãng đường đi', value: '10 m' }, { label: 'Gập gối', value: '70°' }] }),
  'bk-2006-s2': obs('Đi được xa hơn, ít phải dừng nghỉ. Hướng dẫn thêm bài nâng chân tại nhà.', { vitals: { bp: '126/78', pulse: 78, temp: 36.6, spo2: 98 }, pain: 4, extras: [{ label: 'Quãng đường đi', value: '25 m' }, { label: 'Gập gối', value: '85°' }] }),

  // bk-2007 — single wound dressing
  'bk-2007-s1': obs('Vết thương sạch, đã thay băng. Dặn giữ khô và quan sát dấu hiệu sưng đỏ.', { vitals: { bp: '130/82', pulse: 80, temp: 36.7, spo2: 98 }, pain: 2, extras: [{ label: 'Kích thước vết thương', value: '2 × 2 cm' }] }),

  // bk-2101 — vitals monitoring (patient-thu)
  'bk-2101-s1': obs('Đường huyết đầu buổi hơi cao. Đã nhắc chế độ ăn, uống thuốc sau bữa.', { vitals: { bp: '140/88', pulse: 84, temp: 36.7, spo2: 97, glucose: 9.1 } }),
  'bk-2101-s2': obs('Đường huyết giảm nhẹ so với hôm qua, huyết áp ổn định.', { vitals: { bp: '136/86', pulse: 80, temp: 36.6, spo2: 97, glucose: 8.2 } }),
  'bk-2101-s3': obs('Chỉ số tiếp tục cải thiện. Bệnh nhân tuân thủ ăn uống tốt.', { vitals: { bp: '132/84', pulse: 78, temp: 36.6, spo2: 98, glucose: 7.6 } }),
  'bk-2101-s4': obs('Huyết áp và đường huyết trong ngưỡng chấp nhận. Hẹn tái khám theo lịch bác sĩ.', { vitals: { bp: '130/82', pulse: 76, temp: 36.6, spo2: 98, glucose: 6.9 } }),
}
