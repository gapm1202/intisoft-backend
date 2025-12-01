export interface Historial {
  id: number;
  empresaId: number;
  fecha: Date;
  usuario?: string;
  nombreUsuario?: string;
  motivo?: string;
  accion: 'EDITAR_EMPRESA' | 'EDITAR_SEDE' | 'ELIMINAR_SEDE';
  changes?: Record<string, any> | null;
}
