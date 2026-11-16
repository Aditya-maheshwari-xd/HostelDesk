// routes/lookups.js — small lists the frontend needs for dropdowns
//   GET /api/categories   (API 3)  complaint types for the "new complaint" form
//   GET /api/staff        (API 4)  staff members, so the warden can pick one to assign

const express = require('express');
const db = require('../db');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

// API 3
router.get('/categories', requireLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 4 — also tells the warden how many unfinished tasks each staff member has
router.get('/staff', requireLogin, requireRole('warden'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name,
              COUNT(CASE WHEN c.status IN ('assigned', 'in_progress') THEN 1 END) AS active_tasks
       FROM users u
       LEFT JOIN complaints c ON c.assigned_to = u.id
       WHERE u.role = 'staff'
       GROUP BY u.id, u.name
       ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
