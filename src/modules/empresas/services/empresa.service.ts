import * as repo from "../repositories/empresa.repository";
import * as sedeService from "./sede.service";
import { Empresa } from "../models/empresa.model";

export const listEmpresas = async (): Promise<Empresa[]> => {
  return repo.getAll();
};

export const getEmpresa = async (id: number): Promise<Empresa | null> => {
  const empresa = await repo.getById(id);
  if (!empresa) return null;
  // attach sedes
  try {
    const sedes = await sedeService.listSedes(id);
    (empresa as any).sedes = sedes;
  } catch (err) {
    // ignore sedes errors to not break empresa retrieval
    console.error('Could not load sedes for empresa', id, err);
  }
  return empresa;
};

export const createEmpresa = async (data: Empresa): Promise<Empresa> => {
  return repo.create(data);
};

export const updateEmpresa = async (id: number, data: Partial<Empresa>): Promise<Empresa | null> => {
  return repo.updateById(id, data);
};

export const deleteEmpresa = async (id: number): Promise<boolean> => {
  return repo.deleteById(id);
};
