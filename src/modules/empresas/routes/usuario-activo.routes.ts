import { Router } from 'express';
import * as usuarioActivoController from '../controllers/usuario-activo.controller';

const router = Router();

/**
 * Rutas para gestión M:N de usuarios-activos
 */

// --- Rutas desde perspectiva de ACTIVOS ---

// Asignar múltiples usuarios a un activo
router.post('/inventario/:activoId/usuarios', usuarioActivoController.asignarUsuariosAActivo);

// Desasignar un usuario de un activo
router.delete('/inventario/:activoId/usuarios/:usuarioId', usuarioActivoController.desasignarUsuarioDeActivo);

// Obtener usuarios asignados a un activo
router.get('/inventario/:activoId/usuarios', usuarioActivoController.getUsuariosByActivo);

// Obtener historial de asignaciones de un activo
router.get('/inventario/:activoId/usuarios/historial', usuarioActivoController.getHistorialAsignacionesActivo);

// --- Rutas desde perspectiva de USUARIOS ---

// Asignar múltiples activos a un usuario
router.post('/usuarios/:usuarioId/activos', usuarioActivoController.asignarActivosAUsuario);

// Desasignar un activo de un usuario
router.delete('/usuarios/:usuarioId/activos/:activoId', usuarioActivoController.desasignarActivoDeUsuario);

// Obtener activos asignados a un usuario
router.get('/usuarios/:usuarioId/activos', usuarioActivoController.getActivosByUsuario);

export default router;
