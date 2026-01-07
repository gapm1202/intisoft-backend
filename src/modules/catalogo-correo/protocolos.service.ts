import * as protocolosRepo from './protocolos.repository';
import { ProtocoloCorreo, ProtocoloCorreoInput, ProtocoloCorreoUpdateInput } from './models';

/**
 * Obtener todos los protocolos
 */
export async function getAll(incluirInactivos = false): Promise<ProtocoloCorreo[]> {
  return await protocolosRepo.getAll(incluirInactivos);
}

/**
 * Obtener protocolo por ID
 */
export async function getById(id: string): Promise<ProtocoloCorreo | null> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  return await protocolosRepo.getById(id);
}

/**
 * Crear protocolo con validaciones
 */
export async function create(data: ProtocoloCorreoInput): Promise<ProtocoloCorreo> {
  // Validar nombre
  if (!data.nombre || data.nombre.trim() === '') {
    throw new Error('nombre es obligatorio');
  }
  
  // Validar nombre duplicado
  const existente = await protocolosRepo.getByNombre(data.nombre);
  if (existente) {
    throw new Error('Ya existe un protocolo con ese nombre');
  }
  
  return await protocolosRepo.create(data);
}

/**
 * Actualizar protocolo con validaciones
 */
export async function update(id: string, data: ProtocoloCorreoUpdateInput): Promise<ProtocoloCorreo> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  // Validar que el protocolo existe
  const protocolo = await protocolosRepo.getById(id);
  if (!protocolo) {
    throw new Error('Protocolo de correo no encontrado');
  }
  
  // Validar nombre si se proporciona
  if (data.nombre !== undefined && data.nombre.trim() === '') {
    throw new Error('nombre no puede estar vacío');
  }
  
  // Validar nombre duplicado si se proporciona
  if (data.nombre !== undefined) {
    const existente = await protocolosRepo.getByNombre(data.nombre, id);
    if (existente) {
      throw new Error('Ya existe un protocolo con ese nombre');
    }
  }
  
  return await protocolosRepo.update(id, data);
}

/**
 * Desactivar protocolo
 */
export async function remove(id: string): Promise<boolean> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  const protocolo = await protocolosRepo.getById(id);
  if (!protocolo) {
    throw new Error('Protocolo de correo no encontrado');
  }
  
  return await protocolosRepo.remove(id);
}
