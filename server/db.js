// db.js — one place that connects to MySQL.
// A "pool" keeps a few connections open and reuses them, instead of
// opening a new connection for every request (which is slow).

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

module.exports = pool;
