import { pool } from "../../../config/db";
import { Sede } from "../models/sede.model";

export const getAllByEmpresa = async (empresaId: number): Promise<Sede[]> => {
  const res = await pool.query(
    `SELECT id, empresa_id AS "empresaId", nombre, direccion, ciudad, provincia, telefono, email, tipo,
      responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", creado_en
     FROM sedes WHERE empresa_id = $1 ORDER BY id`,
    [empresaId]
  );
  return res.rows;
};

export const createForEmpresa = async (empresaId: number, sede: Sede): Promise<Sede> => {
  const res = await pool.query(
    `INSERT INTO sedes (empresa_id, nombre, direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable, telefono_responsable, email_responsable)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id, empresa_id AS "empresaId", nombre, direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", creado_en`,
    [
      empresaId,
      sede.nombre,
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
    ]
  );
  return res.rows[0];
};

export const deleteById = async (id: number): Promise<Sede | null> => {
  const res = await pool.query(
    `DELETE FROM sedes WHERE id = $1
     RETURNING id, empresa_id AS "empresaId", nombre, direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", creado_en`,
    [id]
  );
  return res.rows[0] || null;
};

export const getById = async (id: number): Promise<Sede | null> => {
  const res = await pool.query(
    `SELECT id, empresa_id AS "empresaId", nombre, direccion, ciudad, provincia, telefono, email, tipo,
      responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", creado_en
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
    RETURNING id, empresa_id AS "empresaId", nombre, direccion, ciudad, provincia, telefono, email, tipo, responsable, cargo_responsable AS "cargoResponsable", telefono_responsable AS "telefonoResponsable", email_responsable AS "emailResponsable", creado_en`;

  const res = await pool.query(query, values);
  return res.rows[0] || null;
};
