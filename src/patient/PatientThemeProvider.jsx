import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/vi'
import { patientTheme } from './theme'

export default function PatientThemeProvider({ children }) {
  return (
    <ThemeProvider theme={patientTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  )
}
