export interface Categoria {
  id?: number;
  empresaId?: number;
  nombre: string;
  subcategorias?: string[];
  campos?: any[];
  creadoEn?: Date;
}

export interface Area {
  id?: number;
  empresaId: number;
  sedeId?: number;
  nombre: string;
  responsable?: string;
  creadoEn?: Date;
}

export interface RAM {
  tipo: string;
  capacidad: string;
}

export interface Storage {
  tipo: string;
  capacidad: string;
}

export interface Foto {
  id?: number;
  url: string;
  descripcion?: string;
}

export interface Inventario {
  id?: number;
  empresaId: number;
  sedeId?: number;
  sedeOriginalId?: number;
  trasladado?: boolean;
  empresaNombre?: string;
  sedeNombre?: string;
  categoriaId?: number;
  areaId?: number;
  categoria?: string;
  area?: string;
  assetId: string;
  fabricante?: string;
  modelo?: string;
  serie?: string;
  estadoActivo?: 'Activo' | 'Inactivo' | 'Mantenimiento' | 'Descartado';
  estadoOperativo?: 'Operativo' | 'No Operativo' | 'Reparación';
  fechaCompra?: Date;
  fechaFinGarantia?: Date;
  proveedor?: string;
  ip?: string;
  mac?: string;
  usuarioAsignado?: string;
  usuarioAsignadoId?: string | number | null;
  usuarioAsignadoData?: any; // Datos del usuario asignado (JOIN)
  usuariosAsignados?: any[];
  observaciones?: string;
  ram?: RAM[];
  storages?: Storage[];
  fotos?: Foto[] | any;
  especificacion?: Record<string, any>;
  camposPersonalizados?: Record<string, any>;
  camposPersonalizadosArray?: any[];
  purchaseDocumentUrl?: string | null;
  warrantyDocumentUrl?: string | null;
  purchaseDocumentDescription?: string | null;
  warrantyDocumentDescription?: string | null;
  antiguedadAnios?: number | null;
  antiguedadMeses?: number | null;
  antiguedadText?: string | null;
  etiquetaToken?: string | null;
  codigoAccesoRemoto?: string | null;
  creadoEn?: Date;
  actualizadoEn?: Date;
}
