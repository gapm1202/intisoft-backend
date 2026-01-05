import { pool } from '../../../config/db';
import { UsuarioEmpresa, UsuarioEmpresaInput, UsuarioEmpresaUpdateInput } from '../models/usuario-empresa.model';

/**
 * Obtener todos los usuarios de una empresa con datos relacionados (JOINs)
 */
export async function getAllByEmpresa(empresaId: string, incluirInactivos = false, sedeId?: string): Promise<UsuarioEmpresa[]> {
  let whereClause = 'WHERE u.empresa_id = $1';
  const params: any[] = [parseInt(empresaId)];
  
  if (!incluirInactivos) {
    whereClause += ' AND u.activo = TRUE';
  }
  
  if (sedeId) {
    whereClause += ` AND u.sede_id = $${params.length + 1}`;
    params.push(parseInt(sedeId));
  }

  const query = `
    SELECT 
      u.id,
      u.empresa_id,
      u.sede_id,
      u.nombre_completo,
      u.correo,
      u.cargo,
      u.telefono,
      u.observaciones,
      u.activo_asignado_id,
      u.activo,
      u.created_at,
      u.updated_at,
      s.nombre AS sede_name,
      e.nombre AS empresa_name,
      i.asset_id AS activo_codigo,
      i.categoria AS activo_nombre,
      i.modelo AS activo_modelo,
      COALESCE(
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', inv.id,
            'assetId', inv.asset_id,
            'codigo', inv.asset_id,
            'nombre', inv.categoria,
            'categoria', inv.categoria,
            'fabricante', inv.fabricante,
            'modelo', inv.modelo,
            'fechaAsignacion', ua.fecha_asignacion
          )
        )
        FROM usuarios_activos ua
        INNER JOIN inventario inv ON ua.activo_id = inv.id
        WHERE ua.usuario_id = u.id AND ua.activo = TRUE),
        '[]'::json
      ) as activos_asignados_m2n,
      (SELECT COUNT(*)
        FROM usuarios_activos ua
        WHERE ua.usuario_id = u.id AND ua.activo = TRUE
      ) as cantidad_activos_asignados
    FROM usuarios_empresas u
    LEFT JOIN sedes s ON u.sede_id = s.id
    LEFT JOIN empresas e ON u.empresa_id = e.id
    LEFT JOIN inventario i ON u.activo_asignado_id = i.id
    ${whereClause}
    ORDER BY u.nombre_completo ASC
  `;

  const result = await pool.query(query, params);
  
  return result.rows.map(row => mapRowToUsuario(row));
}

/**
 * Obtener usuario por ID
 */
export async function getById(id: string): Promise<UsuarioEmpresa | null> {
  const query = `
    SELECT 
      u.id,
      u.empresa_id,
      u.sede_id,
      u.nombre_completo,
      u.correo,
      u.cargo,
      u.telefono,
      u.observaciones,
      u.activo_asignado_id,
      u.activo,
      u.created_at,
      u.updated_at,
      s.nombre AS sede_name,
      e.nombre AS empresa_name,
      i.asset_id AS activo_codigo,
      i.categoria AS activo_nombre,
      i.modelo AS activo_modelo,
      COALESCE(
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', inv.id,
            'assetId', inv.asset_id,
            'codigo', inv.asset_id,
            'nombre', inv.categoria,
            'categoria', inv.categoria,
            'fabricante', inv.fabricante,
            'modelo', inv.modelo,
            'fechaAsignacion', ua.fecha_asignacion
          )
        )
        FROM usuarios_activos ua
        INNER JOIN inventario inv ON ua.activo_id = inv.id
        WHERE ua.usuario_id = u.id AND ua.activo = TRUE),
        '[]'::json
      ) as activos_asignados_m2n,
      (SELECT COUNT(*)
        FROM usuarios_activos ua
        WHERE ua.usuario_id = u.id AND ua.activo = TRUE
      ) as cantidad_activos_asignados
    FROM usuarios_empresas u
    LEFT JOIN sedes s ON u.sede_id = s.id
    LEFT JOIN empresas e ON u.empresa_id = e.id
    LEFT JOIN inventario i ON u.activo_asignado_id = i.id
    WHERE u.id = $1
  `;

  const result = await pool.query(query, [parseInt(id)]);
  
  if (result.rows.length === 0) return null;
  
  return mapRowToUsuario(result.rows[0]);
}

/**
 * Verificar si un correo ya existe para una empresa
 */
