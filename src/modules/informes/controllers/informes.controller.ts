import { Request, Response } from 'express';
import * as service from '../services/informes.service';
import { validateInformePayload } from '../validators/informe.validator';
import { getInformeById } from '../repositories/informes.repository';
import { pool } from '../../../config/db';
import { s3Client, getS3Bucket } from '../../../config/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export const createInforme = async (req: Request, res: Response) => {
  try {
    // Combine JSON body with any uploaded files (multer)
    const payload = Object.assign({}, req.body);

    // If multer files present, attach their paths for processing
    if ((req as any).files && Array.isArray((req as any).files) && (req as any).files.length) {
      payload._files = (req as any).files.map((f: any) => ({ path: f.path, originalname: f.originalname }));
    }

    // If user has empresaId, prefer that when payload doesn't include it
    const user = (req as any).user;
    if (!payload.empresaId && user && user.empresaId) {
      payload.empresaId = user.empresaId;
      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.empresaId) payload.metadata.empresaId = user.empresaId;
    }

    // Validate payload
    const { error, value } = validateInformePayload(payload);
    if (error) return res.status(400).json({ ok: false, message: 'Payload inválido', details: error.details });

    // Generate PDF (service handles images, S3, Puppeteer)
    const result = await service.generateInformePdf(value, (req as any).user);
    return res.json({ ok: true, data: result });
  } catch (err) {
    console.error('createInforme error:', err);
    return res.status(500).json({ ok: false, message: 'Error generando informe', error: String(err) });
  }
};

export const getInforme = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'ID inválido' });
    const info = await getInformeById(id);
    if (!info) return res.status(404).json({ ok: false, message: 'Informe no encontrado' });
    // Authorization: allow if user has role admin/tecnico OR is the creator
    const user = (req as any).user;
    const allowedRoles = ['admin', 'tecnico'];
    const isAllowedRole = user && user.rol && allowedRoles.includes(user.rol);
    const isCreator = user && user.id && info.created_by && Number(user.id) === Number(info.created_by);

    let isSameCompany = false;
    try {
      if (user && user.empresaId && info.empresa_id && Number(user.empresaId) === Number(info.empresa_id)) {
        isSameCompany = true;
      } else if (user && user.empresaId && info.empresa_nombre) {
        // Fetch company name for user and compare
        const r = await pool.query('SELECT nombre FROM empresas WHERE id = $1', [user.empresaId]);
        const empresaRow = r.rows[0];
        if (empresaRow && String(empresaRow.nombre).trim().toLowerCase() === String(info.empresa_nombre).trim().toLowerCase()) {
          isSameCompany = true;
        }
      }
    } catch (e) {
      // ignore DB errors and treat as not same company
      isSameCompany = false;
    }

    if (!isAllowedRole && !isCreator && !isSameCompany) return res.status(403).json({ ok: false, message: 'Acceso denegado' });

    return res.json({ ok: true, data: info });
  } catch (err) {
    console.error('getInforme error:', err);
    return res.status(500).json({ ok: false, message: 'Error obteniendo informe', error: String(err) });
  }
};

export const downloadInforme = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'ID inválido' });
    const info = await getInformeById(id);
    if (!info) return res.status(404).json({ ok: false, message: 'Informe no encontrado' });
    // Authorization: allow if user has role admin/tecnico OR is the creator
    const user = (req as any).user;
    const allowedRoles = ['admin', 'tecnico'];
    const isAllowedRole = user && user.rol && allowedRoles.includes(user.rol);
    const isCreator = user && user.id && info.created_by && Number(user.id) === Number(info.created_by);

    let isSameCompany = false;
    try {
      if (user && user.empresaId && info.empresa_id && Number(user.empresaId) === Number(info.empresa_id)) {
        isSameCompany = true;
      } else if (user && user.empresaId && info.empresa_nombre) {
        const r = await pool.query('SELECT nombre FROM empresas WHERE id = $1', [user.empresaId]);
        const empresaRow = r.rows[0];
        if (empresaRow && String(empresaRow.nombre).trim().toLowerCase() === String(info.empresa_nombre).trim().toLowerCase()) {
          isSameCompany = true;
        }
      }
    } catch (e) {
      isSameCompany = false;
    }

    if (!isAllowedRole && !isCreator && !isSameCompany) return res.status(403).json({ ok: false, message: 'Acceso denegado' });

    // Fetch from S3 and stream
    const bucket = getS3Bucket();
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: info.s3_key });
    const s3res = await s3Client.send(cmd as any);
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${info.filename || 'informe.pdf'}"`);
    // Stream body
    const body = (s3res as any).Body;
    if (!body) return res.status(500).json({ ok: false, message: 'No se pudo obtener el PDF' });
    // body is a stream in Node
    (body as NodeJS.ReadableStream).pipe(res);
  } catch (err) {
    console.error('downloadInforme error:', err);
    return res.status(500).json({ ok: false, message: 'Error descargando informe', error: String(err) });
  }
};
