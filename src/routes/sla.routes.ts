import { Router } from 'express';
import slaController from '../controllers/sla.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Obtener configuración SLA
router.get('/configuracion/:empresaId', authenticate, slaController.getConfiguracion);

// Crear o actualizar configuración SLA completa
router.post('/configuracion/:empresaId', authenticate, slaController.upsertConfiguracion);

// Actualizar una sección específica
router.post('/seccion/:empresaId', authenticate, slaController.updateSeccion);

// Registrar intención de edición
router.post('/editar/:empresaId', authenticate, slaController.editarSeccion);

// Limpiar/resetear sección a valores por defecto
router.post('/limpiar/:empresaId', authenticate, slaController.limpiarSeccion);

// Obtener historial de cambios
router.get('/historial/:empresaId', authenticate, slaController.getHistorial);

// Eliminar configuración SLA (soft delete)
router.delete('/configuracion/:empresaId', authenticate, slaController.deleteConfiguracion);

// Obtener esquema/estructura de una sección (útil para el frontend)
router.get('/schema', slaController.getSchema);
router.get('/schema/:seccion', slaController.getSchema);

// Obtener valores por defecto de una sección (útil para inicializar formularios)
router.get('/defaults', slaController.getDefaults);
router.get('/defaults/:seccion', slaController.getDefaults);

export default router;
