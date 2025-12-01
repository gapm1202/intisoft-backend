import * as repo from '../repositories/activos.repository';
import * as trasladosRepo from '../repositories/traslados.repository';
import { pool } from '../../../config/db';
import { CreateTrasladoDto, Foto } from '../models/traslado.model';

export const getHistorialByActivo = async (activoId: number) => {
  return repo.getHistorialByActivoId(activoId);
};

interface TrasladarActivoDto {
  activoId: number;
  empresaId: string;
  sedeOrigenId: string;
  sedeDestino: string;
  areaDestino?: string;
  fechaTraslado: string;
  responsableEnvia: string;
  responsableRecibe: string;
  motivo: string;
  estadoEquipo: string;
  especificarFalla?: string;
  observaciones?: string;
  fotos?: Foto[];
  usuarioId?: number;
  nuevoCodigoAsignado?: string;
}

export const trasladarActivo = async (dto: TrasladarActivoDto) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Iniciando traslado - activoId:', dto.activoId);
    
    // 1. Obtener datos actuales del activo (sede_id y area_id actuales)
    const activoQuery = `
      SELECT id, sede_id, area, asset_id 
      FROM inventario 
      WHERE id = $1
    `;
    const activoResult = await client.query(activoQuery, [dto.activoId]);
    
    if (activoResult.rows.length === 0) {
      throw new Error('Activo no encontrado');
    }
    
    const activo = activoResult.rows[0];
    const sedeAnterior = activo.sede_id;
    const areaAnterior = activo.area;
    const assetIdAnterior = activo.asset_id;
    
    console.log('📍 Activo encontrado:', assetIdAnterior);
    console.log('📍 Sede anterior:', sedeAnterior, '→ Sede nueva:', dto.sedeDestino);
    console.log('📍 Área anterior:', areaAnterior, '→ Área nueva (ID):', dto.areaDestino);
    
    // 2. Determinar si cambiar código o mantenerlo
    let assetIdFinal: string;
    let cambiarCodigo = false;
    
    if (dto.nuevoCodigoAsignado) {
      // Frontend envió nuevo código (raw) -> NORMALIZAR / VALIDAR
      console.log('🔄 Frontend envió nuevo código (raw):', dto.nuevoCodigoAsignado);
      // Normalize: uppercase and trim
      const raw = String(dto.nuevoCodigoAsignado).trim().toUpperCase();
      const m = raw.match(/^([A-Z]+)-(\d{1,})$/);
      if (!m) {
        throw new Error(`Formato inválido para nuevoCodigoAsignado: ${dto.nuevoCodigoAsignado}. Debe ser PREFIJO-NUMERO`);
      }
      const pref = m[1];
      const numPart = m[2];
      // Pad to 4 digits
      const padded = String(parseInt(numPart, 10)).padStart(4, '0');
      const normalized = `${pref}-${padded}`;
      // Verificar que el nuevo código no exista ya (UNIQUE global)
      const duplicadoQuery = `SELECT id FROM inventario WHERE asset_id = $1 AND id != $2`;
      const duplicadoResult = await client.query(duplicadoQuery, [normalized, dto.activoId]);
      if (duplicadoResult.rows.length > 0) {
        throw new Error(`El código ${normalized} ya existe`);
      }
      assetIdFinal = normalized;
      cambiarCodigo = true;
      console.log('✅ Código nuevo normalizado y validado:', assetIdFinal);
    } else {
      // Sin conflicto, mantener código actual
      console.log('✅ Manteniendo código original (sin conflicto):', assetIdAnterior);
      assetIdFinal = assetIdAnterior;
      cambiarCodigo = false;
    }
    
    // 3. Obtener nombre del área destino si se proporcionó areaDestino
    let areaNombreDestino: string | null = null;
    if (dto.areaDestino) {
      const areaResult = await client.query('SELECT nombre FROM areas WHERE id = $1', [parseInt(dto.areaDestino)]);
      areaNombreDestino = areaResult.rows[0]?.nombre || null;
      console.log('📍 Área destino (nombre):', areaNombreDestino);
    }
    
    // 4. Actualizar activo: sede_id, area y opcionalmente asset_id
    let updateActivoQuery: string;
    let updateParams: any[];
    
    if (cambiarCodigo) {
      // Frontend detectó conflicto, actualizar código también
      updateActivoQuery = `
        UPDATE inventario 
        SET 
          asset_id = $1,
          sede_id = $2,
          area = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;
      updateParams = [
        assetIdFinal,
        parseInt(dto.sedeDestino),
        areaNombreDestino,
        dto.activoId
      ];
      console.log('🔄 UPDATE con cambio de código:', assetIdFinal);
    } else {
      // Sin conflicto, mantener código original
      updateActivoQuery = `
        UPDATE inventario 
        SET 
          sede_id = $1,
          area = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      updateParams = [
        parseInt(dto.sedeDestino),
        areaNombreDestino,
        dto.activoId
      ];
      console.log('✅ UPDATE sin cambio de código (mantiene:', assetIdAnterior, ')');
    }
    
    const updateResult = await client.query(updateActivoQuery, updateParams);
    
    if (updateResult.rowCount === 0) {
      throw new Error('❌ UPDATE falló - No se encontró el activo o no se pudo actualizar');
    }
    
    console.log('✅ Activo actualizado correctamente - Nueva ubicación:');
    console.log('   - asset_id:', updateResult.rows[0].asset_id, '(cambió:', cambiarCodigo, ')');
    console.log('   - sede_id:', updateResult.rows[0].sede_id, '(anterior:', sedeAnterior, ')');
    console.log('   - area:', updateResult.rows[0].area, '(anterior:', areaAnterior, ')');
    console.log('   - sede_original_id:', updateResult.rows[0].sede_original_id, '(NO debe cambiar)');
    
    // 5. Obtener nombres de sedes para el historial
    const sedeOrigenNombre = sedeAnterior ? (await client.query('SELECT nombre FROM sedes WHERE id = $1', [sedeAnterior])).rows[0]?.nombre || `Sede ${sedeAnterior}` : 'Sin sede';
    const sedeDestinoNombre = (await client.query('SELECT nombre FROM sedes WHERE id = $1', [parseInt(dto.sedeDestino)])).rows[0]?.nombre || `Sede ${dto.sedeDestino}`;
    
    // 6. Registrar en historial_activos - UN SOLO registro de traslado con JSON
    const motivoCompleto = `TRASLADO: ${dto.motivo}. Responsable envía: ${dto.responsableEnvia}. Responsable recibe: ${dto.responsableRecibe}. Estado equipo: ${dto.estadoEquipo}${dto.especificarFalla ? '. Falla: ' + dto.especificarFalla : ''}${dto.observaciones ? '. Obs: ' + dto.observaciones : ''}`;
    
    const trasladoInfo = {
      sede_origen: sedeOrigenNombre,
      sede_destino: sedeDestinoNombre,
      area_origen: areaAnterior || 'Sin área',
      area_destino: areaNombreDestino || 'Sin área',
    };
    
    const historialTrasladoQuery = `
      INSERT INTO historial_activos (
        activo_id,
        asset_id,
        campo_modificado,
        valor_anterior,
        valor_nuevo,
        motivo,
        usuario_id,
        fecha_modificacion
      ) VALUES ($1, $2, 'traslado', $3, $4, $5, $6, NOW())
    `;
    
    await client.query(historialTrasladoQuery, [
      dto.activoId,
      assetIdFinal,
      JSON.stringify({ sede_origen: sedeOrigenNombre, area_origen: areaAnterior || 'Sin área' }),
      JSON.stringify(trasladoInfo),
      motivoCompleto,
      dto.usuarioId || null
    ]);
    
    console.log('✅ Historial de traslado registrado:', trasladoInfo);
    
    // 7. Si hubo cambio de código, registrar en historial adicional
    if (dto.nuevoCodigoAsignado && assetIdAnterior !== assetIdFinal) {
      const historialCodigoQuery = `
        INSERT INTO historial_activos (
          activo_id,
          asset_id,
          campo_modificado,
          valor_anterior,
          valor_nuevo,
          motivo,
          usuario_id,
          fecha_modificacion
        ) VALUES ($1, $2, 'asset_id', $3, $4, $5, $6, NOW())
      `;
      
      await client.query(historialCodigoQuery, [
        dto.activoId,
        assetIdFinal,
        assetIdAnterior,
        assetIdFinal,
        'Cambio automático por traslado (código duplicado en sede destino)',
        dto.usuarioId || null
      ]);
      
      console.log('✅ Historial de cambio de código registrado:', assetIdAnterior, '→', assetIdFinal);
    }
    
    // 8. Crear registro en tabla traslados
    const trasladoDto: CreateTrasladoDto = {
      activoId: dto.activoId,
      empresaId: dto.empresaId,
      sedeOrigenId: dto.sedeOrigenId,
      sedeDestino: dto.sedeDestino,
      areaDestino: dto.areaDestino,
      fechaTraslado: dto.fechaTraslado,
      responsableEnvia: dto.responsableEnvia,
      responsableRecibe: dto.responsableRecibe,
      motivo: dto.motivo,
      estadoEquipo: dto.estadoEquipo,
      especificarFalla: dto.especificarFalla,
      observaciones: dto.observaciones,
      fotos: dto.fotos || []
    };
    
    // Usar el cliente de transacción para crear el traslado
    const createTrasladoQuery = `
      INSERT INTO traslados (
        activo_id,
        empresa_id,
        sede_origen_id,
        sede_destino_id,
        area_destino,
        fecha_traslado,
        responsable_envia,
        responsable_recibe,
        motivo,
        estado_equipo,
        especificar_falla,
        observaciones,
        fotos
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const trasladoResult = await client.query(createTrasladoQuery, [
      trasladoDto.activoId,
      parseInt(trasladoDto.empresaId),
      parseInt(trasladoDto.sedeOrigenId),
      parseInt(trasladoDto.sedeDestino),
      trasladoDto.areaDestino || null,
      trasladoDto.fechaTraslado,
      trasladoDto.responsableEnvia,
      trasladoDto.responsableRecibe,
      trasladoDto.motivo,
      trasladoDto.estadoEquipo,
      trasladoDto.especificarFalla || null,
      trasladoDto.observaciones || null,
      JSON.stringify(trasladoDto.fotos || [])
    ]);
    
    await client.query('COMMIT');
    
    console.log('✅ Traslado completado exitosamente - Transaction COMMITTED');
    
    // Verificar que el activo fue actualizado correctamente
    const verificacion = await pool.query('SELECT id, asset_id, sede_id, sede_original_id, area FROM inventario WHERE id = $1', [dto.activoId]);
    console.log('🔍 VERIFICACIÓN POST-TRASLADO (después de COMMIT):');
    console.log('   - ID:', verificacion.rows[0]?.id);
    console.log('   - asset_id:', verificacion.rows[0]?.asset_id);
    console.log('   - sede_id:', verificacion.rows[0]?.sede_id, '(debe ser:', dto.sedeDestino, ')');
    console.log('   - sede_original_id:', verificacion.rows[0]?.sede_original_id, '(debe ser:', sedeAnterior, ')');
    console.log('   - area:', verificacion.rows[0]?.area);
    
    if (verificacion.rows[0]?.sede_id !== parseInt(dto.sedeDestino)) {
      console.error('⚠️ WARNING: sede_id NO se actualizó correctamente!');
      console.error('   Esperado:', parseInt(dto.sedeDestino));
      console.error('   Actual:', verificacion.rows[0]?.sede_id);
    }
    
    return {
      success: true,
      message: 'Traslado realizado exitosamente',
      traslado: trasladoResult.rows[0]
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en traslado - ROLLBACK ejecutado:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getTrasladosByActivo = async (activoId: number) => {
  return trasladosRepo.getTrasladosByActivo(activoId);
};
