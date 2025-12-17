import { pool } from "../../../config/db";
import {
  ContractBase,
  ContractDocument,
  ContractEconomics,
  ContractHistoryEntry,
  ContractPreventivePolicy,
  ContractServices,
  ContractCreateInput,
  ContractWithDetails,
  ContractEstado,
} from "../models/contract.model";

export const listByEmpresa = async (empresaId: number): Promise<ContractBase[]> => {
  const res = await pool.query(
    `SELECT id, empresa_id AS "empresaId", tipo_contrato AS "tipoContrato", estado_contrato AS "estadoContrato",
            fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin", renovacion_automatica AS "renovacionAutomatica",
            responsable_comercial AS "responsableComercial", observaciones,
            created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
     FROM contracts
     WHERE empresa_id = $1
     ORDER BY id DESC`,
    [empresaId]
  );
  return res.rows;
};

export const getActiveByEmpresa = async (empresaId: number): Promise<number | null> => {
  const res = await pool.query(
    `SELECT id FROM contracts WHERE empresa_id = $1 AND estado_contrato = 'activo' LIMIT 1`,
    [empresaId]
  );
  return res.rows[0]?.id || null;
};

export const getByIdWithDetails = async (id: number): Promise<ContractWithDetails | null> => {
  const client = await pool.connect();
  try {
    const contractRes = await client.query(
      `SELECT id, empresa_id AS "empresaId", tipo_contrato AS "tipoContrato", estado_contrato AS "estadoContrato",
              fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin", renovacion_automatica AS "renovacionAutomatica",
              responsable_comercial AS "responsableComercial", observaciones,
              created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
       FROM contracts WHERE id = $1`,
      [id]
    );
    if (!contractRes.rows[0]) return null;

    const servicesRes = await client.query(
      `SELECT soporte_remoto AS "soporteRemoto", soporte_presencial AS "soportePresencial", mantenimiento_preventivo AS "mantenimientoPreventivo",
              gestion_inventario AS "gestionInventario", gestion_credenciales AS "gestionCredenciales", monitoreo,
              informes_mensuales AS "informesMensuales", gestion_accesos AS "gestionAccesos",
              horas_mensuales_incluidas AS "horasMensualesIncluidas", exceso_horas_facturable AS "excesoHorasFacturable",
              created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
       FROM contract_services WHERE contract_id = $1`,
      [id]
    );

    const preventiveRes = await client.query(
      `SELECT incluye_preventivo AS "incluyePreventivo", frecuencia, modalidad, aplica, observaciones,
              created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
       FROM contract_preventive_policy WHERE contract_id = $1`,
      [id]
    );

    const economicsRes = await client.query(
      `SELECT tipo_facturacion AS "tipoFacturacion", monto_referencial AS "montoReferencial", moneda,
              dia_facturacion AS "diaFacturacion", observaciones,
              created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy"
       FROM contract_economics WHERE contract_id = $1`,
      [id]
    );

    const docsRes = await client.query(
      `SELECT id, contract_id AS "contractId", filename, path, mime_type AS "mimeType", size_bytes AS "sizeBytes",
              tipo, uploaded_at AS "uploadedAt", uploaded_by AS "uploadedBy", version
       FROM contract_documents WHERE contract_id = $1 ORDER BY uploaded_at DESC, id DESC`,
      [id]
    );

    const historyRes = await client.query(
      `SELECT id, contract_id AS "contractId", campo, valor_anterior AS "valorAnterior", valor_nuevo AS "valorNuevo",
              fecha, usuario, motivo, tipo_cambio AS "tipoCambio"
       FROM contract_history WHERE contract_id = $1 ORDER BY fecha DESC, id DESC`,
      [id]
    );

    // Mapear documentos al formato que espera el frontend
    const documentsFormatted = docsRes.rows.map((doc: any) => ({
      id: doc.id,
      nombre: doc.filename,
      url: `${process.env.SERVER_URL || 'http://localhost:4000'}/uploads/${doc.path}`,
      fechaSubida: doc.uploadedAt,
      usuarioSubida: doc.uploadedBy,
      tipo: doc.tipo,
      path: doc.path,
      mimeType: doc.mimeType,
      sizeBytes: doc.sizeBytes,
      version: doc.version,
    }));

    const contract: ContractWithDetails = {
      ...contractRes.rows[0],
      services: servicesRes.rows[0] || null,
      preventivePolicy: preventiveRes.rows[0] || null,
      economics: economicsRes.rows[0] || null,
      documents: documentsFormatted,
      history: historyRes.rows || [],
    };

    return contract;
  } finally {
    client.release();
  }
};

