import * as serviciosRepo from '../repositories/servicios.repository';
import {
  Servicio,
  ServicioInput,
  ServicioUpdateInput,
  ServicioStats,
  TipoServicio,
  TipoServicioInput,
} from '../models/servicios.model';

/**
 * Obtener todos los servicios con filtros opcionales
 */
export async function getAllServicios(filters?: {
  activo?: boolean;
  visibleEnTickets?: boolean;
  tipoServicio?: string;
}): Promise<Servicio[]> {
  return await serviciosRepo.getAllServicios(filters);
}

/**
 * Obtener un servicio por ID
 */
export async function getServicioById(id: number): Promise<Servicio | null> {
  return await serviciosRepo.getServicioById(id);
}

/**
 * Crear un nuevo servicio
 * Valida que el código sea único y que el tipo de servicio exista
 */
export async function createServicio(
  data: ServicioInput,
  creadoPor: string
): Promise<Servicio> {
  // Validar que el código no exista
  const existingByCodigo = await serviciosRepo.getServicioByCodigo(data.codigo);
  if (existingByCodigo) {
    throw new Error(`Ya existe un servicio con el código: ${data.codigo}`);
  }

  // Validar que el tipo de servicio exista
  const tipoServicio = await serviciosRepo.getTipoServicioByNombre(data.tipoServicio);
  if (!tipoServicio) {
    throw new Error(`El tipo de servicio "${data.tipoServicio}" no existe`);
  }

  // Crear el servicio
  return await serviciosRepo.createServicio({
    ...data,
    creadoPor,
  });
}

/**
 * Actualizar un servicio existente
 * Valida que el tipo de servicio exista (si se está actualizando)
 */
export async function updateServicio(
  id: number,
  data: ServicioUpdateInput
): Promise<Servicio | null> {
  // Verificar que el servicio exista
  const existing = await serviciosRepo.getServicioById(id);
  if (!existing) {
    throw new Error('Servicio no encontrado');
  }

  // Si se está actualizando el tipo de servicio, validar que exista
  if (data.tipoServicio) {
    const tipoServicio = await serviciosRepo.getTipoServicioByNombre(data.tipoServicio);
    if (!tipoServicio) {
      throw new Error(`El tipo de servicio "${data.tipoServicio}" no existe`);
    }
  }

  return await serviciosRepo.updateServicio(id, data);
}

/**
 * Obtener estadísticas de servicios
 */
export async function getServicioStats(): Promise<ServicioStats> {
  return await serviciosRepo.getServicioStats();
}

/**
 * Obtener todos los tipos de servicio disponibles
 */
export async function getAllTiposServicio(): Promise<TipoServicio[]> {
  return await serviciosRepo.getAllTiposServicio();
}

/**
 * Crear un nuevo tipo de servicio
 * Valida que el tipo sea único
 */
export async function createTipoServicio(
  data: TipoServicioInput
): Promise<TipoServicio> {
  // Validar que el tipo no exista
  const existing = await serviciosRepo.getTipoServicioByNombre(data.tipo);
  if (existing) {
    throw new Error(`Ya existe un tipo de servicio con el nombre: ${data.tipo}`);
  }

  return await serviciosRepo.createTipoServicio(data);
}
