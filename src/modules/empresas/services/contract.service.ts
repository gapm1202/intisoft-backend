import dayjs from "dayjs";

export const getContratosProximosAVencer = async (dias: number, hoy: string) => {
  // Buscar contratos activos cuya fechaFin esté entre hoy y hoy+dias
  const rows = await repo.getContratosProximosAVencer(dias, hoy);
  // Calcular diasRestantes y filtrar
  return rows
    .map((c: any) => {
      const fechaFin = dayjs(c.fechaFin);
      const diasRestantes = fechaFin.diff(dayjs(hoy), 'day');
      return {
        ...c,
        diasRestantes,
      };
    })
    .filter((c: any) => c.diasRestantes >= 0 && c.diasRestantes <= dias)
    .sort((a: any, b: any) => a.diasRestantes - b.diasRestantes);
};
// Historial consolidado por empresa
export const getContractHistoryByEmpresa = async (empresaId: number) => {
  return repo.getContractHistoryByEmpresa(empresaId);
};
import {
  ContractBase,
  ContractCreateInput,
  ContractEstado,
  ContractWithDetails,
  ContractServices,
  ContractPreventivePolicy,
  ContractEconomics,
} from "../models/contract.model";
import * as repo from "../repositories/contract.repository";

const ESTADOS: ContractEstado[] = ['activo', 'suspendido', 'vencido', 'historico'];

export const listContracts = async (empresaId: number): Promise<ContractBase[]> => {
  const items = await repo.listByEmpresa(empresaId);
  const updated: ContractBase[] = [];
  for (const c of items) {
    updated.push(await repo.expireIfNeeded(c));
  }
  return updated;
};

export const getContract = async (contractId: number): Promise<ContractWithDetails | null> => {
  const item = await repo.getByIdWithDetails(contractId);
  if (!item) return null;
  // expire check
  await repo.expireIfNeeded(item as ContractBase);
  // return fresh details
  return repo.getByIdWithDetails(contractId);
};

export const getActiveContract = async (empresaId: number): Promise<ContractWithDetails | null> => {
  const activeId = await repo.getActiveByEmpresa(empresaId);
  if (!activeId) return null;
  return getContract(activeId);
};

export const createContract = async (input: ContractCreateInput): Promise<ContractWithDetails> => {
  // Calcular estado automáticamente según la fecha de fin
  let estado: ContractEstado | undefined = undefined;
  const hoy = new Date();
  if (input.estadoContrato === 'suspendido') {
    estado = 'suspendido';
  } else if (input.fechaFin) {
    const fechaFin = new Date(input.fechaFin);
    if (isNaN(fechaFin.getTime())) {
      throw new Error('fechaFin inválida');
    }
    if (input.fechaInicio && new Date(input.fechaFin) < new Date(input.fechaInicio)) {
      throw new Error('fechaFin debe ser mayor o igual a fechaInicio');
    }
    if (fechaFin >= hoy) {
      estado = 'activo';
    } else {
      estado = 'vencido';
    }
  }
  // Si no hay estado calculado, no incluir estadoContrato en el inputFinal
  const inputFinal = estado ? { ...input, estadoContrato: estado } : { ...input };
  // Ya no se exige horasMensualesIncluidas al crear contrato tipo bolsa_horas
  return repo.createContract(inputFinal);
};

export const updateEstado = async (
  contractId: number,
  nuevoEstado: ContractEstado,
  motivo: string,
  usuario?: string | null
): Promise<ContractBase | null> => {
  // Solo permitir cambiar manualmente a 'suspendido'
  if (nuevoEstado !== 'suspendido') {
    throw new Error('Solo se permite cambiar manualmente a estado "suspendido". Los estados "activo" y "vencido" son automáticos.');
  }
  return repo.updateEstado(contractId, nuevoEstado, motivo, usuario);
};

export const updateGeneral = async (
  contractId: number,
  data: Partial<ContractBase>,
  motivo: string,
  usuario?: string | null
) => {
  return repo.updateGeneral(contractId, data, motivo, usuario);
};

export const updateServices = async (
  contractId: number,
  data: ContractServices,
  motivo: string,
  usuario?: string | null
) => {
  if (data.horasMensualesIncluidas !== undefined && data.horasMensualesIncluidas !== null && data.horasMensualesIncluidas < 0) {
    throw new Error('horasMensualesIncluidas no puede ser negativa');
  }
  return repo.updateServices(contractId, data, motivo, usuario);
};

export const updatePreventive = async (
  contractId: number,
  data: ContractPreventivePolicy,
  motivo: string,
  usuario?: string | null
) => {
  return repo.updatePreventive(contractId, data, motivo, usuario);
};

export const updateEconomics = async (
  contractId: number,
  data: ContractEconomics,
  motivo: string,
  usuario?: string | null
) => {
  if (data.diaFacturacion !== undefined && data.diaFacturacion !== null) {
    if (data.diaFacturacion < 1 || data.diaFacturacion > 31) {
      throw new Error('diaFacturacion debe estar entre 1 y 31');
    }
  }
  if (data.montoReferencial !== undefined && data.montoReferencial !== null && Number(data.montoReferencial) <= 0) {
    throw new Error('montoReferencial debe ser mayor a 0');
  }
  return repo.updateEconomics(contractId, data, motivo, usuario);
};

export const addDocument = async (
  contractId: number,
  doc: any,
  motivo: string,
  usuario?: string | null
) => {
  return repo.addDocument(contractId, doc, motivo, usuario);
};

export const deleteDocument = async (
  contractId: number,
  docId: number,
  motivo: string,
  usuario?: string | null
) => {
  return repo.deleteDocument(contractId, docId, motivo, usuario);
};

export const renewContract = async (
  empresaId: number,
  contractId: number,
  data: ContractCreateInput,
  motivo: string,
  usuario?: string | null
) => {
  if (new Date(data.fechaFin) < new Date(data.fechaInicio)) {
    throw new Error('fechaFin debe ser mayor o igual a fechaInicio');
  }
  return repo.renewContract(empresaId, contractId, data, motivo, usuario);
};

export const getContractHistory = async (contractId: number) => {
  return repo.getContractHistory(contractId);
};
