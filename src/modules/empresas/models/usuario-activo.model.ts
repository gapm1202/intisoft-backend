// Modelo para la relación M:N entre usuarios y activos

export interface UsuarioActivoAsignacion {
  id: number;
  usuarioId: number;
  activoId: number;
  fechaAsignacion: Date;
  asignadoPor?: string;
  motivo?: string;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Datos relacionados (JOIN)
  usuarioData?: {
    id: number;
    nombreCompleto: string;
    correo: string;
    cargo?: string;
    telefono?: string;
  };
  
  activoData?: {
    id: number;
    assetId: string;
    nombre?: string;
    categoria?: string;
    modelo?: string;
  };
}

export interface AsignarUsuariosInput {
  usuarioIds: string[];
  motivo?: string;
  asignadoPor?: string;
}

export interface AsignarActivosInput {
  activoIds: string[];
  motivo?: string;
  asignadoPor?: string;
}

export interface DesasignarInput {
  motivo?: string;
}
