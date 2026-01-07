import { Request, Response } from 'express';
import * as protocolosService from './protocolos.service';

/**
 * GET /api/catalogo/protocolos
 * Query params: ?includeInactive=true (devuelve todos por defecto)
 */
export async function getAll(req: Request, res: Response) {
  try {
    // Acepta includeInactive (frontend) o incluirInactivos (legacy)
    // Por defecto devuelve todos los registros (activos e inactivos)
    const includeInactive = req.query.includeInactive !== 'false';
    const incluirInactivos = req.query.incluirInactivos === 'true' || includeInactive;
    const protocolos = await protocolosService.getAll(incluirInactivos);
    
    res.json(protocolos);
  } catch (error: any) {
    console.error('Error al obtener protocolos de correo:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/catalogo/protocolos/:id
 */
export async function getById(req: Request, res: Response) {
  try {
    const protocolo = await protocolosService.getById(req.params.id);
    
    if (!protocolo) {
      return res.status(404).json({ message: 'Protocolo de correo no encontrado' });
    }
    
    res.json(protocolo);
  } catch (error: any) {
    console.error('Error al obtener protocolo de correo:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * POST /api/catalogo/protocolos
 */
export async function create(req: Request, res: Response) {
  try {
    const protocolo = await protocolosService.create(req.body);
    
    res.status(201).json(protocolo);
  } catch (error: any) {
    console.error('Error al crear protocolo de correo:', error);
    
    if (error.message.includes('obligatorio')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}

/**
 * PUT /api/catalogo/protocolos/:id
 */
export async function update(req: Request, res: Response) {
  try {
    const protocolo = await protocolosService.update(req.params.id, req.body);
    
    res.json(protocolo);
  } catch (error: any) {
    console.error('Error al actualizar protocolo de correo:', error);
    
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
 * DELETE /api/catalogo/protocolos/:id
 */
export async function remove(req: Request, res: Response) {
  try {
    const eliminado = await protocolosService.remove(req.params.id);
    
    if (!eliminado) {
      return res.status(404).json({ message: 'Protocolo de correo no encontrado' });
    }
    
    res.json({ message: 'Protocolo de correo desactivado correctamente' });
  } catch (error: any) {
    console.error('Error al desactivar protocolo de correo:', error);
    
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}
