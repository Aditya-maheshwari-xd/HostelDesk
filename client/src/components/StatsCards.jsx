// Warden-only: small cards with the count of complaints in each status
export default function StatsCards({ stats }) {
  const items = [
    ['Total', stats.total],
    ['Open', stats.open],
    ['Assigned', stats.assigned],
    ['In Progress', stats.in_progress],
    ['Resolved', stats.resolved],
    ['Closed', stats.closed],
  ];

  return (
    <div className="stats">
      {items.map(([label, value]) => (
        <div className="card stat" key={label}>
          <div className="stat-value">{value}</div>
          <div className="muted">{label}</div>
        </div>
      ))}
    </div>
  );
}