export async function existsCorreoEnEmpresa(correo: string, empresaId: string, excludeUsuarioId?: string): Promise<boolean> {
  let query = `
    SELECT COUNT(*) as count
    FROM usuarios_empresas
    WHERE correo = $1 AND empresa_id = $2 AND activo = TRUE
  `;
  
  const params: any[] = [correo, parseInt(empresaId)];
  
  if (excludeUsuarioId) {
    query += ' AND id != $3';
    params.push(parseInt(excludeUsuarioId));
  }
  
  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Verificar si un activo está disponible para asignar
 */
export async function isActivoDisponible(activoId: string, currentUsuarioId?: string): Promise<boolean> {
  let query = `
    SELECT COUNT(*) as count
    FROM inventario
    WHERE id = $1
      AND (usuario_asignado_id IS NULL OR usuario_asignado_id = $2)
  `;
  
  const params = [parseInt(activoId), currentUsuarioId ? parseInt(currentUsuarioId) : null];
  
  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Crear usuario
 */
export async function create(data: UsuarioEmpresaInput): Promise<UsuarioEmpresa> {
  const client = await pool.connect();
  
  try {
    console.log('[USUARIO-EMPRESA] 🔄 Iniciando transacción CREATE');
    console.log('[USUARIO-EMPRESA] 📝 Datos:', JSON.stringify(data, null, 2));
    await client.query('BEGIN');
    
    // 1. Crear usuario
    const insertQuery = `
      INSERT INTO usuarios_empresas (
        empresa_id, sede_id, nombre_completo, correo, cargo, 
        telefono, observaciones, activo_asignado_id, activo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING *
    `;
    
    const activoId = data.activoAsignadoId && data.activoAsignadoId !== '' ? parseInt(data.activoAsignadoId) : null;
    
    const insertResult = await client.query(insertQuery, [
      parseInt(data.empresaId),
      parseInt(data.sedeId),
      data.nombreCompleto,
      data.correo,
      data.cargo || null,
      data.telefono || null,
      data.observaciones || null,
      activoId,
    ]);
    
    const nuevoUsuario = insertResult.rows[0];
    console.log('[USUARIO-EMPRESA] ✅ Usuario insertado, ID:', nuevoUsuario.id);
    
    // 2a. Procesar array activosIds (si se proporciona)
    if (data.activosIds && Array.isArray(data.activosIds) && data.activosIds.length > 0) {
      console.log('[USUARIO-EMPRESA] 🎯 Array activosIds recibido:', data.activosIds);
      
      for (const activoIdStr of data.activosIds) {
        const activoIdNum = parseInt(activoIdStr);
        
        // Verificar que el activo existe
        const activoCheckResult = await client.query(
          'SELECT id FROM inventario WHERE id = $1',
          [activoIdNum]
        );
        
        if (activoCheckResult.rows.length === 0) {
          console.log(`[USUARIO-EMPRESA] ⚠️ Activo ${activoIdNum} no encontrado - saltando`);
          continue;
        }
        
        // Verificar que NO exista ya la relación usuario-activo (evitar duplicados)
        const duplicadoCheck = await client.query(
          'SELECT id FROM usuarios_activos WHERE usuario_id = $1 AND activo_id = $2 AND activo = TRUE',
          [nuevoUsuario.id, activoIdNum]
        );
        
        if (duplicadoCheck.rows.length > 0) {
          console.log(`[USUARIO-EMPRESA] ⚠️ Usuario ya tiene activo ${activoIdNum} - saltando`);
        } else {
          // Insertar en tabla M:N usuarios_activos
          await client.query(
            `INSERT INTO usuarios_activos (usuario_id, activo_id, fecha_asignacion, motivo, activo)
             VALUES ($1, $2, NOW(), 'Asignación inicial al crear usuario', TRUE)`,
            [nuevoUsuario.id, activoIdNum]
          );
          console.log(`[USUARIO-EMPRESA] ✅ Activo ${activoIdNum} asignado en usuarios_activos`);
        }
      }
    }
    
    // 2b. Asignar activo si se especificó activoAsignadoId (campo singular legacy)
    if (activoId) {
      console.log('[USUARIO-EMPRESA] 🎯 Activo a asignar:', activoId);
      
      // Verificar que el activo existe
      const activoCheckResult = await client.query(
        'SELECT id FROM inventario WHERE id = $1',
        [activoId]
      );
      
      if (activoCheckResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error(`Activo ${activoId} no encontrado`);
      }
      
      // Verificar que NO exista ya la relación usuario-activo (evitar duplicados)
      const duplicadoCheck = await client.query(
        'SELECT id FROM usuarios_activos WHERE usuario_id = $1 AND activo_id = $2 AND activo = TRUE',
        [nuevoUsuario.id, activoId]
      );
      
      if (duplicadoCheck.rows.length > 0) {
        console.log('[USUARIO-EMPRESA] ⚠️ El usuario ya tiene este activo asignado - saltando');
      } else {
        // Insertar en tabla M:N usuarios_activos
        await client.query(
          `INSERT INTO usuarios_activos (usuario_id, activo_id, fecha_asignacion, motivo, activo)
           VALUES ($1, $2, NOW(), 'Asignación inicial al crear usuario', TRUE)`,
          [nuevoUsuario.id, activoId]
        );
        console.log('[USUARIO-EMPRESA] ✅ Activo asignado en usuarios_activos (M:N)');
      }
      
      // LEGACY: También actualizar inventario.usuario_asignado_id por compatibilidad
      // NOTA: Este campo es 1:1, se sobrescribirá si múltiples usuarios tienen el activo
      await client.query(
        'UPDATE inventario SET usuario_asignado_id = $1 WHERE id = $2',
        [nuevoUsuario.id, activoId]
      );
    } else {
      console.log('[USUARIO-EMPRESA] ⚪ Sin activo asignado');
    }
    
    await client.query('COMMIT');
    console.log('[USUARIO-EMPRESA] ✅ Transacción CREATE completada');
    
    // 3. Retornar usuario creado con datos relacionados
    const usuario = await getById(nuevoUsuario.id.toString());
    return usuario!;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[USUARIO-EMPRESA] ❌ Error en transacción CREATE, ROLLBACK ejecutado:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Actualizar usuario
 */
export async function update(id: string, data: UsuarioEmpresaUpdateInput): Promise<UsuarioEmpresa | null> {
  const client = await pool.connect();
  
  try {
    console.log('[USUARIO-EMPRESA] 🔄 Iniciando transacción UPDATE, usuario ID:', id);
    console.log('[USUARIO-EMPRESA] 📝 Datos a actualizar:', JSON.stringify(data, null, 2));
    await client.query('BEGIN');
    
    // 1. Obtener usuario actual
    const usuarioActual = await getById(id);
    if (!usuarioActual) {
      console.log('[USUARIO-EMPRESA] ❌ Usuario no encontrado, ID:', id);
      await client.query('ROLLBACK');
      return null;
    }
    console.log('[USUARIO-EMPRESA] ✅ Usuario actual:', usuarioActual.nombreCompleto, '| Activo actual:', usuarioActual.activoAsignadoId);
    
    // 2. Construir query de actualización dinámicamente
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.sedeId !== undefined) {
      fields.push(`sede_id = $${paramIndex++}`);
      values.push(parseInt(data.sedeId));
    }
    
    if (data.nombreCompleto !== undefined) {
      fields.push(`nombre_completo = $${paramIndex++}`);
      values.push(data.nombreCompleto);
    }
    
    if (data.correo !== undefined) {
      fields.push(`correo = $${paramIndex++}`);
      values.push(data.correo);
    }
    
    if (data.cargo !== undefined) {
      fields.push(`cargo = $${paramIndex++}`);
      values.push(data.cargo);
    }
    
    if (data.telefono !== undefined) {
      fields.push(`telefono = $${paramIndex++}`);
      values.push(data.telefono);
    }
    
    if (data.observaciones !== undefined) {
      fields.push(`observaciones = $${paramIndex++}`);
      values.push(data.observaciones);
    }
    
    if (data.activo !== undefined) {
      fields.push(`activo = $${paramIndex++}`);
      values.push(data.activo);
    }
    
    if (data.activoAsignadoId !== undefined) {
      const nuevoActivoId = data.activoAsignadoId && data.activoAsignadoId !== '' 
        ? parseInt(data.activoAsignadoId) 
        : null;
      
      fields.push(`activo_asignado_id = $${paramIndex++}`);
      values.push(nuevoActivoId);
      
      // 3. Gestionar relación M:N en usuarios_activos
      if (usuarioActual.activoAsignadoId) {
        console.log('[USUARIO-EMPRESA] 🔓 Liberando activo anterior ID:', usuarioActual.activoAsignadoId, 'de la relación M:N');
        // Desactivar relación anterior en usuarios_activos
        await client.query(
          'UPDATE usuarios_activos SET activo = FALSE WHERE usuario_id = $1 AND activo_id = $2',
          [parseInt(id), parseInt(usuarioActual.activoAsignadoId)]
        );
        console.log('[USUARIO-EMPRESA] ✅ Activo anterior liberado en usuarios_activos');
      }
      
      // 4. Asignar nuevo activo si se especificó
      if (nuevoActivoId) {
        // Verificar que el activo existe
        const activoCheckResult = await client.query(
          'SELECT id FROM inventario WHERE id = $1',
          [nuevoActivoId]
        );
        
        if (activoCheckResult.rows.length === 0) {
          await client.query('ROLLBACK');
          throw new Error(`Activo ${nuevoActivoId} no encontrado`);
        }
        
        console.log('[USUARIO-EMPRESA] 🔗 Asignando nuevo activo ID:', nuevoActivoId, 'a usuario ID:', id);
        
        // Verificar si ya existe la relación usuario-activo
        const duplicadoCheck = await client.query(
          'SELECT id FROM usuarios_activos WHERE usuario_id = $1 AND activo_id = $2 AND activo = TRUE',
          [parseInt(id), nuevoActivoId]
        );
        
        if (duplicadoCheck.rows.length > 0) {
          console.log('[USUARIO-EMPRESA] ⚠️ El usuario ya tiene este activo - saltando inserción M:N');
        } else {
          // Insertar nueva relación M:N
          await client.query(
            `INSERT INTO usuarios_activos (usuario_id, activo_id, fecha_asignacion, motivo, activo)
             VALUES ($1, $2, NOW(), 'Actualización de usuario', TRUE)`,
            [parseInt(id), nuevoActivoId]
          );
          console.log('[USUARIO-EMPRESA] ✅ Nuevo activo asignado en usuarios_activos (M:N)');
        }
        
        // LEGACY: Actualizar inventario.usuario_asignado_id por compatibilidad
        await client.query(
          'UPDATE inventario SET usuario_asignado_id = $1 WHERE id = $2',
          [parseInt(id), nuevoActivoId]
        );
      }
    }
    
    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return usuarioActual;
    }
    
    // 5. Actualizar usuario
    values.push(parseInt(id));
    const updateQuery = `
      UPDATE usuarios_empresas 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    await client.query(updateQuery, values);
    
    await client.query('COMMIT');
    console.log('[USUARIO-EMPRESA] ✅ Transacción UPDATE completada');
    
    // 6. Retornar usuario actualizado con datos relacionados
    const usuarioActualizado = await getById(id);
    return usuarioActualizado;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[USUARIO-EMPRESA] ❌ Error en transacción UPDATE, ROLLBACK ejecutado:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Eliminar usuario (soft delete)
 */
export async function remove(id: string): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    console.log('[USUARIO-EMPRESA] 🔄 Iniciando transacción REMOVE (soft delete), usuario ID:', id);
    await client.query('BEGIN');
    
    // 1. Obtener usuario
    const usuario = await getById(id);
    if (!usuario) {
      console.log('[USUARIO-EMPRESA] ❌ Usuario no encontrado, ID:', id);
      await client.query('ROLLBACK');
      return false;
    }
    console.log('[USUARIO-EMPRESA] ✅ Usuario encontrado:', usuario.nombreCompleto, '| Activo asignado:', usuario.activoAsignadoId);
    
    // 2. Liberar activo si tenía asignado
    if (usuario.activoAsignadoId) {
      console.log('[USUARIO-EMPRESA] 🔓 Liberando activo ID:', usuario.activoAsignadoId);
      await client.query(
        'UPDATE inventario SET usuario_asignado_id = NULL WHERE id = $1',
        [parseInt(usuario.activoAsignadoId)]
      );
      console.log('[USUARIO-EMPRESA] ✅ Activo liberado correctamente');
    }
    
    // 3. Marcar usuario como inactivo (soft delete)
    await client.query(
      'UPDATE usuarios_empresas SET activo = FALSE, updated_at = NOW() WHERE id = $1',
      [parseInt(id)]
    );
    
    await client.query('COMMIT');
    console.log('[USUARIO-EMPRESA] ✅ Transacción REMOVE completada');
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[USUARIO-EMPRESA] ❌ Error en transacción REMOVE, ROLLBACK ejecutado:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verificar que la sede existe y pertenece a la empresa
 */
export async function sedeExistsInEmpresa(sedeId: string, empresaId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM sedes WHERE id = $1 AND empresa_id = $2',
    [parseInt(sedeId), parseInt(empresaId)]
  );
  
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Verificar que el activo existe
 */
export async function activoExists(activoId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM inventario WHERE id = $1',
    [parseInt(activoId)]
  );
  
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Mapear fila de BD a objeto UsuarioEmpresa
 */
function mapRowToUsuario(row: any): UsuarioEmpresa {
  const activosAsignadosM2N = Array.isArray(row.activos_asignados_m2n) 
    ? row.activos_asignados_m2n 
    : (row.activos_asignados_m2n ? JSON.parse(row.activos_asignados_m2n) : []);
  
  return {
    id: row.id,
    _id: row.id.toString(),
    empresaId: row.empresa_id.toString(),
    sedeId: row.sede_id.toString(),
    nombreCompleto: row.nombre_completo,
    correo: row.correo,
    cargo: row.cargo,
    telefono: row.telefono,
    observaciones: row.observaciones,
    activoAsignadoId: row.activo_asignado_id ? row.activo_asignado_id.toString() : null,
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sedeName: row.sede_name,
    empresaName: row.empresa_name,
    activoCodigo: row.activo_codigo,
    activoNombre: row.activo_nombre,
    activoModelo: row.activo_modelo,
    // Campos M:N nuevos
    activosAsignados: activosAsignadosM2N,
    cantidadActivosAsignados: parseInt(row.cantidad_activos_asignados) || 0,
  };
}
