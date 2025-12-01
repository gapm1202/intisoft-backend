import * as repo from "../repositories/sede.repository";
import { Sede } from "../models/sede.model";

export const listSedes = async (empresaId: number): Promise<Sede[]> => {
  return repo.getAllByEmpresa(empresaId);
};

export const createSede = async (empresaId: number, data: Sede): Promise<Sede> => {
  return repo.createForEmpresa(empresaId, data);
};

export const updateSede = async (id: number, data: Partial<Sede>): Promise<Sede | null> => {
  return repo.updateById(id, data);
};

export const deleteSede = async (id: number): Promise<Sede | null> => {
  return repo.deleteById(id);
};

export const getSede = async (id: number): Promise<Sede | null> => {
  return repo.getById(id);
};
