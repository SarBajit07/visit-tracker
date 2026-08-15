require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('./prismaClient');
const seedAdmin = require('./seedAdmin');
const app = require('./app');

const PORT = process.env.PORT || 4000;

// Auth login (kept in index because it uses environment-based admin shortcut)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const adminPasswordRaw = process.env.ADMIN_PASSWORD;

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

async function start() {
  try {
    await seedAdmin(prisma);
  } catch (e) {
    console.warn('Seed admin failed:', e.message || e);
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

if (require.main === module) {
  start().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
