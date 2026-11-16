// seed.js — creates demo accounts so you can try every dashboard.
// Run once AFTER schema.sql:   npm run seed
// Passwords must be hashed, which is why this is a JS file and not plain SQL.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const users = [
  { name: 'Warden Sharma',  email: 'warden@hostel.com',   role: 'warden',  room_no: null },
  { name: 'Ravi (Electrician)', email: 'ravi@hostel.com', role: 'staff',   room_no: null },
  { name: 'Suresh (Plumber)',   email: 'suresh@hostel.com', role: 'staff', room_no: null },
  { name: 'Aman Verma',     email: 'aman@student.com',    role: 'student', room_no: 'A-101' },
  { name: 'Priya Nair',     email: 'priya@student.com',   role: 'student', room_no: 'B-204' },
];

async function seed() {
  const hash = await bcrypt.hash('password123', 10); // same demo password for all

  for (const u of users) {
    // INSERT IGNORE skips the row if the email already exists, so running twice is safe
    await db.query(
      'INSERT IGNORE INTO users (name, email, password_hash, role, room_no) VALUES (?, ?, ?, ?, ?)',
      [u.name, u.email, hash, u.role, u.room_no]
    );
  }

  console.log('Demo users ready. Password for all: password123');
  users.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}`));
  await db.end(); // close the pool so the script exits
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
