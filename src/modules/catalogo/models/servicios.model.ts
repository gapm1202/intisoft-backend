// Modelos para el catálogo de servicios

export interface TipoServicio {
  id?: number;
  tipo: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TipoServicioInput {
  tipo: string;
  activo?: boolean;
}

export interface Servicio {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoServicio: string;
  activo: boolean;
  visibleEnTickets: boolean;
  creadoPor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServicioInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoServicio: string;
  activo?: boolean;
  visibleEnTickets?: boolean;
  creadoPor?: string;
}

export interface ServicioUpdateInput {
  nombre?: string;
  descripcion?: string;
  tipoServicio?: string;
  activo?: boolean;
  visibleEnTickets?: boolean;
}

export interface ServicioStats {
  total: number;
  activos: number;
  inactivos: number;
  visiblesEnTickets: number;
  porTipo: {
    tipo: string;
    count: number;
  }[];
}