export const createContract = async (input: ContractCreateInput): Promise<ContractWithDetails> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      empresaId,
      tipoContrato,
      estadoContrato,
      fechaInicio,
      fechaFin,
      renovacionAutomatica,
      responsableComercial,
      observaciones,
      services,
      preventivePolicy,
      economics,
      documents,
      usuario,
      createdBy,
    } = input as any;

    const contractRes = await client.query(
      `INSERT INTO contracts (empresa_id, tipo_contrato, estado_contrato, fecha_inicio, fecha_fin, renovacion_automatica, responsable_comercial, observaciones, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
       RETURNING id, empresa_id AS "empresaId", tipo_contrato AS "tipoContrato", estado_contrato AS "estadoContrato",
                 fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin", renovacion_automatica AS "renovacionAutomatica",
                 responsable_comercial AS "responsableComercial", observaciones, created_at AS "createdAt", updated_at AS "updatedAt",
                 created_by AS "createdBy", updated_by AS "updatedBy"`,
      [
        empresaId,
        tipoContrato,
        estadoContrato,
        fechaInicio,
        fechaFin,
        renovacionAutomatica ?? false,
        responsableComercial || null,
        observaciones || null,
        createdBy || usuario || null,
      ]
    );

    const contractId = contractRes.rows[0].id as number;

    if (services) {
      await client.query(
        `INSERT INTO contract_services (contract_id, soporte_remoto, soporte_presencial, mantenimiento_preventivo, gestion_inventario, gestion_credenciales, monitoreo, informes_mensuales, gestion_accesos, horas_mensuales_incluidas, exceso_horas_facturable, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)` ,
        [
          contractId,
          services.soporteRemoto ?? false,
          services.soportePresencial ?? false,
          services.mantenimientoPreventivo ?? false,
          services.gestionInventario ?? false,
          services.gestionCredenciales ?? false,
          services.monitoreo ?? false,
          services.informesMensuales ?? false,
          services.gestionAccesos ?? false,
          services.horasMensualesIncluidas ?? null,
          services.excesoHorasFacturable ?? false,
          usuario || null,
        ]
      );
    }

    if (preventivePolicy) {
      await client.query(
        `INSERT INTO contract_preventive_policy (contract_id, incluye_preventivo, frecuencia, modalidad, aplica, observaciones, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)` ,
        [
          contractId,
          preventivePolicy.incluyePreventivo ?? false,
          preventivePolicy.frecuencia ?? null,
          preventivePolicy.modalidad ?? null,
          preventivePolicy.aplica ?? null,
          preventivePolicy.observaciones || null,
          usuario || null,
        ]
      );
    }

    if (economics) {
      await client.query(
        `INSERT INTO contract_economics (contract_id, tipo_facturacion, monto_referencial, moneda, dia_facturacion, observaciones, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)` ,
        [
          contractId,
          economics.tipoFacturacion,
          economics.montoReferencial ?? null,
          economics.moneda,
          economics.diaFacturacion ?? null,
          economics.observaciones || null,
          usuario || null,
        ]
      );
    }

    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        await client.query(
          `INSERT INTO contract_documents (contract_id, filename, path, mime_type, size_bytes, tipo, uploaded_by, version)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)` ,
          [
            contractId,
            doc.filename,
            doc.path,
            doc.mimeType || null,
            doc.sizeBytes ?? null,
            doc.tipo,
            usuario || null,
            doc.version || null,
          ]
        );
      }
    }

    // Agregar entrada de historial automáticamente
    const historyMessage = estadoContrato === 'activo' 
      ? 'Contrato registrado como activo' 
      : 'Contrato creado';
    
    await client.query(
      `INSERT INTO contract_history (contract_id, campo, valor_anterior, valor_nuevo, usuario, motivo, tipo_accion, tipo_cambio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)` ,
      [
        contractId,
        'Creación del Contrato',
        null,
        historyMessage,
        usuario || null,
        'Creación inicial del contrato',
        'CREACION',
        'general',
      ]
    );

    await client.query("COMMIT");

    return await getByIdWithDetails(contractId) as ContractWithDetails;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateEstado = async (
  contractId: number,
  nuevoEstado: ContractEstado,
  motivo: string,
  usuario?: string | null
): Promise<ContractBase | null> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existingRes = await client.query(
      `SELECT id, estado_contrato AS "estadoContrato" FROM contracts WHERE id = $1 FOR UPDATE`,
      [contractId]
    );
    if (!existingRes.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const prevEstado: ContractEstado = existingRes.rows[0].estadoContrato;
    await client.query(
      `UPDATE contracts SET estado_contrato = $1, updated_by = $2 WHERE id = $3`,
      [nuevoEstado, usuario || null, contractId]
    );

    await client.query(
      `INSERT INTO contract_history (contract_id, campo, valor_anterior, valor_nuevo, usuario, motivo, tipo_cambio)
       VALUES ($1,$2,$3,$4,$5,$6,$7)` ,
      [contractId, 'estado_contrato', prevEstado, nuevoEstado, usuario || null, motivo, 'estado']
    );

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT id, empresa_id AS "empresaId", tipo_contrato AS "tipoContrato", estado_contrato AS "estadoContrato",
              fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin", renovacion_automatica AS "renovacionAutomatica",
              responsable_comercial AS "responsableComercial", observaciones, created_at AS "createdAt", updated_at AS "updatedAt",
              created_by AS "createdBy", updated_by AS "updatedBy"
       FROM contracts WHERE id = $1`,
      [contractId]
    );
    return updated.rows[0] || null;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const addHistory = async (entry: ContractHistoryEntry): Promise<void> => {
  await pool.query(
    `INSERT INTO contract_history (contract_id, campo, valor_anterior, valor_nuevo, usuario, motivo, tipo_accion, tipo_cambio)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)` ,
    [
      entry.contractId,
      entry.campo,
      entry.valorAnterior ?? null,
      entry.valorNuevo ?? null,
      entry.usuario || null,
      entry.motivo,
      entry.tipoAccion ?? null,
      entry.tipoCambio,
    ]
  );
};

export const getContractHistory = async (contractId: number): Promise<ContractHistoryEntry[]> => {
  const res = await pool.query(
    `SELECT id, contract_id AS "contractIaccion AS "tipoAccion", tipo_d", campo, valor_anterior AS "valorAnterior", valor_nuevo AS "valorNuevo",
            fecha, usuario, motivo, tipo_cambio AS "tipoCambio"
     FROM contract_history WHERE contract_id = $1 ORDER BY fecha DESC, id DESC`,
    [contractId]
  );
  return res.rows || [];
};

// ---- Aux: expiración automática ----
export const expireIfNeeded = async (
  contract: ContractBase,
  usuario: string | null = 'system'
): Promise<ContractBase> => {
  try {
    const today = new Date();
    const fin = new Date(contract.fechaFin);
    if (contract.estadoContrato === 'activo' && !isNaN(fin.getTime()) && fin < today) {
      await pool.query('BEGIN');
      await pool.query(
        `UPDATE contracts SET estado_contrato = 'vencido', updated_by = $1 WHERE id = $2`,
        [usuario, contract.id]
      );
      await pool.query(
        `INSERT INTO contract_history (contract_id, campo, valor_anterior, valor_nuevo, usuario, motivo, tipo_cambio)
         VALUES ($1,$2,$3,$4,$5,$6,$7)` ,
        [contract.id, 'estado_contrato', contract.estadoContrato, 'vencido', usuario, 'Expiración automática', 'estado']
      );
      await pool.query('COMMIT');
      return { ...contract, estadoContrato: 'vencido' } as ContractBase;
    }
    return contract;
  } catch (err) {
    try { await pool.query('ROLLBACK'); } catch (_) { /* ignore */ }
    throw err;
  }
};

// ---- Update helpers with diff + history ----

const normalizeValue = (value: any): string => {
  if (value === null || value === undefined) return 'null';
  
  // Detectar si es una fecha (ISO string, JavaScript Date, o timestamp)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{4}-\d{2}-\d{2}T|^\w+\s+\w+\s+\d+\s+\d{4}|^\d{10,13}$/;
  const valueStr = String(value).trim();
  
  if (dateRegex.test(valueStr)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Retornar en formato ISO YYYY-MM-DD
        return date.toISOString().slice(0, 10);
      }
    } catch (_) {
      // Si no es fecha válida, seguir como string
    }
  }
  
  // Para otros valores, retornar como string
  return valueStr;
};

const diffAndHistory = async (
  client: any,
  contractId: number,
  changes: Record<string, { old: any; new: any }>,
  motivo: string,
  usuario: string | null,
  tipoCambio: ContractHistoryEntry['tipoCambio']
) => {
  // No guardar historial si el motivo indica configuración inicial
  if (motivo.includes('Configuración inicial')) {
    return;
  }
  
  // Normalizar valores antes de comparar
  const entries = Object.entries(changes).filter(([, v]) => {
    const oldNorm = normalizeValue(v.old);
    const newNorm = normalizeValue(v.new);
    return oldNorm !== newNorm;
  });
  
  for (const [campo, v] of entries) {
    await client.query(
      `INSERT INTO contract_history (contract_id, campo, valor_anterior, valor_nuevo, usuario, motivo, tipo_accion, tipo_cambio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        contractId,
        campo,
        v.old === undefined ? null : String(v.old),
        v.new === undefined ? null : String(v.new),
        usuario,
        motivo,
        'EDICION',
        tipoCambio,
      ]
    );
  }
};

