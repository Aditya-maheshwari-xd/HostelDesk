// index.js — starting point of the backend.
// Run with:  npm start   (or "npm run dev" to auto-restart on file changes)

require('dotenv').config(); // reads the .env file into process.env
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const lookupRoutes = require('./routes/lookups');

const app = express();

app.use(cors());         // lets the React app (another port) call this server
app.use(express.json()); // turns JSON request bodies into req.body

// Quick check that the server is alive
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Connect URL prefixes to route files
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api', lookupRoutes);

// Anything that didn't match a route above
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HostelDesk API running on http://localhost:${PORT}`));
