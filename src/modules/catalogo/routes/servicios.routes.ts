import { Router } from 'express';
import * as serviciosController from '../controllers/servicios.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

/**
 * Rutas especiales (deben ir ANTES de las rutas con parámetros)
 */

// GET /api/catalogo/servicios/stats - Estadísticas
router.get('/stats', serviciosController.getServicioStats);

// GET /api/catalogo/servicios/tipos - Lista de tipos de servicio
router.get('/tipos', serviciosController.getAllTiposServicio);

// POST /api/catalogo/servicios/tipos - Crear tipo de servicio
router.post('/tipos', serviciosController.createTipoServicio);

/**
 * Rutas CRUD de servicios
 */

// GET /api/catalogo/servicios - Lista de servicios (con filtros)
router.get('/', serviciosController.getAllServicios);

// GET /api/catalogo/servicios/:id - Obtener servicio por ID
router.get('/:id', serviciosController.getServicioById);

// POST /api/catalogo/servicios - Crear servicio
router.post('/', serviciosController.createServicio);

// PUT /api/catalogo/servicios/:id - Actualizar servicio
router.put('/:id', serviciosController.updateServicio);

// ❌ NO DELETE - Solo desactivar con activo: false

export default router;
