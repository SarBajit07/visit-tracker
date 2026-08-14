require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const prisma = require('./prismaClient');
const seedAdmin = require('./seedAdmin');

const officesRouter = require('./routes/offices');
const visitsRouter = require('./routes/visits');
const attachmentsRouter = require('./routes/attachments');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function start() {
  // Attempt to seed admin user (local/dev only)
  try {
    await seedAdmin(prisma);
  } catch (e) {
    console.warn('Seed admin failed:', e.message || e);
  }

  // Auth login (public)
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminPasswordRaw = process.env.ADMIN_PASSWORD;

    // If admin is configured in env, allow login via env credentials (convenience for v1 single-user)
    if (adminEmail && email === adminEmail) {
      if (adminPasswordHash) {
        const ok = await bcrypt.compare(password, adminPasswordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      } else if (adminPasswordRaw) {
        if (password !== adminPasswordRaw) return res.status(401).json({ error: 'Invalid credentials' });
      } else {
        return res.status(401).json({ error: 'Admin not configured' });
      }

      const token = jwt.sign({ email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
      return res.json({ ok: true });
    }

    // Otherwise check DB user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    return res.json({ ok: true });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ ok: true });
  });

  app.get('/api/ping', (req, res) => res.json({ ok: true }));

  // Protected routes
  // Serve uploaded files
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.use('/api/visits', authMiddleware, attachmentsRouter);
  app.use('/api/offices', authMiddleware, officesRouter);
  app.use('/api/visits', authMiddleware, visitsRouter);

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
