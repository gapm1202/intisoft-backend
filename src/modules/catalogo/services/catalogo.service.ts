import catalogoRepository from '../repositories/catalogo.repository';
import {
  CatalogoCategoria,
  CatalogoSubcategoria,
  CategoriaInput,
  SubcategoriaInput,
} from '../models/catalogo.model';

interface ListOptions {
  forTickets?: boolean;
  includeInactivas?: boolean;
  estado?: 'activos' | 'inactivos' | 'todos';
  tipo?: string;
  limit?: number;
  offset?: number;
}

function httpError(status: number, message: string): Error {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

export class CatalogoService {
  async listCategorias(options: ListOptions = {}): Promise<CatalogoCategoria[]> {
    return catalogoRepository.listCategorias(options);
  }

  async createCategoria(input: CategoriaInput): Promise<CatalogoCategoria> {
    if (!input.nombre || input.nombre.trim() === '') {
      throw httpError(400, 'nombre es requerido');
    }

    const nombre = input.nombre.trim();
    const codigo = (input.codigo || this.generateCategoriaCodigo(nombre)).toUpperCase();

    return catalogoRepository.createCategoria({
      ...input,
      nombre,
      codigo,
      visibleEnTickets: input.visibleEnTickets ?? true,
      activo: input.activo ?? true,
    });
  }

  async updateCategoria(id: number, input: Partial<CategoriaInput>): Promise<CatalogoCategoria> {
    const existing = await catalogoRepository.findCategoriaById(id);
    if (!existing) {
      throw httpError(404, 'Categoría no encontrada');
    }

    const payload: Partial<CategoriaInput> = { ...input };

    if (payload.nombre !== undefined) {
      if (payload.nombre === null || payload.nombre.trim() === '') {
        throw httpError(400, 'nombre no puede estar vacío');
      }
      payload.nombre = payload.nombre.trim();
    }

    if (payload.codigo !== undefined && payload.codigo.trim() === '') {
      throw httpError(400, 'codigo no puede estar vacío');
    }

    if (payload.codigo) {
      payload.codigo = payload.codigo.toUpperCase();
    }

    // Soft delete rules
    if (payload.activo === false && existing.activo) {
      const hasSub = await catalogoRepository.hasActiveSubcategorias(id);
      if (hasSub) {
        throw httpError(400, 'Desactiva las subcategorías antes de desactivar la categoría');
      }

      const ticketCount = await catalogoRepository.countTicketsForCategoria(id);
      if (ticketCount > 0) {
        throw httpError(400, 'No se puede desactivar la categoría porque tiene tickets asociados');
      }
    }

    const updated = await catalogoRepository.updateCategoria(id, payload);
    if (!updated) {
      throw httpError(500, 'No se pudo actualizar la categoría');
    }
    return updated;
  }

  async listSubcategorias(options: ListOptions & { categoriaId?: number } = {}): Promise<CatalogoSubcategoria[]> {
    return catalogoRepository.listSubcategorias(options);
  }

  async createSubcategoria(input: SubcategoriaInput): Promise<CatalogoSubcategoria> {
    if (!input.categoriaId) {
      throw httpError(400, 'categoriaId es requerido');
    }
    if (!input.nombre || input.nombre.trim() === '') {
      throw httpError(400, 'nombre es requerido');
    }

    const categoria = await catalogoRepository.findCategoriaById(input.categoriaId);
    if (!categoria) {
      throw httpError(404, 'categoriaId no existe');
    }

    const nombre = input.nombre.trim();
    const codigo = (input.codigo || this.generateSubcategoriaCodigo(categoria.nombre, nombre)).toUpperCase();

    return catalogoRepository.createSubcategoria({
      ...input,
      nombre,
      codigo,
      heredaTipo: input.heredaTipo ?? true,
      requiereValidacion: input.requiereValidacion ?? false,
      activo: input.activo ?? true,
    });
  }

  async updateSubcategoria(id: number, input: Partial<SubcategoriaInput>): Promise<CatalogoSubcategoria> {
    const existing = await catalogoRepository.findSubcategoriaById(id);
    if (!existing) {
      throw httpError(404, 'Subcategoría no encontrada');
    }

    const payload: Partial<SubcategoriaInput> = { ...input };

    if (payload.nombre !== undefined) {
      if (payload.nombre === null || payload.nombre.trim() === '') {
        throw httpError(400, 'nombre no puede estar vacío');
      }
      payload.nombre = payload.nombre.trim();
    }

    if (payload.codigo !== undefined && payload.codigo.trim() === '') {
      throw httpError(400, 'codigo no puede estar vacío');
    }
    if (payload.codigo) {
      payload.codigo = payload.codigo.toUpperCase();
    }

    if (payload.categoriaId !== undefined) {
      const categoria = await catalogoRepository.findCategoriaById(payload.categoriaId);
      if (!categoria) {
        throw httpError(404, 'categoriaId no existe');
      }
      if (!payload.codigo && payload.nombre) {
        payload.codigo = this.generateSubcategoriaCodigo(categoria.nombre, payload.nombre).toUpperCase();
      }
    }

    if (payload.activo === false && existing.activo) {
      const ticketCount = await catalogoRepository.countTicketsForSubcategoria(id);
      if (ticketCount > 0) {
        throw httpError(400, 'No se puede desactivar la subcategoría porque tiene tickets asociados');
      }
    }

    const updated = await catalogoRepository.updateSubcategoria(id, payload);
    if (!updated) {
      throw httpError(500, 'No se pudo actualizar la subcategoría');
    }
    return updated;
  }

  private normalizeToken(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
  }

  private generateCategoriaCodigo(nombre: string): string {
    const token = this.normalizeToken(nombre) || 'CAT';
    return `CAT-${token.slice(0, 12)}`;
  }

  private generateSubcategoriaCodigo(nombreCategoria: string, nombreSubcategoria: string): string {
    const catToken = (this.normalizeToken(nombreCategoria) || 'CAT').slice(0, 3).padEnd(3, 'X');
    const subToken = (this.normalizeToken(nombreSubcategoria) || 'SUB').slice(0, 3).padEnd(3, 'X');
    return `SUB-${catToken}-${subToken}`;
  }
}

export default new CatalogoService();
