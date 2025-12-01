import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import * as controller from '../modules/uploads/controllers/uploads.controller';

const router = Router();

// Use memory storage so we can process buffer and upload to S3
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// POST /api/uploads - single file under fieldname 'file'
router.post('/', authenticate, upload.single('file'), controller.uploadFile);

export default router;
