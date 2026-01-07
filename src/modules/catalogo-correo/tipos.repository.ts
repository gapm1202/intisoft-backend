import { pool } from '../../config/db';
import { TipoCorreo, TipoCorreoInput, TipoCorreoUpdateInput } from './models';

/**
 * Generar código único para tipo: TP-{PRIMERAS_LETRAS}
 */
function generarCodigoTipo(nombre: string): string {
  const palabras = nombre.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(' ')
    .filter(p => p.length > 0 && !['DE', 'LA', 'EL', 'LOS', 'LAS'].includes(p));
  
  let codigo = 'TP-';
  
  if (palabras.length === 1) {
    codigo += palabras[0].substring(0, 5);
  } else {
    codigo += palabras.map(p => p.substring(0, 2)).join('').substring(0, 5);
  }
  
  return codigo;
}

/**
 * Verificar unicidad del código y agregar sufijo numérico si es necesario
 */
async function generarCodigoUnico(nombre: string): Promise<string> {
  let codigoBase = generarCodigoTipo(nombre);
  let codigo = codigoBase;
  let contador = 1;
  
  while (true) {
    const existe = await pool.query(
      'SELECT COUNT(*) as count FROM tipos_correo WHERE codigo = $1',
      [codigo]
    );
    
    if (parseInt(existe.rows[0].count) === 0) {
      return codigo;
    }
    
    codigo = `${codigoBase}${contador}`;
    contador++;
  }
}

/**
 * Obtener todos los tipos
 */
export async function getAll(incluirInactivos = false): Promise<TipoCorreo[]> {
  let query = 'SELECT * FROM tipos_correo';
  
  if (!incluirInactivos) {
    query += ' WHERE activo = TRUE';
  }
  
  query += ' ORDER BY nombre ASC';
  
  const result = await pool.query(query);
  return result.rows.map(mapRowToTipo);
}

/**
 * Obtener tipo por ID
 */
export async function getById(id: string): Promise<TipoCorreo | null> {
  const result = await pool.query(
    'SELECT * FROM tipos_correo WHERE id = $1',
    [parseInt(id)]
  );
  
  if (result.rows.length === 0) return null;
  
  return mapRowToTipo(result.rows[0]);
}

/**
 * Obtener tipo por nombre (case-insensitive)
 */
export async function getByNombre(nombre: string, excludeId?: string): Promise<TipoCorreo | null> {
  let query = 'SELECT * FROM tipos_correo WHERE LOWER(nombre) = LOWER($1)';
  const params: any[] = [nombre];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(parseInt(excludeId));
  }
  
  const result = await pool.query(query, params);
  
  if (result.rows.length === 0) return null;
  
  return mapRowToTipo(result.rows[0]);
}

/**
 * Crear tipo
 */
export async function create(data: TipoCorreoInput): Promise<TipoCorreo> {
  const codigo = await generarCodigoUnico(data.nombre);
  
  const query = `
    INSERT INTO tipos_correo (codigo, nombre, descripcion, activo)
    VALUES ($1, $2, $3, TRUE)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    codigo,
    data.nombre,
    data.descripcion || null,
  ]);
  
  return mapRowToTipo(result.rows[0]);
}

/**
 * Actualizar tipo
 */
export async function update(id: string, data: TipoCorreoUpdateInput): Promise<TipoCorreo> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.nombre !== undefined) {
    fields.push(`nombre = $${paramIndex++}`);
    values.push(data.nombre);
  }
  
  if (data.descripcion !== undefined) {
    fields.push(`descripcion = $${paramIndex++}`);
    values.push(data.descripcion || null);
  }
  
  if (data.activo !== undefined) {
    fields.push(`activo = $${paramIndex++}`);
    values.push(data.activo);
  }
  
  fields.push(`updated_at = NOW()`);
  
  values.push(parseInt(id));
  
  const query = `
    UPDATE tipos_correo
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Tipo de correo no encontrado');
  }
  
  return mapRowToTipo(result.rows[0]);
}

/**
 * Desactivar tipo (soft delete)
 */
export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE tipos_correo SET activo = FALSE, updated_at = NOW() WHERE id = $1',
    [parseInt(id)]
  );
  
  return result.rowCount > 0;
}

/**
 * Mapear fila de BD a objeto TipoCorreo
 */
function mapRowToTipo(row: any): TipoCorreo {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
