import { Router } from 'express';
import controller from '../controllers/catalogo.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import catalogoCorreoRoutes from '../../catalogo-correo/routes';

const router = Router();

router.get('/categorias', authenticate, controller.listCategorias.bind(controller));
router.post('/categorias', authenticate, controller.createCategoria.bind(controller));
router.put('/categorias/:id', authenticate, controller.updateCategoria.bind(controller));

router.get('/subcategorias', authenticate, controller.listSubcategorias.bind(controller));
router.post('/subcategorias', authenticate, controller.createSubcategoria.bind(controller));
router.put('/subcategorias/:id', authenticate, controller.updateSubcategoria.bind(controller));

// Catálogo de correos (plataformas, tipos, protocolos)
router.use('/', authenticate, catalogoCorreoRoutes);

export default router;
