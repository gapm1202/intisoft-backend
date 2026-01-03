export interface ContactoAdmin {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
}

export interface ContactoTecnico {
  nombre: string;
  cargo?: string;
  telefono1?: string;
  telefono2?: string;
  email?: string;
  contactoPrincipal?: boolean;
  horarioDisponible?: string;
  autorizaCambiosCriticos?: boolean;
  nivelAutorizacion?: string;
  supervisionCoordinacion?: boolean; // Nuevo campo
}

export interface Empresa {
  id?: number;
  nombre: string;
  codigo?: string; // Código corto para generar asset codes (ej. "IME")
  codigoCliente?: string; // Código cliente auto-generado (CLI-001, CLI-002, etc.)
  ruc?: string;
  direccionFiscal?: string;
  direccionOperativa?: string;
  ciudad?: string;
  provincia?: string;
  tipoEmpresa?: string; // sector empresarial
  paginaWeb?: string;
  contactosAdmin?: ContactoAdmin[];
  contactosTecnicos?: ContactoTecnico[];
  observacionesGenerales?: string;
  autorizacionFacturacion?: boolean;
  creado_en?: Date;
}
