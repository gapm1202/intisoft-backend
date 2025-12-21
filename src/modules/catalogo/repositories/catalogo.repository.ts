import { pool } from '../../../config/db';
import {
  CatalogoCategoria,
  CatalogoSubcategoria,
  CategoriaInput,
  SubcategoriaInput,
} from '../models/catalogo.model';

interface ListCategoriaOptions {
  forTickets?: boolean;
  includeInactivas?: boolean;
  estado?: 'activos' | 'inactivos' | 'todos';
  tipo?: string;
  limit?: number;
  offset?: number;
}

interface ListSubcategoriaOptions {
  categoriaId?: number;
  forTickets?: boolean;
  includeInactivas?: boolean;
  estado?: 'activos' | 'inactivos' | 'todos';
  tipo?: string;
  limit?: number;
  offset?: number;
}

export class CatalogoRepository {
  private tableExistsCache: Record<string, boolean> = {};
  private columnExistsCache: Record<string, boolean> = {};

  private mapCategoria(row: any): CatalogoCategoria {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoTicket: row.tipo_ticket,
      activo: row.activo,
      visibleEnTickets: row.visible_en_tickets,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSubcategoria(row: any): CatalogoSubcategoria {
    const tipoCategoria = row.categoria_tipo_ticket ?? null;
    const heredaTipo = row.hereda_tipo;
    const tipoPropio = row.tipo_ticket ?? null;

    return {
      id: row.id,
      categoriaId: row.categoria_id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      tipoTicket: tipoPropio,
      heredaTipo,
      requiereValidacion: row.requiere_validacion,
      activo: row.activo,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tipoTicketEfectivo: heredaTipo ? tipoCategoria : tipoPropio,
    };
  }

  async listCategorias(options: ListCategoriaOptions = {}): Promise<CatalogoCategoria[]> {
    const { forTickets = false, includeInactivas = false, estado, tipo, limit, offset } = options;

    if (!(await this.tableExists('catalogo_categorias'))) {
      return [];
    }

    const where: string[] = [];
    const params: any[] = [];

    if (forTickets) {
      where.push('c.activo = TRUE', 'c.visible_en_tickets = TRUE');
    } else if (!includeInactivas) {
      where.push('c.activo = TRUE');
    }

    if (estado === 'activos') where.push('c.activo = TRUE');
    if (estado === 'inactivos') where.push('c.activo = FALSE');

    if (tipo) {
      params.push(tipo);
      where.push(`c.tipo_ticket = $${params.length}`);
    }

    let sql = `
      SELECT c.*
      FROM catalogo_categorias c
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY c.nombre ASC
    `;

    if (limit && Number.isFinite(limit) && limit > 0) {
      sql += ` LIMIT ${Math.min(limit, 500)}`; // hard cap
      if (offset && Number.isFinite(offset) && offset >= 0) {
        sql += ` OFFSET ${offset}`;
      }
    }

    const result = await pool.query(sql, params);
    return result.rows.map((row: any) => this.mapCategoria(row));
  }

  async findCategoriaById(id: number): Promise<CatalogoCategoria | null> {
    const result = await pool.query('SELECT * FROM catalogo_categorias WHERE id = $1', [id]);
    return result.rows[0] ? this.mapCategoria(result.rows[0]) : null;
  }

  async createCategoria(data: CategoriaInput): Promise<CatalogoCategoria> {
    const result = await pool.query(
      `INSERT INTO catalogo_categorias (codigo, nombre, descripcion, tipo_ticket, activo, visible_en_tickets)
       VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), COALESCE($6, TRUE))
       RETURNING *`,
      [data.codigo, data.nombre, data.descripcion ?? null, data.tipoTicket ?? null, data.activo, data.visibleEnTickets]
    );

    return this.mapCategoria(result.rows[0]);
  }

  async updateCategoria(id: number, data: Partial<CategoriaInput>): Promise<CatalogoCategoria | null> {
    const sets: string[] = [];
    const params: any[] = [];

    if (data.codigo !== undefined) {
      params.push(data.codigo);
      sets.push(`codigo = $${params.length}`);
    }
    if (data.nombre !== undefined) {
      params.push(data.nombre);
      sets.push(`nombre = $${params.length}`);
    }
    if (data.descripcion !== undefined) {
      params.push(data.descripcion);
      sets.push(`descripcion = $${params.length}`);
    }
    if (data.tipoTicket !== undefined) {
      params.push(data.tipoTicket);
      sets.push(`tipo_ticket = $${params.length}`);
    }
    if (data.activo !== undefined) {
      params.push(data.activo);
      sets.push(`activo = $${params.length}`);
    }
    if (data.visibleEnTickets !== undefined) {
      params.push(data.visibleEnTickets);
      sets.push(`visible_en_tickets = $${params.length}`);
    }

    if (sets.length === 0) {
      return this.findCategoriaById(id);
    }

    sets.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE catalogo_categorias SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`;
    const result = await pool.query(sql, params);
    return result.rows[0] ? this.mapCategoria(result.rows[0]) : null;
  }

  async hasActiveSubcategorias(categoriaId: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM catalogo_subcategorias WHERE categoria_id = $1 AND activo = TRUE LIMIT 1',
      [categoriaId]
    );
    return result.rows.length > 0;
  }

  async listSubcategorias(options: ListSubcategoriaOptions = {}): Promise<CatalogoSubcategoria[]> {
    const { categoriaId, forTickets = false, includeInactivas = false, estado, tipo, limit, offset } = options;
    if (!(await this.tableExists('catalogo_subcategorias')) || !(await this.tableExists('catalogo_categorias'))) {
      return [];
    }

    const where: string[] = [];
    const params: any[] = [];

    if (categoriaId !== undefined) {
      params.push(categoriaId);
      where.push(`s.categoria_id = $${params.length}`);
    }

    if (forTickets) {
      where.push('s.activo = TRUE', 'c.activo = TRUE', 'c.visible_en_tickets = TRUE');
    } else if (!includeInactivas) {
      where.push('s.activo = TRUE');
    }

    if (estado === 'activos') where.push('s.activo = TRUE');
    if (estado === 'inactivos') where.push('s.activo = FALSE');

    if (tipo) {
      params.push(tipo);
      where.push(`COALESCE(s.tipo_ticket, c.tipo_ticket) = $${params.length}`);
    }

    let sql = `
      SELECT s.*, c.tipo_ticket AS categoria_tipo_ticket
      FROM catalogo_subcategorias s
      JOIN catalogo_categorias c ON c.id = s.categoria_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY s.nombre ASC
    `;

    if (limit && Number.isFinite(limit) && limit > 0) {
      sql += ` LIMIT ${Math.min(limit, 500)}`;
      if (offset && Number.isFinite(offset) && offset >= 0) {
        sql += ` OFFSET ${offset}`;
      }
    }

    const result = await pool.query(sql, params);
    return result.rows.map((row: any) => this.mapSubcategoria(row));
  }

  async findSubcategoriaById(id: number): Promise<CatalogoSubcategoria | null> {
    const result = await pool.query(
      `SELECT s.*, c.tipo_ticket AS categoria_tipo_ticket
       FROM catalogo_subcategorias s
       JOIN catalogo_categorias c ON c.id = s.categoria_id
       WHERE s.id = $1`,
      [id]
    );

    return result.rows[0] ? this.mapSubcategoria(result.rows[0]) : null;
  }

  async createSubcategoria(data: SubcategoriaInput): Promise<CatalogoSubcategoria> {
    const result = await pool.query(
      `INSERT INTO catalogo_subcategorias (categoria_id, codigo, nombre, descripcion, tipo_ticket, hereda_tipo, requiere_validacion, activo)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE), COALESCE($7, FALSE), COALESCE($8, TRUE))
       RETURNING *`,
      [
        data.categoriaId,
        data.codigo,
        data.nombre,
        data.descripcion ?? null,
        data.tipoTicket ?? null,
        data.heredaTipo,
        data.requiereValidacion,
        data.activo,
      ]
    );

    return this.mapSubcategoria(result.rows[0]);
  }

  async updateSubcategoria(id: number, data: Partial<SubcategoriaInput>): Promise<CatalogoSubcategoria | null> {
    const sets: string[] = [];
    const params: any[] = [];

    if (data.categoriaId !== undefined) {
      params.push(data.categoriaId);
      sets.push(`categoria_id = $${params.length}`);
    }
    if (data.codigo !== undefined) {
      params.push(data.codigo);
      sets.push(`codigo = $${params.length}`);
    }
    if (data.nombre !== undefined) {
      params.push(data.nombre);
      sets.push(`nombre = $${params.length}`);
    }
    if (data.descripcion !== undefined) {
      params.push(data.descripcion);
      sets.push(`descripcion = $${params.length}`);
    }
    if (data.tipoTicket !== undefined) {
      params.push(data.tipoTicket);
      sets.push(`tipo_ticket = $${params.length}`);
    }
    if (data.heredaTipo !== undefined) {
      params.push(data.heredaTipo);
      sets.push(`hereda_tipo = $${params.length}`);
    }
    if (data.requiereValidacion !== undefined) {
      params.push(data.requiereValidacion);
      sets.push(`requiere_validacion = $${params.length}`);
    }
    if (data.activo !== undefined) {
      params.push(data.activo);
      sets.push(`activo = $${params.length}`);
    }

    if (sets.length === 0) {
      return this.findSubcategoriaById(id);
    }

    sets.push('updated_at = NOW()');
    params.push(id);

    const sql = `UPDATE catalogo_subcategorias SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`;
    const result = await pool.query(sql, params);
    return result.rows[0] ? this.mapSubcategoria(result.rows[0]) : null;
  }

  async countTicketsForCategoria(categoriaId: number): Promise<number> {
    if (!(await this.columnExists('tickets', 'categoria_id'))) return 0;

    const result = await pool.query('SELECT COUNT(*)::int AS count FROM tickets WHERE categoria_id = $1', [categoriaId]);
    return result.rows[0]?.count || 0;
  }

  async countTicketsForSubcategoria(subcategoriaId: number): Promise<number> {
    if (!(await this.columnExists('tickets', 'subcategoria_id'))) return 0;

    const result = await pool.query('SELECT COUNT(*)::int AS count FROM tickets WHERE subcategoria_id = $1', [subcategoriaId]);
    return result.rows[0]?.count || 0;
  }

  private async tableExists(table: string): Promise<boolean> {
    if (this.tableExistsCache[table] !== undefined) {
      return this.tableExistsCache[table];
    }

    const result = await pool.query("SELECT to_regclass($1) AS oid", [`public.${table}`]);
    const exists = Boolean(result.rows[0]?.oid);
    this.tableExistsCache[table] = exists;
    return exists;
  }

  private async columnExists(table: string, column: string): Promise<boolean> {
    const cacheKey = `${table}.${column}`;
    if (this.columnExistsCache[cacheKey] !== undefined) {
      return this.columnExistsCache[cacheKey];
    }

    if (!(await this.tableExists(table))) {
      this.columnExistsCache[cacheKey] = false;
      return false;
    }

    const result = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
       ) AS exists`,
      [table, column]
    );

    const exists = Boolean(result.rows[0]?.exists);
    this.columnExistsCache[cacheKey] = exists;
    return exists;
  }
}

export default new CatalogoRepository();
