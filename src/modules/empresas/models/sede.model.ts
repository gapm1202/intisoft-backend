export interface Sede {
  id?: number;
  empresaId?: number;
  nombre: string;
  direccion: string;
  ciudad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  tipo?: 'principal' | 'secundaria' | 'sucursal' | 'almacen' | string;
  responsable?: string;
  cargoResponsable?: string;
  telefonoResponsable?: string;
  emailResponsable?: string;
  creado_en?: Date;
  deleted_at?: Date;
  motivo_eliminacion?: string;
}
