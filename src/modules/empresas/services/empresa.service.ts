import * as repo from "../repositories/empresa.repository";
import * as sedeService from "./sede.service";
import { Empresa } from "../models/empresa.model";
import { pool } from "../../../config/db";

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
  // Generate codigoCliente if not provided - find first available number (handle gaps from deletions)
  if (!data.codigoCliente) {
    // For now, use simple query without try/catch for debugging
    // Get all existing codigoCliente values and extract numbers
    const existingCodes = await pool.query(
      `SELECT codigo_cliente FROM empresas WHERE codigo_cliente IS NOT NULL ORDER BY codigo_cliente`
    );
    
    const usedNumbers = new Set<number>();
    for (const row of existingCodes.rows) {
      const match = (row.codigo_cliente as string).match(/^CLI-(\d+)$/);
      if (match) {
        usedNumbers.add(parseInt(match[1], 10));
      }
    }
    
    // Find first available number starting from 1
    let nextNum = 1;
    while (usedNumbers.has(nextNum)) {
      nextNum++;
    }
    
    data.codigoCliente = `CLI-${String(nextNum).padStart(3, '0')}`;
  }
  return repo.create(data);
};

export const updateEmpresa = async (id: number, data: Partial<Empresa>): Promise<Empresa | null> => {
  return repo.updateById(id, data);
};

export const deleteEmpresa = async (id: number): Promise<boolean> => {
  return repo.deleteById(id);
};
