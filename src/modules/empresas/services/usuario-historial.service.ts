// ============================================================================
// Service: UsuarioHistorial y Asignaciones
// ============================================================================
// Propósito: Lógica de negocio para historial y asignación de activos a usuarios
// ============================================================================

import * as historialRepo from '../repositories/usuario-historial.repository';
import * as usuarioRepo from '../repositories/usuario-empresa.repository';
import * as inventarioRepo from '../repositories/inventario.repository';
import { pool } from '../../../config/db';
import { 
  RegistroHistorialParams,
  HistorialListResponse 
} from '../models/usuario-historial.model';

/**
 * Asignar un activo a un usuario (M:N)
 */
export const asignarActivoAUsuario = async (
  empresaId: number,
  usuarioId: number,
  activoId: number,
  params: {
    fechaAsignacion?: string;
    observacion?: string;
    motivo: string;
    realizadoPor?: number;
    nombreQuienRealizo?: string;
    ipOrigen?: string;
  }
): Promise<any> => {
  const { motivo, fechaAsignacion, observacion, realizadoPor, nombreQuienRealizo, ipOrigen } = params;

  // Validar motivo
  if (!motivo || motivo.trim().length < 10) {
    throw new Error('El motivo debe tener al menos 10 caracteres');
  }

  // Validar que usuario existe y pertenece a la empresa
  const usuario = await usuarioRepo.getById(usuarioId.toString());
  if (!usuario) {
    throw new Error(`Usuario ${usuarioId} no encontrado`);
  }
  if (parseInt(usuario.empresaId as string) !== empresaId) {
    throw new Error('El usuario no pertenece a esta empresa');
  }

  // Validar que activo existe
  const activo = await inventarioRepo.getInventarioById(activoId);
  if (!activo) {
    throw new Error(`Activo ${activoId} no encontrado`);
  }

  // Validar que activo pertenece a la empresa
  if (activo.empresaId !== empresaId) {
    throw new Error('El activo no pertenece a esta empresa');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar si ya está asignado
    const checkQuery = `
      SELECT * FROM usuarios_activos 
      WHERE usuario_id = $1 AND activo_id = $2 AND activo = true
    `;
    const checkResult = await client.query(checkQuery, [usuarioId, activoId]);

    if (checkResult.rows.length > 0) {
      await client.query('ROLLBACK');
      throw new Error('Este activo ya está asignado a este usuario');
    }

    // Insertar en usuarios_activos (tabla M:N de Migration 066)
    const insertQuery = `
      INSERT INTO usuarios_activos (
        usuario_id, activo_id, fecha_asignacion, motivo, activo, asignado_por
      )
      VALUES ($1, $2, $3, $4, true, $5)
      RETURNING id
    `;

    const fecha = fechaAsignacion || new Date().toISOString().split('T')[0];
    await client.query(insertQuery, [usuarioId, activoId, fecha, observacion || motivo, realizadoPor]);

    // Registrar en historial
    const historialParams: RegistroHistorialParams = {
      empresaId,
      usuarioId,
      accion: 'ASIGNACION_ACTIVO',
      motivo,
      campoModificado: 'activo_asignado',
      valorAnterior: null,
      valorNuevo: {
        activoId: activo.id,
        assetId: activo.assetId,
        nombre: activo.modelo || activo.categoria,
        codigo: activo.assetId
      },
      observacionAdicional: observacion,
      realizadoPor,
      nombreQuienRealizo,
      ipOrigen
    };

    await historialRepo.registrarCambio(historialParams);

    await client.query('COMMIT');
    console.log(`✅ Activo ${activoId} asignado a usuario ${usuarioId}`);

    // Retornar usuario actualizado con activos
    const usuarioActualizado = await usuarioRepo.getById(usuarioId.toString());
    return usuarioActualizado;

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error asignando activo:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cambiar activo asignado a un usuario
 */
export const cambiarActivoDeUsuario = async (
  empresaId: number,
  usuarioId: number,
  params: {
    activoAnteriorId: number;
    activoNuevoId: number;
    fechaAsignacion?: string;
    motivoCambio: string;
    realizadoPor?: number;
    nombreQuienRealizo?: string;
    ipOrigen?: string;
  }
): Promise<any> => {
  const { activoAnteriorId, activoNuevoId, motivoCambio, fechaAsignacion, realizadoPor, nombreQuienRealizo, ipOrigen } = params;

  // Validar motivo
  if (!motivoCambio || motivoCambio.trim().length < 10) {
    throw new Error('El motivo del cambio debe tener al menos 10 caracteres');
  }

  // Validar que usuario existe
  const usuario = await usuarioRepo.getById(usuarioId.toString());
  if (!usuario) {
    throw new Error(`Usuario ${usuarioId} no encontrado`);
  }
  if (parseInt(usuario.empresaId as string) !== empresaId) {
    throw new Error('El usuario no pertenece a esta empresa');
  }

  // Validar activos
  const activoAnterior = await inventarioRepo.getInventarioById(activoAnteriorId);
  if (!activoAnterior) {
    throw new Error(`Activo anterior ${activoAnteriorId} no encontrado`);
  }

  const activoNuevo = await inventarioRepo.getInventarioById(activoNuevoId);
  if (!activoNuevo) {
    throw new Error(`Activo nuevo ${activoNuevoId} no encontrado`);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que el activo anterior realmente está asignado al usuario
    const checkQuery = `
      SELECT * FROM usuarios_activos 
      WHERE usuario_id = $1 AND activo_id = $2 AND activo = true
    `;
    const checkResult = await client.query(checkQuery, [usuarioId, activoAnteriorId]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('El activo anterior no está asignado a este usuario');
    }

    // Desactivar/eliminar asignación anterior
    const deleteQuery = `
      DELETE FROM usuarios_activos 
      WHERE usuario_id = $1 AND activo_id = $2 AND activo = true
    `;
    await client.query(deleteQuery, [usuarioId, activoAnteriorId]);

    // Insertar nueva asignación
    const insertQuery = `
      INSERT INTO usuarios_activos (
        usuario_id, activo_id, fecha_asignacion, motivo, activo, asignado_por
      )
      VALUES ($1, $2, $3, $4, true, $5)
    `;

    const fecha = fechaAsignacion || new Date().toISOString().split('T')[0];
    await client.query(insertQuery, [usuarioId, activoNuevoId, fecha, motivoCambio, realizadoPor]);

    // Registrar en historial
    const historialParams: RegistroHistorialParams = {
      empresaId,
      usuarioId,
      accion: 'CAMBIO_ACTIVO',
      motivo: motivoCambio,
      campoModificado: 'activo_asignado',
      valorAnterior: {
        activoId: activoAnterior.id,
        assetId: activoAnterior.assetId,
        nombre: activoAnterior.modelo || activoAnterior.categoria,
        codigo: activoAnterior.assetId
      },
      valorNuevo: {
        activoId: activoNuevo.id,
        assetId: activoNuevo.assetId,
        nombre: activoNuevo.modelo || activoNuevo.categoria,
        codigo: activoNuevo.assetId
      },
      realizadoPor,
      nombreQuienRealizo,
      ipOrigen
    };

    await historialRepo.registrarCambio(historialParams);

    await client.query('COMMIT');
    console.log(`✅ Activo cambiado: ${activoAnteriorId} → ${activoNuevoId} para usuario ${usuarioId}`);

    // Retornar usuario actualizado
    const usuarioActualizado = await usuarioRepo.getById(usuarioId.toString());
    return usuarioActualizado;

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error cambiando activo:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Liberar activo de un usuario
 */
export const liberarActivoDeUsuario = async (
  empresaId: number,
  usuarioId: number,
  activoId: number,
  params: {
    motivo: string;
    realizadoPor?: number;
    nombreQuienRealizo?: string;
    ipOrigen?: string;
  }
): Promise<any> => {
  const { motivo, realizadoPor, nombreQuienRealizo, ipOrigen } = params;

  if (!motivo || motivo.trim().length < 10) {
    throw new Error('El motivo debe tener al menos 10 caracteres');
  }

  const activo = await inventarioRepo.getInventarioById(activoId);
  if (!activo) {
    throw new Error(`Activo ${activoId} no encontrado`);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que está asignado
    const checkQuery = `
      SELECT * FROM usuarios_activos 
      WHERE usuario_id = $1 AND activo_id = $2 AND activo = true
    `;
    const checkResult = await client.query(checkQuery, [usuarioId, activoId]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('Este activo no está asignado a este usuario');
    }

    // Eliminar asignación
    const deleteQuery = `
      DELETE FROM usuarios_activos 
      WHERE usuario_id = $1 AND activo_id = $2 AND activo = true
    `;
    await client.query(deleteQuery, [usuarioId, activoId]);

    // Registrar en historial
    const historialParams: RegistroHistorialParams = {
      empresaId,
      usuarioId,
      accion: 'LIBERACION_ACTIVO',
      motivo,
      campoModificado: 'activo_asignado',
      valorAnterior: {
        activoId: activo.id,
        assetId: activo.assetId,
        nombre: activo.modelo || activo.categoria
      },
      valorNuevo: null,
      realizadoPor,
      nombreQuienRealizo,
      ipOrigen
    };

    await historialRepo.registrarCambio(historialParams);

    await client.query('COMMIT');
    console.log(`✅ Activo ${activoId} liberado de usuario ${usuarioId}`);

    const usuarioActualizado = await usuarioRepo.getById(usuarioId.toString());
    return usuarioActualizado;

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error liberando activo:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtener historial de un usuario con paginación
 */
export const obtenerHistorial = async (
  usuarioId: number,
  empresaId: number,
  options: {
    page?: number;
    pageSize?: number;
    accion?: string;
  } = {}
): Promise<HistorialListResponse> => {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;

  const { data, total } = await historialRepo.obtenerHistorial(usuarioId, empresaId, {
    page,
    pageSize,
    accion: options.accion
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
};

/**
 * Actualizar usuario con registro de cambios
 */
export const actualizarUsuarioConHistorial = async (
  usuarioId: number,
  empresaId: number,
  datosNuevos: any,
  params: {
    motivo: string;
    realizadoPor?: number;
    nombreQuienRealizo?: string;
    ipOrigen?: string;
  }
): Promise<any> => {
  const { motivo, realizadoPor, nombreQuienRealizo, ipOrigen } = params;

  // Validar motivo
  if (!motivo || motivo.trim().length < 10) {
    throw new Error('El motivo debe tener al menos 10 caracteres');
  }

  // Obtener datos actuales
  const usuarioActual = await usuarioRepo.getById(usuarioId.toString());
  if (!usuarioActual) {
    throw new Error(`Usuario ${usuarioId} no encontrado`);
  }

  if (parseInt(usuarioActual.empresaId as string) !== empresaId) {
    throw new Error('El usuario no pertenece a esta empresa');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Comparar campos y generar registros de historial
    const cambios: RegistroHistorialParams[] = [];
    const camposComparables = ['nombreCompleto', 'correo', 'cargo', 'telefono', 'observaciones'];

    for (const campo of camposComparables) {
      const valorActual = (usuarioActual as any)[campo];
      const valorNuevo = datosNuevos[campo];

      if (valorNuevo !== undefined && valorNuevo !== valorActual) {
        cambios.push({
          empresaId,
          usuarioId,
          accion: 'EDICION',
          motivo,
          campoModificado: campo,
          valorAnterior: valorActual,
          valorNuevo,
          realizadoPor,
          nombreQuienRealizo,
          ipOrigen
        });
      }
    }

    // Si hay cambios, actualizar usuario y registrar historial
    if (cambios.length > 0) {
      // Actualizar usuario
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      for (const campo of camposComparables) {
        if (datosNuevos[campo] !== undefined) {
          updateFields.push(`${campo.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramIndex}`);
          updateValues.push(datosNuevos[campo]);
          paramIndex++;
        }
      }

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE usuarios_empresas 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `;
        updateValues.push(usuarioId);
        await client.query(updateQuery, updateValues);
      }

      // Registrar cambios en historial
      await historialRepo.registrarCambiosMultiples(cambios);

      console.log(`✅ Usuario ${usuarioId} actualizado con ${cambios.length} cambios registrados`);
    } else {
      console.log(`ℹ️ Usuario ${usuarioId}: sin cambios detectados`);
    }

    await client.query('COMMIT');

    // Retornar usuario actualizado
    const usuarioActualizado = await usuarioRepo.getById(usuarioId.toString());
    return usuarioActualizado;

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error actualizando usuario:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Desactivar un usuario (soft delete)
 */
export const desactivarUsuario = async (
  empresaId: number,
  usuarioId: number,
  params: {
    motivo: string;
    observacionAdicional?: string;
    realizadoPor?: number;
    nombreQuienRealizo?: string;
    ipOrigen?: string;
  }
): Promise<any> => {
  const { motivo, observacionAdicional, realizadoPor, nombreQuienRealizo, ipOrigen } = params;

  // Validar motivo
  if (!motivo || motivo.trim().length < 10) {
    throw new Error('El motivo debe tener al menos 10 caracteres');
  }

  // Validar que usuario existe y pertenece a la empresa
  const usuario = await usuarioRepo.getById(usuarioId.toString());
  if (!usuario) {
    throw new Error(`Usuario ${usuarioId} no encontrado`);
  }
  if (parseInt(usuario.empresaId as string) !== empresaId) {
    throw new Error('El usuario no pertenece a esta empresa');
  }

  // Validar que no esté ya desactivado
  if (usuario.activo === false) {
    throw new Error('El usuario ya está desactivado');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const fechaDesactivacion = new Date();

    // Actualizar usuario: activo = false, motivo y fecha de desactivación
    const updateQuery = `
      UPDATE usuarios_empresas 
      SET 
        activo = false,
        motivo_desactivacion = $1,
        fecha_desactivacion = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [motivo, fechaDesactivacion, usuarioId]);
    const usuarioDesactivado = updateResult.rows[0];

    // Registrar en historial
    const historialParams: RegistroHistorialParams = {
      empresaId,
      usuarioId,
      accion: 'DESACTIVACION',
      motivo,
      campoModificado: 'activo',
      valorAnterior: true,
      valorNuevo: false,
      observacionAdicional,
      realizadoPor,
      nombreQuienRealizo,
      ipOrigen
    };

    await historialRepo.registrarCambio(historialParams);

    await client.query('COMMIT');
    console.log(`✅ Usuario ${usuarioId} desactivado correctamente`);

    // Formatear respuesta
    return {
      id: usuarioDesactivado.id,
      nombreCompleto: usuarioDesactivado.nombre_completo,
      correo: usuarioDesactivado.correo,
      cargo: usuarioDesactivado.cargo,
      telefono: usuarioDesactivado.telefono,
      activo: usuarioDesactivado.activo,
      motivoDesactivacion: usuarioDesactivado.motivo_desactivacion,
      fechaDesactivacion: usuarioDesactivado.fecha_desactivacion,
      empresaId: usuarioDesactivado.empresa_id,
      sedeId: usuarioDesactivado.sede_id
    };

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error desactivando usuario:', error);
    throw error;
  } finally {
    client.release();
  }
};
