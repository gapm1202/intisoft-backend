export interface Historial {
  id: number;
  empresaId: number;
  fecha: Date;
  usuario?: string;
  nombreUsuario?: string;
  motivo?: string;
  accion: 'EDITAR_EMPRESA' | 'EDITAR_SEDE' | 'ELIMINAR_SEDE' | 'DESACTIVAR_SEDE' | 'REACTIVAR_SEDE' | 'desactivar_sede' | 'activar_sede' | 'editar_empresa';
  changes?: Record<string, any> | null;
}
