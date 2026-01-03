import { pool } from "../../../config/db";
import {
  Servicio,
  ServicioInput,
  ServicioUpdateInput,
  TipoServicio,
  TipoServicioInput,
  ServicioStats
} from "../models/servicios.model";

// ==================== SERVICIOS ====================

const SERVICIO_FIELDS = `
  id, codigo, nombre, descripcion, 
  tipo_servicio AS "tipoServicio",
  activo, 
  visible_en_tickets AS "visibleEnTickets",
  creado_por AS "creadoPor",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const getAllServicios = async (filters?: {
  activo?: boolean;
  visibleEnTickets?: boolean;
  tipoServicio?: string;
}): Promise<Servicio[]> => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.activo !== undefined) {
    whereClauses.push(`activo = $${paramIndex++}`);
    values.push(filters.activo);
  }

  if (filters?.visibleEnTickets !== undefined) {
    whereClauses.push(`visible_en_tickets = $${paramIndex++}`);
    values.push(filters.visibleEnTickets);
  }

  if (filters?.tipoServicio) {
    whereClauses.push(`tipo_servicio = $${paramIndex++}`);
    values.push(filters.tipoServicio);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const res = await pool.query(
    `SELECT ${SERVICIO_FIELDS}
     FROM servicios
     ${whereSQL}
     ORDER BY codigo`,
    values
  );
  return res.rows;
};

export const getServicioById = async (id: number): Promise<Servicio | null> => {
  const res = await pool.query(
    `SELECT ${SERVICIO_FIELDS} FROM servicios WHERE id = $1`,
    [id]
  );
  return res.rows[0] || null;
};

export const getServicioByCodigo = async (codigo: string): Promise<Servicio | null> => {
  const res = await pool.query(
    `SELECT ${SERVICIO_FIELDS} FROM servicios WHERE codigo = $1`,
    [codigo]
  );
  return res.rows[0] || null;
};

export const createServicio = async (data: ServicioInput): Promise<Servicio> => {
  const res = await pool.query(
    `INSERT INTO servicios (codigo, nombre, descripcion, tipo_servicio, activo, visible_en_tickets, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${SERVICIO_FIELDS}`,
    [
      data.codigo,
      data.nombre,
      data.descripcion || null,
      data.tipoServicio,
      data.activo !== undefined ? data.activo : true,
      data.visibleEnTickets !== undefined ? data.visibleEnTickets : true,
      data.creadoPor || null
    ]
  );
  return res.rows[0];
};

export const updateServicio = async (
  id: number,
  data: ServicioUpdateInput
): Promise<Servicio | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.nombre !== undefined) {
    fields.push(`nombre = $${paramIndex++}`);
    values.push(data.nombre);
  }
  if (data.descripcion !== undefined) {
    fields.push(`descripcion = $${paramIndex++}`);
    values.push(data.descripcion);
  }
  if (data.tipoServicio !== undefined) {
    fields.push(`tipo_servicio = $${paramIndex++}`);
    values.push(data.tipoServicio);
  }
  if (data.activo !== undefined) {
    fields.push(`activo = $${paramIndex++}`);
    values.push(data.activo);
  }
  if (data.visibleEnTickets !== undefined) {
    fields.push(`visible_en_tickets = $${paramIndex++}`);
    values.push(data.visibleEnTickets);
  }

  if (fields.length === 0) {
    return getServicioById(id);
  }

  values.push(id);
  const res = await pool.query(
    `UPDATE servicios SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING ${SERVICIO_FIELDS}`,
    values
  );
  return res.rows[0] || null;
};

export const getServicioStats = async (): Promise<ServicioStats> => {
  const totalRes = await pool.query('SELECT COUNT(*) as count FROM servicios');
  const activosRes = await pool.query('SELECT COUNT(*) as count FROM servicios WHERE activo = true');
  const inactivosRes = await pool.query('SELECT COUNT(*) as count FROM servicios WHERE activo = false');
  const visiblesRes = await pool.query('SELECT COUNT(*) as count FROM servicios WHERE visible_en_tickets = true');
  
  const porTipoRes = await pool.query(`
    SELECT tipo_servicio as tipo, COUNT(*) as count
    FROM servicios
    GROUP BY tipo_servicio
    ORDER BY count DESC
  `);

  return {
    total: parseInt(totalRes.rows[0].count),
    activos: parseInt(activosRes.rows[0].count),
    inactivos: parseInt(inactivosRes.rows[0].count),
    visiblesEnTickets: parseInt(visiblesRes.rows[0].count),
    porTipo: porTipoRes.rows.map(row => ({
      tipo: row.tipo,
      count: parseInt(row.count)
    }))
  };
};

// ==================== TIPOS DE SERVICIO ====================

export const getAllTiposServicio = async (): Promise<TipoServicio[]> => {
  const res = await pool.query(`
    SELECT id, tipo, activo, created_at AS "createdAt", updated_at AS "updatedAt"
    FROM tipos_servicio
    ORDER BY tipo
  `);
  return res.rows;
};

export const getTipoServicioByNombre = async (tipo: string): Promise<TipoServicio | null> => {
  const res = await pool.query(
    `SELECT id, tipo, activo, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM tipos_servicio
     WHERE tipo = $1`,
    [tipo]
  );
  return res.rows[0] || null;
};

export const createTipoServicio = async (data: TipoServicioInput): Promise<TipoServicio> => {
  const res = await pool.query(
    `INSERT INTO tipos_servicio (tipo, activo)
     VALUES ($1, $2)
     RETURNING id, tipo, activo, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [data.tipo, data.activo !== undefined ? data.activo : true]
  );
  return res.rows[0];
};
