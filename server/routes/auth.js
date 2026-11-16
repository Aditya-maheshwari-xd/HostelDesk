// routes/auth.js — register and login
//   POST /api/auth/register   (API 1)
//   POST /api/auth/login      (API 2)

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validateRegister, validateLogin } = require('../utils/validate');

const router = express.Router();

// Creates a token that holds the user's id, name and role. Valid for 1 day.
function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

// API 1: Only STUDENTS can sign up themselves.
// Warden and staff accounts are created by seed.js (an admin would do this in real life).
router.post('/register', async (req, res) => {
  const error = validateRegister(req.body);
  if (error) return res.status(400).json({ error });

  const { name, email, password, room_no } = req.body;
  try {
    // Never store the real password. bcrypt turns it into a one-way hash.
    const hash = await bcrypt.hash(password, 10);

    // The "?" placeholders stop SQL injection — mysql2 escapes the values for us.
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, room_no) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hash, 'student', room_no.trim()]
    );

    const user = { id: result.insertId, name: name.trim(), role: 'student' };
    res.status(201).json({ token: makeToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This email is already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// API 2: Login for all roles
router.post('/login', async (req, res) => {
  const error = validateLogin(req.body);
  if (error) return res.status(400).json({ error });

  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];

    // Same message for "no user" and "wrong password" so attackers can't guess emails
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }

    res.json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
