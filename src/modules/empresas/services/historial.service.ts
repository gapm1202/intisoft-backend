import * as repository from "../repositories/historial.repository";
import { Historial } from "../models/historial.model";

export const createHistorial = async (
  empresaId: number,
  usuario: string | undefined,
  nombreUsuario: string | undefined,
  motivo: string | undefined,
  accion: 'EDITAR_EMPRESA' | 'EDITAR_SEDE' | 'ELIMINAR_SEDE',
  changes?: Record<string, any> | null
): Promise<Historial> => {
  return repository.create(empresaId, usuario, nombreUsuario, motivo, accion, changes || null);
};

export const getHistorialByEmpresa = async (empresaId: number): Promise<Historial[]> => {
  return repository.getByEmpresaId(empresaId);
};
