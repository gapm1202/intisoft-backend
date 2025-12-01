import { Request, Response } from 'express';
import * as service from '../services/uploads.service';

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ ok: false, message: 'No file uploaded (field: file)' });

    const user = (req as any).user;
    const result = await service.uploadFile(file, user);
    return res.json({ ok: true, data: result });
  } catch (err) {
    console.error('uploadFile error:', err);
    return res.status(500).json({ ok: false, message: 'Error uploading file', error: String(err) });
  }
};
