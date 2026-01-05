// Modelos para usuarios de empresas

export interface UsuarioEmpresa {
  id: number;
  _id: string; // Para compatibilidad con frontend
  empresaId: string;
  sedeId: string;
  nombreCompleto: string;
  correo: string;
  cargo?: string;
  telefono?: string;
  observaciones?: string;
  activoAsignadoId?: string | null;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Campos relacionados (JOIN)
  sedeName?: string;
  empresaName?: string;
  activoCodigo?: string;
  activoNombre?: string;
  activoModelo?: string;
  
  // Campos M:N (relación muchos a muchos con activos)
  activosAsignados?: any[];
  cantidadActivosAsignados?: number;
}

export interface UsuarioEmpresaInput {
  empresaId: string;
  sedeId: string;
  nombreCompleto: string;
  correo: string;
  cargo?: string;
  telefono?: string;
  observaciones?: string;
  activoAsignadoId?: string | null;
}

export interface UsuarioEmpresaUpdateInput {
  sedeId?: string;
  nombreCompleto?: string;
  correo?: string;
  cargo?: string;
  telefono?: string;
  observaciones?: string;
  activoAsignadoId?: string | null;
  activo?: boolean;
}
