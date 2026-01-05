// ============================================================================
// Controller: UsuarioHistorial y Asignaciones
// ============================================================================
// Propósito: Endpoints para historial y asignación de activos a usuarios
// ============================================================================

import { Request, Response } from 'express';
import * as historialService from '../services/usuario-historial.service';

/**
 * POST /api/empresas/:empresaId/usuarios/:usuarioId/asignar-activo
 * Asignar un activo a un usuario
 */
export const asignarActivo = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const usuarioId = parseInt(req.params.usuarioId);
    const { activoId, fechaAsignacion, observacion, motivo } = req.body;

    // Validaciones
    if (!activoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'El campo activoId es requerido' 
      });
    }

    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'El motivo es requerido y debe tener al menos 10 caracteres' 
      });
    }

    const activoIdInt = parseInt(activoId);
    const realizadoPor = (req as any).user?.id || null;
    const nombreQuienRealizo = (req as any).user?.nombreCompleto || (req as any).user?.nombre || null;
    const ipOrigen = req.ip || req.headers['x-forwarded-for'] as string || null;

    const usuario = await historialService.asignarActivoAUsuario(
      empresaId,
      usuarioId,
      activoIdInt,
      {
        fechaAsignacion,
        observacion,
        motivo,
        realizadoPor,
        nombreQuienRealizo,
        ipOrigen
      }
    );

    // Formatear respuesta según spec del frontend
    const response = {
      success: true,
      data: {
        id: usuario.id?.toString(),
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        cargo: usuario.cargo,
        telefono: usuario.telefono,
        activosAsignados: (usuario.activosAsignados || []).map((activo: any) => ({
          id: activo.id?.toString(),
          asset_id: activo.assetId || activo.codigo,
          codigo: activo.codigo || activo.assetId,
          nombre: activo.nombre || activo.modelo || activo.categoria,
          categoria: activo.categoria,
          fechaAsignacion: activo.fechaAsignacion
        }))
      }
    };

    console.log(`✅ Activo ${activoId} asignado a usuario ${usuarioId}`);
    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error asignando activo:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('no pertenece')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('ya está asignado')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.message.includes('motivo')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al asignar activo', 
      error: error.message 
    });
  }
};

/**
 * POST /api/empresas/:empresaId/usuarios/:usuarioId/cambiar-activo
 * Cambiar activo asignado a un usuario
 */
export const cambiarActivo = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const usuarioId = parseInt(req.params.usuarioId);
    const { activoAnteriorId, activoNuevoId, fechaAsignacion, motivoCambio } = req.body;

    // Validaciones
    if (!activoAnteriorId || !activoNuevoId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Los campos activoAnteriorId y activoNuevoId son requeridos' 
      });
    }

    if (!motivoCambio || motivoCambio.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'El motivoCambio es requerido y debe tener al menos 10 caracteres' 
      });
    }

    const activoAnteriorIdInt = parseInt(activoAnteriorId);
    const activoNuevoIdInt = parseInt(activoNuevoId);
    const realizadoPor = (req as any).user?.id || null;
    const nombreQuienRealizo = (req as any).user?.nombreCompleto || (req as any).user?.nombre || null;
    const ipOrigen = req.ip || req.headers['x-forwarded-for'] as string || null;

    const usuario = await historialService.cambiarActivoDeUsuario(
      empresaId,
      usuarioId,
      {
        activoAnteriorId: activoAnteriorIdInt,
        activoNuevoId: activoNuevoIdInt,
        fechaAsignacion,
        motivoCambio,
        realizadoPor,
        nombreQuienRealizo,
        ipOrigen
      }
    );

    const response = {
      success: true,
      data: {
        id: usuario.id?.toString(),
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        cargo: usuario.cargo,
        telefono: usuario.telefono,
        activosAsignados: (usuario.activosAsignados || []).map((activo: any) => ({
          id: activo.id?.toString(),
          asset_id: activo.assetId || activo.codigo,
          codigo: activo.codigo || activo.assetId,
          nombre: activo.nombre || activo.modelo || activo.categoria,
          categoria: activo.categoria,
          fechaAsignacion: activo.fechaAsignacion
        }))
      }
    };

    console.log(`✅ Activo cambiado: ${activoAnteriorId} → ${activoNuevoId} para usuario ${usuarioId}`);
    res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error cambiando activo:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('no está asignado')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('motivo')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar activo', 
      error: error.message 
    });
  }
};

