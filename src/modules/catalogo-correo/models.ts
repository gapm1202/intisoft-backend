// Modelos para catálogo de correos

// ============ PLATAFORMAS CORREO ============

export interface PlataformaCorreo {
  id: number;
  codigo: string;
  nombre: string;
  tipoPlataforma: string;
  tipoPlataformaPersonalizado?: string | null;
  permiteReasignar: boolean;
  permiteConservar: boolean;
  observaciones?: string | null;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlataformaCorreoInput {
  nombre: string;
  tipoPlataforma: string; // Cloud, On-Premise, Otro
  tipoPlataformaPersonalizado?: string;
  permiteReasignar?: boolean;
  permiteConservar?: boolean;
  observaciones?: string;
}

export interface PlataformaCorreoUpdateInput {
  nombre?: string;
  tipoPlataforma?: string;
  tipoPlataformaPersonalizado?: string;
  permiteReasignar?: boolean;
  permiteConservar?: boolean;
  observaciones?: string;
  activo?: boolean;
}

// ============ TIPOS CORREO ============

export interface TipoCorreo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TipoCorreoInput {
  nombre: string;
  descripcion?: string;
}

export interface TipoCorreoUpdateInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

// ============ PROTOCOLOS CORREO ============

export interface ProtocoloCorreo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProtocoloCorreoInput {
  nombre: string;
  descripcion?: string;
}

export interface ProtocoloCorreoUpdateInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}
