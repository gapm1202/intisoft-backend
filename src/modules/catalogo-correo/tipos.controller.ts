import { Request, Response } from 'express';
import * as tiposService from './tipos.service';

/**
 * GET /api/catalogo/tipos-correo
 * Query params: ?includeInactive=true (devuelve todos por defecto)
 */
export async function getAll(req: Request, res: Response) {
  try {
    // Acepta includeInactive (frontend) o incluirInactivos (legacy)
    // Por defecto devuelve todos los registros (activos e inactivos)
    const includeInactive = req.query.includeInactive !== 'false';
    const incluirInactivos = req.query.incluirInactivos === 'true' || includeInactive;
    const tipos = await tiposService.getAll(incluirInactivos);
    
    res.json(tipos);
  } catch (error: any) {
    console.error('Error al obtener tipos de correo:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/catalogo/tipos-correo/:id
 */
export async function getById(req: Request, res: Response) {
  try {
    const tipo = await tiposService.getById(req.params.id);
    
    if (!tipo) {
      return res.status(404).json({ message: 'Tipo de correo no encontrado' });
    }
    
    res.json(tipo);
  } catch (error: any) {
    console.error('Error al obtener tipo de correo:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * POST /api/catalogo/tipos-correo
 */
export async function create(req: Request, res: Response) {
  try {
    const tipo = await tiposService.create(req.body);
    
    res.status(201).json(tipo);
  } catch (error: any) {
    console.error('Error al crear tipo de correo:', error);
    
    if (error.message.includes('obligatorio')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}

/**
 * PUT /api/catalogo/tipos-correo/:id
 */
export async function update(req: Request, res: Response) {
  try {
    const tipo = await tiposService.update(req.params.id, req.body);
    
    res.json(tipo);
  } catch (error: any) {
    console.error('Error al actualizar tipo de correo:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('obligatorio') || error.message.includes('vacío')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}

/**
 * DELETE /api/catalogo/tipos-correo/:id
 */
export async function remove(req: Request, res: Response) {
  try {
    const eliminado = await tiposService.remove(req.params.id);
    
    if (!eliminado) {
      return res.status(404).json({ message: 'Tipo de correo no encontrado' });
    }
    
    res.json({ message: 'Tipo de correo desactivado correctamente' });
  } catch (error: any) {
    console.error('Error al desactivar tipo de correo:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}
