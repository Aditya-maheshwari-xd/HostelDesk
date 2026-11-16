// routes/complaints.js — everything about complaints
//   POST   /api/complaints              (API 5)  student raises a complaint
//   GET    /api/complaints              (API 6)  list (filtered by role, status, category, search)
//   GET    /api/complaints/stats        (API 7)  counts per status for the warden dashboard
//   GET    /api/complaints/:id          (API 8)  one complaint + its history
//   PUT    /api/complaints/:id/assign   (API 9)  warden assigns to a staff member
//   PUT    /api/complaints/:id/status   (API 10) staff / warden change the status
//   POST   /api/complaints/:id/comments (API 11) add a comment to the history
//   DELETE /api/complaints/:id          (API 12) student deletes their own OPEN complaint

const express = require('express');
const db = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');
const { validateComplaint, STATUSES } = require('../utils/validate');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

// Every complaint route needs a logged-in user
router.use(requireLogin);

// ---------- helper functions ----------

// Fetch one complaint (plus the emails we need for notifications)
async function findComplaint(id) {
  const [rows] = await db.query(
    `SELECT c.*, s.email AS student_email, s.name AS student_name, s.room_no,
            st.name AS staff_name, st.email AS staff_email, cat.name AS category
     FROM complaints c
     JOIN users s        ON s.id = c.student_id
     LEFT JOIN users st  ON st.id = c.assigned_to
     JOIN categories cat ON cat.id = c.category_id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0];
}

// Who is allowed to SEE a complaint?
function canView(user, complaint) {
  if (user.role === 'warden') return true;
  if (user.role === 'student') return complaint.student_id === user.id;
  if (user.role === 'staff') return complaint.assigned_to === user.id;
  return false;
}

// Save one row in the history table
async function addHistory(complaintId, userId, message, newStatus = null) {
  await db.query(
    'INSERT INTO complaint_updates (complaint_id, user_id, message, new_status) VALUES (?, ?, ?, ?)',
    [complaintId, userId, message, newStatus]
  );
}

// ---------- routes ----------

// API 5: student raises a complaint
router.post('/', requireRole('student'), async (req, res) => {
  const error = validateComplaint(req.body);
  if (error) return res.status(400).json({ error });

  const { title, description, category_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO complaints (student_id, category_id, title, description) VALUES (?, ?, ?, ?)',
      [req.user.id, Number(category_id), title.trim(), description.trim()]
    );
    await addHistory(result.insertId, req.user.id, 'Complaint raised', 'open');
    res.status(201).json({ id: result.insertId, message: 'Complaint submitted' });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid category' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 6: list complaints. Optional query params: ?status=open&category=2&search=fan
router.get('/', async (req, res) => {
  const { status, category, search } = req.query;

  // We build the WHERE part step by step. "params" holds the values for each "?".
  const conditions = [];
  const params = [];

  // Role decides the base filter
  if (req.user.role === 'student') {
    conditions.push('c.student_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === 'staff') {
    conditions.push('c.assigned_to = ?');
    params.push(req.user.id);
  }
  // warden: no base filter, sees everything

  if (status && STATUSES.includes(status)) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  if (category) {
    conditions.push('c.category_id = ?');
    params.push(Number(category));
  }
  if (search && search.trim()) {
    conditions.push('(c.title LIKE ? OR c.description LIKE ? OR s.room_no LIKE ?)');
    const like = `%${search.trim()}%`;
    params.push(like, like, like);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const [rows] = await db.query(
      `SELECT c.id, c.title, c.status, c.created_at, c.updated_at,
              cat.name AS category, s.name AS student_name, s.room_no,
              st.name AS staff_name
       FROM complaints c
       JOIN categories cat ON cat.id = c.category_id
       JOIN users s        ON s.id = c.student_id
       LEFT JOIN users st  ON st.id = c.assigned_to
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 7: counts per status (warden dashboard cards).
// NOTE: this must come BEFORE "/:id", otherwise Express would treat "stats" as an id.
router.get('/stats', requireRole('warden'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT status, COUNT(*) AS count FROM complaints GROUP BY status'
    );
    // Turn [{status:'open', count:3}, ...] into { open: 3, assigned: 0, ... }
    const stats = { total: 0 };
    STATUSES.forEach((s) => (stats[s] = 0));
    rows.forEach((r) => {
      stats[r.status] = r.count;
      stats.total += r.count;
    });
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 8: one complaint with its full history
router.get('/:id', async (req, res) => {
  try {
    const complaint = await findComplaint(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!canView(req.user, complaint)) return res.status(403).json({ error: 'Not your complaint' });

    const [history] = await db.query(
      `SELECT u.id, u.message, u.new_status, u.created_at, us.name AS by_name, us.role AS by_role
       FROM complaint_updates u
       JOIN users us ON us.id = u.user_id
       WHERE u.complaint_id = ?
       ORDER BY u.created_at ASC, u.id ASC`,
      [req.params.id]
    );

    // Don't send emails back to the browser
    delete complaint.student_email;
    delete complaint.staff_email;
    res.json({ ...complaint, history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 9: warden assigns a complaint to a staff member. Body: { staff_id }
router.put('/:id/assign', requireRole('warden'), async (req, res) => {
  const staffId = Number(req.body.staff_id);
  try {
    const complaint = await findComplaint(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.status === 'closed') return res.status(400).json({ error: 'Complaint is already closed' });

    // Make sure the chosen person really is staff
    const [staffRows] = await db.query(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'staff'",
      [staffId]
    );
    const staff = staffRows[0];
    if (!staff) return res.status(400).json({ error: 'Choose a valid staff member' });

    await db.query(
      "UPDATE complaints SET assigned_to = ?, status = 'assigned' WHERE id = ?",
      [staff.id, complaint.id]
    );
    await addHistory(complaint.id, req.user.id, `Assigned to ${staff.name}`, 'assigned');

    // Notify both people (runs without making the user wait)
    sendMail(staff.email, `New task: ${complaint.title}`,
      `You have been assigned complaint #${complaint.id} (Room ${complaint.room_no}).`);
    sendMail(complaint.student_email, `Complaint #${complaint.id} assigned`,
      `Your complaint "${complaint.title}" has been assigned to ${staff.name}.`);

    res.json({ message: 'Assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 10: change status. Body: { status, message? }
//   staff  -> can set 'in_progress' or 'resolved' on complaints assigned to them
//   warden -> can set any status (for example 'closed' after checking the work)
router.put('/:id/status', requireRole('staff', 'warden'), async (req, res) => {
  const { status, message } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const complaint = await findComplaint(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (req.user.role === 'staff') {
      if (complaint.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'This complaint is not assigned to you' });
      }
      if (!['in_progress', 'resolved'].includes(status)) {
        return res.status(403).json({ error: 'Staff can only mark In Progress or Resolved' });
      }
    }
    if (complaint.status === status) {
      return res.status(400).json({ error: `Already ${status}` });
    }

    await db.query('UPDATE complaints SET status = ? WHERE id = ?', [status, complaint.id]);
    const note = message && message.trim() ? message.trim().slice(0, 400) : `Status changed to ${status}`;
    await addHistory(complaint.id, req.user.id, note, status);

    sendMail(complaint.student_email, `Complaint #${complaint.id} is now ${status}`,
      `Update on "${complaint.title}": ${note}`);

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 11: add a comment. Body: { message }
router.post('/:id/comments', async (req, res) => {
  const message = (req.body.message || '').trim();
  if (message.length < 2) return res.status(400).json({ error: 'Comment is too short' });
  if (message.length > 500) return res.status(400).json({ error: 'Comment is too long (max 500)' });

  try {
    const complaint = await findComplaint(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (!canView(req.user, complaint)) return res.status(403).json({ error: 'Not your complaint' });

    await addHistory(complaint.id, req.user.id, message);
    res.status(201).json({ message: 'Comment added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 12: student deletes their own complaint, only while it is still 'open'
router.delete('/:id', requireRole('student'), async (req, res) => {
  try {
    const complaint = await findComplaint(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.student_id !== req.user.id) return res.status(403).json({ error: 'Not your complaint' });
    if (complaint.status !== 'open') {
      return res.status(400).json({ error: 'Only open complaints can be deleted' });
    }

    // complaint_updates rows are removed automatically (ON DELETE CASCADE)
    await db.query('DELETE FROM complaints WHERE id = ?', [complaint.id]);
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
