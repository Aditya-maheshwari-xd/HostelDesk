// middleware/auth.js
// Middleware = a function that runs BEFORE the route handler.
// It can let the request continue (next()) or stop it with an error.

const jwt = require('jsonwebtoken');

// 1) Checks that the request has a valid login token.
//    The frontend sends:  Authorization: Bearer <token>
function requireLogin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  try {
    // verify() throws an error if the token was changed or has expired
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data; // { id, name, role } — available in every route after this
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

// 2) Checks the user's role. Usage: requireRole('warden') or requireRole('warden', 'staff')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not allowed to do this' });
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
