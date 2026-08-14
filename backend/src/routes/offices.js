const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

// GET /api/offices?q=&locality=
router.get('/', async (req, res) => {
  const { q, locality } = req.query;
  const where = {};
  if (q) {
    where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }];
  }
  if (locality) where.locality = { equals: locality };

  const offices = await prisma.office.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(offices);
});

// POST /api/offices
router.post('/', async (req, res) => {
  const { name, address, locality, latitude, longitude } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing office name' });
  const office = await prisma.office.create({ data: { name, address, locality, latitude: latitude || null, longitude: longitude || null } });
  res.status(201).json(office);
});

// GET /api/offices/:id (with visits timeline)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const office = await prisma.office.findUnique({ where: { id }, include: { visits: { orderBy: { visitDate: 'desc' } } } });
  if (!office) return res.status(404).json({ error: 'Not found' });
  res.json(office);
});

module.exports = router;
