import { pool } from '../../config/db';
import { PlataformaCorreo, PlataformaCorreoInput, PlataformaCorreoUpdateInput } from './models';

/**
 * Generar código único para plataforma: PLAT-{PRIMERAS_LETRAS}
 */
function generarCodigoPlataforma(nombre: string): string {
  // Tomar primeras letras significativas del nombre (sin espacios ni artículos)
  const palabras = nombre.toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Solo letras y números
    .split(' ')
    .filter(p => p.length > 0 && !['DE', 'LA', 'EL', 'LOS', 'LAS'].includes(p));
  
  let codigo = 'PLAT-';
  
  if (palabras.length === 1) {
    // Una palabra: tomar primeras 5 letras
    codigo += palabras[0].substring(0, 5);
  } else {
    // Múltiples palabras: tomar primeras 2-3 letras de cada una
    codigo += palabras.map(p => p.substring(0, 2)).join('').substring(0, 5);
  }
  
  return codigo;
}

/**
 * Verificar unicidad del código y agregar sufijo numérico si es necesario
 */
async function generarCodigoUnico(nombre: string): Promise<string> {
  let codigoBase = generarCodigoPlataforma(nombre);
  let codigo = codigoBase;
  let contador = 1;
  
  while (true) {
    const existe = await pool.query(
      'SELECT COUNT(*) as count FROM plataformas_correo WHERE codigo = $1',
      [codigo]
    );
    
    if (parseInt(existe.rows[0].count) === 0) {
      return codigo;
    }
    
    // Código existe, agregar sufijo numérico
    codigo = `${codigoBase}${contador}`;
    contador++;
  }
}

/**
 * Obtener todas las plataformas
 */
export async function getAll(incluirInactivos = false): Promise<PlataformaCorreo[]> {
  let query = 'SELECT * FROM plataformas_correo';
  
  if (!incluirInactivos) {
    query += ' WHERE activo = TRUE';
  }
  
  query += ' ORDER BY nombre ASC';
  
  const result = await pool.query(query);
  return result.rows.map(mapRowToPlataforma);
}

/**
 * Obtener plataforma por ID
 */
export async function getById(id: string): Promise<PlataformaCorreo | null> {
  const result = await pool.query(
    'SELECT * FROM plataformas_correo WHERE id = $1',
    [parseInt(id)]
  );
  
  if (result.rows.length === 0) return null;
  
  return mapRowToPlataforma(result.rows[0]);
}

/**
 * Obtener plataforma por nombre (case-insensitive)
 */
export async function getByNombre(nombre: string, excludeId?: string): Promise<PlataformaCorreo | null> {
  let query = 'SELECT * FROM plataformas_correo WHERE LOWER(nombre) = LOWER($1)';
  const params: any[] = [nombre];
  
  if (excludeId) {
    query += ' AND id != $2';
    params.push(parseInt(excludeId));
  }
  
  const result = await pool.query(query, params);
  
  if (result.rows.length === 0) return null;
  
  return mapRowToPlataforma(result.rows[0]);
}

/**
 * Crear plataforma
 */
export async function create(data: PlataformaCorreoInput): Promise<PlataformaCorreo> {
  // Generar código único
  const codigo = await generarCodigoUnico(data.nombre);
  
  const query = `
    INSERT INTO plataformas_correo (
      codigo, nombre, tipo_plataforma, tipo_plataforma_personalizado,
      permite_reasignar, permite_conservar, observaciones, activo
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    RETURNING *
  `;
  
  const result = await pool.query(query, [
    codigo,
    data.nombre,
    data.tipoPlataforma,
    data.tipoPlataformaPersonalizado || null,
    data.permiteReasignar !== undefined ? data.permiteReasignar : true,
    data.permiteConservar !== undefined ? data.permiteConservar : true,
    data.observaciones || null,
  ]);
  
  return mapRowToPlataforma(result.rows[0]);
}

/**
 * Actualizar plataforma
 */
export async function update(id: string, data: PlataformaCorreoUpdateInput): Promise<PlataformaCorreo> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.nombre !== undefined) {
    fields.push(`nombre = $${paramIndex++}`);
    values.push(data.nombre);
  }
  
  if (data.tipoPlataforma !== undefined) {
    fields.push(`tipo_plataforma = $${paramIndex++}`);
    values.push(data.tipoPlataforma);
  }
  
  if (data.tipoPlataformaPersonalizado !== undefined) {
    fields.push(`tipo_plataforma_personalizado = $${paramIndex++}`);
    values.push(data.tipoPlataformaPersonalizado || null);
  }
  
  if (data.permiteReasignar !== undefined) {
    fields.push(`permite_reasignar = $${paramIndex++}`);
    values.push(data.permiteReasignar);
  }
  
  if (data.permiteConservar !== undefined) {
    fields.push(`permite_conservar = $${paramIndex++}`);
    values.push(data.permiteConservar);
  }
  
  if (data.observaciones !== undefined) {
    fields.push(`observaciones = $${paramIndex++}`);
    values.push(data.observaciones || null);
  }
  
  if (data.activo !== undefined) {
    fields.push(`activo = $${paramIndex++}`);
    values.push(data.activo);
  }
  
  fields.push(`updated_at = NOW()`);
  
  values.push(parseInt(id));
  
  const query = `
    UPDATE plataformas_correo
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    throw new Error('Plataforma no encontrada');
  }
  
  return mapRowToPlataforma(result.rows[0]);
}

/**
 * Desactivar plataforma (soft delete)
 */
export async function remove(id: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE plataformas_correo SET activo = FALSE, updated_at = NOW() WHERE id = $1',
    [parseInt(id)]
  );
  
  return result.rowCount > 0;
}

/**
 * Mapear fila de BD a objeto PlataformaCorreo
 */
function mapRowToPlataforma(row: any): PlataformaCorreo {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    tipoPlataforma: row.tipo_plataforma,
    tipoPlataformaPersonalizado: row.tipo_plataforma_personalizado,
    permiteReasignar: row.permite_reasignar,
    permiteConservar: row.permite_conservar,
    observaciones: row.observaciones,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
