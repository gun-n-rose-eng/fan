const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

app.post('/api/send-code', async (req, res) => {
  const { email, purpose, code } = req.body;
  if (!email || !purpose || !code) {
    return res.status(400).json({ error: 'Email, purpose, and code are required.' });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(500).json({ error: 'SMTP credentials are not configured.' });
  }

  const subject = `Guns N' Roses ${purpose === 'signup' ? 'Signup' : 'Password Reset'} Verification Code`;
  const text = `Your Guns N' Roses verification code is ${code}.\n\nEnter this code into the Guns N' Roses app to complete the ${purpose === 'signup' ? 'signup' : 'password reset'} process.`;
  const html = `<p>Your <strong>Guns N' Roses</strong> verification code is <strong>${code}</strong>.</p><p>Enter this code into the Guns N' Roses app to complete the ${purpose === 'signup' ? 'signup' : 'password reset'} process.</p>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      text,
      html,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Unable to send verification email.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
