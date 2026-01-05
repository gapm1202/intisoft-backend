import { pool } from '../../../config/db';
import { UsuarioActivoAsignacion } from '../models/usuario-activo.model';

/**
 * Asignar un usuario a un activo
 */
export async function asignarUsuarioAActivo(
  usuarioId: number,
  activoId: number,
  asignadoPor?: string,
  motivo?: string
): Promise<UsuarioActivoAsignacion> {
  // Verificar si ya existe asignación activa
  const existente = await pool.query(
    'SELECT id FROM usuarios_activos WHERE usuario_id = $1 AND activo_id = $2 AND activo = TRUE',
    [usuarioId, activoId]
  );
  
  if (existente.rows.length > 0) {
    throw new Error('El usuario ya está asignado a este activo');
  }
  
  const query = `
    INSERT INTO usuarios_activos (usuario_id, activo_id, asignado_por, motivo, activo)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING *
  `;
  
  const result = await pool.query(query, [usuarioId, activoId, asignadoPor || null, motivo || null]);
  return mapRowToAsignacion(result.rows[0]);
}

/**
 * Desasignar un usuario de un activo (soft delete)
 */
export async function desasignarUsuarioDeActivo(
  usuarioId: number,
  activoId: number,
  motivo?: string
): Promise<boolean> {
  const query = `
    UPDATE usuarios_activos 
    SET activo = FALSE, 
        motivo = COALESCE($3, motivo),
        updated_at = NOW()
    WHERE usuario_id = $1 AND activo_id = $2 AND activo = TRUE
    RETURNING id
  `;
  
  const result = await pool.query(query, [usuarioId, activoId, motivo || null]);
  return result.rows.length > 0;
}

/**
 * Obtener usuarios asignados a un activo
 */
export async function getUsuariosByActivo(activoId: number): Promise<UsuarioActivoAsignacion[]> {
  const query = `
    SELECT 
      ua.*,
      u.nombre_completo,
      u.correo,
      u.cargo,
      u.telefono
    FROM usuarios_activos ua
    INNER JOIN usuarios_empresas u ON ua.usuario_id = u.id
    WHERE ua.activo_id = $1 AND ua.activo = TRUE
    ORDER BY ua.fecha_asignacion DESC
  `;
  
  const result = await pool.query(query, [activoId]);
  return result.rows.map(row => ({
    ...mapRowToAsignacion(row),
    usuarioData: {
      id: row.usuario_id,
      nombreCompleto: row.nombre_completo,
      correo: row.correo,
      cargo: row.cargo,
      telefono: row.telefono
    }
  }));
}

/**
 * Obtener activos asignados a un usuario
 */
export async function getActivosByUsuario(usuarioId: number): Promise<UsuarioActivoAsignacion[]> {
  const query = `
    SELECT 
      ua.*,
      i.asset_id,
      i.categoria,
      i.modelo,
      i.fabricante
    FROM usuarios_activos ua
    INNER JOIN inventario i ON ua.activo_id = i.id
    WHERE ua.usuario_id = $1 AND ua.activo = TRUE
    ORDER BY ua.fecha_asignacion DESC
  `;
  
  const result = await pool.query(query, [usuarioId]);
  return result.rows.map(row => ({
    ...mapRowToAsignacion(row),
    activoData: {
      id: row.activo_id,
      assetId: row.asset_id,
      nombre: row.categoria ? `${row.categoria} ${row.fabricante || ''} ${row.modelo || ''}`.trim() : undefined,
      categoria: row.categoria,
      modelo: row.modelo
    }
  }));
}

/**
 * Obtener historial completo de asignaciones de un activo
 */
export async function getHistorialAsignacionesActivo(activoId: number): Promise<any[]> {
  const query = `
    SELECT 
      ua.*,
      u.nombre_completo,
      u.correo,
      CASE 
        WHEN ua.activo = TRUE THEN 'ASIGNACION'
        ELSE 'DESASIGNACION'
      END as accion
    FROM usuarios_activos ua
    INNER JOIN usuarios_empresas u ON ua.usuario_id = u.id
    WHERE ua.activo_id = $1
    ORDER BY ua.updated_at DESC
  `;
  
  const result = await pool.query(query, [activoId]);
  return result.rows.map(row => ({
    accion: row.accion,
    usuarioId: row.usuario_id.toString(),
    nombreCompleto: row.nombre_completo,
    correo: row.correo,
    fecha: row.activo ? row.fecha_asignacion : row.updated_at,
    asignadoPor: row.asignado_por,
    motivo: row.motivo
  }));
}

/**
 * Contar usuarios asignados a un activo
 */
export async function countUsuariosByActivo(activoId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM usuarios_activos WHERE activo_id = $1 AND activo = TRUE',
    [activoId]
  );
  return parseInt(result.rows[0].count);
}

/**
 * Contar activos asignados a un usuario
 */
export async function countActivosByUsuario(usuarioId: number): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM usuarios_activos WHERE usuario_id = $1 AND activo = TRUE',
    [usuarioId]
  );
  return parseInt(result.rows[0].count);
}

/**
 * Mapper de row a UsuarioActivoAsignacion
 */
function mapRowToAsignacion(row: any): UsuarioActivoAsignacion {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    activoId: row.activo_id,
    fechaAsignacion: row.fecha_asignacion,
    asignadoPor: row.asignado_por,
    motivo: row.motivo,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
