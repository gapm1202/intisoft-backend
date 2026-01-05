import * as usuarioActivoRepo from '../repositories/usuario-activo.repository';
import { AsignarUsuariosInput, AsignarActivosInput } from '../models/usuario-activo.model';
import { pool } from '../../../config/db';

// Límites configurables
const MAX_USUARIOS_POR_ACTIVO = 10;
const MAX_ACTIVOS_POR_USUARIO = 20;

/**
 * Asignar múltiples usuarios a un activo
 */
export async function asignarUsuariosAActivo(
  activoId: string,
  input: AsignarUsuariosInput
): Promise<any> {
  const activoIdNum = parseInt(activoId);
  const { usuarioIds, motivo, asignadoPor } = input;
  
  // Validar que el activo existe
  const activoResult = await pool.query('SELECT id FROM inventario WHERE id = $1', [activoIdNum]);
  if (activoResult.rows.length === 0) {
    throw new Error('Activo no encontrado');
  }
  
  // Validar límite
  const countActual = await usuarioActivoRepo.countUsuariosByActivo(activoIdNum);
  if (countActual + usuarioIds.length > MAX_USUARIOS_POR_ACTIVO) {
    throw new Error(`El activo no puede tener más de ${MAX_USUARIOS_POR_ACTIVO} usuarios asignados`);
  }
  
  const asignaciones = [];
  const errores = [];
  
  for (const usuarioId of usuarioIds) {
    try {
      const usuarioIdNum = parseInt(usuarioId);
      
      // Verificar que el usuario existe
      const usuarioResult = await pool.query(
        'SELECT id FROM usuarios_empresas WHERE id = $1 AND activo = TRUE',
        [usuarioIdNum]
      );
      
      if (usuarioResult.rows.length === 0) {
        errores.push(`Usuario ${usuarioId} no encontrado o inactivo`);
        continue;
      }
      
      const asignacion = await usuarioActivoRepo.asignarUsuarioAActivo(
        usuarioIdNum,
        activoIdNum,
        asignadoPor,
        motivo
      );
      
      // Obtener datos completos del usuario
      const usuarioData = await pool.query(
        'SELECT id, nombre_completo, correo, cargo FROM usuarios_empresas WHERE id = $1',
        [usuarioIdNum]
      );
      
      asignaciones.push({
        id: asignacion.id.toString(),
        usuarioId: usuarioId,
        activoId: activoId,
        fechaAsignacion: asignacion.fechaAsignacion,
        usuarioData: {
          id: usuarioId,
          nombreCompleto: usuarioData.rows[0].nombre_completo,
          correo: usuarioData.rows[0].correo,
          cargo: usuarioData.rows[0].cargo
        }
      });
    } catch (error: any) {
      errores.push(`Usuario ${usuarioId}: ${error.message}`);
    }
  }
  
  if (asignaciones.length === 0 && errores.length > 0) {
    throw new Error(`No se pudo asignar ningún usuario: ${errores.join(', ')}`);
  }
  
  return {
    asignaciones,
    errores: errores.length > 0 ? errores : undefined
  };
}

/**
 * Asignar múltiples activos a un usuario
 */
