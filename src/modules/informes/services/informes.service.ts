import ejs from 'ejs';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

import { s3Client, getS3Bucket } from '../../../config/s3';
import { saveInforme } from '../repositories/informes.repository';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'src', 'modules', 'informes', 'templates', 'informe.ejs');

async function uploadBufferToS3(buffer: Buffer, key: string, contentType: string) {
  const bucket = getS3Bucket();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType });
  await s3Client.send(cmd);
  // Return a public-ish URL assuming bucket public or CloudFront; adapt as needed
  return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
}

async function processImageSource(src: any) {
  // src may be { url } or { base64 }
  if (src.url) return src.url;
  if (src.base64) {
    // Expect data:[mime];base64,....
    const match = /data:(image\/\w+);base64,(.+)/.exec(src.base64);
    if (!match) throw new Error('base64 image malformada');
    const mime = match[1];
    const b64 = match[2];
    const buffer = Buffer.from(b64, 'base64');
    // Optimize with sharp (max width 1600)
    const optimized = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    const key = `informes/images/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.jpg`;
    const url = await uploadBufferToS3(optimized, key, 'image/jpeg');
    return url;
  }
  throw new Error('imagen sin url ni base64');
}

export const generateInformePdf = async (payload: any, user: any) => {
  // Process photos and signature
  const processedPhotos: string[] = [];
  if (Array.isArray(payload.photos)) {
    for (const p of payload.photos) {
      const url = await processImageSource(p);
      processedPhotos.push(url);
    }
  }

  let signatureUrl: string | null = null;
  if (payload.signature) {
    signatureUrl = await processImageSource(payload.signature);
  }

  // Render HTML with EJS
  const html = await ejs.renderFile(TEMPLATE_PATH, { payload, photos: processedPhotos, signatureUrl, user }, { async: true });

  // Launch puppeteer
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // Wait an extra moment for fonts/images
    await page.waitForTimeout(500);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });

    // Upload PDF to S3
    const key = `informes/pdf/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.pdf`;
    const url = await uploadBufferToS3(pdfBuffer, key, 'application/pdf');

    // Persist metadata in DB
    try {
      const empresaIdToSave = payload.empresaId || (payload.metadata && payload.metadata.empresaId) || (user && user.empresaId) || null;
      const dbRow = await saveInforme({
        assetId: payload.assetId,
        empresaId: empresaIdToSave || undefined,
        empresaNombre: payload.empresaNombre,
        sedeNombre: payload.sedeNombre,
        pdfUrl: url,
        s3Key: key,
        filename: key.split('/').pop() || key,
        metadata: payload.metadata || {},
        payload: payload,
        createdBy: user && user.id ? user.id : null
      });

      return { url, key, filename: key.split('/').pop(), informeId: dbRow.id, createdAt: dbRow.created_at };
    } catch (dbErr) {
      // If DB save fails, still return URL but log the error
      console.error('Failed saving informe metadata:', dbErr);
      return { url, key, filename: key.split('/').pop() };
    }
  } finally {
    try { await browser.close(); } catch (e) { /* ignore */ }
  }
};
