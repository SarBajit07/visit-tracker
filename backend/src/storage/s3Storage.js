// Stub for S3/R2 storage adapter. Implement when switching to cloud storage.
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

async function uploadToS3(buffer, key, contentType) {
  const client = new S3Client({ region: process.env.S3_REGION, endpoint: process.env.S3_ENDPOINT });
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };
  await client.send(new PutObjectCommand(params));
  // Construct URL (may vary by provider)
  const url = `${process.env.S3_BASE_URL || ''}/${params.Bucket}/${key}`;
  return url;
}

module.exports = { uploadToS3 };
