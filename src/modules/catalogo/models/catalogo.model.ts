export interface CatalogoCategoria {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  visibleEnTickets: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogoSubcategoria {
  id: number;
  categoriaId: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  requiereValidacion: boolean;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoriaInput {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  visibleEnTickets?: boolean;
}

export interface SubcategoriaInput {
  categoriaId: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  requiereValidacion?: boolean;
  activo?: boolean;
}
