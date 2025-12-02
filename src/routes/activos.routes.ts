import { Router } from "express";
import * as controller from "../modules/activos/controllers/activos.controller";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware";
import multer from 'multer';
import path from 'path';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}-${safe}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const router = Router();

// GET /api/activos/:activoId/historial
router.get('/:activoId/historial', authenticate, controller.getHistorialByActivo);

// POST /api/activos/:id/trasladar
router.post('/:id/trasladar', authenticate, upload.any(), controller.trasladarActivo);

// POST /api/activos/:activoId/token  -> create or get token (admin/service)
router.post('/:activoId/token', authenticate, authorizeRole(['administrador','servicio']), controller.createOrGetToken);
// POST /api/activos/tokens  -> batch get/create tokens (admin/servicio). Body: { ids: [1,2,3] }
router.post('/tokens', authenticate, authorizeRole(['administrador','servicio']), controller.getTokensBatch);

// POST /api/activos/:activoId/token/regenerate -> regenerate token (admin only)
router.post('/:activoId/token/regenerate', authenticate, authorizeRole(['administrador']), controller.regenerateToken);
// DELETE /api/activos/:activoId/token -> revoke token (admin)
router.delete('/:activoId/token', authenticate, authorizeRole(['administrador']), controller.deleteToken);

// GET /api/activos/:activoId/traslados
router.get('/:activoId/traslados', authenticate, controller.getTrasladosByActivo);

export default router;
