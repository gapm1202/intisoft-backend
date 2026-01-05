// ============================================================================
// Repository: UsuarioHistorial
// ============================================================================
// Propósito: Operaciones de base de datos para historial de usuarios
// Tabla: usuarios_historial
// ============================================================================

import { pool } from '../../../config/db';
import { 
  UsuarioHistorial, 
  RegistroHistorialParams,
  HistorialResponse 
} from '../models/usuario-historial.model';

/**
 * Registrar un cambio en el historial de usuario
 */
export const registrarCambio = async (params: RegistroHistorialParams): Promise<UsuarioHistorial> => {
  const {
    empresaId,
    usuarioId,
    accion,
    motivo,
    campoModificado = null,
    valorAnterior = null,
    valorNuevo = null,
    observacionAdicional = null,
    realizadoPor = null,
    nombreQuienRealizo = null,
    ipOrigen = null
  } = params;

  // Convertir objetos a JSON string
  const valorAnteriorStr = valorAnterior !== null && typeof valorAnterior === 'object' 
    ? JSON.stringify(valorAnterior) 
    : valorAnterior;
  
  const valorNuevoStr = valorNuevo !== null && typeof valorNuevo === 'object' 
    ? JSON.stringify(valorNuevo) 
    : valorNuevo;

  const query = `
    INSERT INTO usuarios_historial (
      empresa_id, usuario_id, accion, campo_modificado, 
      valor_anterior, valor_nuevo, motivo, observacion_adicional,
      realizado_por, nombre_quien_realizo, ip_origen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING 
      historial_id as "historialId",
      empresa_id as "empresaId",
      usuario_id as "usuarioId",
      accion,
      campo_modificado as "campoModificado",
      valor_anterior as "valorAnterior",
      valor_nuevo as "valorNuevo",
      motivo,
      observacion_adicional as "observacionAdicional",
      realizado_por as "realizadoPor",
      nombre_quien_realizo as "nombreQuienRealizo",
      fecha_cambio as "fechaCambio",
      ip_origen as "ipOrigen"
  `;

  const values = [
    empresaId,
    usuarioId,
    accion,
    campoModificado,
    valorAnteriorStr,
    valorNuevoStr,
    motivo,
    observacionAdicional,
    realizadoPor,
    nombreQuienRealizo,
    ipOrigen
  ];

  try {
    const result = await pool.query(query, values);
    console.log(`✅ Historial registrado: ${accion} para usuario ${usuarioId}`);
    return result.rows[0];
  } catch (error: any) {
    console.error('❌ Error registrando historial:', error);
    throw new Error(`Error al registrar historial: ${error.message}`);
  }
};

/**
 * Obtener historial de un usuario con paginación y filtros
 */
export const obtenerHistorial = async (
  usuarioId: number,
  empresaId: number,
  options: {
    page?: number;
    pageSize?: number;
    accion?: string;
  } = {}
): Promise<{ data: HistorialResponse[]; total: number }> => {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT 
      historial_id as "historialId",
      accion,
      campo_modificado as "campoModificado",
      valor_anterior as "valorAnterior",
      valor_nuevo as "valorNuevo",
      motivo,
      observacion_adicional as "observacionAdicional",
      realizado_por as "realizadoPor",
      nombre_quien_realizo as "nombreQuienRealizo",
      fecha_cambio as "fechaCambio",
      ip_origen as "ipOrigen"
    FROM usuarios_historial
    WHERE usuario_id = $1 AND empresa_id = $2
  `;

  const values: any[] = [usuarioId, empresaId];

  if (options.accion) {
    query += ` AND accion = $${values.length + 1}`;
    values.push(options.accion);
  }

  query += ` ORDER BY fecha_cambio DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(pageSize, offset);

  try {
    const result = await pool.query(query, values);

    // Obtener total de registros
    let countQuery = `
      SELECT COUNT(*) as total
      FROM usuarios_historial
      WHERE usuario_id = $1 AND empresa_id = $2
    `;
    const countValues: any[] = [usuarioId, empresaId];
    
    if (options.accion) {
      countQuery += ` AND accion = $3`;
      countValues.push(options.accion);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);

    // Mapear rows a formato de respuesta
    const data: HistorialResponse[] = result.rows.map((row: any) => ({
      historialId: row.historialId?.toString(),
      accion: row.accion,
      campoModificado: row.campoModificado,
      valorAnterior: row.valorAnterior,
      valorNuevo: row.valorNuevo,
      motivo: row.motivo,
      observacionAdicional: row.observacionAdicional,
      realizadoPor: row.realizadoPor?.toString(),
      nombreQuienRealizo: row.nombreQuienRealizo,
      fechaCambio: row.fechaCambio?.toISOString(),
      ipOrigen: row.ipOrigen
    }));

    return { data, total };
  } catch (error: any) {
    console.error('❌ Error obteniendo historial:', error);
    throw new Error(`Error al obtener historial: ${error.message}`);
  }
};

/**
 * Registrar múltiples cambios en una sola transacción
 * Útil cuando se editan varios campos a la vez
 */
export const registrarCambiosMultiples = async (
  cambios: RegistroHistorialParams[]
): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    for (const cambio of cambios) {
      const valorAnteriorStr = cambio.valorAnterior !== null && typeof cambio.valorAnterior === 'object' 
        ? JSON.stringify(cambio.valorAnterior) 
        : cambio.valorAnterior;
      
      const valorNuevoStr = cambio.valorNuevo !== null && typeof cambio.valorNuevo === 'object' 
        ? JSON.stringify(cambio.valorNuevo) 
        : cambio.valorNuevo;

      const query = `
        INSERT INTO usuarios_historial (
          empresa_id, usuario_id, accion, campo_modificado, 
          valor_anterior, valor_nuevo, motivo, observacion_adicional,
          realizado_por, nombre_quien_realizo, ip_origen
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const values = [
        cambio.empresaId,
        cambio.usuarioId,
        cambio.accion,
        cambio.campoModificado || null,
        valorAnteriorStr,
        valorNuevoStr,
        cambio.motivo,
        cambio.observacionAdicional || null,
        cambio.realizadoPor || null,
        cambio.nombreQuienRealizo || null,
        cambio.ipOrigen || null
      ];

      await client.query(query, values);
    }

    await client.query('COMMIT');
    console.log(`✅ ${cambios.length} cambios registrados en historial`);
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error registrando cambios múltiples:', error);
    throw new Error(`Error al registrar cambios múltiples: ${error.message}`);
  } finally {
    client.release();
  }
};
