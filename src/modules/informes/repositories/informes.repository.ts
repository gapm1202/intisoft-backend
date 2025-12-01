import { pool } from '../../../config/db';

export const saveInforme = async (data: {
  assetId: string;
  empresaNombre: string;
  empresaId?: number;
  sedeNombre: string;
  pdfUrl: string;
  s3Key: string;
  filename: string;
  metadata?: any;
  payload?: any;
  createdBy?: number;
}) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO informes (asset_id, empresa_id, empresa_nombre, sede_nombre, pdf_url, s3_key, filename, metadata, payload, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10) RETURNING id, created_at`,
      [data.assetId, data.empresaId || null, data.empresaNombre, data.sedeNombre, data.pdfUrl, data.s3Key, data.filename, JSON.stringify(data.metadata || {}), JSON.stringify(data.payload || {}), data.createdBy || null]
    );
    return res.rows[0];
  } finally {
    client.release();
  }
};

export const getInformeById = async (id: number) => {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT id, asset_id, empresa_id, empresa_nombre, sede_nombre, pdf_url, s3_key, filename, metadata, payload, created_by, created_at FROM informes WHERE id = $1`, [id]);
    return res.rows[0] || null;
  } finally {
    client.release();
  }
};
