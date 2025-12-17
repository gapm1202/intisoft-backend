import { Request, Response } from "express";
import * as service from "../services/empresa.service";
import * as historialService from "../services/historial.service";


export const list = async (req: Request, res: Response) => {
  try {
    const items = await service.listEmpresas();
    // augment items with flat aliases for frontend convenience
    const mapped = items.map((it: any) => {
      // Support both old (contactosAdministrativos) and new (contactosAdmin) field names
      const adminArray = it.contactosAdmin || it.contactosAdministrativos || [];
      const techArray = it.contactosTecnicos || [];
      const admin = Array.isArray(adminArray) && adminArray.length > 0 ? adminArray[0] : null;
      const tech = Array.isArray(techArray) && techArray.length > 0 ? techArray[0] : null;
      return {
        ...it,
        sector: it.tipoEmpresa || undefined,
        adminNombre: admin ? (admin.nombre || admin.nombreCompleto) : undefined,
        adminCargo: admin ? admin.cargo : undefined,
        adminTelefono: admin ? admin.telefono : undefined,
        adminEmail: admin ? admin.email : undefined,
        tecNombre: tech ? (tech.nombre || tech.nombreCompleto) : undefined,
        tecCargo: tech ? tech.cargo : undefined,
        tecTelefono1: tech ? tech.telefono1 : undefined,
        tecTelefono2: tech ? tech.telefono2 : undefined,
        tecEmail: tech ? tech.email : undefined,
        nivelAutorizacion: tech ? tech.nivelAutorizacion : undefined,
      };
    });
    res.json(mapped);
  } catch (error) {
    console.error("Error list empresas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const item = await service.getEmpresa(id);
    if (!item) return res.status(404).json({ message: "Empresa no encontrada" });
    // Support both old (contactosAdministrativos) and new (contactosAdmin) field names
    const adminArray = (item as any).contactosAdmin || (item as any).contactosAdministrativos || [];
    const techArray = (item as any).contactosTecnicos || [];
    const admin = Array.isArray(adminArray) && adminArray.length > 0 ? adminArray[0] : null;
    const tech = Array.isArray(techArray) && techArray.length > 0 ? techArray[0] : null;
    const mapped = {
      ...item,
      sector: item.tipoEmpresa || undefined,
      adminNombre: admin ? (admin.nombre || admin.nombreCompleto) : undefined,
      adminCargo: admin ? admin.cargo : undefined,
      adminTelefono: admin ? admin.telefono : undefined,
      adminEmail: admin ? admin.email : undefined,
      tecNombre: tech ? (tech.nombre || tech.nombreCompleto) : undefined,
      tecCargo: tech ? tech.cargo : undefined,
      tecTelefono1: tech ? tech.telefono1 : undefined,
      tecTelefono2: tech ? tech.telefono2 : undefined,
      tecEmail: tech ? tech.email : undefined,
      nivelAutorizacion: tech ? tech.nivelAutorizacion : undefined,
    };
    res.json(mapped);
  } catch (error) {
    console.error("Error get empresa:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Collect validation errors to return a structured list
    const errors: Array<{ field: string; message: string }> = [];

    const required = ["nombre", "ruc", "direccionFiscal", "ciudad"];
    for (const field of required) {
      const val = data[field];
      const emptyString = typeof val === 'string' && val.trim() === '';
      if (val === undefined || val === null || emptyString) {
        errors.push({ field, message: `${field} es requerido` });
      }
    }

    // Normalize RUC: accept formatted input (with dashes/spaces) by stripping non-digits
    let rucClean: string | undefined;
    if (data.ruc !== undefined && data.ruc !== null) {
      rucClean = String(data.ruc).replace(/\D/g, '');
      const rucRegex = /^\d{10,13}$/;
      if (!rucRegex.test(rucClean)) {
        errors.push({ field: 'ruc', message: 'ruc inválido' });
      }
    }

    // Validate contactos arrays (optional) - accept arrays or JSON strings
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

    const contactosAdminInput = parseArrayField(data.contactosAdmin) as any[] | undefined;
    const contactosAdministrativos = parseArrayField(data.contactosAdministrativos) as any[] | undefined;
    const contactosTecnicos = parseArrayField(data.contactosTecnicos) as any[] | undefined;

    // Accept individual admin/tech fields from form and map them into the expected arrays
    const mapAdminFromFields = () => {
      const name = data.adminNombre || data.admin_name || data.adminNombre;
      if (!name && !data.adminEmail && !data.adminTelefono && !data.observaciones && !data.adminCargo) return undefined;
      return [{
        nombreCompleto: name ? String(name).trim() : '',
        cargo: data.adminCargo ? String(data.adminCargo).trim() : undefined,
        telefono: data.adminTelefono ? String(data.adminTelefono).trim() : undefined,
        email: data.adminEmail ? String(data.adminEmail).trim() : undefined,
        observaciones: data.observaciones ? String(data.observaciones).trim() : undefined,
      }];
    };

    const mapTechFromFields = () => {
      const name = data.tecNombre || data.tec_nombre || data.tecName;
      if (!name && !data.tecEmail && !data.tecTelefono1 && !data.tecTelefono2 && !data.nivelAutorizacion && !data.tecCargo) return undefined;
      return [{
        nombreCompleto: name ? String(name).trim() : '',
        cargo: data.tecCargo ? String(data.tecCargo).trim() : undefined,
        telefono1: data.tecTelefono1 ? String(data.tecTelefono1).trim() : undefined,
        telefono2: data.tecTelefono2 ? String(data.tecTelefono2).trim() : undefined,
        email: data.tecEmail ? String(data.tecEmail).trim() : undefined,
        nivelAutorizacion: data.nivelAutorizacion ? String(data.nivelAutorizacion).trim() : undefined,
      }];
    };

    const finalContactosAdministrativos = contactosAdministrativos ?? mapAdminFromFields();
    const finalContactosAdmin = contactosAdminInput ?? finalContactosAdministrativos;
    const finalContactosTecnicos = contactosTecnicos ?? mapTechFromFields();

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Validate estadoContrato if provided (accept case-insensitive and common variants)
    const estadoRaw = data.estadoContrato !== undefined && data.estadoContrato !== null ? String(data.estadoContrato) : undefined;
    let estadoContrato: string | undefined;
    if (estadoRaw) {
      const key = estadoRaw.trim().toLowerCase().replace(/[_-]+/g, ' ');
      const map: Record<string, string> = {
        'activo': 'Activo',
        'suspendido': 'Suspendido',
        'no renovado': 'No renovado',
        'nor renovado': 'No renovado',
        'no_renovado': 'No renovado',
      };
      estadoContrato = map[key] || undefined;
      if (!estadoContrato) {
        return res.status(400).json({ message: 'estadoContrato inválido' });
      }
    }

    const toCreate = {
      nombre: data.nombre.trim(),
      ruc: rucClean,
      direccionFiscal: data.direccionFiscal.trim(),
      direccionOperativa: data.direccionOperativa ? String(data.direccionOperativa).trim() : undefined,
      ciudad: data.ciudad.trim(),
      provincia: data.provincia ? String(data.provincia).trim() : undefined,
      tipoEmpresa: data.tipoEmpresa ? String(data.tipoEmpresa).trim() : (data.sector ? String(data.sector).trim() : undefined),
      paginaWeb: data.paginaWeb ? String(data.paginaWeb).trim() : undefined,
      estadoContrato: estadoContrato as any,
      codigo: data.nombre && data.nombre.trim().length >= 3 
        ? data.nombre.trim().substring(0, 3).toUpperCase()
        : data.nombre ? data.nombre.trim().toUpperCase().padEnd(3, 'X') : 'XXX',
      contactosAdmin: finalContactosAdmin,
      contactosTecnicos: finalContactosTecnicos,
      // New fields from frontend
      observacionesGenerales: data.observacionesGenerales ? String(data.observacionesGenerales).trim() : undefined,
      autorizacionFacturacion: data.autorizacionFacturacion !== undefined ? Boolean(data.autorizacionFacturacion) : false,
    };

    const created = await service.createEmpresa(toCreate as any);
    res.status(201).json(created);
  } catch (error) {
    const err: any = error;
    console.error("Error create empresa - Full error:", {
      message: err?.message,
      code: err?.code,
      detail: err?.detail,
      hint: err?.hint,
      context: err?.context,
      position: err?.position,
      internalPosition: err?.internalPosition,
      internalQuery: err?.internalQuery,
      stack: err?.stack?.substring(0, 500)
    });
    // Postgres unique violation
    if (err && (err.code === "23505" || err.code === 23505)) {
      const detail = err.detail || "";
      if (typeof detail === "string" && detail.includes("nombre")) {
        return res.status(400).json({ message: "Nombre ya existe" });
      }
      return res.status(400).json({ message: "Violación de unicidad" });
    }
    res.status(500).json({ message: "Error en el servidor", error: err?.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    
    // Validate motivo (required for audit trail)
    if (!data.motivo || typeof data.motivo !== 'string' || data.motivo.trim() === '') {
      return res.status(400).json({ message: "motivo es requerido y no puede estar vacío" });
    }
    const motivo = data.motivo.trim();
    
    // Allow partial updates for the new fields
    const toUpdate: any = {};
    const simpleFields = ['nombre','ruc','direccionFiscal','direccionOperativa','ciudad','provincia','tipoEmpresa','paginaWeb','estadoContrato'];
    for (const f of simpleFields) {
      if (data[f] !== undefined && data[f] !== null) {
        toUpdate[f] = typeof data[f] === 'string' ? data[f].trim() : data[f];
      }
    }
    // accept sector alias in updates
    if (data.sector !== undefined && data.sector !== null) {
      toUpdate.tipoEmpresa = typeof data.sector === 'string' ? data.sector.trim() : data.sector;
    }

    const parseArrayField = (v: any) => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return undefined; }
      }
      return undefined;
    };

    if (data.contactosAdmin !== undefined) {
      toUpdate.contactosAdmin = parseArrayField(data.contactosAdmin);
    }
    const contactosAdministrativosUpdate = data.contactosAdministrativos !== undefined
      ? parseArrayField(data.contactosAdministrativos)
      : undefined;
    if (toUpdate.contactosAdmin === undefined && contactosAdministrativosUpdate !== undefined) {
      toUpdate.contactosAdmin = contactosAdministrativosUpdate;
    }
    if (data.contactosTecnicos !== undefined) {
      toUpdate.contactosTecnicos = parseArrayField(data.contactosTecnicos);
    }

    // Map individual admin/tech fields on update as well
    const mapAdminFromFieldsUpdate = () => {
      const name = data.adminNombre || data.admin_name || data.adminNombre;
      if (!name && !data.adminEmail && !data.adminTelefono && !data.observaciones && !data.adminCargo) return undefined;
      return [{
        nombreCompleto: name ? String(name).trim() : '',
        cargo: data.adminCargo ? String(data.adminCargo).trim() : undefined,
        telefono: data.adminTelefono ? String(data.adminTelefono).trim() : undefined,
        email: data.adminEmail ? String(data.adminEmail).trim() : undefined,
        observaciones: data.observaciones ? String(data.observaciones).trim() : undefined,
      }];
    };

    const mapTechFromFieldsUpdate = () => {
      const name = data.tecNombre || data.tec_nombre || data.tecName;
      if (!name && !data.tecEmail && !data.tecTelefono1 && !data.tecTelefono2 && !data.nivelAutorizacion && !data.tecCargo) return undefined;
      return [{
        nombreCompleto: name ? String(name).trim() : '',
        cargo: data.tecCargo ? String(data.tecCargo).trim() : undefined,
        telefono1: data.tecTelefono1 ? String(data.tecTelefono1).trim() : undefined,
        telefono2: data.tecTelefono2 ? String(data.tecTelefono2).trim() : undefined,
        email: data.tecEmail ? String(data.tecEmail).trim() : undefined,
        nivelAutorizacion: data.nivelAutorizacion ? String(data.nivelAutorizacion).trim() : undefined,
      }];
    };

    if (toUpdate.contactosAdmin === undefined) {
      const mapped = mapAdminFromFieldsUpdate();
      if (mapped) toUpdate.contactosAdmin = mapped;
    }
    if (toUpdate.contactosTecnicos === undefined) {
      const mapped = mapTechFromFieldsUpdate();
      if (mapped) toUpdate.contactosTecnicos = mapped;
    }

    // Support new contact/metadata fields in update
    if (data.contactosAdmin !== undefined) {
      toUpdate.contactosAdmin = parseArrayField(data.contactosAdmin);
    }
    if (data.observacionesGenerales !== undefined) {
      toUpdate.observacionesGenerales = data.observacionesGenerales ? String(data.observacionesGenerales).trim() : undefined;
    }
    if (data.autorizacionFacturacion !== undefined) {
      toUpdate.autorizacionFacturacion = Boolean(data.autorizacionFacturacion);
    }

    // If ruc provided in update, normalize and validate
    if (toUpdate.ruc !== undefined && toUpdate.ruc !== null) {
      const cleaned = String(toUpdate.ruc).replace(/\D/g, '');
      if (!/^\d{10,13}$/.test(cleaned)) {
        return res.status(400).json({ errors: [{ field: 'ruc', message: 'ruc inválido' }] });
      }
      toUpdate.ruc = cleaned;
    }

    // Fetch existing empresa to compute diff
    const existingEmpresa = await service.getEmpresa(id);
    if (!existingEmpresa) return res.status(404).json({ message: "Empresa no encontrada" });

    const updated = await service.updateEmpresa(id, toUpdate);
    if (!updated) return res.status(404).json({ message: "Empresa no encontrada" });

    // Compute changed fields (old -> new)
    const changes: Record<string, any> = {};
    for (const key of Object.keys(toUpdate)) {
      const oldVal = (existingEmpresa as any)[key] ?? null;
      const newVal = (toUpdate as any)[key] ?? null;
      changes[key] = { old: oldVal, new: newVal };
    }

    // Record historial con resumen y destino
    const user = (req as any).user;
    try {
      await historialService.createHistorial(
        id,
        user.email,
        user.nombre,
        motivo,
        'editar_empresa',
        {
          tipo: 'empresa',
          destino: updated.nombre || existingEmpresa.nombre,
          cambios: changes
        }
      );
    } catch (histErr) {
      console.error("Warning: historial not recorded:", histErr);
      // No fallar el update si historial falla
    }

    res.json(updated);
  } catch (error) {
    console.error("Error update empresa:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await service.deleteEmpresa(id);
    if (!deleted) return res.status(404).json({ message: "Empresa no encontrada" });
    res.json({ message: "Eliminada" });
  } catch (error) {
    console.error("Error delete empresa:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
