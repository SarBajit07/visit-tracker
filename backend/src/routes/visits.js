const express = require('express');
const prisma = require('../prismaClient');

const router = express.Router();

// POST /api/visits
router.post('/', async (req, res) => {
  const data = req.body;
  // Allow creating an office on the fly: accept officeId or officeName
  let officeId = data.officeId;
  if (!officeId && data.officeName) {
    const created = await prisma.office.create({ data: { name: data.officeName, address: data.officeAddress || null, locality: data.locality || null, latitude: data.latitude || null, longitude: data.longitude || null } });
    officeId = created.id;
  }
  if (!officeId) return res.status(400).json({ error: 'Missing officeId or officeName' });

  const visit = await prisma.visit.create({ data: {
    officeId,
    userId: data.userId || null,
    visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
    status: data.status || 'FOLLOW_UP',
    priority: data.priority || 'WARM',
    contactName: data.contactName || null,
    contactDesignation: data.contactDesignation || null,
    contactNumber: data.contactNumber || null,
    interestTags: data.interestTags || null,
    notes: data.notes || null,
    nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
  } });

  res.status(201).json(visit);
});

// GET /api/visits?status=&priority=&locality=&start=&end=
router.get('/', async (req, res) => {
  const { status, priority, locality, start, end, q } = req.query;
  const where = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (start || end) {
    where.visitDate = {};
    if (start) where.visitDate.gte = new Date(start);
    if (end) where.visitDate.lte = new Date(end);
  }
  if (locality) where.office = { locality: { equals: locality } };
  if (q) where.OR = [{ contactName: { contains: q, mode: 'insensitive' } }];

  const visits = await prisma.visit.findMany({ where, orderBy: { visitDate: 'desc' }, include: { office: true } });
  res.json(visits);
});

// PATCH /api/visits/:id
router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const payload = req.body;
  if (payload.visitDate) payload.visitDate = new Date(payload.visitDate);
  if (payload.nextFollowupDate) payload.nextFollowupDate = new Date(payload.nextFollowupDate);

  const updated = await prisma.visit.update({ where: { id }, data: payload });
  res.json(updated);
});

// DELETE /api/visits/:id
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  await prisma.visit.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
