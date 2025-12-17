export type ContractEstado = 'activo' | 'suspendido' | 'vencido' | 'historico';
export type TipoContrato = 'servicios' | 'bolsa_horas' | 'proyecto' | 'otro';

export interface ContractBase {
  id?: number;
  empresaId: number;
  tipoContrato: TipoContrato;
  estadoContrato: ContractEstado;
  fechaInicio: string; // ISO date (YYYY-MM-DD)
  fechaFin: string;   // ISO date (YYYY-MM-DD)
  renovacionAutomatica?: boolean;
  responsableComercial?: string | null;
  observaciones?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface ContractServices {
  soporteRemoto?: boolean;
  soportePresencial?: boolean;
  mantenimientoPreventivo?: boolean;
  gestionInventario?: boolean;
  gestionCredenciales?: boolean;
  monitoreo?: boolean;
  informesMensuales?: boolean;
  gestionAccesos?: boolean;
  horasMensualesIncluidas?: number | null;
  excesoHorasFacturable?: boolean;
}

export interface ContractPreventivePolicy {
  incluyePreventivo?: boolean;
  frecuencia?: '3m' | '6m' | '8m' | '12m' | null;
  modalidad?: 'presencial' | 'remoto' | 'mixto' | null;
  aplica?: 'todos' | 'categoria' | null;
  observaciones?: string | null;
}

export interface ContractEconomics {
  tipoFacturacion: 'mensual' | 'por_evento' | 'por_horas';
  montoReferencial?: number | null;
  moneda: 'PEN' | 'USD';
  diaFacturacion?: number | null;
  observaciones?: string | null;
}

export interface ContractDocument {
  id?: number;
  contractId?: number;
  filename?: string;
  nombre?: string; // Para el frontend
  path?: string;
  url?: string; // Para el frontend
  mimeType?: string | null;
  sizeBytes?: number | null;
  tipo: 'contrato_firmado' | 'anexo' | 'addenda' | 'otro' | 'contrato'; // Aceptar ambos para compatibilidad
  uploadedAt?: string;
  fechaSubida?: string; // Para el frontend
  uploadedBy?: string | null;
  usuarioSubida?: string | null; // Para el frontend
  version?: string | null;
}

export interface ContractHistoryEntry {
  id?: number;
  contractId: number;
  campo: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  fecha?: string;
  usuario?: string | null;
  motivo: string;
  tipoAccion?: 'ELIMINACION' | 'CREACION' | 'EDICION'; // Para el frontend
  tipoCambio: 'estado' | 'fecha' | 'servicio' | 'renovacion' | 'documento' | 'economico' | 'preventivo' | 'general' | 'otro';
}

export interface ContractWithDetails extends ContractBase {
  services?: ContractServices | null;
  preventivePolicy?: ContractPreventivePolicy | null;
  economics?: ContractEconomics | null;
  documents?: ContractDocument[];
  history?: ContractHistoryEntry[];
}

export interface ContractCreateInput extends Omit<ContractBase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> {
  services?: ContractServices | null;
  preventivePolicy?: ContractPreventivePolicy | null;
  economics?: ContractEconomics | null;
  documents?: ContractDocument[];
  usuario?: string | null;
  createdBy?: string | null;
}
