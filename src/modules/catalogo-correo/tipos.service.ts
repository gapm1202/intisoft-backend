import * as tiposRepo from './tipos.repository';
import { TipoCorreo, TipoCorreoInput, TipoCorreoUpdateInput } from './models';

/**
 * Obtener todos los tipos
 */
export async function getAll(incluirInactivos = false): Promise<TipoCorreo[]> {
  return await tiposRepo.getAll(incluirInactivos);
}

/**
 * Obtener tipo por ID
 */
export async function getById(id: string): Promise<TipoCorreo | null> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  return await tiposRepo.getById(id);
}

/**
 * Crear tipo con validaciones
 */
export async function create(data: TipoCorreoInput): Promise<TipoCorreo> {
  // Validar nombre
  if (!data.nombre || data.nombre.trim() === '') {
    throw new Error('nombre es obligatorio');
  }
  
  // Validar nombre duplicado
  const existente = await tiposRepo.getByNombre(data.nombre);
  if (existente) {
    throw new Error('Ya existe un tipo de correo con ese nombre');
  }
  
  return await tiposRepo.create(data);
}

/**
 * Actualizar tipo con validaciones
 */
export async function update(id: string, data: TipoCorreoUpdateInput): Promise<TipoCorreo> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  // Validar que el tipo existe
  const tipo = await tiposRepo.getById(id);
  if (!tipo) {
    throw new Error('Tipo de correo no encontrado');
  }
  
  // Validar nombre si se proporciona
  if (data.nombre !== undefined && data.nombre.trim() === '') {
    throw new Error('nombre no puede estar vacío');
  }
  
  // Validar nombre duplicado si se proporciona
  if (data.nombre !== undefined) {
    const existente = await tiposRepo.getByNombre(data.nombre, id);
    if (existente) {
      throw new Error('Ya existe un tipo de correo con ese nombre');
    }
  }
  
  return await tiposRepo.update(id, data);
}

/**
 * Desactivar tipo
 */
export async function remove(id: string): Promise<boolean> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  const tipo = await tiposRepo.getById(id);
  if (!tipo) {
    throw new Error('Tipo de correo no encontrado');
  }
  
  return await tiposRepo.remove(id);
}