export const updateGeneral = async (
  contractId: number,
  data: Partial<ContractBase>,
  motivo: string,
  usuario?: string | null
): Promise<ContractBase | null> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query(
      `SELECT id, empresa_id AS "empresaId", tipo_contrato AS "tipoContrato", estado_contrato AS "estadoContrato",
              fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin", renovacion_automatica AS "renovacionAutomatica",
              responsable_comercial AS "responsableComercial", observaciones
       FROM contracts WHERE id = $1 FOR UPDATE`,
      [contractId]
    );
    if (!currentRes.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    const current = currentRes.rows[0] as ContractBase;

    const merged = {
      tipoContrato: data.tipoContrato ?? current.tipoContrato,
      estadoContrato: current.estadoContrato,
      fechaInicio: data.fechaInicio ?? current.fechaInicio,
      fechaFin: data.fechaFin ?? current.fechaFin,
      renovacionAutomatica: data.renovacionAutomatica ?? current.renovacionAutomatica ?? false,
      responsableComercial: data.responsableComercial ?? current.responsableComercial ?? null,
      observaciones: data.observaciones ?? current.observaciones ?? null,
    };

    await client.query(
      `UPDATE contracts SET tipo_contrato=$1, fecha_inicio=$2, fecha_fin=$3, renovacion_automatica=$4,
        responsable_comercial=$5, observaciones=$6, updated_by=$7
       WHERE id = $8`,
      [
        merged.tipoContrato,
        merged.fechaInicio,
        merged.fechaFin,
        merged.renovacionAutomatica,
        merged.responsableComercial,
        merged.observaciones,
        usuario || null,
        contractId,
      ]
    );

    const changes: Record<string, { old: any; new: any }> = {
      tipo_contrato: { old: current.tipoContrato, new: merged.tipoContrato },
      fecha_inicio: { old: current.fechaInicio, new: merged.fechaInicio },
      fecha_fin: { old: current.fechaFin, new: merged.fechaFin },
      renovacion_automatica: { old: current.renovacionAutomatica, new: merged.renovacionAutomatica },
      responsable_comercial: { old: current.responsableComercial, new: merged.responsableComercial },
      observaciones: { old: current.observaciones, new: merged.observaciones },
    };

    await diffAndHistory(client, contractId, changes, motivo, usuario || null, 'general');

    await client.query('COMMIT');

    const updatedRes = await pool.query(
      `SELECT id, empresa_id AS "empresaId", tipo_contrato AS "tipoContrato", estado_contrato AS "estadoContrato",
              fecha_inicio AS "fechaInicio", fecha_fin AS "fechaFin", renovacion_automatica AS "renovacionAutomatica",
              responsable_comercial AS "responsableComercial", observaciones, created_at AS "createdAt", updated_at AS "updatedAt",
              created_by AS "createdBy", updated_by AS "updatedBy"
       FROM contracts WHERE id = $1`,
      [contractId]
    );
    return updatedRes.rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateServices = async (
  contractId: number,
  data: ContractServices,
  motivo: string,
  usuario?: string | null
): Promise<ContractServices> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query(
      `SELECT soporte_remoto AS "soporteRemoto", soporte_presencial AS "soportePresencial", mantenimiento_preventivo AS "mantenimientoPreventivo",
              gestion_inventario AS "gestionInventario", gestion_credenciales AS "gestionCredenciales", monitoreo,
              informes_mensuales AS "informesMensuales", gestion_accesos AS "gestionAccesos",
              horas_mensuales_incluidas AS "horasMensualesIncluidas", exceso_horas_facturable AS "excesoHorasFacturable"
       FROM contract_services WHERE contract_id = $1 FOR UPDATE`,
      [contractId]
    );
    const current = currentRes.rows[0] as ContractServices | undefined;

    const merged: ContractServices = {
      soporteRemoto: data.soporteRemoto ?? current?.soporteRemoto ?? false,
      soportePresencial: data.soportePresencial ?? current?.soportePresencial ?? false,
      mantenimientoPreventivo: data.mantenimientoPreventivo ?? current?.mantenimientoPreventivo ?? false,
      gestionInventario: data.gestionInventario ?? current?.gestionInventario ?? false,
      gestionCredenciales: data.gestionCredenciales ?? current?.gestionCredenciales ?? false,
      monitoreo: data.monitoreo ?? current?.monitoreo ?? false,
      informesMensuales: data.informesMensuales ?? current?.informesMensuales ?? false,
      gestionAccesos: data.gestionAccesos ?? current?.gestionAccesos ?? false,
      horasMensualesIncluidas: data.horasMensualesIncluidas ?? current?.horasMensualesIncluidas ?? null,
      excesoHorasFacturable: data.excesoHorasFacturable ?? current?.excesoHorasFacturable ?? false,
    };

    if (current) {
      await client.query(
        `UPDATE contract_services SET soporte_remoto=$1, soporte_presencial=$2, mantenimiento_preventivo=$3, gestion_inventario=$4,
          gestion_credenciales=$5, monitoreo=$6, informes_mensuales=$7, gestion_accesos=$8, horas_mensuales_incluidas=$9, exceso_horas_facturable=$10,
          updated_by=$11 WHERE contract_id=$12`,
        [
          merged.soporteRemoto,
          merged.soportePresencial,
          merged.mantenimientoPreventivo,
          merged.gestionInventario,
          merged.gestionCredenciales,
          merged.monitoreo,
          merged.informesMensuales,
          merged.gestionAccesos,
          merged.horasMensualesIncluidas,
          merged.excesoHorasFacturable,
          usuario || null,
          contractId,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO contract_services (contract_id, soporte_remoto, soporte_presencial, mantenimiento_preventivo, gestion_inventario, gestion_credenciales, monitoreo, informes_mensuales, gestion_accesos, horas_mensuales_incluidas, exceso_horas_facturable, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)` ,
        [
          contractId,
          merged.soporteRemoto,
          merged.soportePresencial,
          merged.mantenimientoPreventivo,
          merged.gestionInventario,
          merged.gestionCredenciales,
          merged.monitoreo,
          merged.informesMensuales,
          merged.gestionAccesos,
          merged.horasMensualesIncluidas,
          merged.excesoHorasFacturable,
          usuario || null,
        ]
      );
    }

    const changes: Record<string, { old: any; new: any }> = {};
    const oldObj = current || {} as any;
    for (const key of Object.keys(merged)) {
      changes[key] = { old: (oldObj as any)[key], new: (merged as any)[key] };
    }
    await diffAndHistory(client, contractId, changes, motivo, usuario || null, 'servicio');

    await client.query('COMMIT');
    return merged;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updatePreventive = async (
  contractId: number,
  data: ContractPreventivePolicy,
  motivo: string,
  usuario?: string | null
): Promise<ContractPreventivePolicy> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query(
      `SELECT incluye_preventivo AS "incluyePreventivo", frecuencia, modalidad, aplica, observaciones
       FROM contract_preventive_policy WHERE contract_id = $1 FOR UPDATE`,
      [contractId]
    );
    const current = currentRes.rows[0] as ContractPreventivePolicy | undefined;

    const merged: ContractPreventivePolicy = {
      incluyePreventivo: data.incluyePreventivo ?? current?.incluyePreventivo ?? false,
      frecuencia: data.frecuencia ?? current?.frecuencia ?? null,
      modalidad: data.modalidad ?? current?.modalidad ?? null,
      aplica: data.aplica ?? current?.aplica ?? null,
      observaciones: data.observaciones ?? current?.observaciones ?? null,
    };

    if (current) {
      await client.query(
        `UPDATE contract_preventive_policy SET incluye_preventivo=$1, frecuencia=$2, modalidad=$3, aplica=$4, observaciones=$5, updated_by=$6 WHERE contract_id=$7`,
        [
          merged.incluyePreventivo,
          merged.frecuencia,
          merged.modalidad,
          merged.aplica,
          merged.observaciones,
          usuario || null,
          contractId,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO contract_preventive_policy (contract_id, incluye_preventivo, frecuencia, modalidad, aplica, observaciones, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)` ,
        [
          contractId,
          merged.incluyePreventivo,
          merged.frecuencia,
          merged.modalidad,
          merged.aplica,
          merged.observaciones,
          usuario || null,
        ]
      );
    }

    const changes: Record<string, { old: any; new: any }> = {};
    const oldObj = current || {} as any;
    for (const key of Object.keys(merged)) {
      changes[key] = { old: (oldObj as any)[key], new: (merged as any)[key] };
    }
    await diffAndHistory(client, contractId, changes, motivo, usuario || null, 'preventivo');

    await client.query('COMMIT');
    return merged;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateEconomics = async (
  contractId: number,
  data: ContractEconomics,
  motivo: string,
  usuario?: string | null
): Promise<ContractEconomics> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query(
      `SELECT tipo_facturacion AS "tipoFacturacion", monto_referencial AS "montoReferencial", moneda,
              dia_facturacion AS "diaFacturacion", observaciones
       FROM contract_economics WHERE contract_id = $1 FOR UPDATE`,
      [contractId]
    );
    const current = currentRes.rows[0] as ContractEconomics | undefined;

    const merged: ContractEconomics = {
      tipoFacturacion: data.tipoFacturacion ?? current?.tipoFacturacion as any,
      montoReferencial: data.montoReferencial ?? current?.montoReferencial ?? null,
      moneda: data.moneda ?? current?.moneda as any,
      diaFacturacion: data.diaFacturacion ?? current?.diaFacturacion ?? null,
      observaciones: data.observaciones ?? current?.observaciones ?? null,
    } as ContractEconomics;

    if (current) {
      await client.query(
        `UPDATE contract_economics SET tipo_facturacion=$1, monto_referencial=$2, moneda=$3, dia_facturacion=$4, observaciones=$5, updated_by=$6 WHERE contract_id=$7`,
        [
          merged.tipoFacturacion,
          merged.montoReferencial,
          merged.moneda,
          merged.diaFacturacion,
          merged.observaciones,
          usuario || null,
          contractId,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO contract_economics (contract_id, tipo_facturacion, monto_referencial, moneda, dia_facturacion, observaciones, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$7)` ,
        [
          contractId,
          merged.tipoFacturacion,
          merged.montoReferencial,
          merged.moneda,
          merged.diaFacturacion,
          merged.observaciones,
          usuario || null,
        ]
      );
    }

    const changes: Record<string, { old: any; new: any }> = {};
    const oldObj = current || {} as any;
    for (const key of Object.keys(merged)) {
      changes[key] = { old: (oldObj as any)[key], new: (merged as any)[key] };
    }
    await diffAndHistory(client, contractId, changes, motivo, usuario || null, 'economico');

    await client.query('COMMIT');
    return merged;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const addDocument = async (
  contractId: number,
  doc: ContractDocument,
  motivo: string,
  usuario?: string | null
): Promise<ContractDocument> => {
  const res = await pool.query(
    `INSERT INTO contract_documents (contract_id, filename, path, mime_type, size_bytes, tipo, uploaded_by, version)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, contract_id AS "contractId", filename, path, mime_type AS "mimeType", size_bytes AS "sizeBytes", tipo, uploaded_at AS "uploadedAt", uploaded_by AS "uploadedBy", version` ,
    [
      contractId,
      doc.filename,
      doc.path,
      doc.mimeType || null,
      doc.sizeBytes ?? null,
      doc.tipo,
      usuario || null,
      doc.version || null,
    ]
  );

  await addHistory({
    contractId,
    campo: 'documento',
    valorAnterior: null,
    valorNuevo: doc.filename,
    usuario: usuario || null,
    motivo,
    tipoCambio: 'documento',
  });

  return res.rows[0];
};

export const deleteDocument = async (
  contractId: number,
  docId: number,
  motivo: string,
  usuario?: string | null
): Promise<ContractDocument | null> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT id, contract_id AS "contractId", filename, path, mime_type AS "mimeType", size_bytes AS "sizeBytes", tipo, uploaded_at AS "uploadedAt", uploaded_by AS "uploadedBy", version
       FROM contract_documents WHERE id = $1 AND contract_id = $2 FOR UPDATE`,
      [docId, contractId]
    );
    const doc = existing.rows[0];
    if (!doc) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(`DELETE FROM contract_documents WHERE id = $1`, [docId]);

    await addHistory({
      contractId,
      campo: 'Documento eliminado',
      valorAnterior: doc.filename,
      valorNuevo: '—',
      usuario: usuario || null,
      motivo,
      tipoAccion: 'ELIMINACION',
      tipoCambio: 'documento',
    });

    await client.query('COMMIT');
    return doc;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const renewContract = async (
  empresaId: number,
  contractId: number,
  data: ContractCreateInput,
  motivo: string,
  usuario?: string | null
): Promise<{ oldId: number; newContract: ContractWithDetails } | null> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentRes = await client.query(
      `SELECT id, estado_contrato AS "estadoContrato" FROM contracts WHERE id = $1 AND empresa_id = $2 FOR UPDATE`,
      [contractId, empresaId]
    );
    if (!currentRes.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }

    // Marcar anterior como histórico
    await client.query(
      `UPDATE contracts SET estado_contrato = 'historico', updated_by = $1 WHERE id = $2`,
      [usuario || null, contractId]
    );

    // Crear nuevo contrato
    const newInput = { ...data, empresaId, estadoContrato: data.estadoContrato || 'activo', usuario, createdBy: usuario } as ContractCreateInput;
    const created = await createContract(newInput);

    // Historial de renovación en contrato anterior
    await addHistory({
      contractId,
      campo: 'renovacion',
      valorAnterior: String(contractId),
      valorNuevo: String(created.id),
      usuario: usuario || null,
      motivo,
      tipoCambio: 'renovacion',
    });

    await client.query('COMMIT');
    return { oldId: contractId, newContract: created };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
