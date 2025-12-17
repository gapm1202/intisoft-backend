export interface ResponsableSede {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
}

export interface Sede {
  id?: number;
  empresaId?: number;
  nombre: string;
  codigoInterno?: string; // SED-XXX (auto-generated in backend)
  direccion: string;
  ciudad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  tipo?: 'principal' | 'secundaria' | 'sucursal' | 'almacen' | string;
  responsable?: string; // Legacy field
  cargoResponsable?: string; // Legacy field
  telefonoResponsable?: string; // Legacy field
  emailResponsable?: string; // Legacy field
  responsables?: ResponsableSede[]; // New field: multiple responsables
  horarioAtencion?: string;
  observaciones?: string;
  autorizaIngresoTecnico?: boolean;
  autorizaMantenimientoFueraHorario?: boolean;
  activo?: boolean; // Soft delete: true = active, false = inactive
  motivo?: string; // Reason for deactivation/reactivation
  creado_en?: Date;
  deleted_at?: Date;
  motivo_eliminacion?: string;
}
