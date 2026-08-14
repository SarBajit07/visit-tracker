const bcrypt = require('bcrypt');

async function seedAdmin(prisma) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PASSWORD_HASH } = process.env;
  if (!ADMIN_EMAIL) return;

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) return;

  let passwordHash = ADMIN_PASSWORD_HASH;
  if (!passwordHash && ADMIN_PASSWORD) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
  }
  if (!passwordHash) return;

  await prisma.user.create({ data: { email: ADMIN_EMAIL, passwordHash } });
}

module.exports = seedAdmin;
