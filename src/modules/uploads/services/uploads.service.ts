import crypto from 'crypto';
import sharp from 'sharp';
import fs from 'fs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, getS3Bucket } from '../../../config/s3';
import { saveUpload } from '../repositories/uploads.repository';

const ALLOWED_MIMES = ['application/pdf', 'image/png', 'image/jpeg'];

export const uploadFile = async (file: Express.Multer.File, user: any) => {
  // Validate mime
  if (!ALLOWED_MIMES.includes(file.mimetype)) throw new Error('MIME type not allowed');

  // Optional processing: if image, resize/optimize
  // Support both memoryStorage (file.buffer) and diskStorage (file.path)
  let buffer: Buffer | undefined = (file as any).buffer;
  // If multer used diskStorage, read the file from disk
  if ((!buffer || buffer.length === 0) && (file as any).path) {
    try {
      buffer = await fs.promises.readFile((file as any).path);
    } catch (e) {
      throw new Error('Could not read uploaded file from disk: ' + String(e && e.message ? e.message : e));
    }
  }
  if (!buffer) throw new Error('No file buffer available for upload');
  let contentType = file.mimetype;
  if (file.mimetype.startsWith('image/')) {
    try {
      buffer = await sharp(buffer).resize({ width: 2000, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
      contentType = 'image/jpeg';
    } catch (e) {
      console.warn('Image processing failed, continuing with original buffer', e);
    }
  }

  // Upload to S3
  const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;
  const bucket = getS3Bucket();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType });

  let uploadedToS3 = false;
  let url: string;
  try {
    await s3Client.send(cmd);
    // Create presigned GET URL (expires in 1 hour)
    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    url = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });
    uploadedToS3 = true;
  } catch (e: any) {
    // If credentials are missing or S3 not reachable, fall back to serving the file from local uploads/ directory
    console.warn('S3 upload failed, falling back to local file. Error:', e && (e.message || e));
    const localBase = process.env.SERVER_BASE_URL || process.env.SERVER_URL || 'http://localhost:4000';
    const filenameOnDisk = (file as any).filename || file.originalname;
    url = `${localBase}/uploads/${encodeURIComponent(filenameOnDisk)}`;
  }

  // Persist metadata (use s3Key only if uploadedToS3)
  // If upload to S3 failed, persist an empty s3Key (DB column may be NOT NULL)
  const dbRow = await saveUpload({
    originalName: file.originalname,
    s3Key: uploadedToS3 ? key : '',
    url,
    mime: contentType,
    size: buffer.length,
    uploaderId: user && user.id ? user.id : null,
    metadata: { fieldname: file.fieldname }
  });

  // If multer used diskStorage and we uploaded to S3, try to remove the temporary file to avoid disk buildup
  try {
    if (uploadedToS3 && (file as any).path && fs.existsSync((file as any).path)) {
      await fs.promises.unlink((file as any).path);
    }
  } catch (e) {
    // Don't block the flow if cleanup fails; just warn
    console.warn('Could not remove local uploaded file:', (file as any).path, e && e.message ? e.message : e);
  }

  return { id: dbRow.id, url, filename: file.originalname, mime: contentType, size: buffer.length };
};
