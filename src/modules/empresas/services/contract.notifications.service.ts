import { pool } from "../../../config/db";

export const getContratosProximosAVencer = async (dias: number) => {
  // Calcular fechas
  const hoy = new Date();
  const hasta = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000);
  const hoyStr = hoy.toISOString().slice(0, 10);
  const hastaStr = hasta.toISOString().slice(0, 10);

  const query = `
    SELECT c.empresa_id AS "empresaId", e.nombre AS "empresaNombre", c.fecha_fin AS "fechaFin",
      c.renovacion_automatica AS "renovacionAutomatica",
      CEIL(EXTRACT(EPOCH FROM (c.fecha_fin::timestamp - NOW())) / 86400) AS "diasRestantes"
    FROM contracts c
    JOIN empresas e ON c.empresa_id = e.id
    WHERE c.estado_contrato = 'activo'
      AND c.fecha_fin >= $1
      AND c.fecha_fin <= $2
    ORDER BY "diasRestantes" ASC
  `;
  const res = await pool.query(query, [hoyStr, hastaStr]);
  return res.rows;
};
