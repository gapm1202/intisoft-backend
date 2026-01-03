import { Request, Response } from 'express';
import * as serviciosService from '../services/servicios.service';
import { ServicioInput, ServicioUpdateInput, TipoServicioInput } from '../models/servicios.model';

/**
 * GET /api/catalogo/servicios
 * Obtener todos los servicios con filtros opcionales
 */
export async function getAllServicios(req: Request, res: Response): Promise<void> {
  try {
    const filters: any = {};

    // Filtros opcionales desde query params
    if (req.query.activo !== undefined) {
      filters.activo = req.query.activo === 'true';
    }
    if (req.query.visibleEnTickets !== undefined) {
      filters.visibleEnTickets = req.query.visibleEnTickets === 'true';
    }
    if (req.query.tipoServicio) {
      filters.tipoServicio = req.query.tipoServicio as string;
    }

    const servicios = await serviciosService.getAllServicios(filters);
    res.json(servicios);
  } catch (error: any) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
}

/**
 * GET /api/catalogo/servicios/:id
 * Obtener un servicio por ID
 */
export async function getServicioById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const servicio = await serviciosService.getServicioById(id);

    if (!servicio) {
      res.status(404).json({ error: 'Servicio no encontrado' });
      return;
    }

    res.json(servicio);
  } catch (error: any) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({ error: 'Error al obtener servicio' });
  }
}

/**
 * POST /api/catalogo/servicios
 * Crear un nuevo servicio
 */
export async function createServicio(req: Request, res: Response): Promise<void> {
  try {
    const data: ServicioInput = req.body;
    
    // Validaciones básicas
    if (!data.codigo || !data.nombre || !data.tipoServicio) {
      res.status(400).json({ 
        error: 'Campos requeridos: codigo, nombre, tipoServicio' 
      });
      return;
    }

    // Obtener el usuario del request (asumiendo que hay autenticación)
    const creadoPor = (req as any).user?.id || 'sistema';

    const nuevoServicio = await serviciosService.createServicio(data, creadoPor);
    res.status(201).json(nuevoServicio);
  } catch (error: any) {
    console.error('Error al crear servicio:', error);
    
    // Errores específicos de negocio
    if (error.message.includes('Ya existe')) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error.message.includes('no existe')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error al crear servicio' });
  }
}

/**
 * PUT /api/catalogo/servicios/:id
 * Actualizar un servicio existente
 */
export async function updateServicio(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const data: ServicioUpdateInput = req.body;

    const servicioActualizado = await serviciosService.updateServicio(id, data);

    if (!servicioActualizado) {
      res.status(404).json({ error: 'Servicio no encontrado' });
      return;
    }

    res.json(servicioActualizado);
  } catch (error: any) {
    console.error('Error al actualizar servicio:', error);

    // Errores específicos de negocio
    if (error.message.includes('Ya existe')) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error.message.includes('no existe')) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error.message.includes('no encontrado')) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
}

/**
 * GET /api/catalogo/servicios/stats
 * Obtener estadísticas de servicios
 */
export async function getServicioStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = await serviciosService.getServicioStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
}

/**
 * GET /api/catalogo/servicios/tipos
 * Obtener todos los tipos de servicio
 */
export async function getAllTiposServicio(req: Request, res: Response): Promise<void> {
  try {
    const tipos = await serviciosService.getAllTiposServicio();
    res.json(tipos);
  } catch (error: any) {
    console.error('Error al obtener tipos de servicio:', error);
    res.status(500).json({ error: 'Error al obtener tipos de servicio' });
  }
}

/**
 * POST /api/catalogo/servicios/tipos
 * Crear un nuevo tipo de servicio
 */
export async function createTipoServicio(req: Request, res: Response): Promise<void> {
  try {
    const data: TipoServicioInput = req.body;

    // Validaciones básicas
    if (!data.tipo) {
      res.status(400).json({ error: 'El campo tipo es requerido' });
      return;
    }

    const nuevoTipo = await serviciosService.createTipoServicio(data);
    res.status(201).json(nuevoTipo);
  } catch (error: any) {
    console.error('Error al crear tipo de servicio:', error);

    if (error.message.includes('Ya existe')) {
      res.status(409).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Error al crear tipo de servicio' });
  }
}
