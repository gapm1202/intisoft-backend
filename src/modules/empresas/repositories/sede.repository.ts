import { pool } from "../../../config/db";
import { Sede } from "../models/sede.model";

export const getAllByEmpresa = async (empresaId: number, includeInactive: boolean = false): Promise<Sede[]> => {
  const whereClause = includeInactive ? `WHERE empresa_id = $1` : `WHERE empresa_id = $1 AND activo = true`;
  const res = await pool.query(
    `SELECT id, empresa_id AS "empresaId", nombre, codigo_interno AS "codigoInterno", direccion, ciudad, provincia, telefono, email, tipo,
      responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable",
      responsables, horario_atencion AS "horarioAtencion", observaciones,
      autoriza_ingreso_tecnico AS "autorizaIngresoTecnico", autoriza_mantenimiento_fuera_horario AS "autorizaMantenimientoFueraHorario",
      autoriza_supervision_coordinacion AS "autorizaSupervisionCoordinacion",
      activo, motivo, creado_en
     FROM sedes ${whereClause} ORDER BY id`,
    [empresaId]
  );
  return res.rows;
};

export const createForEmpresa = async (empresaId: number, sede: Sede): Promise<Sede> => {
  const res = await pool.query(
    `INSERT INTO sedes (empresa_id, nombre, codigo_interno, direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable, telefono_responsable, email_responsable, responsables, horario_atencion, observaciones, autoriza_ingreso_tecnico, autoriza_mantenimiento_fuera_horario, autoriza_supervision_coordinacion, activo, motivo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,$18,$19,$20,$21)
     RETURNING id, empresa_id AS "empresaId", nombre, codigo_interno AS "codigoInterno", direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", responsables, horario_atencion AS "horarioAtencion", observaciones, autoriza_ingreso_tecnico AS "autorizaIngresoTecnico", autoriza_mantenimiento_fuera_horario AS "autorizaMantenimientoFueraHorario", autoriza_supervision_coordinacion AS "autorizaSupervisionCoordinacion", activo, motivo, creado_en`,
    [
      empresaId,
      sede.nombre,
      sede.codigoInterno || null,
      sede.direccion,
      sede.ciudad || null,
      sede.provincia || null,
      sede.telefono || null,
      sede.email || null,
      sede.tipo || null,
      sede.responsable || null,
      sede.cargoResponsable || null,
      sede.telefonoResponsable || null,
      sede.emailResponsable || null,
      sede.responsables ? JSON.stringify(sede.responsables) : JSON.stringify([]),
      sede.horarioAtencion || null,
      sede.observaciones || null,
      sede.autorizaIngresoTecnico !== undefined ? sede.autorizaIngresoTecnico : false,
      sede.autorizaMantenimientoFueraHorario !== undefined ? sede.autorizaMantenimientoFueraHorario : false,
      sede.autorizaSupervisionCoordinacion !== undefined ? sede.autorizaSupervisionCoordinacion : true,
      sede.activo !== undefined ? sede.activo : true,
      sede.motivo || null,
    ]
  );
  return res.rows[0];
};

export const softDeleteById = async (id: number, activo: boolean, motivo: string): Promise<Sede | null> => {
  const res = await pool.query(
    `UPDATE sedes SET activo = $1, motivo = $2 WHERE id = $3
     RETURNING id, empresa_id AS "empresaId", nombre, codigo_interno AS "codigoInterno", direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", responsables, horario_atencion AS "horarioAtencion", observaciones, autoriza_ingreso_tecnico AS "autorizaIngresoTecnico", autoriza_mantenimiento_fuera_horario AS "autorizaMantenimientoFueraHorario", activo, motivo, creado_en`,
    [activo, motivo, id]
  );
  return res.rows[0] || null;
};

export const deleteById = async (id: number): Promise<Sede | null> => {
  const res = await pool.query(
    `DELETE FROM sedes WHERE id = $1
     RETURNING id, empresa_id AS "empresaId", nombre, codigo_interno AS "codigoInterno", direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", responsables, horario_atencion AS "horarioAtencion", observaciones, autoriza_ingreso_tecnico AS "autorizaIngresoTecnico", autoriza_mantenimiento_fuera_horario AS "autorizaMantenimientoFueraHorario", activo, motivo, creado_en`,
    [id]
  );
  return res.rows[0] || null;
};

