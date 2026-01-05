import { Request, Response } from 'express';
import * as usuarioActivoService from '../services/usuario-activo.service';

/**
 * POST /api/inventario/:activoId/usuarios
 * Asignar múltiples usuarios a un activo
 */
export async function asignarUsuariosAActivo(req: Request, res: Response) {
  try {
    const { activoId } = req.params;
    const input = req.body;
    
    // Validar entrada
    if (!input.usuarioIds || !Array.isArray(input.usuarioIds) || input.usuarioIds.length === 0) {
      return res.status(400).json({
        error: 'El campo usuarioIds es requerido y debe ser un array no vacío'
      });
    }
    
    if (!input.asignadoPor) {
      return res.status(400).json({
        error: 'El campo asignadoPor es requerido'
      });
    }
    
    const resultado = await usuarioActivoService.asignarUsuariosAActivo(activoId, input);
    
    return res.status(201).json({
      mensaje: `Se asignaron ${resultado.asignaciones.length} usuario(s) al activo`,
      asignaciones: resultado.asignaciones,
      errores: resultado.errores
    });
  } catch (error: any) {
    console.error('Error asignando usuarios a activo:', error);
    return res.status(400).json({
      error: error.message || 'Error al asignar usuarios al activo'
    });
  }
}

/**
 * DELETE /api/inventario/:activoId/usuarios/:usuarioId
 * Desasignar un usuario de un activo
 */
export async function desasignarUsuarioDeActivo(req: Request, res: Response) {
  try {
    const { activoId, usuarioId } = req.params;
    const { motivo } = req.body;
    
    const desasignado = await usuarioActivoService.desasignarUsuarioDeActivo(
      activoId,
      usuarioId,
      motivo
    );
    
    if (!desasignado) {
      return res.status(404).json({
        error: 'No se encontró asignación activa entre el usuario y el activo'
      });
    }
    
    return res.status(200).json({
      mensaje: 'Usuario desasignado del activo correctamente'
    });
  } catch (error: any) {
    console.error('Error desasignando usuario de activo:', error);
    return res.status(400).json({
      error: error.message || 'Error al desasignar usuario del activo'
    });
  }
}

/**
 * POST /api/usuarios/:usuarioId/activos
 * Asignar múltiples activos a un usuario
 */
export async function asignarActivosAUsuario(req: Request, res: Response) {
  try {
    const { usuarioId } = req.params;
    const input = req.body;
    
    // Validar entrada
    if (!input.activoIds || !Array.isArray(input.activoIds) || input.activoIds.length === 0) {
      return res.status(400).json({
        error: 'El campo activoIds es requerido y debe ser un array no vacío'
      });
    }
    
    if (!input.asignadoPor) {
      return res.status(400).json({
        error: 'El campo asignadoPor es requerido'
      });
    }
    
    const resultado = await usuarioActivoService.asignarActivosAUsuario(usuarioId, input);
    
    return res.status(201).json({
      mensaje: `Se asignaron ${resultado.asignaciones.length} activo(s) al usuario`,
      asignaciones: resultado.asignaciones,
      errores: resultado.errores
    });
  } catch (error: any) {
    console.error('Error asignando activos a usuario:', error);
    return res.status(400).json({
      error: error.message || 'Error al asignar activos al usuario'
    });
  }
}

/**
 * DELETE /api/usuarios/:usuarioId/activos/:activoId
 * Desasignar un activo de un usuario
 */
export async function desasignarActivoDeUsuario(req: Request, res: Response) {
  try {
    const { usuarioId, activoId } = req.params;
    const { motivo } = req.body;
    
    const desasignado = await usuarioActivoService.desasignarActivoDeUsuario(
      usuarioId,
      activoId,
      motivo
    );
    
    if (!desasignado) {
      return res.status(404).json({
        error: 'No se encontró asignación activa entre el usuario y el activo'
      });
    }
    
    return res.status(200).json({
      mensaje: 'Activo desasignado del usuario correctamente'
    });
  } catch (error: any) {
    console.error('Error desasignando activo de usuario:', error);
    return res.status(400).json({
      error: error.message || 'Error al desasignar activo del usuario'
    });
  }
}

/**
 * GET /api/inventario/:activoId/usuarios
 * Obtener usuarios asignados a un activo
 */
export async function getUsuariosByActivo(req: Request, res: Response) {
  try {
    const { activoId } = req.params;
    const usuarios = await usuarioActivoService.getUsuariosByActivo(activoId);
    
    return res.status(200).json({
      activoId,
      totalUsuarios: usuarios.length,
      usuarios
    });
  } catch (error: any) {
    console.error('Error obteniendo usuarios de activo:', error);
    return res.status(400).json({
      error: error.message || 'Error al obtener usuarios del activo'
    });
  }
}

/**
 * GET /api/usuarios/:usuarioId/activos
 * Obtener activos asignados a un usuario
 */
export async function getActivosByUsuario(req: Request, res: Response) {
  try {
    const { usuarioId } = req.params;
    const activos = await usuarioActivoService.getActivosByUsuario(usuarioId);
    
    return res.status(200).json({
      usuarioId,
      totalActivos: activos.length,
      activos
    });
  } catch (error: any) {
    console.error('Error obteniendo activos de usuario:', error);
    return res.status(400).json({
      error: error.message || 'Error al obtener activos del usuario'
    });
  }
}

/**
 * GET /api/inventario/:activoId/usuarios/historial
 * Obtener historial de asignaciones de un activo
 */
export async function getHistorialAsignacionesActivo(req: Request, res: Response) {
  try {
    const { activoId } = req.params;
    const historial = await usuarioActivoService.getHistorialAsignacionesActivo(activoId);
    
    return res.status(200).json({
      activoId,
      totalEventos: historial.length,
      historial
    });
  } catch (error: any) {
    console.error('Error obteniendo historial de activo:', error);
    return res.status(400).json({
      error: error.message || 'Error al obtener historial del activo'
    });
  }
}
