import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export default function EmptyState({ icon, title, description, action }) {
  return (
    <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderStyle: 'dashed' }}>
      <Stack spacing={1.5} alignItems="center">
        {icon}
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
        )}
        {action}
      </Stack>
    </Paper>
  )
}
