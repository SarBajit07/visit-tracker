const prisma = require('./prismaClient');
const seedAdmin = require('./seedAdmin');

async function run() {
  try {
    await seedAdmin(prisma);
    console.log('Admin seed complete');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
