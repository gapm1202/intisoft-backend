import { pool } from '../../../config/db';

export const getHistorialByActivoId = async (activoId: number) => {
  const query = `
    SELECT
      id,
      COALESCE(fecha_modificacion, creado_en) as fecha,
      asset_id,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      motivo
    FROM historial_activos
    WHERE activo_id = $1
    ORDER BY fecha DESC
  `;
  const result = await pool.query(query, [activoId]);
  return result.rows.map((r: any) => ({
    id: r.id,
    fecha: r.fecha,
    asset_id: r.asset_id,
    campo_modificado: r.campo_modificado,
    valor_anterior: r.valor_anterior,
    valor_nuevo: r.valor_nuevo,
    motivo: r.motivo
  }));
};
