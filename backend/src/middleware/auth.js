const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

async function authMiddleware(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    let user = null;
    if (payload.userId) {
      user = await prisma.user.findUnique({ where: { id: payload.userId } });
    } else if (payload.email) {
      user = await prisma.user.findUnique({ where: { email: payload.email } });
    }
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
