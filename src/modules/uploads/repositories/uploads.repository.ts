import { pool } from '../../../config/db';

export const saveUpload = async (data: {
  originalName: string;
  s3Key: string;
  url: string;
  mime?: string;
  size?: number;
  uploaderId?: number | null;
  metadata?: any;
}) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO uploads (original_name, s3_key, url, mime, size, uploader_id, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING id, created_at`,
      [
        data.originalName,
        // Ensure s3_key is never NULL to satisfy DB NOT NULL constraint
        (data.s3Key ?? ''),
        data.url,
        data.mime || null,
        data.size || null,
        data.uploaderId || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
};
