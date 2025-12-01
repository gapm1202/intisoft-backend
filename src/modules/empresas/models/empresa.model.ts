export interface ContactoAdministrativo {
  nombreCompleto: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  observaciones?: string;
}

export interface ContactoTecnico {
  nombreCompleto: string;
  cargo?: string;
  telefono1?: string;
  telefono2?: string;
  email?: string;
  nivelAutorizacion?: string;
}

export interface Empresa {
  id?: number;
  nombre: string;
  ruc?: string;
  direccion?: string; // legacy/general address
  direccionFiscal?: string;
  direccionOperativa?: string;
  ciudad?: string;
  razonSocial?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  tipoEmpresa?: string; // sector empresarial
  paginaWeb?: string;
  estadoContrato?: 'Activo' | 'Suspendido' | 'No renovado';
  contactosAdministrativos?: ContactoAdministrativo[];
  contactosTecnicos?: ContactoTecnico[];
  creado_en?: Date;
}
