import { Router } from "express";
import * as controller from "../modules/activos/controllers/activos.controller";
import { authenticate } from "../middlewares/auth.middleware";
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

// GET /api/activos/:activoId/traslados
router.get('/:activoId/traslados', authenticate, controller.getTrasladosByActivo);

export default router;
