import { Router, Request, Response } from 'express';
import * as service from '../modules/activos/services/activos.service';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import nodemailer from 'nodemailer';

// reuse pool to query empresa/sede names when needed
import { pool } from '../config/db';

const router = Router();

// CORS middleware for all public routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

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
  upload.array('attachments', 10)(req as any, res as any, (err: any) => {
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

    // Validate required fields
    const reporterEmail = req.body.reporterEmail;
    const description = req.body.description;
    const anydesk = req.body.anydesk;

    if (!reporterEmail || !description || !anydesk) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Campos requeridos: reporterEmail, description, anydesk' 
      });
    }

    // Extract optional fields
    const reporterUserId = req.body.reporterUserId ? parseInt(req.body.reporterUserId) : null;
    const reporterName = req.body.reporterName || null;
    const operational = req.body.operational || null;

    // Insert into reporte_usuario table
    const insertReportQuery = `
      INSERT INTO reporte_usuario (
        asset_id, reporter_user_id, reporter_name, reporter_email, 
        description, operational, anydesk, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const reportResult = await pool.query(insertReportQuery, [
      activo.assetId,
      reporterUserId,
      reporterName,
      reporterEmail,
      description,
      operational,
      anydesk
    ]);

    const reportId = reportResult.rows[0].id;

    // Process attachments saved by multer
    const files = (req as any).files || [];
    
    // Insert each attachment into reporte_adjuntos table
    for (const file of files) {
      const insertAttachmentQuery = `
        INSERT INTO reporte_adjuntos (
          reporte_id, file_name, file_path, file_type, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await pool.query(insertAttachmentQuery, [
        reportId,
        file.originalname,
        `/uploads/${file.filename}`,
        file.mimetype
      ]);
    }

    // Record report in log (append) for backward compatibility
    try {
      const REPORT_LOG = path.join(LOG_DIR, 'public_reports.log');
      const saved = files.map((f: any) => ({ 
        filename: f.filename, 
        path: `/uploads/${f.filename}`, 
        mimetype: f.mimetype, 
        size: f.size 
      }));
      const line = JSON.stringify({
        ts: new Date().toISOString(), ip, token: token || null, assetId: activo.assetId, 
        activoId: activo.id, reportId, reporterUserId, reporterName, reporterEmail,
        description, operational, anydesk, attachments: saved
      }) + '\n';
      fs.appendFileSync(REPORT_LOG, line);
    } catch (e) {
      console.warn('Failed to write report log', e);
    }

    // Send confirmation email
    try {
      // Debug: verify SMTP environment variables are loaded
      console.log('[EMAIL DEBUG] SMTP_USER:', process.env.SMTP_USER);
      console.log('[EMAIL DEBUG] SMTP_PASS:', process.env.SMTP_PASS ? '***CONFIGURED***' : 'UNDEFINED');
      console.log('[EMAIL DEBUG] SMTP_HOST:', process.env.SMTP_HOST);
      console.log('[EMAIL DEBUG] SMTP_PORT:', process.env.SMTP_PORT);

      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('[EMAIL ERROR] Missing SMTP credentials in environment variables');
        throw new Error('SMTP credentials not configured');
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const FRONTEND_URL = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';

      const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Registrado</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, Helvetica, sans-serif;">
  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Email Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); background-color: #0ea5e9; padding: 40px 20px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Logo Circle -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 15px;">
                      <tr>
                        <td style="background-color: #ffffff; width: 100px; height: 100px; border-radius: 50px; text-align: center; vertical-align: middle;">
                          <img src="cid:logo-intisoft" alt="INTISOFT Logo" width="70" height="70" style="display: block; margin: 15px auto;" />
                        </td>
                      </tr>
                    </table>
                    <!-- Company Name -->
                    <div style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px; margin-bottom: 10px;">
                      INTISOFT
                    </div>
                    <!-- Header Title -->
                    <div style="color: #ffffff; font-size: 24px; font-weight: 600; margin-top: 10px;">
                         Ticket Registrado Exitosamente
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Success Icon -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #10b981; width: 60px; height: 60px; border-radius: 30px; text-align: center; vertical-align: middle; color: #ffffff; font-size: 32px; font-weight: bold;">
                          ✓
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Intro Text -->
                <tr>
                  <td align="center" style="color: #475569; font-size: 16px; padding-bottom: 25px; line-height: 1.5;">
                    Tu reporte ha sido registrado correctamente en nuestro sistema. Nuestro equipo técnico revisará tu solicitud a la brevedad.
                  </td>
                </tr>
                
                <!-- Ticket ID Section -->
                <tr>
                  <td align="center" style="padding-bottom: 25px;">
                    <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color: #f8fafc; border: 2px dashed #0ea5e9; border-radius: 8px;">
                      <tr>
                        <td align="center">
                          <div style="color: #64748b; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                            Número de Ticket
                          </div>
                          <div style="color: #0ea5e9; font-size: 36px; font-weight: bold; font-family: 'Courier New', Courier, monospace;">
                            #${reportId}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Info Table -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table width="100%" cellpadding="12" cellspacing="0" border="0">
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td width="120" style="color: #64748b; font-size: 14px; font-weight: 500; vertical-align: top;">
                          Activo:
                        </td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: bold;">
                          ${activo.assetId}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td width="120" style="color: #64748b; font-size: 14px; font-weight: 500; vertical-align: top; padding-top: 12px;">
                          Descripción:
                        </td>
                        <td style="color: #1e293b; font-size: 14px; padding-top: 12px;">
                          ${description}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td width="120" style="color: #64748b; font-size: 14px; font-weight: 500; vertical-align: top; padding-top: 12px;">
                          Estado:
                        </td>
                        <td style="color: #0ea5e9; font-size: 14px; font-weight: bold; padding-top: 12px;">
                          Enviado
                        </td>
                      </tr>
                      <tr>
                        <td width="120" style="color: #64748b; font-size: 14px; font-weight: 500; vertical-align: top; padding-top: 12px;">
                          AnyDesk:
                        </td>
                        <td style="padding-top: 12px;">
                          <code style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #1e293b; font-size: 14px; font-family: 'Courier New', Courier, monospace;">
                            ${anydesk}
                          </code>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 20px 0;">
                    <div style="height: 1px; background-color: #e2e8f0;"></div>
                  </td>
                </tr>
                
                <!-- Status Section -->
                <tr>
                  <td style="padding-bottom: 25px;">
                    <table width="100%" cellpadding="25" cellspacing="0" border="0" style="background-color: #f8fafc; border-radius: 8px;">
                      <tr>
                        <td>
                          <!-- Status Title -->
                          <div style="color: #1e293b; font-size: 16px; font-weight: 600; text-align: center; margin-bottom: 20px;">
                            Estado del Ticket
                          </div>
                          
                          <!-- Status Steps -->
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <!-- Step 1: Enviado (Active) -->
                              <td width="33%" align="center" style="vertical-align: top;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center">
                                      <div style="background-color: #0ea5e9; width: 40px; height: 40px; border-radius: 20px; color: #ffffff; font-size: 16px; font-weight: bold; line-height: 40px; text-align: center; margin: 0 auto 10px;">
                                        ✓
                                      </div>
                                      <div style="color: #0ea5e9; font-size: 13px; font-weight: 500;">
                                        Enviado
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              
                              <!-- Step 2: En proceso (Inactive) -->
                              <td width="33%" align="center" style="vertical-align: top;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center">
                                      <div style="background-color: #e2e8f0; width: 40px; height: 40px; border-radius: 20px; color: #94a3b8; font-size: 16px; font-weight: bold; line-height: 40px; text-align: center; margin: 0 auto 10px;">
                                        2
                                      </div>
                                      <div style="color: #94a3b8; font-size: 13px; font-weight: 500;">
                                        En proceso
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              
                              <!-- Step 3: Finalizado (Inactive) -->
                              <td width="33%" align="center" style="vertical-align: top;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td align="center">
                                      <div style="background-color: #e2e8f0; width: 40px; height: 40px; border-radius: 20px; color: #94a3b8; font-size: 16px; font-weight: bold; line-height: 40px; text-align: center; margin: 0 auto 10px;">
                                        3
                                      </div>
                                      <div style="color: #94a3b8; font-size: 13px; font-weight: 500;">
                                        Finalizado
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Button -->
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color: #0ea5e9; border-radius: 8px;">
                          <a href="${FRONTEND_URL}/public/ticket/${reportId}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                            📋 Ver Estado del Ticket
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Tip -->
                <tr>
                  <td align="center" style="color: #64748b; font-size: 13px; padding-top: 20px;">
                    💡 <strong>Tip:</strong> Guarda este correo para acceder al estado de tu ticket en cualquier momento
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="color: #64748b; font-size: 13px; line-height: 1.6; padding-bottom: 10px;">
                    <strong>Recibirás actualizaciones por correo</strong> cuando tu ticket cambie de estado.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color: #64748b; font-size: 13px; line-height: 1.6; padding-bottom: 10px;">
                    Si tienes alguna duda, puedes responder a este correo.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color: #64748b; font-size: 13px; line-height: 1.6; padding-top: 15px;">
                    © ${new Date().getFullYear()} <strong>INTISOFT</strong> - Sistema de Gestión de Activos
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

      await transporter.sendMail({
        from: `"INTISOFT Soporte" <${process.env.SMTP_USER}>`,
        to: reporterEmail,
        subject: '✅ Tu ticket de soporte fue enviado',
        html: htmlEmail,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(process.cwd(), 'public', 'logo.png'),
            cid: 'logo-intisoft'
          }
        ]
      });

      console.log(`✅ Confirmation email sent to ${reporterEmail} for report #${reportId}`);
    } catch (emailError) {
      // Don't fail the request if email fails, just log it
      console.error('Failed to send confirmation email:', emailError);
    }

    logAccess(ip, token || assetIdParam, true);
    
    // Return success with reportId
    return res.status(200).json({ 
      success: true, 
      reportId: reportId
    });
  } catch (err: any) {
    console.error('public report error:', err && (err.stack || err));
    logAccess(ip, token || assetIdParam, false);
    // Ensure multer/other errors return JSON
    if (err && err.message) return res.status(400).json({ ok: false, message: err.message });
    return res.status(500).json({ ok: false, message: 'Error' });
  }
});

// GET public ticket details - allows users to view their ticket from email link
router.get('/ticket/:ticketId', async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    
    // Validate ticketId is a number
    const ticketIdNum = parseInt(ticketId);
    if (isNaN(ticketIdNum)) {
      return res.status(400).json({ ok: false, message: 'ID de ticket inválido' });
    }
    
    const result = await pool.query(`
      SELECT 
        r.*,
        json_agg(
          json_build_object(
            'id', a.id,
            'file_name', a.file_name,
            'file_path', a.file_path,
            'file_type', a.file_type
          )
        ) FILTER (WHERE a.id IS NOT NULL) as attachments
      FROM reporte_usuario r
      LEFT JOIN reporte_adjuntos a ON a.reporte_id = r.id
      WHERE r.id = $1
      GROUP BY r.id
    `, [ticketIdNum]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Ticket no encontrado' });
    }
    
    return res.json({ ok: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return res.status(500).json({ ok: false, message: 'Error al obtener el ticket' });
  }
});

export default router;
