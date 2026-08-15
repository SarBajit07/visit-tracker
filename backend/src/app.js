require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const officesRouter = require('./routes/offices');
const visitsRouter = require('./routes/visits');
const attachmentsRouter = require('./routes/attachments');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Protected routes
app.use('/api/visits', authMiddleware, attachmentsRouter);
app.use('/api/offices', authMiddleware, officesRouter);
app.use('/api/visits', authMiddleware, visitsRouter);

module.exports = app;
