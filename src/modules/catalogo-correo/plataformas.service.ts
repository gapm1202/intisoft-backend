import * as plataformasRepo from './plataformas.repository';
import { PlataformaCorreo, PlataformaCorreoInput, PlataformaCorreoUpdateInput } from './models';

/**
 * Obtener todas las plataformas
 */
export async function getAll(incluirInactivos = false): Promise<PlataformaCorreo[]> {
  return await plataformasRepo.getAll(incluirInactivos);
}

/**
 * Obtener plataforma por ID
 */
export async function getById(id: string): Promise<PlataformaCorreo | null> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  return await plataformasRepo.getById(id);
}

/**
 * Crear plataforma con validaciones
 */
export async function create(data: PlataformaCorreoInput): Promise<PlataformaCorreo> {
  // Validar nombre
  if (!data.nombre || data.nombre.trim() === '') {
    throw new Error('nombre es obligatorio');
  }
  
  // Validar nombre duplicado
  const existente = await plataformasRepo.getByNombre(data.nombre);
  if (existente) {
    throw new Error('Ya existe una plataforma con ese nombre');
  }
  
  // Validar tipo_plataforma
  if (!data.tipoPlataforma || data.tipoPlataforma.trim() === '') {
    throw new Error('tipoPlataforma es obligatorio');
  }
  
  const tiposValidos = ['Cloud', 'On-Premise', 'Otro'];
  if (!tiposValidos.includes(data.tipoPlataforma)) {
    throw new Error(`tipoPlataforma debe ser uno de: ${tiposValidos.join(', ')}`);
  }
  
  // Validar tipo_plataforma_personalizado cuando tipoPlataforma = "Otro"
  if (data.tipoPlataforma === 'Otro') {
    if (!data.tipoPlataformaPersonalizado || data.tipoPlataformaPersonalizado.trim() === '') {
      throw new Error('tipoPlataformaPersonalizado es requerido cuando tipoPlataforma es "Otro"');
    }
  }
  
  return await plataformasRepo.create(data);
}

/**
 * Actualizar plataforma con validaciones
 */
export async function update(id: string, data: PlataformaCorreoUpdateInput): Promise<PlataformaCorreo> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  // Validar que la plataforma existe
  const plataforma = await plataformasRepo.getById(id);
  if (!plataforma) {
    throw new Error('Plataforma no encontrada');
  }
  
  // Validar nombre si se proporciona
  if (data.nombre !== undefined && data.nombre.trim() === '') {
    throw new Error('nombre no puede estar vacío');
  }
  
  // Validar nombre duplicado si se proporciona
  if (data.nombre !== undefined) {
    const existente = await plataformasRepo.getByNombre(data.nombre, id);
    if (existente) {
      throw new Error('Ya existe una plataforma con ese nombre');
    }
  }
  
  // Validar tipo_plataforma si se proporciona
  if (data.tipoPlataforma !== undefined) {
    const tiposValidos = ['Cloud', 'On-Premise', 'Otro'];
    if (!tiposValidos.includes(data.tipoPlataforma)) {
      throw new Error(`tipoPlataforma debe ser uno de: ${tiposValidos.join(', ')}`);
    }
    
    // Si se cambia a "Otro", validar que se proporcione el personalizado
    if (data.tipoPlataforma === 'Otro') {
      const tipoPersonalizado = data.tipoPlataformaPersonalizado !== undefined 
        ? data.tipoPlataformaPersonalizado 
        : plataforma.tipoPlataformaPersonalizado;
      
      if (!tipoPersonalizado || tipoPersonalizado.trim() === '') {
        throw new Error('tipoPlataformaPersonalizado es requerido cuando tipoPlataforma es "Otro"');
      }
    }
  }
  
  return await plataformasRepo.update(id, data);
}

/**
 * Desactivar plataforma
 */
export async function remove(id: string): Promise<boolean> {
  if (!id) {
    throw new Error('id es requerido');
  }
  
  const plataforma = await plataformasRepo.getById(id);
  if (!plataforma) {
    throw new Error('Plataforma no encontrada');
  }
  
  return await plataformasRepo.remove(id);
}
