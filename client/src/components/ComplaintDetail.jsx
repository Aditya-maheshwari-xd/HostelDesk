import { useEffect, useState } from 'react';
import { api } from '../api';
import StatusBadge from './StatusBadge';

// Detail panel for one complaint: info, history, and the actions allowed for this role.
export default function ComplaintDetail({ id, user, onClose, onChanged }) {
  const [complaint, setComplaint] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [note, setNote] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setComplaint(await api(`/complaints/${id}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  // Reload whenever a different complaint is selected
  useEffect(() => {
    load();
  }, [id]);

  // Only the warden needs the staff list (for the "assign" dropdown)
  useEffect(() => {
    if (user.role === 'warden') {
      api('/staff').then(setStaffList).catch(() => {});
    }
  }, [user.role]);

  // Runs any action, then refreshes both this panel and the list behind it
  async function run(action) {
    setError('');
    try {
      await action();
      setNote('');
      setComment('');
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  const assign = () => run(() => api(`/complaints/${id}/assign`, 'PUT', { staff_id: staffId }));
  const setStatus = (status) => run(() => api(`/complaints/${id}/status`, 'PUT', { status, message: note }));
  const addComment = () => run(() => api(`/complaints/${id}/comments`, 'POST', { message: comment }));

  async function remove() {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await api(`/complaints/${id}`, 'DELETE');
      onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!complaint) {
    return <div className="card">{error ? <p className="error">{error}</p> : 'Loading...'}</div>;
  }

  const c = complaint;
  const isClosed = c.status === 'closed';

  return (
    <div className="card detail">
      <div className="detail-head">
        <h2>#{c.id} {c.title}</h2>
        <button className="btn-light" onClick={onClose}>✕</button>
      </div>

      <p><StatusBadge status={c.status} /> &nbsp; {c.category}</p>
      <p>{c.description}</p>
      <p className="muted">
        Raised by {c.student_name} (Room {c.room_no}) · Assigned to {c.staff_name || 'nobody yet'}
      </p>

      {error && <p className="error">{error}</p>}

      {/* ---- Warden actions ---- */}
      {user.role === 'warden' && !isClosed && (
        <div className="actions">
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Choose staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.active_tasks} active)
              </option>
            ))}
          </select>
          <button onClick={assign} disabled={!staffId}>
            {c.assigned_to ? 'Re-assign' : 'Assign'}
          </button>
          <button className="btn-dark" onClick={() => setStatus('closed')}>Close complaint</button>
        </div>
      )}
      {user.role === 'warden' && isClosed && (
        <div className="actions">
          <button className="btn-light" onClick={() => setStatus('open')}>Re-open</button>
        </div>
      )}

      {/* ---- Staff actions ---- */}
      {user.role === 'staff' && ['assigned', 'in_progress'].includes(c.status) && (
        <div className="actions">
          <input placeholder="Optional note (e.g. replaced the fuse)" value={note} onChange={(e) => setNote(e.target.value)} />
          {c.status === 'assigned' && <button onClick={() => setStatus('in_progress')}>Start work</button>}
          <button onClick={() => setStatus('resolved')}>Mark resolved</button>
        </div>
      )}

      {/* ---- Student actions ---- */}
      {user.role === 'student' && c.status === 'open' && (
        <div className="actions">
          <button className="btn-danger" onClick={remove}>Delete complaint</button>
        </div>
      )}

      {/* ---- History (everyone) ---- */}
      <h3>History</h3>
      <ul className="history">
        {c.history.map((h) => (
          <li key={h.id}>
            <strong>{h.by_name}</strong> <span className="role">{h.by_role}</span>
            {h.new_status && <> → <StatusBadge status={h.new_status} /></>}
            <div>{h.message}</div>
            <small className="muted">{new Date(h.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>

      {!isClosed && (
        <div className="actions">
          <input placeholder="Write a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
          <button onClick={addComment} disabled={!comment.trim()}>Comment</button>
        </div>
      )}
    </div>
  );
}
