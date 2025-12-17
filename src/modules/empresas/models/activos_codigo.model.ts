// Models for activos codigo management

export interface CodigoSequence {
  id: number;
  empresa_id: number;
  categoria_id: number;
  next_number: number;
  created_at: string;
  updated_at: string;
}

export interface CodigoReserved {
  id: number;
  empresa_id: number;
  codigo: string;
  categoria_id: number;
  sequence_number: number;
  reserved_at: string;
  expires_at: string;
  user_id?: number;
  confirmed: boolean;
  activo_id?: number;
  created_at: string;
  updated_at: string;
}

export interface NextCodeResponse {
  code: string;
  sequence_number: number;
  reservation_id: number;
  expires_at: string;
}
