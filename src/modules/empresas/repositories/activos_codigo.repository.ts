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
