export interface Foto {
  url: string;
  descripcion?: string;
}

export interface Traslado {
  id: number;
  activoId: number;
  empresaId: number;
  sedeOrigenId: number | null;
  sedeDestinoId: number | null;
  areaDestino: string | null;
  fechaTraslado: string;
  responsableEnvia: string;
  responsableRecibe: string;
  motivo: string;
  estadoEquipo: string;
  especificarFalla?: string;
  observaciones?: string;
  fotos: Foto[];
  createdAt: Date;
}

export interface CreateTrasladoDto {
  activoId: number;
  empresaId: string;
  sedeOrigenId: string;
  sedeDestino: string;
  areaDestino?: string;
  fechaTraslado: string;
  responsableEnvia: string;
  responsableRecibe: string;
  motivo: string;
  estadoEquipo: string;
  especificarFalla?: string;
  observaciones?: string;
  fotos?: Foto[];
}
