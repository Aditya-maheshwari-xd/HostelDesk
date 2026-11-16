// utils/validate.js — small hand-written input checks.
// We never trust data coming from the browser, so every route checks it here first.
// Each function returns an error message (string) or null if everything is fine.

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateRegister({ name, email, password, room_no }) {
  if (!name || name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!isEmail(email)) return 'Enter a valid email';
  if (!password || password.length < 6) return 'Password must be at least 6 characters';
  if (!room_no || room_no.trim() === '') return 'Room number is required';
  return null;
}

function validateLogin({ email, password }) {
  if (!isEmail(email)) return 'Enter a valid email';
  if (!password) return 'Password is required';
  return null;
}

function validateComplaint({ title, description, category_id }) {
  if (!title || title.trim().length < 5) return 'Title must be at least 5 characters';
  if (title.length > 150) return 'Title is too long (max 150)';
  if (!description || description.trim().length < 10) return 'Description must be at least 10 characters';
  if (!Number.isInteger(Number(category_id))) return 'Choose a category';
  return null;
}

const STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];

module.exports = { validateRegister, validateLogin, validateComplaint, STATUSES };
