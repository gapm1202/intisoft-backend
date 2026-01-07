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
  
  // Nuevos campos - Migration 070
  codigoUsuario?: string; // Código autogenerado: {EMPRESA_PREFIX}-USR-{CONTADOR}
  tipoDocumento?: string; // DNI, CE, Pasaporte, etc.
  numeroDocumento?: string; // Número de documento
  areaId?: string | null; // FK a tabla areas
  
  // Migration 071
  tipoDocumentoPersonalizado?: string; // Tipo personalizado cuando tipoDocumento = 'Otro'
  
  // Campos relacionados (JOIN)
  sedeName?: string;
  empresaName?: string;
  activoCodigo?: string;
  activoNombre?: string;
  activoModelo?: string;
  areaNombre?: string; // Nombre del área (JOIN)
  
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
  activosIds?: string[]; // Array de IDs de activos para asignación M:N
  // Nuevos campos
  tipoDocumento: string; // Obligatorio
  numeroDocumento: string; // Obligatorio
  areaId?: string | null; // Opcional
  tipoDocumentoPersonalizado?: string; // Obligatorio cuando tipoDocumento = 'Otro'
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
  // Nuevos campos
  tipoDocumento?: string;
  numeroDocumento?: string;
  areaId?: string | null;
  tipoDocumentoPersonalizado?: string;
}
