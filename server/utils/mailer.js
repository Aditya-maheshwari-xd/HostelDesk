// utils/mailer.js — sends an email when a complaint is updated.
// If SMTP is not set up in .env, we just print the email in the terminal,
// so the app still works on your laptop without any email account.

const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendMail(to, subject, text) {
  if (!transporter) {
    console.log(`[email] to=${to} | ${subject} | ${text}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
  } catch (err) {
    // An email failure should never break the main request
    console.error('Email failed:', err.message);
  }
}

module.exports = { sendMail };
