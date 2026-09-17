import Chip from '@mui/material/Chip'

export default function StatusChip({ status, labelMap, size = 'small' }) {
  const entry = labelMap[status] || { label: status, color: 'default' }
  return <Chip label={entry.label} color={entry.color} size={size} variant="filled" />
}
