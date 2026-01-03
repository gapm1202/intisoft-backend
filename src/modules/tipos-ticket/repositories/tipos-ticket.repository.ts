import { pool } from '../../../config/db';
import { TipoTicket, TipoTicketInput, TipoTicketUpdateInput } from '../models/tipos-ticket.model';

class TiposTicketRepository {
  async findAll(): Promise<TipoTicket[]> {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, activo, created_at as "createdAt", updated_at as "updatedAt"
       FROM tipos_ticket
       ORDER BY nombre ASC`
    );
    return result.rows;
  }

  async findById(id: string): Promise<TipoTicket | null> {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, activo, created_at as "createdAt", updated_at as "updatedAt"
       FROM tipos_ticket
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByNombre(nombre: string): Promise<TipoTicket | null> {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, activo, created_at as "createdAt", updated_at as "updatedAt"
       FROM tipos_ticket
       WHERE nombre = $1`,
      [nombre]
    );
    return result.rows[0] || null;
  }

  async create(input: TipoTicketInput): Promise<TipoTicket> {
    const result = await pool.query(
      `INSERT INTO tipos_ticket (nombre, descripcion, activo)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, descripcion, activo, created_at as "createdAt", updated_at as "updatedAt"`,
      [input.nombre, input.descripcion || null, input.activo ?? true]
    );
    return result.rows[0];
  }

  async update(id: string, input: TipoTicketUpdateInput): Promise<TipoTicket | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.nombre !== undefined) {
      updates.push(`nombre = $${paramCount++}`);
      values.push(input.nombre);
    }
    if (input.descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount++}`);
      values.push(input.descripcion);
    }
    if (input.activo !== undefined) {
      updates.push(`activo = $${paramCount++}`);
      values.push(input.activo);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE tipos_ticket
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, nombre, descripcion, activo, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  }

  async toggle(id: string): Promise<TipoTicket | null> {
    const result = await pool.query(
      `UPDATE tipos_ticket
       SET activo = NOT activo
       WHERE id = $1
       RETURNING id, nombre, descripcion, activo, created_at as "createdAt", updated_at as "updatedAt"`,
      [id]
    );
    return result.rows[0] || null;
  }
}

export default new TiposTicketRepository();
