import { Router } from 'express';
import * as plataformasController from './plataformas.controller';
import * as tiposController from './tipos.controller';
import * as protocolosController from './protocolos.controller';

const router = Router();

// ============ PLATAFORMAS CORREO ============
router.get('/plataformas', plataformasController.getAll);
router.get('/plataformas/:id', plataformasController.getById);
router.post('/plataformas', plataformasController.create);
router.put('/plataformas/:id', plataformasController.update);
router.delete('/plataformas/:id', plataformasController.remove);

// ============ TIPOS CORREO ============
router.get('/tipos-correo', tiposController.getAll);
router.get('/tipos-correo/:id', tiposController.getById);
router.post('/tipos-correo', tiposController.create);
router.put('/tipos-correo/:id', tiposController.update);
router.delete('/tipos-correo/:id', tiposController.remove);

// ============ PROTOCOLOS CORREO ============
router.get('/protocolos', protocolosController.getAll);
router.get('/protocolos/:id', protocolosController.getById);
router.post('/protocolos', protocolosController.create);
router.put('/protocolos/:id', protocolosController.update);
router.delete('/protocolos/:id', protocolosController.remove);

export default router;
