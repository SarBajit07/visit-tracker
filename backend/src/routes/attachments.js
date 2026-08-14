const express = require('express');
const prisma = require('../prismaClient');
const path = require('path');

const router = express.Router();

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
let uploadMiddleware;
if (STORAGE_PROVIDER === 'local') {
  const local = require('../storage/localStorage');
  uploadMiddleware = local.upload.single('file');
} else {
  // For cloud providers we expect the client to send a file buffer; stub for now
  const multer = require('multer');
  const storage = multer.memoryStorage();
  uploadMiddleware = multer({ storage }).single('file');
}

// POST /api/visits/:id/attachments
router.post('/:id/attachments', uploadMiddleware, async (req, res) => {
  const visitId = req.params.id;
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  let fileUrl;
  if (STORAGE_PROVIDER === 'local') {
    // file.path is absolute on disk, expose via /uploads/<filename>
    const filename = path.basename(req.file.path || req.file.filename);
    fileUrl = `/uploads/${filename}`;
  } else {
    // stub for cloud: implement uploadToS3 in storage adapter
    const { uploadToS3 } = require('../storage/s3Storage');
    const key = `visits/${visitId}/${Date.now()}-${req.file.originalname}`;
    fileUrl = await uploadToS3(req.file.buffer, key, req.file.mimetype);
  }

  const attachment = await prisma.visitAttachment.create({ data: { visitId, fileUrl } });
  res.status(201).json(attachment);
});

module.exports = router;
