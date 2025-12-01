import { pool } from "../../../config/db";
import { Historial } from "../models/historial.model";

export const create = async (
  empresaId: number,
  usuario: string | undefined,
  nombreUsuario: string | undefined,
  motivo: string | undefined,
  accion: 'EDITAR_EMPRESA' | 'EDITAR_SEDE' | 'ELIMINAR_SEDE',
  changes?: Record<string, any> | null
): Promise<Historial> => {
  const query = `
    INSERT INTO historial (empresa_id, usuario, nombre_usuario, motivo, accion, fecha, changes)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
    RETURNING 
      id,
      empresa_id as "empresaId",
      fecha,
      usuario,
      nombre_usuario as "nombreUsuario",
      motivo,
      accion,
      changes
  `;

  const result = await pool.query(query, [
    empresaId,
    usuario || null,
    nombreUsuario || null,
    motivo || null,
    accion,
    changes ? JSON.stringify(changes) : null
  ]);

  return result.rows[0];
};

export const getByEmpresaId = async (empresaId: number): Promise<Historial[]> => {
  const query = `
    SELECT
      id,
      empresa_id as "empresaId",
      fecha,
      usuario,
      nombre_usuario as "nombreUsuario",
      motivo,
      accion,
      changes
    FROM historial
    WHERE empresa_id = $1
    ORDER BY fecha DESC
  `;

  const result = await pool.query(query, [empresaId]);
  return result.rows;
};
