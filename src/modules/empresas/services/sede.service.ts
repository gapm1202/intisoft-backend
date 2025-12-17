import * as repo from "../repositories/sede.repository";
import { Sede } from "../models/sede.model";

/**
 * Genera código interno basado en el nombre de la sede
 * Ejemplos:
 * - "Sucursal Callao" → "SUC-CALL"
 * - "Sede Ate" → "SED-ATE"
 * - "Almacen Principal" → "ALM-PRIN"
 */
function generarCodigoInterno(nombre: string): string {
  // Limpiar y normalizar el nombre
  const palabras = nombre
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remover caracteres especiales
    .split(/\s+/) // Separar por espacios
    .filter(p => p.length > 0);

  if (palabras.length === 0) {
    return 'SED-XXX'; // Fallback si no hay palabras válidas
  }

  // Primera palabra: hasta 3 caracteres
  const primera = palabras[0].substring(0, 3);

  // Segunda palabra: hasta 4 caracteres (o usar la primera palabra si no hay segunda)
  const segunda = palabras.length > 1 
    ? palabras[1].substring(0, 4)
    : palabras[0].substring(3, 7) || 'XXX';

  return `${primera}-${segunda}`;
}

export const listSedes = async (empresaId: number, includeInactive: boolean = false): Promise<Sede[]> => {
  return repo.getAllByEmpresa(empresaId, includeInactive);
};

export const createSede = async (empresaId: number, data: Sede): Promise<Sede> => {
  // Generar código interno automáticamente si no viene del request
  if (!data.codigoInterno && data.nombre) {
    data.codigoInterno = generarCodigoInterno(data.nombre);
  }
  
  return repo.createForEmpresa(empresaId, data);
};

export const updateSede = async (id: number, data: Partial<Sede>): Promise<Sede | null> => {
  return repo.updateById(id, data);
};

/**
 * Soft delete: Deactivate or reactivate a sede without removing it from the database
 * @param id Sede ID
 * @param activo true to activate, false to deactivate
 * @param motivo Reason for the change
 */
export const toggleActivoSede = async (id: number, activo: boolean, motivo: string): Promise<Sede | null> => {
  return repo.softDeleteById(id, activo, motivo);
};

export const deleteSede = async (id: number): Promise<Sede | null> => {
  return repo.deleteById(id);
};

export const getSede = async (id: number): Promise<Sede | null> => {
  return repo.getById(id);
};