export async function asignarActivosAUsuario(
  usuarioId: string,
  input: AsignarActivosInput
): Promise<any> {
  const usuarioIdNum = parseInt(usuarioId);
  const { activoIds, motivo, asignadoPor } = input;
  
  // Validar que el usuario existe
  const usuarioResult = await pool.query(
    'SELECT id FROM usuarios_empresas WHERE id = $1 AND activo = TRUE',
    [usuarioIdNum]
  );
  
  if (usuarioResult.rows.length === 0) {
    throw new Error('Usuario no encontrado o inactivo');
  }
  
  // Validar límite
  const countActual = await usuarioActivoRepo.countActivosByUsuario(usuarioIdNum);
  if (countActual + activoIds.length > MAX_ACTIVOS_POR_USUARIO) {
    throw new Error(`El usuario no puede tener más de ${MAX_ACTIVOS_POR_USUARIO} activos asignados`);
  }
  
  const asignaciones = [];
  const errores = [];
  
  for (const activoId of activoIds) {
    try {
      const activoIdNum = parseInt(activoId);
      
      // Verificar que el activo existe
      const activoResult = await pool.query(
        'SELECT id, asset_id, categoria, fabricante, modelo FROM inventario WHERE id = $1',
        [activoIdNum]
      );
      
      if (activoResult.rows.length === 0) {
        errores.push(`Activo ${activoId} no encontrado`);
        continue;
      }
      
      const asignacion = await usuarioActivoRepo.asignarUsuarioAActivo(
        usuarioIdNum,
        activoIdNum,
        asignadoPor,
        motivo
      );
      
      const activo = activoResult.rows[0];
      asignaciones.push({
        id: asignacion.id.toString(),
        usuarioId: usuarioId,
        activoId: activoId,
        fechaAsignacion: asignacion.fechaAsignacion,
        activoData: {
          id: activoId,
          assetId: activo.asset_id,
          nombre: activo.categoria ? `${activo.categoria} ${activo.fabricante || ''} ${activo.modelo || ''}`.trim() : undefined,
          categoria: activo.categoria
        }
      });
    } catch (error: any) {
      errores.push(`Activo ${activoId}: ${error.message}`);
    }
  }
  
  if (asignaciones.length === 0 && errores.length > 0) {
    throw new Error(`No se pudo asignar ningún activo: ${errores.join(', ')}`);
  }
  
  return {
    asignaciones,
    errores: errores.length > 0 ? errores : undefined
  };
}

/**
 * Desasignar usuario de activo
 */
export async function desasignarUsuarioDeActivo(
  activoId: string,
  usuarioId: string,
  motivo?: string
): Promise<boolean> {
  return await usuarioActivoRepo.desasignarUsuarioDeActivo(
    parseInt(usuarioId),
    parseInt(activoId),
    motivo
  );
}

/**
 * Desasignar activo de usuario
 */
export async function desasignarActivoDeUsuario(
  usuarioId: string,
  activoId: string,
  motivo?: string
): Promise<boolean> {
  return await usuarioActivoRepo.desasignarUsuarioDeActivo(
    parseInt(usuarioId),
    parseInt(activoId),
    motivo
  );
}

/**
 * Obtener usuarios asignados a un activo
 */
export async function getUsuariosByActivo(activoId: string): Promise<any[]> {
  const asignaciones = await usuarioActivoRepo.getUsuariosByActivo(parseInt(activoId));
  
  return asignaciones.map(a => ({
    asignacionId: a.id.toString(),
    usuarioId: a.usuarioId.toString(),
    nombreCompleto: a.usuarioData?.nombreCompleto,
    correo: a.usuarioData?.correo,
    cargo: a.usuarioData?.cargo,
    telefono: a.usuarioData?.telefono,
    fechaAsignacion: a.fechaAsignacion,
    asignadoPor: a.asignadoPor,
    motivo: a.motivo
  }));
}

/**
 * Obtener activos asignados a un usuario
 */
export async function getActivosByUsuario(usuarioId: string): Promise<any[]> {
  const asignaciones = await usuarioActivoRepo.getActivosByUsuario(parseInt(usuarioId));
  
  return asignaciones.map(a => ({
    asignacionId: a.id.toString(),
    activoId: a.activoId.toString(),
    assetId: a.activoData?.assetId,
    nombre: a.activoData?.nombre,
    categoria: a.activoData?.categoria,
    fechaAsignacion: a.fechaAsignacion,
    asignadoPor: a.asignadoPor,
    motivo: a.motivo
  }));
}

/**
 * Obtener historial de asignaciones de un activo
 */
export async function getHistorialAsignacionesActivo(activoId: string): Promise<any[]> {
  return await usuarioActivoRepo.getHistorialAsignacionesActivo(parseInt(activoId));
}
