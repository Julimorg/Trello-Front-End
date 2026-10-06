import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

// Ant Design setup for the staff portals (nurse now; hospital + platform admin next),
// themed onto the CareShift design tokens in styles/base.css. Vietnamese locale also
// makes Calendar / DatePicker weeks start on Monday.
dayjs.extend(relativeTime)
dayjs.locale('vi')

const theme = {
  token: {
    colorPrimary: '#0b6b68',
    colorInfo: '#2b69c9',
    colorSuccess: '#21845b',
    colorSuccessBg: '#e7f6ee',
    colorSuccessBorder: '#bfe5d1',
    colorWarningBg: '#fff4df',
    colorWarningBorder: '#f2ddb6',
    colorWarning: '#b96b08',
    colorError: '#cf3c43',
    colorText: '#15313a',
    colorTextSecondary: '#667d83',
    colorBorder: '#dce7e7',
    colorBorderSecondary: '#edf2f2',
    colorBgLayout: '#f4f8f8',
    borderRadius: 10,
    borderRadiusLG: 16,
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
  },
  components: {
    Card: { headerFontSize: 15 },
    Button: { fontWeight: 650, primaryShadow: '0 8px 20px rgba(11,107,104,.2)' },
    Segmented: { itemSelectedColor: '#0b6b68' },
    Calendar: { fullBg: '#fff', fullPanelBg: '#fff' },
  },
}

export default function AntdThemeProvider({ children }) {
  return (
    <ConfigProvider locale={viVN} theme={theme}>
      <AntApp className="antd-scope">{children}</AntApp>
    </ConfigProvider>
  )
}
