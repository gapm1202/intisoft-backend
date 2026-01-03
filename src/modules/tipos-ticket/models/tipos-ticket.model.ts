export interface TipoTicket {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TipoTicketInput {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface TipoTicketUpdateInput {
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
}