export const getById = async (id: number): Promise<Sede | null> => {
  const res = await pool.query(
    `SELECT id, empresa_id AS "empresaId", nombre, codigo_interno AS "codigoInterno", direccion, ciudad, provincia, telefono, email, tipo,
      responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable",
      responsables, horario_atencion AS "horarioAtencion", observaciones,
      autoriza_ingreso_tecnico AS "autorizaIngresoTecnico", autoriza_mantenimiento_fuera_horario AS "autorizaMantenimientoFueraHorario",
      autoriza_supervision_coordinacion AS "autorizaSupervisionCoordinacion",
      activo, motivo, creado_en
     FROM sedes WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
};

export const updateById = async (id: number, updates: Partial<Sede>): Promise<Sede | null> => {
  const fields: string[] = [];
  const values: any[] = [id];
  let paramIndex = 2;

  if (updates.nombre !== undefined) {
    fields.push(`nombre = $${paramIndex++}`);
    values.push(updates.nombre);
  }
  if (updates.direccion !== undefined) {
    fields.push(`direccion = $${paramIndex++}`);
    values.push(updates.direccion);
  }
  if (updates.ciudad !== undefined) {
    fields.push(`ciudad = $${paramIndex++}`);
    values.push(updates.ciudad);
  }
  if (updates.provincia !== undefined) {
    fields.push(`provincia = $${paramIndex++}`);
    values.push(updates.provincia);
  }
  if (updates.telefono !== undefined) {
    fields.push(`telefono = $${paramIndex++}`);
    values.push(updates.telefono);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }
  if (updates.tipo !== undefined) {
    fields.push(`tipo = $${paramIndex++}`);
    values.push(updates.tipo);
  }
  if (updates.responsable !== undefined) {
    fields.push(`responsable = $${paramIndex++}`);
    values.push(updates.responsable);
  }
  if (updates.cargoResponsable !== undefined) {
    fields.push(`cargo_responsable = $${paramIndex++}`);
    values.push(updates.cargoResponsable);
  }
  if (updates.telefonoResponsable !== undefined) {
    fields.push(`telefono_responsable = $${paramIndex++}`);
    values.push(updates.telefonoResponsable);
  }
  if (updates.emailResponsable !== undefined) {
    fields.push(`email_responsable = $${paramIndex++}`);
    values.push(updates.emailResponsable);
  }
  if (updates.codigoInterno !== undefined) {
    fields.push(`codigo_interno = $${paramIndex++}`);
    values.push(updates.codigoInterno);
  }
  if (updates.responsables !== undefined) {
    fields.push(`responsables = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.responsables));
  }
  if (updates.horarioAtencion !== undefined) {
    fields.push(`horario_atencion = $${paramIndex++}`);
    values.push(updates.horarioAtencion);
  }
  if (updates.observaciones !== undefined) {
    fields.push(`observaciones = $${paramIndex++}`);
    values.push(updates.observaciones);
  }
  if (updates.autorizaIngresoTecnico !== undefined) {
    fields.push(`autoriza_ingreso_tecnico = $${paramIndex++}`);
    values.push(updates.autorizaIngresoTecnico);
  }
  if (updates.autorizaMantenimientoFueraHorario !== undefined) {
    fields.push(`autoriza_mantenimiento_fuera_horario = $${paramIndex++}`);
    values.push(updates.autorizaMantenimientoFueraHorario);
  }
  if ((updates as any).deleted_at !== undefined) {
    fields.push(`deleted_at = $${paramIndex++}`);
    values.push((updates as any).deleted_at);
  }
  if ((updates as any).motivo_eliminacion !== undefined) {
    fields.push(`motivo_eliminacion = $${paramIndex++}`);
    values.push((updates as any).motivo_eliminacion);
  }

  if (fields.length === 0) return null;

  const query = `UPDATE sedes SET ${fields.join(', ')} WHERE id = $1
    RETURNING id, empresa_id AS "empresaId", nombre, codigo_interno AS "codigoInterno", direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", responsables, horario_atencion AS "horarioAtencion", observaciones, autoriza_ingreso_tecnico AS "autorizaIngresoTecnico", autoriza_mantenimiento_fuera_horario AS "autorizaMantenimientoFueraHorario", autoriza_supervision_coordinacion AS "autorizaSupervisionCoordinacion", activo, motivo, creado_en`;

  const res = await pool.query(query, values);
  return res.rows[0] || null;
};
