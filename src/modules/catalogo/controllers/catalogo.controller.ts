import { Request, Response } from 'express';
import catalogoService from '../services/catalogo.service';

class CatalogoController {
  async listCategorias(req: Request, res: Response): Promise<void> {
    try {
      const forTickets = this.parseBoolean(req.query.forTickets);
      const includeInactivas = this.parseBoolean(req.query.includeInactivas);
      const estado = typeof req.query.estado === 'string' ? (req.query.estado as string) : undefined;
      const tipo = typeof req.query.tipo === 'string' ? (req.query.tipo as string) : undefined;
      const limit = this.parseNumber(req.query.limit);
      const offset = this.parseNumber(req.query.offset);
      const categorias = await catalogoService.listCategorias({
        forTickets,
        includeInactivas,
        estado: estado as any,
        tipo,
        limit,
        offset,
      });

      res.json({ data: categorias });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async createCategoria(req: Request, res: Response): Promise<void> {
    try {
      const categoria = await catalogoService.createCategoria(req.body);
      res.status(201).json({ data: categoria });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async updateCategoria(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'id inválido' });
        return;
      }

      const categoria = await catalogoService.updateCategoria(id, req.body);
      res.json({ data: categoria });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async listSubcategorias(req: Request, res: Response): Promise<void> {
    try {
      const categoriaId = req.query.categoriaId ? Number(req.query.categoriaId) : undefined;
      const forTickets = this.parseBoolean(req.query.forTickets);
      const includeInactivas = this.parseBoolean(req.query.includeInactivas);
      const estado = typeof req.query.estado === 'string' ? (req.query.estado as string) : undefined;
      const tipo = typeof req.query.tipo === 'string' ? (req.query.tipo as string) : undefined;
      const limit = this.parseNumber(req.query.limit);
      const offset = this.parseNumber(req.query.offset);

      if (categoriaId !== undefined && Number.isNaN(categoriaId)) {
        res.status(400).json({ error: 'categoriaId inválido' });
        return;
      }

      const subcategorias = await catalogoService.listSubcategorias({
        categoriaId,
        forTickets,
        includeInactivas,
        estado: estado as any,
        tipo,
        limit,
        offset,
      });

      res.json({ data: subcategorias });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async createSubcategoria(req: Request, res: Response): Promise<void> {
    try {
      const subcategoria = await catalogoService.createSubcategoria(req.body);
      res.status(201).json({ data: subcategoria });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  async updateSubcategoria(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        res.status(400).json({ error: 'id inválido' });
        return;
      }

      const subcategoria = await catalogoService.updateSubcategoria(id, req.body);
      res.json({ data: subcategoria });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }

  private parseBoolean(value: any): boolean | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).toLowerCase();
    return ['true', '1', 'yes'].includes(normalized);
  }

  private parseNumber(value: any): number | undefined {
    if (value === undefined) return undefined;
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    return n;
  }

  private handleError(res: Response, error: any): void {
    const pgDuplicate = error?.code === '23505';
    const status = error?.status || (pgDuplicate ? 409 : 500);
    const message = error?.message || 'Error en el servidor';

    if (status >= 500) {
      console.error('[catalogo] error', error);
    }

    res.status(status).json({ error: message });
  }
}

export default new CatalogoController();
