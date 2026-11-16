// Coloured label for a status. The colour comes from CSS classes like .badge-open
export default function StatusBadge({ status }) {
  const label = status.replace('_', ' '); // "in_progress" -> "in progress"
  return <span className={`badge badge-${status}`}>{label}</span>;
}
