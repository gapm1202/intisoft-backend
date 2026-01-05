// ============================================================================
// Modelo: UsuarioHistorial
// ============================================================================
// Propósito: Representar el historial de cambios en usuarios
// Tabla: usuarios_historial
// ============================================================================

export interface UsuarioHistorial {
  historialId?: number;
  empresaId: number;
  usuarioId: number;
  accion: AccionHistorial;
  campoModificado?: string | null;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  motivo: string;
  observacionAdicional?: string | null;
  realizadoPor?: number | null;
  nombreQuienRealizo?: string | null;
  fechaCambio?: Date;
  ipOrigen?: string | null;
  createdAt?: Date;
}

export type AccionHistorial = 
  | 'CREACION' 
  | 'EDICION' 
  | 'ASIGNACION_ACTIVO' 
  | 'CAMBIO_ACTIVO' 
  | 'DESACTIVACION'
  | 'LIBERACION_ACTIVO';

export interface RegistroHistorialParams {
  empresaId: number;
  usuarioId: number;
  accion: AccionHistorial;
  motivo: string;
  campoModificado?: string;
  valorAnterior?: any;
  valorNuevo?: any;
  observacionAdicional?: string;
  realizadoPor?: number;
  nombreQuienRealizo?: string;
  ipOrigen?: string;
}

export interface HistorialResponse {
  historialId: string;
  accion: AccionHistorial;
  campoModificado?: string | null;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  motivo: string;
  observacionAdicional?: string | null;
  realizadoPor?: string | null;
  nombreQuienRealizo?: string | null;
  fechaCambio: string;
  ipOrigen?: string | null;
}

export interface HistorialListResponse {
  success: boolean;
  data: HistorialResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
