import { Request, Response } from "express";
import * as service from "../services/contract.service";
import { ContractCreateInput, ContractEstado } from "../models/contract.model";
import multer from "multer";
import path from "path";

// Multer config para documentos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
export const uploadDocs = multer({ storage });

const parseDate = (value: any): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

export const list = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const items = await service.listContracts(empresaId);
    res.json(items);
  } catch (error) {
    console.error("Error list contracts:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const item = await service.getContract(contractId);
    if (!item) return res.status(404).json({ message: "Contrato no encontrado" });
    res.json(item);
  } catch (error) {
    console.error("Error get contract:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getActive = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const item = await service.getActiveContract(empresaId);
    if (!item) return res.status(404).json({ message: "No hay contrato activo para esta empresa" });
    res.json(item);
  } catch (error) {
    console.error("Error get active contract:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const user = (req as any).user;
    const body = req.body || {};

    const fechaInicio = parseDate(body.fechaInicio);
    const fechaFin = parseDate(body.fechaFin);
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "fechaInicio y fechaFin son requeridas y deben ser fechas válidas (YYYY-MM-DD)" });
    }

    const payload: ContractCreateInput = {
      empresaId,
      tipoContrato: body.tipoContrato,
      estadoContrato: body.estadoContrato || 'activo',
      fechaInicio,
      fechaFin,
      renovacionAutomatica: Boolean(body.renovacionAutomatica),
      responsableComercial: body.responsableComercial ? String(body.responsableComercial).trim() : null,
      observaciones: body.observaciones ? String(body.observaciones).trim() : null,
      services: body.services || null,
      preventivePolicy: body.preventivePolicy || null,
      economics: body.economics || null,
      documents: Array.isArray(body.documents) ? body.documents : undefined,
      usuario: user?.email,
      createdBy: user?.email,
    } as any;

    const created = await service.createContract(payload);
    res.status(201).json(created);
  } catch (error: any) {
    console.error("Error create contract:", error);
    if (error && (error.code === '23505' || error.code === 23505)) {
      return res.status(400).json({ message: "Ya existe un contrato activo para esta empresa" });
    }
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const updateEstado = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const { estado, motivo } = req.body || {};
    if (!estado) return res.status(400).json({ message: "estado es requerido" });
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const user = (req as any).user;
    const updated = await service.updateEstado(contractId, estado as ContractEstado, motivo.trim(), user?.email);
    if (!updated) return res.status(404).json({ message: "Contrato no encontrado" });
    res.json(updated);
  } catch (error: any) {
    console.error("Error update estado contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const updateGeneral = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const user = (req as any).user;
    const { motivo, ...rest } = req.body || {};
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const updated = await service.updateGeneral(contractId, rest, motivo.trim(), user?.email);
    if (!updated) return res.status(404).json({ message: "Contrato no encontrado" });
    res.json(updated);
  } catch (error: any) {
    console.error("Error update general contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const updateServices = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const user = (req as any).user;
    const { motivo, ...rest } = req.body || {};
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const updated = await service.updateServices(contractId, rest as any, motivo.trim(), user?.email);
    res.json(updated);
  } catch (error: any) {
    console.error("Error update services contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const updatePreventive = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const user = (req as any).user;
    const { motivo, ...rest } = req.body || {};
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const updated = await service.updatePreventive(contractId, rest as any, motivo.trim(), user?.email);
    res.json(updated);
  } catch (error: any) {
    console.error("Error update preventive contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const updateEconomics = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const user = (req as any).user;
    const { motivo, ...rest } = req.body || {};
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const updated = await service.updateEconomics(contractId, rest as any, motivo.trim(), user?.email);
    res.json(updated);
  } catch (error: any) {
    console.error("Error update economics contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const uploadDocuments = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const user = (req as any).user;
    const motivo = (req.body && req.body.motivo) ? String(req.body.motivo).trim() : '';
    if (!motivo) {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const tipo = (req.body && req.body.tipo) ? String(req.body.tipo).trim() : 'otro';
    const files = (req as any).files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Se requiere al menos un archivo" });
    }

    const saved: any[] = [];
    for (const f of files) {
      const doc = await service.addDocument(contractId, {
        filename: f.originalname,
        path: f.filename,
        mimeType: f.mimetype,
        sizeBytes: f.size,
        tipo,
      }, motivo, user?.email);
      saved.push(doc);
    }

    res.status(201).json(saved);
  } catch (error: any) {
    console.error("Error upload documents contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const docId = parseInt(req.params.docId);
    const user = (req as any).user;
    const { motivo } = req.body || req.query || {} as any;
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const deleted = await service.deleteDocument(contractId, docId, motivo.trim(), user?.email);
    if (!deleted) return res.status(404).json({ message: "Documento no encontrado" });
    res.json({ message: "Documento eliminado", data: deleted });
  } catch (error: any) {
    console.error("Error delete document contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const renew = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const contractId = parseInt(req.params.contractId);
    const user = (req as any).user;
    const body = req.body || {};
    const { motivo } = body;
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido" });
    }
    const fechaInicio = parseDate(body.fechaInicio);
    const fechaFin = parseDate(body.fechaFin);
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "fechaInicio y fechaFin son requeridas" });
    }
    const payload: ContractCreateInput = {
      empresaId,
      tipoContrato: body.tipoContrato,
      estadoContrato: body.estadoContrato || 'activo',
      fechaInicio,
      fechaFin,
      renovacionAutomatica: Boolean(body.renovacionAutomatica),
      responsableComercial: body.responsableComercial ? String(body.responsableComercial).trim() : null,
      observaciones: body.observaciones ? String(body.observaciones).trim() : null,
      services: body.services || null,
      preventivePolicy: body.preventivePolicy || null,
      economics: body.economics || null,
      documents: Array.isArray(body.documents) ? body.documents : undefined,
      usuario: user?.email,
      createdBy: user?.email,
    } as any;

    const result = await service.renewContract(empresaId, contractId, payload, motivo.trim(), user?.email);
    if (!result) return res.status(404).json({ message: "Contrato no encontrado" });
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error renew contract:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const history = await service.getContractHistory(contractId);
    res.json(history);
  } catch (error: any) {
    console.error("Error getting contract history:", error);
    res.status(500).json({ message: error?.message || "Error en el servidor" });
  }
};
