export default function StatusBadge({ status, labelMap, label, tone }) {
  const entry = labelMap ? labelMap[status] || { label: status, tone: 'neutral' } : { label, tone: tone || 'neutral' }
  return <span className={`status ${entry.tone}`}>{entry.label}</span>
}
