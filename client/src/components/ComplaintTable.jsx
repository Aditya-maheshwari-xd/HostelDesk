import StatusBadge from './StatusBadge';

// Shows the list of complaints. Clicking a row opens its details.
// Students don't need the "Student / Room" column because all rows are theirs.
export default function ComplaintTable({ complaints, role, selectedId, onSelect }) {
  if (complaints.length === 0) {
    return <p className="muted">No complaints found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Title</th>
          <th>Category</th>
          {role !== 'student' && <th>Student / Room</th>}
          <th>Assigned to</th>
          <th>Status</th>
          <th>Raised on</th>
        </tr>
      </thead>
      <tbody>
        {complaints.map((c) => (
          <tr
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={c.id === selectedId ? 'selected' : ''}
          >
            <td>{c.id}</td>
            <td>{c.title}</td>
            <td>{c.category}</td>
            {role !== 'student' && <td>{c.student_name} / {c.room_no}</td>}
            <td>{c.staff_name || '—'}</td>
            <td><StatusBadge status={c.status} /></td>
            <td>{new Date(c.created_at).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
