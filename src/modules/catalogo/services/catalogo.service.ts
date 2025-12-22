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

    // Normalizar y validar tipoTicket si fue provisto
    if (input.tipoTicket !== undefined && input.tipoTicket !== null) {
      if (String(input.tipoTicket).trim() === '') throw httpError(400, 'tipo inválido');
      const tipo = this.normalizeTipo(String(input.tipoTicket));
      const allowed = await this.listTipos();
      if (!allowed.includes(tipo)) throw httpError(400, 'tipo inválido');
      input.tipoTicket = tipo;
    }

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

    // Normalizar y validar tipoTicket si viene
    if (payload.tipoTicket !== undefined) {
      if (payload.tipoTicket === null || String(payload.tipoTicket).trim() === '') {
        throw httpError(400, 'tipo inválido');
      }
      const tipo = this.normalizeTipo(String(payload.tipoTicket));
      const allowed = await this.listTipos();
      if (!allowed.includes(tipo)) throw httpError(400, 'tipo inválido');
      payload.tipoTicket = tipo;
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

    // Normalizar y validar tipoTicket según heredaTipo
    const hereda = input.heredaTipo ?? true;
    const categoriaTipo = categoria.tipoTicket ? this.normalizeTipo(categoria.tipoTicket) : null;

    // Normalizar el tipo proporcionado (si viene) para evitar discrepancias en las comprobaciones
    const providedTipo = input.tipoTicket !== undefined && input.tipoTicket !== null ? this.normalizeTipo(String(input.tipoTicket)) : null;

    // DEBUG: registrar valores para diagnosticar validación de tipos
    console.info('[catalogo] createSubcategoria checks', { hereda, categoriaTipo, providedTipo });

    if (hereda) {
      if (!categoriaTipo) throw httpError(400, 'La categoría no tiene tipo definido');
      // Si el front envía tipo, normalizamos y requerimos que coincida con la categoría
      if (providedTipo && providedTipo !== categoriaTipo) {
        throw httpError(400, 'tipo no coincide con la categoría');
      }
      // No sobrescribimos el tipo enviado por el cliente: si vino, mantenemos la forma normalizada; si no, heredamos de la categoría
      input.tipoTicket = providedTipo ? providedTipo : categoriaTipo;
    } else if (input.tipoTicket !== undefined && input.tipoTicket !== null) {
      if (String(input.tipoTicket).trim() === '') throw httpError(400, 'tipo inválido');
      const tipo = this.normalizeTipo(String(input.tipoTicket));
      const allowed = await this.listTipos();
      if (!allowed.includes(tipo)) throw httpError(400, 'tipo inválido');
      input.tipoTicket = tipo;
    }

    const nombre = input.nombre.trim();
    const codigo = (input.codigo || this.generateSubcategoriaCodigo(categoria.nombre, nombre)).toUpperCase();

    // Debug log: record the resolved tipoTicket to detect overwrites
    const debugResolvedTipo = input.tipoTicket ?? null;
    console.info('[catalogo] createSubcategoria - categoria.tipoTicket:', { categoriaId: categoria.id, categoriaTipo: categoria.tipoTicket });
    console.info('[catalogo] createSubcategoria - resolved tipoTicket (will insert):', { tipo: debugResolvedTipo, hereda });

    const created = await catalogoRepository.createSubcategoria({
      ...input,
      nombre,
      codigo,
      heredaTipo: hereda,
      requiereValidacion: input.requiereValidacion ?? false,
      activo: input.activo ?? true,
    });

    // Post-insert validation: ensure the stored tipoTicket matches the expected resolved tipo
    const expectedTipo = input.tipoTicket !== undefined && input.tipoTicket !== null ? String(input.tipoTicket).trim().toLowerCase() : null;
    if (expectedTipo !== null) {
      const stored = await catalogoRepository.findSubcategoriaById(created.id);
      const storedTipo = stored?.tipoTicket ? String(stored.tipoTicket).trim().toLowerCase() : null;
      if (stored && storedTipo !== expectedTipo) {
        console.warn('[catalogo] tipo mismatch after insert, correcting', { subcategoriaId: created.id, expectedTipo, storedTipo });
        const corrected = await catalogoRepository.updateSubcategoria(created.id, { tipoTicket: expectedTipo });
        if (corrected) return corrected;
        // If correction failed, throw explicit error
        throw httpError(500, 'Tipo guardado no coincide con el esperado y no pudo corregirse');
      }
    }

    return created;
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

    // Si se cambia categoriaId o heredaTipo, verificar consistencia de tipos
    if (payload.categoriaId !== undefined) {
      const categoria = await catalogoRepository.findCategoriaById(payload.categoriaId);
      if (!categoria) {
        throw httpError(404, 'categoriaId no existe');
      }
      if (!payload.codigo && payload.nombre) {
        payload.codigo = this.generateSubcategoriaCodigo(categoria.nombre, payload.nombre).toUpperCase();
      }
      // Si heredaTipo queda true, setear tipo desde la nueva categoria
      if (payload.heredaTipo === true) {
        const catTipo = categoria.tipoTicket ? this.normalizeTipo(categoria.tipoTicket) : null;
        if (!catTipo) throw httpError(400, 'La categoría no tiene tipo definido');
        payload.tipoTicket = catTipo;
      }
    }

    // Si se actualiza heredaTipo sin cambiar categoria
    if (payload.heredaTipo === true && payload.categoriaId === undefined) {
      const categoria = await catalogoRepository.findCategoriaById(existing.categoriaId);
      const catTipo = categoria?.tipoTicket ? this.normalizeTipo(categoria.tipoTicket) : null;
      if (!catTipo) throw httpError(400, 'La categoría no tiene tipo definido');
      payload.tipoTicket = catTipo;
    }

    // Si heredaTipo es false pero se envía tipoTicket, normalizar y validar
    if ((payload.heredaTipo === false || payload.heredaTipo === undefined) && payload.tipoTicket !== undefined) {
      if (payload.tipoTicket === null || String(payload.tipoTicket).trim() === '') throw httpError(400, 'tipo inválido');
      const tipo = this.normalizeTipo(String(payload.tipoTicket));
      const allowed = await this.listTipos();
      if (!allowed.includes(tipo)) throw httpError(400, 'tipo inválido');
      payload.tipoTicket = tipo;
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

  async listTipos(): Promise<string[]> {
    return catalogoRepository.listTipos();
  }

  async createTipo(tipo: string): Promise<string> {
    if (!tipo || tipo.trim() === '') {
      throw httpError(400, 'tipo es requerido');
    }
    const normalized = this.normalizeTipo(tipo);
    const created = await catalogoRepository.createTipo(normalized);
    return created;
  }

  async deleteTipo(tipo: string): Promise<void> {
    if (!tipo || tipo.trim() === '') {
      throw httpError(400, 'tipo inválido');
    }
    await catalogoRepository.deleteTipo(this.normalizeTipo(tipo));
  }
  private normalizeTipo(value: string): string {
    return value.trim().toLowerCase();
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
