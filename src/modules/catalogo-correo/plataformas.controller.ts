import { Request, Response } from 'express';
import * as plataformasService from './plataformas.service';

/**
 * GET /api/catalogo/plataformas
 * Query params: ?includeInactive=true (devuelve todos por defecto)
 */
export async function getAll(req: Request, res: Response) {
  try {
    // Acepta includeInactive (frontend) o incluirInactivos (legacy)
    // Por defecto devuelve todos los registros (activos e inactivos)
    const includeInactive = req.query.includeInactive !== 'false';
    const incluirInactivos = req.query.incluirInactivos === 'true' || includeInactive;
    const plataformas = await plataformasService.getAll(incluirInactivos);
    
    res.json(plataformas);
  } catch (error: any) {
    console.error('Error al obtener plataformas:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * GET /api/catalogo/plataformas/:id
 */
export async function getById(req: Request, res: Response) {
  try {
    const plataforma = await plataformasService.getById(req.params.id);
    
    if (!plataforma) {
      return res.status(404).json({ message: 'Plataforma no encontrada' });
    }
    
    res.json(plataforma);
  } catch (error: any) {
    console.error('Error al obtener plataforma:', error);
    res.status(500).json({ message: error.message });
  }
}

/**
 * POST /api/catalogo/plataformas
 */
export async function create(req: Request, res: Response) {
  try {
    const plataforma = await plataformasService.create(req.body);
    
    res.status(201).json(plataforma);
  } catch (error: any) {
    console.error('Error al crear plataforma:', error);
    
    if (error.message.includes('obligatorio') || error.message.includes('requerido') || error.message.includes('debe ser')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}

/**
 * PUT /api/catalogo/plataformas/:id
 */
export async function update(req: Request, res: Response) {
  try {
    const plataforma = await plataformasService.update(req.params.id, req.body);
    
    res.json(plataforma);
  } catch (error: any) {
    console.error('Error al actualizar plataforma:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    
    if (error.message.includes('obligatorio') || error.message.includes('requerido') || error.message.includes('debe ser')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}

/**
 * DELETE /api/catalogo/plataformas/:id
 */
export async function remove(req: Request, res: Response) {
  try {
    const eliminado = await plataformasService.remove(req.params.id);
    
    if (!eliminado) {
      return res.status(404).json({ message: 'Plataforma no encontrada' });
    }
    
    res.json({ message: 'Plataforma desactivada correctamente' });
  } catch (error: any) {
    console.error('Error al desactivar plataforma:', error);
    
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    
    res.status(500).json({ message: error.message });
  }
}
