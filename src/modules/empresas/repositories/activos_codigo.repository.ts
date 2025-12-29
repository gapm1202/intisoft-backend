import { pool } from "../../../config/db";
import { CodigoSequence, CodigoReserved, NextCodeResponse } from "../models/activos_codigo.model";

/**
 * Gets or creates the sequence counter for an empresa/categoria combination
 * Uses transaction for atomicity
 */
export const getOrCreateSequence = async (
  empresaId: number,
  categoriaId: number
): Promise<CodigoSequence> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Try to get existing
    const result = await client.query(
      'SELECT * FROM activos_codigo_sequence WHERE empresa_id = $1 AND categoria_id = $2',
      [empresaId, categoriaId]
    );

    if (result.rows.length > 0) {
      await client.query('COMMIT');
      return result.rows[0];
    }

    // Create new with next_number = 1
    const insertResult = await client.query(
      `INSERT INTO activos_codigo_sequence (empresa_id, categoria_id, next_number)
       VALUES ($1, $2, 1)
       RETURNING *`,
      [empresaId, categoriaId]
    );

    await client.query('COMMIT');
    return insertResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reserves the next available code for an empresa/categoria
 * Increments the sequence counter and creates a reservation record
 * Returns the reserved code and reservation details
 * 
 * Lock is transactional per empresa to prevent concurrent access issues
 */
export const reserveNextCode = async (
  empresaId: number,
  categoriaId: number,
  userId?: number,
  reservationTtlMinutes: number = 15
): Promise<NextCodeResponse> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

    // Get empresa codigo and categoria codigo
    const empresaResult = await client.query(
      'SELECT codigo FROM empresas WHERE id = $1',
      [empresaId]
    );

    const categoriaResult = await client.query(
      'SELECT codigo FROM categorias WHERE id = $1',
      [categoriaId]
    );

    if (empresaResult.rows.length === 0) {
      throw new Error(`Empresa no encontrada: ${empresaId}`);
    }
    if (categoriaResult.rows.length === 0) {
      throw new Error(`Categoría no encontrada: ${categoriaId}`);
    }

    const empresaCodigo = empresaResult.rows[0].codigo;
    const categoriaCodigo = categoriaResult.rows[0].codigo;

    // 🎯 LÓGICA SIMPLE: Solo MAX() de inventario + 1
    const pattern = `${empresaCodigo}-${categoriaCodigo}%`;
    const maxNumberResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(asset_id FROM '[0-9]+$') AS INTEGER)), 0) as max_num
       FROM inventario 
       WHERE empresa_id = $1 
       AND asset_id LIKE $2`,
      [empresaId, pattern]
    );

    const sequenceNumber = (maxNumberResult.rows[0].max_num || 0) + 1;

    // Format: <EMPRESA_CODIGO>-<CATEGORIA_CODIGO><NNNN>
    const paddedNumber = String(sequenceNumber).padStart(4, '0');
    const codigo = `${empresaCodigo}-${categoriaCodigo}${paddedNumber}`;

    await client.query('COMMIT');

    // Retornar en el formato esperado (sin crear reserva)
    return {
      code: codigo,
      sequence_number: sequenceNumber,
      reservation_id: 0, // No hay reserva
      expires_at: new Date().toISOString() // No expira
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get a reservation by code
 */
export const getReservation = async (codigo: string): Promise<CodigoReserved | null> => {
  const result = await pool.query(
    'SELECT * FROM activos_codigo_reserved WHERE codigo = $1',
    [codigo]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Confirm a reservation (mark as used when activo is created)
 */
export const confirmReservation = async (
  reservationId: number,
  activoId: number
): Promise<void> => {
  await pool.query(
    `UPDATE activos_codigo_reserved 
     SET confirmed = TRUE, activo_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [activoId, reservationId]
  );
};

/**
 * Check if a code is valid (exists and not expired and not yet used)
 */
export const isCodeReserved = async (codigo: string, empresaId: number): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id FROM activos_codigo_reserved 
     WHERE codigo = $1 AND empresa_id = $2 AND expires_at > CURRENT_TIMESTAMP`,
    [codigo, empresaId]
  );
  return result.rows.length > 0;
};

/**
 * Clean up expired reservations (can be called periodically)
 */
export const cleanupExpiredReservations = async (): Promise<number> => {
  const result = await pool.query(
    'DELETE FROM activos_codigo_reserved WHERE expires_at < CURRENT_TIMESTAMP AND confirmed = FALSE'
  );
  return result.rowCount || 0;
};

/**
 * Get current sequence number for empresa/categoria (for debugging/info)
 */
export const getSequenceInfo = async (empresaId: number, categoriaId: number): Promise<CodigoSequence | null> => {
  const result = await pool.query(
    'SELECT * FROM activos_codigo_sequence WHERE empresa_id = $1 AND categoria_id = $2',
    [empresaId, categoriaId]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};
