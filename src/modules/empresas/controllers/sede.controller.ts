import { Request, Response } from "express";
import * as service from "../services/sede.service";
import * as historialService from "../services/historial.service";


export const list = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    // Check query parameter to include inactive sedes
    const includeInactive = req.query.incluirInactivas === 'true' || req.query.includeInactive === 'true';
    const items = await service.listSedes(empresaId, includeInactive);
    res.json(items);
  } catch (error) {
    console.error("Error list sedes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const data = req.body;
    // Basic validation
    if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim() === '') {
      return res.status(400).json({ message: 'nombre es requerido' });
    }
    if (!data.direccion || typeof data.direccion !== 'string' || data.direccion.trim() === '') {
      return res.status(400).json({ message: 'direccion es requerida' });
    }

    // Parse responsables array if provided
    const parseArrayField = (v: any) => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    const toCreate = {
      nombre: String(data.nombre).trim(),
      codigoInterno: data.codigoInterno ? String(data.codigoInterno).trim() : undefined,
      direccion: String(data.direccion).trim(),
      ciudad: data.ciudad ? String(data.ciudad).trim() : undefined,
      provincia: data.provincia ? String(data.provincia).trim() : undefined,
      telefono: data.telefono ? String(data.telefono).trim() : undefined,
      email: data.email ? String(data.email).trim() : undefined,
      tipo: data.tipo ? String(data.tipo).trim() : undefined,
      // Legacy fields (support backward compatibility)
      responsable: data.responsable ? String(data.responsable).trim() : undefined,
      cargoResponsable: data.cargoResponsable ? String(data.cargoResponsable).trim() : undefined,
      telefonoResponsable: data.telefonoResponsable ? String(data.telefonoResponsable).trim() : undefined,
      emailResponsable: data.emailResponsable ? String(data.emailResponsable).trim() : undefined,
      // New fields
      responsables: parseArrayField(data.responsables),
      horarioAtencion: data.horarioAtencion ? String(data.horarioAtencion).trim() : undefined,
      observaciones: data.observaciones ? String(data.observaciones).trim() : undefined,
      autorizaIngresoTecnico: data.autorizaIngresoTecnico !== undefined ? Boolean(data.autorizaIngresoTecnico) : false,
      autorizaMantenimientoFueraHorario: data.autorizaMantenimientoFueraHorario !== undefined ? Boolean(data.autorizaMantenimientoFueraHorario) : false,
      autorizaSupervisionCoordinacion: data.autorizaSupervisionCoordinacion !== undefined ? Boolean(data.autorizaSupervisionCoordinacion) : true,
    };

    const created = await service.createSede(empresaId, toCreate as any);
    res.status(201).json(created);
  } catch (error) {
    console.error("Error create sede:", error);
    const err: any = error;
    // Handle unique constraint violation for codigo_interno
    if (err && (err.code === "23505" || err.code === 23505)) {
      const detail = err.detail || "";
      if (detail.includes("codigo_interno")) {
        return res.status(400).json({ message: "El código interno ya existe" });
      }
      return res.status(400).json({ message: "Violación de unicidad" });
    }
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const sedeId = parseInt(req.params.sedeId);
    const data = req.body;
    
    // Validate motivo (required for audit trail)
    if (!data.motivo || typeof data.motivo !== 'string' || data.motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido y no puede estar vacío" });
    }
    const motivo = data.motivo.trim();
    
    // Prepare update payload (skip motivo from the update itself)
    const toUpdate: any = {};
    const simpleFields = ['nombre', 'codigoInterno', 'direccion', 'ciudad', 'provincia', 'telefono', 'email', 'tipo', 'responsable', 'cargoResponsable', 'telefonoResponsable', 'emailResponsable', 'horarioAtencion', 'observaciones'];
    for (const f of simpleFields) {
      if (data[f] !== undefined && data[f] !== null) {
        toUpdate[f] = typeof data[f] === 'string' ? data[f].trim() : data[f];
      }
    }

    // Handle array fields (responsables)
    const parseArrayField = (v: any) => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      }
      return undefined;
    };

    if (data.responsables !== undefined) {
      toUpdate.responsables = parseArrayField(data.responsables);
    }

    // Handle boolean fields
    if (data.autorizaIngresoTecnico !== undefined) {
      toUpdate.autorizaIngresoTecnico = Boolean(data.autorizaIngresoTecnico);
    }
    if (data.autorizaMantenimientoFueraHorario !== undefined) {
      toUpdate.autorizaMantenimientoFueraHorario = Boolean(data.autorizaMantenimientoFueraHorario);
    }

    // Fetch current sede to compute diff
    const existing = await service.getSede(sedeId);
    if (!existing) return res.status(404).json({ message: "Sede no encontrada" });

    const updated = await service.updateSede(sedeId, toUpdate);
    if (!updated) return res.status(404).json({ message: "Sede no encontrada" });

    // Compute changed fields (old -> new)
    const changes: Record<string, any> = {};
    for (const key of Object.keys(toUpdate)) {
      const oldKey = key === 'cargoResponsable' ? 'cargoResponsable' : key;
      const oldVal = (existing as any)[oldKey];
      const newVal = (toUpdate as any)[key];
      changes[key] = { old: oldVal === undefined ? null : oldVal, new: newVal === undefined ? null : newVal };
    }

    // Record historial with user info and changes
    const user = (req as any).user;
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    try {
      await historialService.createHistorial(
        empresaId,
        user.email,
        user.nombre,
        motivo,
        'EDITAR_SEDE',
        changes
      );
    } catch (histErr) {
      console.error("Warning: historial not recorded:", histErr);
    }

    res.json(updated);
  } catch (error) {
    console.error("Error update sede:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const toggleActivo = async (req: Request, res: Response) => {
  try {
    const sedeId = parseInt(req.params.sedeId);
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    
    // Validar body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: "Body es requerido" });
    }

    const { activo, motivo } = req.body;

    // Validar activo (debe ser boolean)
    if (activo === undefined || activo === null || typeof activo !== 'boolean') {
      return res.status(400).json({ message: "activo es requerido y debe ser boolean (true/false)" });
    }

    // Validar motivo
    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido y no puede estar vacío" });
    }
    const motivoTrimmed = motivo.trim();
    
    // Fetch current sede
    const current = await service.getSede(sedeId);
    if (!current) return res.status(404).json({ message: "Sede no encontrada" });

    // Prevent toggling if already in desired state (optional - can be removed)
    if (current.activo === activo) {
      return res.status(400).json({ 
        message: `Sede ya está ${activo ? 'activa' : 'inactiva'}` 
      });
    }

    // Record historial (nuevo registro por evento)
    const user = (req as any).user;
    try {
      await historialService.createHistorial(
        empresaId,
        user.email,
        user.nombre,
        motivoTrimmed,
        activo ? 'activar_sede' : 'desactivar_sede',
        {
          tipo: 'sede',
          destino: current.nombre,
          sedeId,
          anterior: { activo: current.activo, motivo: current.motivo },
          nuevo: { activo, motivo: motivoTrimmed }
        }
      );
    } catch (histErr) {
      console.error("Warning: historial not recorded:", histErr);
    }

    // Update sede activo status (soft delete/reactivate)
    const updated = await service.toggleActivoSede(sedeId, activo, motivoTrimmed);
    if (!updated) return res.status(404).json({ message: "Sede no encontrada" });
    
    res.json({ 
      message: activo ? "Sede reactivada" : "Sede desactivada", 
      data: updated 
    });
  } catch (error) {
    console.error("Error toggle sede activo:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const sedeId = parseInt(req.params.sedeId);
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    
    // Aceptar motivo desde el body o desde query
    const motivoRaw = req.body?.motivo ?? req.query?.motivo;

    // Log for debugging
    console.log(`[DELETE SEDE] sedeId=${sedeId}, empresaId=${empresaId}, motivo=${motivoRaw || 'NO PROVIDED'}, body=${JSON.stringify(req.body)}, query=${JSON.stringify(req.query)}`);

    // Validar que el motivo sea obligatorio y no esté vacío
    if (!motivoRaw || typeof motivoRaw !== 'string' || motivoRaw.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido y no puede estar vacío" });
    }
    const motivo = motivoRaw.trim();
    
    // Fetch current sede to include in historial
    const current = await service.getSede(sedeId);
    if (!current) return res.status(404).json({ message: "Sede no encontrada" });

    // Record historial including the deleted record snapshot
    const user = (req as any).user;
    try {
      await historialService.createHistorial(
        empresaId,
        user.email,
        user.nombre,
        motivo,
        'ELIMINAR_SEDE',
        { deleted: current }
      );
    } catch (histErr) {
      console.error("Warning: historial not recorded:", histErr);
    }

    // Now physically delete the sede
    const deletedSede = await service.deleteSede(sedeId);
    if (!deletedSede) return res.status(404).json({ message: "Sede no encontrada" });
    
    res.json({ message: "Sede eliminada", data: deletedSede });
  } catch (error) {
    console.error("Error delete sede:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
