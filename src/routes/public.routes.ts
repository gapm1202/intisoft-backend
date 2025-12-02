import { Router, Request, Response } from 'express';
import * as service from '../modules/activos/services/activos.service';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// reuse pool to query empresa/sede names when needed
import { pool } from '../config/db';

const router = Router();

// Simple in-memory rate limiter: map key -> array of timestamps (ms)
const rateMap: Map<string, number[]> = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute for GET
const MAX_REQUESTS = 10; // per IP+token per window (GET)

const WINDOW_MS_POST = 60 * 60 * 1000; // 1 hour for POST report
const MAX_REQUESTS_POST = 20; // per IP+token per window (POST)

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'public_tokens.log');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch(e) { /* ignore */ }

function logAccess(ip: string, token: string, ok: boolean) {
  const line = `${new Date().toISOString()} - IP=${ip} - token=${token} - ok=${ok}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch (e) { console.warn('Failed to write public token log', e); }
}

router.get('/activos', async (req: Request, res: Response) => {
  const token = String(req.query.token || '');
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

  if (!token) return res.status(400).json({ ok: false, message: 'token missing' });

  // rate limiting per ip+token
  const key = `${ip}|${token}`;
  const now = Date.now();
  const arr = rateMap.get(key) || [];
  // drop old
  const filtered = arr.filter(t => now - t <= WINDOW_MS);
  if (filtered.length >= MAX_REQUESTS) {
    logAccess(ip, token, false);
    return res.status(429).json({ ok: false, message: 'Too many requests' });
  }
  filtered.push(now);
  rateMap.set(key, filtered);

  try {
    const activo = await service.getActivoByEtiquetaToken(token);
    if (!activo) {
      logAccess(ip, token, false);
      return res.status(404).json({ ok: false, message: 'Token no válido' });
    }

    // gather empresa and sede names if available
    let empresaNombre: string | null = null;
    let sedeNombre: string | null = null;
    try {
      if (activo.empresaId) {
        const r = await pool.query('SELECT nombre FROM empresas WHERE id = $1', [activo.empresaId]);
        empresaNombre = r.rows[0]?.nombre || null;
      }
      if (activo.sedeId) {
        const r2 = await pool.query('SELECT nombre FROM sedes WHERE id = $1', [activo.sedeId]);
        sedeNombre = r2.rows[0]?.nombre || null;
      }
    } catch (e) {
      // ignore DB name resolution errors
    }

    logAccess(ip, token, true);

    // If FRONTEND_PUBLIC_URL is configured, redirect there (frontend can render form)
    const frontend = process.env.FRONTEND_PUBLIC_URL || '';
    // If FRONTEND_PUBLIC_URL is configured, include redirect URL in JSON (do NOT redirect)
    const frontendUrl = process.env.FRONTEND_PUBLIC_URL ? `${process.env.FRONTEND_PUBLIC_URL.replace(/\/$/, '')}/public/activos?token=${encodeURIComponent(token)}` : null;

    // Prepare usuariosAsignados by reading possible column names (usuarios_asignados, usuariosAsignados, usuario_asignado)
    const rawUsers = activo.usuarios_asignados || activo.usuariosAsignados || activo.usuario_asignado || activo.usuarioAsignado || null;
    let usuarios: Array<{ id?: any; nombre?: string; email?: string; cargo?: string }> = [];
    if (rawUsers) {
      try {
        if (typeof rawUsers === 'string') {
          // try parse JSON string, otherwise treat as single id/name
          try {
            const parsed = JSON.parse(rawUsers);
            if (Array.isArray(parsed)) {
              usuarios = parsed.map((u: any) => {
                if (typeof u === 'string') return { id: u, nombre: u };
                return {
                  id: u.id || u._id || u.usuario_id || null,
                  nombre: u.nombre || u.name || u.nombre_completo || null,
                  email: u.email || u.correo || null,
                  cargo: u.cargo || null
                };
              });
            } else if (typeof parsed === 'object' && parsed !== null) {
              usuarios = [{ id: parsed.id || parsed._id || parsed.usuario_id || null, nombre: parsed.nombre || parsed.name || parsed.nombre_completo || null, email: parsed.email || parsed.correo || null, cargo: parsed.cargo || null }];
            } else {
              usuarios = [{ id: parsed, nombre: String(parsed) }];
            }
          } catch (e) {
            // not JSON, treat as comma separated or single
            if (rawUsers.indexOf(',') !== -1) {
              usuarios = rawUsers.split(',').map((s: string) => ({ id: s.trim(), nombre: s.trim() }));
            } else {
              usuarios = [{ id: rawUsers, nombre: String(rawUsers) }];
            }
          }
        } else if (Array.isArray(rawUsers)) {
          usuarios = rawUsers.map((u: any) => {
            if (typeof u === 'string') return { id: u, nombre: u };
            return {
              id: u.id || u._id || u.usuario_id || null,
              nombre: u.nombre || u.name || u.nombre_completo || null,
              email: u.email || u.correo || null,
              cargo: u.cargo || null
            };
          });
        } else if (typeof rawUsers === 'object') {
          usuarios = [{ id: rawUsers.id || rawUsers._id || rawUsers.usuario_id || null, nombre: rawUsers.nombre || rawUsers.name || rawUsers.nombre_completo || null, email: rawUsers.email || rawUsers.correo || null, cargo: rawUsers.cargo || null }];
        }
      } catch (e) {
        console.warn('public route - failed parsing usuarios_asignados', e);
        usuarios = [];
      }
    }

    // Temporary debug log: show raw DB field and normalized users
    try {
      console.log('public GET /activos - row usuarios_asignados raw:', rawUsers, 'normalized usuariosAsignados:', usuarios);
    } catch (e) {
      /* ignore logging errors */
    }

    // Return required fields for frontend page (always JSON)
    return res.json({ ok: true, data: {
      assetId: activo.assetId,
      assetCode: activo.assetId,
      empresa: empresaNombre,
      sede: sedeNombre,
      usuariosAsignados: usuarios,
      // also include snake_case for backwards compatibility
      usuarios_asignados: usuarios
    }, redirectTo: frontendUrl });
  } catch (err) {
    console.error('public route error:', err && (err.stack || err));
    logAccess(ip, token, false);
    return res.status(500).send('Error');
  }
});

// Multer setup for reports
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.resolve(process.cwd(), 'uploads')),
    filename: (req, file, cb) => {
      const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    const okTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    if (okTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Invalid file type'));
  }
});

// POST public report - accepts token or assetId and form fields + attachments[]
router.post('/activos/report', (req: Request, res: Response, next) => {
  // handle multer errors and then proceed to main handler
  upload.array('attachments[]', 10)(req as any, res as any, (err: any) => {
    if (err) {
      // Multer errors -> return JSON
      const message = err && err.message ? err.message : 'File upload error';
      return res.status(400).json({ ok: false, message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
  const token = String(req.body.token || req.query.token || '');
  const assetIdParam = String(req.body.assetId || req.query.assetId || '');

  // rate limiting per ip+token or ip+assetId
  const key = `${ip}|${token || assetIdParam}`;
  const now = Date.now();
  const arr = rateMap.get(key) || [];
  const filtered = arr.filter(t => now - t <= WINDOW_MS_POST);
  if (filtered.length >= MAX_REQUESTS_POST) {
    logAccess(ip, token || assetIdParam, false);
    return res.status(429).json({ ok: false, message: 'Too many requests' });
  }
  filtered.push(now);
  rateMap.set(key, filtered);

  try {
    let activo: any = null;
    if (token) {
      activo = await service.getActivoByEtiquetaToken(token);
      if (!activo) return res.status(404).json({ ok: false, message: 'Token no válido' });
    } else if (assetIdParam) {
      activo = await service.getActivoByAssetId(assetIdParam);
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
    } else {
      return res.status(400).json({ ok: false, message: 'token o assetId requerido' });
    }

    // extract form fields
    const reporterUserId = req.body.reporterUserId || null;
    const description = req.body.description || '';
    const operational = req.body.operational || null;
    const anydesk = req.body.anydesk || null;

    // attachments saved by multer
    const files = (req as any).files || [];
    const saved = files.map((f: any) => ({ filename: f.filename, path: `/uploads/${f.filename}`, mimetype: f.mimetype, size: f.size }));

    // record report in log (append)
    try {
      const REPORT_LOG = path.join(LOG_DIR, 'public_reports.log');
      const line = JSON.stringify({
        ts: new Date().toISOString(), ip, token: token || null, assetId: activo.assetId, activoId: activo.id,
        reporterUserId, description, operational, anydesk, attachments: saved
      }) + '\n';
      fs.appendFileSync(REPORT_LOG, line);
    } catch (e) {
      console.warn('Failed to write report log', e);
    }

    logAccess(ip, token || assetIdParam, true);
    return res.status(201).json({ ok: true, message: 'Report received', data: { activoId: activo.id, attachments: saved } });
  } catch (err: any) {
    console.error('public report error:', err && (err.stack || err));
    logAccess(ip, token || assetIdParam, false);
    // Ensure multer/other errors return JSON
    if (err && err.message) return res.status(400).json({ ok: false, message: err.message });
    return res.status(500).json({ ok: false, message: 'Error' });
  }
});

export default router;
