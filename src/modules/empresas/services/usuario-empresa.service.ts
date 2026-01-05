import * as usuarioEmpresaRepo from '../repositories/usuario-empresa.repository';
import { UsuarioEmpresa, UsuarioEmpresaInput, UsuarioEmpresaUpdateInput } from '../models/usuario-empresa.model';

/**
 * Obtener todos los usuarios de una empresa (opcionalmente filtrar por sede)
 */
export async function getAllByEmpresa(empresaId: string, incluirInactivos = false, sedeId?: string): Promise<UsuarioEmpresa[]> {
  if (!empresaId) {
    throw new Error('empresaId es requerido');
  }
  
  return await usuarioEmpresaRepo.getAllByEmpresa(empresaId, incluirInactivos, sedeId);
}

/**
 * Obtener usuario por ID
 */
export async function getById(id: string): Promise<UsuarioEmpresa | null> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  return await usuarioEmpresaRepo.getById(id);
}

/**
 * Crear usuario con validaciones
 */
export async function create(data: UsuarioEmpresaInput): Promise<UsuarioEmpresa> {
  // Validar campos requeridos
  if (!data.nombreCompleto || data.nombreCompleto.trim() === '') {
    throw new Error('nombreCompleto es obligatorio');
  }
  
  if (!data.correo || data.correo.trim() === '') {
    throw new Error('correo es obligatorio');
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.correo)) {
    throw new Error('correo debe ser un email válido');
  }
  
  if (!data.empresaId) {
    throw new Error('empresaId es obligatorio');
  }
  
  if (!data.sedeId) {
    throw new Error('sedeId es obligatorio');
  }
  
  // Validar que la sede exista y pertenezca a la empresa
  const sedeValida = await usuarioEmpresaRepo.sedeExistsInEmpresa(data.sedeId, data.empresaId);
  if (!sedeValida) {
    throw new Error('La sede no existe o no pertenece a la empresa');
  }
  
  // Validar unicidad de correo en la empresa
  const correoExiste = await usuarioEmpresaRepo.existsCorreoEnEmpresa(data.correo, data.empresaId);
  if (correoExiste) {
    throw new Error('Ya existe un usuario con ese correo en la empresa');
  }
  
  // Validar activo si se proporcionó
  if (data.activoAsignadoId && data.activoAsignadoId !== '') {
    // Verificar que el activo exista
    const activoExiste = await usuarioEmpresaRepo.activoExists(data.activoAsignadoId);
    if (!activoExiste) {
      throw new Error('El activo especificado no existe');
    }
    // NOTA: No validamos si está asignado a otro usuario porque M:N permite múltiples asignaciones
    // Solo validaremos duplicados al momento de crear la relación en usuarios_activos
  }
  
  return await usuarioEmpresaRepo.create(data);
}

/**
 * Actualizar usuario con validaciones
 */
export async function update(id: string, data: UsuarioEmpresaUpdateInput, empresaId: string): Promise<UsuarioEmpresa | null> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  // Verificar que el usuario existe
  const usuarioActual = await usuarioEmpresaRepo.getById(id);
  if (!usuarioActual) {
    throw new Error('Usuario no encontrado');
  }
  
  // Validar campos si se están actualizando
  if (data.nombreCompleto !== undefined && data.nombreCompleto.trim() === '') {
    throw new Error('nombreCompleto no puede estar vacío');
  }
  
  if (data.correo !== undefined) {
    if (data.correo.trim() === '') {
      throw new Error('correo no puede estar vacío');
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.correo)) {
      throw new Error('correo debe ser un email válido');
    }
    
    // Validar unicidad de correo (excluyendo el usuario actual)
    const correoExiste = await usuarioEmpresaRepo.existsCorreoEnEmpresa(
      data.correo, 
      empresaId, 
      id
    );
    if (correoExiste) {
      throw new Error('Ya existe otro usuario con ese correo en la empresa');
    }
  }
  
  // Validar sede si se está actualizando
  if (data.sedeId !== undefined) {
    const sedeValida = await usuarioEmpresaRepo.sedeExistsInEmpresa(data.sedeId, empresaId);
    if (!sedeValida) {
      throw new Error('La sede no existe o no pertenece a la empresa');
    }
  }
  
  // Validar activo si se está actualizando
  if (data.activoAsignadoId !== undefined && data.activoAsignadoId !== '' && data.activoAsignadoId !== null) {
    // Verificar que el activo exista
    const activoExiste = await usuarioEmpresaRepo.activoExists(data.activoAsignadoId);
    if (!activoExiste) {
      throw new Error('El activo especificado no existe');
    }
    // NOTA: No validamos si está asignado a otro usuario porque M:N permite múltiples asignaciones
    // La validación de duplicados se hace en la tabla usuarios_activos
  }
  
  return await usuarioEmpresaRepo.update(id, data);
}

/**
 * Eliminar usuario (soft delete)
 */
export async function remove(id: string): Promise<boolean> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  return await usuarioEmpresaRepo.remove(id);
}
