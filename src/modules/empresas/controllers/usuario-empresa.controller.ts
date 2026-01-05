import { Request, Response } from 'express';
import * as usuarioEmpresaService from '../services/usuario-empresa.service';
import { UsuarioEmpresaInput, UsuarioEmpresaUpdateInput } from '../models/usuario-empresa.model';

/**
 * GET /api/empresas/:empresaId/usuarios
 * Listar usuarios de una empresa (opcionalmente filtrar por sede)
 */
export async function getAllByEmpresa(req: Request, res: Response): Promise<void> {
  try {
    const { empresaId } = req.params;
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const sedeId = req.query.sedeId as string | undefined;
    
    const usuarios = await usuarioEmpresaService.getAllByEmpresa(empresaId, incluirInactivos, sedeId);
    
    res.json({
      success: true,
      data: usuarios,
    });
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener usuarios',
    });
  }
}

/**
 * GET /api/empresas/:empresaId/usuarios/:usuarioId
 * Obtener un usuario por ID
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const { usuarioId } = req.params;
    
    const usuario = await usuarioEmpresaService.getById(usuarioId);
    
    if (!usuario) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }
    
    res.json({
      success: true,
      data: usuario,
    });
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener usuario',
    });
  }
}

/**
 * POST /api/empresas/:empresaId/usuarios
 * Crear un nuevo usuario
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const { empresaId } = req.params;
    const data: UsuarioEmpresaInput = {
      ...req.body,
      empresaId, // Asegurar que empresaId viene de la URL
    };
    
    const nuevoUsuario = await usuarioEmpresaService.create(data);
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: nuevoUsuario,
    });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    
    // Errores de validación
    if (
      error.message.includes('obligatorio') ||
      error.message.includes('válido') ||
      error.message.includes('Ya existe') ||
      error.message.includes('no existe') ||
      error.message.includes('no pertenece') ||
      error.message.includes('ya está asignado')
    ) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario',
    });
  }
}

/**
 * PUT /api/empresas/:empresaId/usuarios/:usuarioId
 * Actualizar un usuario
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { empresaId, usuarioId } = req.params;
    const data: UsuarioEmpresaUpdateInput = req.body;
    
    const usuarioActualizado = await usuarioEmpresaService.update(usuarioId, data, empresaId);
    
    if (!usuarioActualizado) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado,
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    
    // Errores de validación
    if (
      error.message.includes('no encontrado') ||
      error.message.includes('obligatorio') ||
      error.message.includes('válido') ||
      error.message.includes('Ya existe') ||
      error.message.includes('no existe') ||
      error.message.includes('no pertenece') ||
      error.message.includes('ya está asignado') ||
      error.message.includes('no puede estar vacío')
    ) {
      const status = error.message.includes('no encontrado') ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error.message,
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario',
    });
  }
}

/**
 * DELETE /api/empresas/:empresaId/usuarios/:usuarioId
 * Eliminar un usuario (soft delete)
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { usuarioId } = req.params;
    
    const eliminado = await usuarioEmpresaService.remove(usuarioId);
    
    if (!eliminado) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al eliminar usuario',
    });
  }
}
