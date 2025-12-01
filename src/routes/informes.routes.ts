import { Router } from 'express';
import * as controller from '../modules/informes/controllers/informes.controller';
import { authenticate, authorizeRole } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// POST /api/informes - generate PDF report
router.post('/', authenticate, authorizeRole(['admin','tecnico']), upload.any(), controller.createInforme);

// GET /api/informes/:id - metadata
// Allow authenticated users; controller will enforce role OR creator check
router.get('/:id', authenticate, controller.getInforme);

// GET /api/informes/:id/download - download PDF
// Allow authenticated users; controller will enforce role OR creator check
router.get('/:id/download', authenticate, controller.downloadInforme);

export default router;