/**
 * DELETE /api/empresas/:empresaId/usuarios/:usuarioId/activos/:activoId
 * Liberar un activo de un usuario
 */
export const liberarActivo = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const usuarioId = parseInt(req.params.usuarioId);
    const activoId = parseInt(req.params.activoId);
    const { motivo } = req.body;

    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'El motivo es requerido y debe tener al menos 10 caracteres' 
      });
    }

    const realizadoPor = (req as any).user?.id || null;
    const nombreQuienRealizo = (req as any).user?.nombreCompleto || (req as any).user?.nombre || null;
    const ipOrigen = req.ip || req.headers['x-forwarded-for'] as string || null;

    const usuario = await historialService.liberarActivoDeUsuario(
      empresaId,
      usuarioId,
      activoId,
      {
        motivo,
        realizadoPor,
        nombreQuienRealizo,
        ipOrigen
      }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Activo liberado correctamente',
      data: usuario
    });

  } catch (error: any) {
    console.error('❌ Error liberando activo:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('no está asignado')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al liberar activo', 
      error: error.message 
    });
  }
};

/**
 * GET /api/empresas/:empresaId/usuarios/:usuarioId/historial
 * Obtener historial de cambios de un usuario
 */
export const obtenerHistorial = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const usuarioId = parseInt(req.params.usuarioId);
    
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
    const accion = req.query.accion as string | undefined;

    const resultado = await historialService.obtenerHistorial(
      usuarioId,
      empresaId,
      { page, pageSize, accion }
    );

    res.status(200).json(resultado);

  } catch (error: any) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial', 
      error: error.message 
    });
  }
};

/**
 * PUT /api/empresas/:empresaId/usuarios/:usuarioId
 * Actualizar usuario con registro de historial (MODIFICADO para incluir motivo)
 */
export const actualizarUsuario = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const usuarioId = parseInt(req.params.usuarioId);
    const { nombreCompleto, correo, cargo, telefono, observaciones, motivo } = req.body;

    // Validar motivo
    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'El motivo es requerido y debe tener al menos 10 caracteres' 
      });
    }

    const realizadoPor = (req as any).user?.id || null;
    const nombreQuienRealizo = (req as any).user?.nombreCompleto || (req as any).user?.nombre || null;
    const ipOrigen = req.ip || req.headers['x-forwarded-for'] as string || null;

    const datosNuevos = {
      nombreCompleto,
      correo,
      cargo,
      telefono,
      observaciones
    };

    const usuario = await historialService.actualizarUsuarioConHistorial(
      usuarioId,
      empresaId,
      datosNuevos,
      {
        motivo,
        realizadoPor,
        nombreQuienRealizo,
        ipOrigen
      }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Usuario actualizado correctamente',
      data: usuario
    });

  } catch (error: any) {
    console.error('❌ Error actualizando usuario:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('motivo')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar usuario', 
      error: error.message 
    });
  }
};

/**
 * POST /api/empresas/:empresaId/usuarios/:usuarioId/desactivar
 * Desactivar un usuario (soft delete)
 */
export const desactivarUsuario = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const usuarioId = parseInt(req.params.usuarioId);
    const { motivo, observacionAdicional } = req.body;

    // Validaciones
    if (!motivo || motivo.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'El motivo es requerido y debe tener al menos 10 caracteres' 
      });
    }

    const realizadoPor = (req as any).user?.id || null;
    const nombreQuienRealizo = (req as any).user?.nombreCompleto || (req as any).user?.nombre || null;
    const ipOrigen = req.ip || req.headers['x-forwarded-for'] as string || null;

    const usuario = await historialService.desactivarUsuario(
      empresaId,
      usuarioId,
      {
        motivo,
        observacionAdicional,
        realizadoPor,
        nombreQuienRealizo,
        ipOrigen
      }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Usuario desactivado correctamente',
      data: usuario
    });

  } catch (error: any) {
    console.error('❌ Error desactivando usuario:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('ya está desactivado')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('motivo')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes('no pertenece')) {
      return res.status(403).json({ success: false, message: error.message });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error al desactivar usuario', 
      error: error.message 
    });
  }
};
