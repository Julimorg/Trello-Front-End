import { createTheme } from '@mui/material/styles'

// MUI theme for the patient app, mapped onto the CareShift design tokens in styles/base.css
// so MUI components sit visually inside the ported design system.
const ink = '#15313a'
const muted = '#667d83'
const line = '#dce7e7'
const teal = '#0b6b68'

export const patientTheme = createTheme({
  palette: {
    primary: { main: teal, dark: '#095c5a', light: '#0e8781', contrastText: '#fff' },
    secondary: { main: '#e7f5f2', dark: '#d3ede8', contrastText: teal },
    error: { main: '#cf3c43' },
    warning: { main: '#b96b08' },
    success: { main: '#21845b' },
    info: { main: '#2b69c9' },
    text: { primary: ink, secondary: muted },
    divider: line,
    background: { default: '#f4f8f8', paper: '#fff' },
  },
  shape: { borderRadius: 11 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 750, letterSpacing: 0 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 43, borderRadius: 11, paddingInline: 17, fontSize: '0.84rem', whiteSpace: 'nowrap' },
        sizeSmall: { minHeight: 35, paddingInline: 13, fontSize: '0.76rem' },
        containedPrimary: { boxShadow: '0 8px 20px rgba(11,107,104,.2)', '&:hover': { boxShadow: '0 8px 20px rgba(11,107,104,.25)' } },
        outlined: { borderColor: line, color: ink, background: '#fff', '&:hover': { borderColor: '#a9d8d2', background: '#f8fffd' } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: '#fff',
          fontSize: '0.82rem',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: line },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a9d8d2' },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '0.82rem' } } },
    // MUI X date fields use their own input components, sized from typography.body1.
    MuiPickersInputBase: { styleOverrides: { root: { fontSize: '0.82rem' } } },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: '#fff',
          '& .MuiPickersOutlinedInput-notchedOutline': { borderColor: line },
          '&:hover .MuiPickersOutlinedInput-notchedOutline': { borderColor: '#a9d8d2' },
        },
      },
    },
    // Two-letter Vietnamese weekday headers (T2…CN) instead of the ambiguous single letters.
    MuiDateCalendar: { defaultProps: { dayOfWeekFormatter: (day) => day.format('dd') } },
    MuiDatePicker: { defaultProps: { dayOfWeekFormatter: (day) => day.format('dd') } },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 22, boxShadow: '0 30px 90px rgba(0,20,28,.25)' },
      },
    },
    MuiBackdrop: { styleOverrides: { root: { backgroundColor: 'rgba(9,29,34,.62)', backdropFilter: 'blur(4px)' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16, borderColor: line } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 650 } } },
    MuiCheckbox: { defaultProps: { color: 'primary' } },
    MuiPaginationItem: { styleOverrides: { root: { fontWeight: 650 } } },
    MuiStepLabel: { styleOverrides: { label: { fontSize: '0.74rem' } } },
  },
})
