// ============================================================================
// Routes: UsuarioHistorial y Asignaciones
// ============================================================================
// Propósito: Rutas para historial y asignación de activos a usuarios
// ============================================================================

import { Router } from 'express';
import * as controller from '../controllers/usuario-historial.controller';
import { authenticate as authenticateToken } from '../../../middlewares/auth.middleware';
import { authorizeRole } from '../../../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/empresas/:empresaId/usuarios/:usuarioId/asignar-activo
 * Asignar un activo a un usuario (M:N)
 * Requiere: motivo, activoId
 */
router.post(
  '/:empresaId/usuarios/:usuarioId/asignar-activo',
  authenticateToken,
  authorizeRole(['administrador', 'supervisor']),
  controller.asignarActivo
);

/**
 * POST /api/empresas/:empresaId/usuarios/:usuarioId/cambiar-activo
 * Cambiar activo asignado a un usuario
 * Requiere: activoAnteriorId, activoNuevoId, motivoCambio
 */
router.post(
  '/:empresaId/usuarios/:usuarioId/cambiar-activo',
  authenticateToken,
  authorizeRole(['administrador', 'supervisor']),
  controller.cambiarActivo
);

/**
 * DELETE /api/empresas/:empresaId/usuarios/:usuarioId/activos/:activoId
 * Liberar un activo de un usuario
 * Requiere: motivo
 */
router.delete(
  '/:empresaId/usuarios/:usuarioId/activos/:activoId',
  authenticateToken,
  authorizeRole(['administrador', 'supervisor']),
  controller.liberarActivo
);

/**
 * GET /api/empresas/:empresaId/usuarios/:usuarioId/historial
 * Obtener historial de cambios de un usuario
 * Query params: page, pageSize, accion
 */
router.get(
  '/:empresaId/usuarios/:usuarioId/historial',
  authenticateToken,
  authorizeRole(['administrador', 'supervisor']),
  controller.obtenerHistorial
);

/**
 * PUT /api/empresas/:empresaId/usuarios/:usuarioId
 * Actualizar usuario (MODIFICADO para requerir motivo)
 * Requiere: motivo + campos a actualizar
 */
router.put(
  '/:empresaId/usuarios/:usuarioId',
  authenticateToken,
  authorizeRole(['administrador', 'supervisor']),
  controller.actualizarUsuario
);

/**
 * POST /api/empresas/:empresaId/usuarios/:usuarioId/desactivar
 * Desactivar un usuario (soft delete)
 * Requiere: motivo (mínimo 10 caracteres), observacionAdicional (opcional)
 */
router.post(
  '/:empresaId/usuarios/:usuarioId/desactivar',
  authenticateToken,
  authorizeRole(['administrador', 'supervisor']),
  controller.desactivarUsuario
);

export default router;
