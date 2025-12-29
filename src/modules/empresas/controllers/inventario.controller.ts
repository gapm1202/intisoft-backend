import { Request, Response } from "express";
import * as service from "../services/inventario.service";
import * as uploadsService from "../../uploads/services/uploads.service";
import fs from 'fs';
import path from 'path';

const ALLOWED_CONDICIONES = new Set(['EXCELENTE','BUENO','REGULAR','MALO']);

// Helper: normalize payload from JSON or multipart/form-data
function extractPayload(req: Request) {
  // If multipart, frontend puts JSON string in req.body.data
  let payload: any = {};
  if (req.body && req.body.data) {
    try {
      payload = JSON.parse(req.body.data);
    } catch (e) {
      // fallback to raw body
      payload = req.body;
    }
  } else {
    payload = req.body || {};
  }

  // Normalize snake_case -> camelCase if needed
  if (!payload.fechaFinGarantia && payload.fecha_fin_garantia) payload.fechaFinGarantia = payload.fecha_fin_garantia;
  if (!payload.camposPersonalizados && payload.campos_personalizados) payload.camposPersonalizados = payload.campos_personalizados;
  if (!payload.camposPersonalizadosArray && payload.campos_personalizados_array) payload.camposPersonalizadosArray = payload.campos_personalizados_array;
  if (!payload.usuariosAsignados && payload.usuario_asignado) payload.usuariosAsignados = payload.usuario_asignado;

  // Normalize date strings to YYYY-MM-DD so DB insertion (::date) works reliably
  if (payload.fechaFinGarantia) {
    try {
      const d = new Date(payload.fechaFinGarantia);
      if (!isNaN(d.getTime())) payload.fechaFinGarantia = d.toISOString().split('T')[0];
    } catch (_) { /* keep original */ }
  }
  if (payload.fechaCompra) {
    try {
      const d2 = new Date(payload.fechaCompra);
      if (!isNaN(d2.getTime())) payload.fechaCompra = d2.toISOString().split('T')[0];
    } catch (_) { /* keep original */ }
  }

  // Keep any client-provided fotos metadata (may include existing fotos)
  // Do NOT delete payload.fotos here; we'll merge with uploaded files below.

  // If files were uploaded (multer .any()), move/rename files to keep original extension,
  // generate public URLs and collect them under `uploadedFotos` so service can merge.
  const files = (req as any).files;
  if (files && Array.isArray(files) && files.length > 0) {
    const uploaded: any[] = [];
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { console.warn('Could not ensure uploads dir', e); }

    files.forEach((f: any, i: number) => {
      const originalName = f.originalname || `file_${i}`;
      // If multer diskStorage provided a filename, use it; else rename the temporary file
      let finalFilename = f.filename;
      if (!finalFilename) {
        const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        finalFilename = `${Date.now()}-${safeName}`;
        const oldPath = f.path;
        const newPath = path.join(uploadsDir, finalFilename);
        try { fs.renameSync(oldPath, newPath); } catch (err) { console.warn('Could not rename uploaded file', oldPath, err); }
      }

      // Try to map a description from payload.fotoDescriptions or photos metadata
      const desc = payload[`fotoDescriptions[${i}]`] ?? payload[`fotoDescriptions`] ?? '';
      const url = `${req.protocol}://${req.get('host')}/uploads/${finalFilename}`;
      uploaded.push({ name: originalName, description: desc, url });
    });

    // Expose uploaded files separately so service can merge with client fotos (avoid overwriting payload.fotos)
    payload.uploadedFotos = uploaded;
  }

  return payload;
}

// ===== CATEGORIAS =====
export const createCategoria = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const { nombre, name, subcategorias, campos, camposPersonalizados } = req.body;
    const categoriaName = nombre || name;
    const camposData = campos || camposPersonalizados || [];

    if (!categoriaName) return res.status(400).json({ ok: false, message: "nombre requerido" });

    console.log('createCategoria - Body completo:', req.body);
    console.log('createCategoria - Campos recibidos:', camposData);

    const categoria = await service.crearCategoria(empresaId, categoriaName, subcategorias, camposData);
    res.status(201).json(categoria);
  } catch (error: any) {
    console.error("Error crear categoría:", error);
    // Unique constraint (duplicate)
    if (error.code === '23505' || (error.message && (error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('llave duplicada')))) {
      return res.status(409).json({ ok: false, message: 'Ya existe una categoría con ese nombre' });
    }
    if (error.message && error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const createCategoriaGlobal = async (req: Request, res: Response) => {
  try {
    const { nombre, name, subcategorias, campos, camposPersonalizados } = req.body;
    const categoriaName = nombre || name;
    const camposData = campos || camposPersonalizados || [];

    console.log('createCategoriaGlobal - Body completo:', JSON.stringify(req.body, null, 2));
    console.log('createCategoriaGlobal - Categoría name:', categoriaName);
    console.log('createCategoriaGlobal - Campos recibidos:', JSON.stringify(camposData, null, 2));

    // Validación: nombre requerido
    if (!categoriaName || (typeof categoriaName === 'string' && categoriaName.trim() === '')) {
      return res.status(400).json({ 
        ok: false, 
        message: "El campo 'nombre' es requerido",
        received: { nombre, name, categoriaName }
      });
    }

    // Validación: si vienen campos, verificar estructura
    if (Array.isArray(camposData) && camposData.length > 0) {
      for (let i = 0; i < camposData.length; i++) {
        const campo = camposData[i];
        if (!campo.nombre || (typeof campo.nombre === 'string' && campo.nombre.trim() === '')) {
          return res.status(400).json({
            ok: false,
            message: `El campo [${i}] debe tener un 'nombre'`,
            field: campo
          });
        }
        if (!campo.tipo) {
          return res.status(400).json({
            ok: false,
            message: `El campo '${campo.nombre}' [${i}] debe tener un 'tipo'`,
            field: campo
          });
        }
      }
    }

    const categoria = await service.crearCategoriaGlobal(categoriaName, subcategorias, camposData);
    res.status(201).json(categoria);
  } catch (error: any) {
    console.error("Error crear categoría global:", error);
    
    // Detectar conflicto de unicidad
    if (error.code === '23505' || error.message.includes("duplicate key")) {
      return res.status(409).json({ 
        ok: false, 
        message: "Ya existe una categoría con ese nombre",
        error: error.message 
      });
    }
    
    // Propagar mensajes de error del servicio
    if (error.message && error.message.includes("requerido")) {
      return res.status(400).json({ 
        ok: false, 
        message: error.message 
      });
    }
    
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      ok: false, 
      message: "Error en el servidor",
      error: error.message 
    });
  }
};

export const listCategorias = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const categorias = await service.listarCategorias(empresaId);
    res.json(categorias);
  } catch (error: any) {
    console.error("Error listar categorías:", error);
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const listCategoriasGlobales = async (req: Request, res: Response) => {
  try {
    const categorias = await service.listarCategoriasGlobales();
    res.json(categorias);
  } catch (error: any) {
    console.error("Error listar categorías globales:", error);
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const updateCategoriaGlobal = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // Log incoming payload for debugging
    console.log('updateCategoriaGlobal - id:', id, 'body:', req.body);

    // Accept `subcategorias` and `campos` either as arrays or as JSON strings (from multipart/form-data)
    let { subcategorias, campos } = req.body as any;

    // Normalize subcategorias: if string, try JSON.parse, otherwise split by comma
    if (typeof subcategorias === 'string') {
      try {
        subcategorias = JSON.parse(subcategorias);
      } catch (e) {
        // fallback: comma separated
        subcategorias = subcategorias.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Normalize campos: if string, try JSON.parse, otherwise keep as-is
    if (typeof campos === 'string') {
      try {
        campos = JSON.parse(campos);
      } catch (e) {
        console.error('updateCategoriaGlobal - invalid JSON in campos:', e);
        return res.status(400).json({ ok: false, message: 'campo "campos" inválido: JSON esperado' });
      }
    }

    console.log('updateCategoriaGlobal - parsed subcategorias:', subcategorias, 'parsed campos:', campos);

    // Do NOT accept 'nombre' in this endpoint — only update subcategorias and campos
    const updated = await service.actualizarCategoriaGlobal(id, null, subcategorias, campos);
    res.json(updated);
  } catch (error: any) {
    console.error("Error actualizar categoría global:", error);
    if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
      return res.status(409).json({ ok: false, message: "Ya existe una categoría con ese nombre" });
    }
    if (error.message && error.message.includes('no encontrada')) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const deleteCategoriaGlobal = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ok = await service.eliminarCategoriaGlobal(id);
    if (!ok) return res.status(404).json({ ok: false, message: "Categoría no encontrada" });
    res.json({ message: "Categoría eliminada" });
  } catch (error: any) {
    console.error("Error eliminar categoría global:", error);
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

// ===== AREAS =====
export const createArea = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const { nombre, name, sedeId, responsable } = req.body;
    const areaName = nombre || name;

    if (!areaName) return res.status(400).json({ ok: false, message: "nombre requerido" });

    const area = await service.crearArea(empresaId, areaName, sedeId, responsable);
    res.status(201).json(area);
  } catch (error: any) {
    console.error("Error crear área:", error);
    
    // Detectar conflicto de unicidad
    if (error.code === '23505' || error.message.includes("duplicate key")) {
      return res.status(409).json({ ok: false, message: "Ya existe un área con ese nombre en esta empresa" });
    }
    
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const listAreas = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    console.log('📊 Obteniendo áreas para empresa:', empresaId);
    
    const areas = await service.listarAreas(empresaId);
    
    console.log(`✅ Áreas encontradas: ${areas.length}`);
    
    res.json({ ok: true, data: areas });
  } catch (error: any) {
    console.error("❌ Error listar áreas:", error);
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

// ===== INVENTARIO =====
export const createInventario = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const data = extractPayload(req);

    // Diagnostic logs requested: content-type, raw body, files and parsed payload
    try { console.log('content-type:', req.headers['content-type']); } catch(_) {}
    try { console.log('req.body raw:', req.body); } catch(_) {}
    try { console.log('req.files:', (req as any).files); } catch(_) {}

    // If multipart with JSON in req.body.data, parse and log it explicitly for debugging
    if (req.body && req.body.data) {
      try {
        const parsed = (typeof req.body.data === 'string') ? JSON.parse(req.body.data) : req.body.data;
        console.log('parsed payload from req.body.data:', parsed);
      } catch (e) {
        console.error('parse req.body.data error', e);
      }
    }

    // Resolve condicion_fisica from multiple possible keys and validate against allowed set
    try {
      const payloadForCond: any = (req.body && req.body.data) ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : (req.body || {});
      let cond = (payloadForCond.condicion_fisica ?? payloadForCond.condicionFisica ?? payloadForCond.estadoFisico ?? '').toString().trim().toUpperCase();
      if (cond === '') cond = null as any;
      if (cond && !ALLOWED_CONDICIONES.has(cond)) {
        console.warn('createInventario - condicion_fisica inválida, se ignora:', cond);
        try {
          const logEntry = { time: new Date().toISOString(), location: 'createInventario - invalid condicion', cond, payload: payloadForCond };
          fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
        } catch (_) {}
        cond = null as any;
      }
      // Set both keys so repository/service see it regardless of naming
      data.condicion_fisica = cond;
      data.condicionFisica = cond;
      console.log('createInventario - parsed payload for condicion:', payloadForCond, 'condicion(normalized):', cond);
    } catch (e) { console.warn('Error resolving condicion_fisica from payload', e); }

    console.log('createInventario - headers:', req.headers ? { authorization: req.headers.authorization } : {});
    console.log('createInventario - params:', { empresaId: req.params.empresaId, sedeId: req.params.sedeId });
    try { console.log('createInventario - body:', JSON.stringify(data)); } catch { console.log('createInventario - body (unserializable)'); }
    console.log('createInventario - usuariosAsignados:', data.usuariosAsignados || data.usuarioAsignado);
    console.log('createInventario - fotos:', data.fotos);

    // Handle optional multipart upload fields for purchase/warranty documents
    try {
      const files = (req as any).files || [];
      const purchaseFieldNames = ['purchase_document','purchaseDocument','purchaseDocumentFile','purchase_document_file'];
      const warrantyFieldNames = ['warranty_document','warrantyDocument','warrantyDocumentFile','warranty_document_file'];
      for (const f of files) {
        if (!f || !f.fieldname) continue;
        // Log incoming file metadata for diagnosis
        try { console.log('createInventario - incoming file:', { field: f.fieldname, originalname: f.originalname, mimetype: f.mimetype, size: f.size, path: (f as any).path }); } catch(_) {}

        if (purchaseFieldNames.includes(f.fieldname) || warrantyFieldNames.includes(f.fieldname)) {
          // upload to S3 via uploads service
          const uploaded = await uploadsService.uploadFile(f, (req as any).user || null);
          if (purchaseFieldNames.includes(f.fieldname)) {
            data.purchaseDocumentUrl = uploaded.url;
            data.purchaseDocumentDescription = data.purchaseDocumentDescription || data.purchase_document_description || data.purchase_document_description || '';
          }
          if (warrantyFieldNames.includes(f.fieldname)) {
            data.warrantyDocumentUrl = uploaded.url;
            data.warrantyDocumentDescription = data.warrantyDocumentDescription || data.warranty_document_description || data.warranty_document_description || '';
          }
        }
      }
    } catch (e) {
      console.error('Error uploading purchase/warranty document:', e && (e.stack || e));
      // write diagnostic with files info
      try {
        const logEntry = { time: new Date().toISOString(), location: 'createInventario - upload', error: (e && (e.stack || e.message)) || String(e), files: (req as any).files };
        fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
      } catch (_) {}
      return res.status(500).json({ ok: false, message: 'Error uploading document' });
    }

    // assetId is generated on the backend; ignore missing assetId from frontend

    // Diagnostic: persist payload and resolved condicion to tmp_inventario_error.log for debugging
    try {
      const diag = { time: new Date().toISOString(), location: 'createInventario - pre-insert diagnostic', payload: data };
      fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(diag, null, 2) + '\n-----\n');
    } catch (e) { console.warn('Could not write pre-insert diagnostic', e); }

    const inventario = await service.crearInventario({
      empresaId,
      sedeId: data.sedeId,
      categoriaId: data.categoriaId,
      areaId: data.areaId,
      categoria: data.categoria || undefined,
      area: data.area || undefined,
      assetId: data.assetId,
      reservationId: data.reservationId,
      fabricante: data.fabricante,
      modelo: data.modelo,
      serie: data.serie,
      estadoActivo: data.estadoActivo,
      estadoOperativo: data.estadoOperativo,
      fechaCompra: data.fechaCompra,
      fechaFinGarantia: data.fechaFinGarantia,
      proveedor: data.proveedor,
      ip: data.ip,
      mac: data.mac,
      usuarioAsignado: data.usuarioAsignado,
      usuariosAsignados: data.usuariosAsignados,
      observaciones: data.observaciones,
      purchaseDocumentUrl: data.purchaseDocumentUrl || data.purchase_document_url,
      warrantyDocumentUrl: data.warrantyDocumentUrl || data.warranty_document_url,
      purchaseDocumentDescription: data.purchaseDocumentDescription || data.purchase_document_description,
      warrantyDocumentDescription: data.warrantyDocumentDescription || data.warranty_document_description,
      // Map purchase/warranty document metadata and accept multiple possible keys from frontend
      tipoDocumentoCompra: data.tipoDocumentoCompra || data.tipo_documento_compra || null,
      numeroDocumentoCompra: data.numeroDocumentoCompra || data.numero_documento_compra || null,
      fechaCompraAproxYear: data.fechaCompraAproxYear || data.fecha_compra_aprox_year || data.fechaCompraAprox || null,
      // Accept garantia from several possible keys
      garantia: data.garantia || data.garantiaDuracion || data.garantia_duracion || null,
      // Accept condicion fisica from camelCase or snake_case and normalize to uppercase enum
      condicionFisica: (() => {
        const raw = data.condicionFisica || data.condicion_fisica || data.condicion || null;
        if (!raw) return null;
        try { return String(raw).trim().toUpperCase(); } catch { return null; }
      })(),
      codigoAccesoRemoto: data.codigoAccesoRemoto || data.codigo_acceso_remoto || null,
      ram: data.ram,
      storages: data.storages,
      especificacion: data.especificacion,
      camposPersonalizados: data.camposPersonalizados || data.dynamicFields || data.campos || data.especificacion,
      camposPersonalizadosArray: data.camposPersonalizadosArray || data.dynamicArrayFields || data.storages,
      fotos: data.fotos || [] ,
      empresaNombre: data.empresaNombre,
      sedeNombre: data.sedeNombre
    } as any);

    console.log('createInventario - created:', inventario);
    // Re-fetch the row from DB to return canonical persisted data (includes fotos JSONB)
    try {
      const persisted = await service.obtenerInventario((inventario as any).id);
      if (persisted) {
        return res.status(201).json({ ok: true, data: persisted });
      }
    } catch (e) {
      console.warn('Could not re-fetch persisted inventario, falling back to constructed object', e);
    }

    // Fallback: ensure fotos from payload are included
    try {
      if (data && data.fotos && Array.isArray(data.fotos) && data.fotos.length > 0) {
        (inventario as any).fotos = data.fotos;
      }
    } catch (e) { /* ignore */ }

    res.status(201).json({ ok: true, data: inventario });
  } catch (error: any) {
    console.error("Error crear inventario:", error);
    try {
      const logEntry = {
        time: new Date().toISOString(),
        route: '/api/empresas/:empresaId/sedes/:sedeId/inventario',
        params: { empresaId: req.params.empresaId, sedeId: req.params.sedeId },
        bodyPreview: (() => { try { return JSON.parse(JSON.stringify(req.body?.data ? (typeof req.body.data === 'string' ? req.body.data : req.body) : req.body)); } catch(e) { return 'unserializable'; } })(),
        files: Array.isArray((req as any).files) ? (req as any).files.map((f: any) => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })) : (req as any).files || null,
        error: (error && (error.stack || error.message)) || String(error)
      };
      fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
    } catch (writeErr) {
      console.error('Could not write tmp_inventario_error.log', writeErr);
    }
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    if (error.message.includes("ya existe")) return res.status(409).json({ ok: false, message: error.message });
    if (error.message.includes("inválido")) return res.status(400).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const createInventarioSede = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const sedeId = parseInt(req.params.sedeId);
    const data = extractPayload(req);

    console.log('createInventarioSede - headers:', req.headers ? { authorization: req.headers.authorization } : {});
    console.log('createInventarioSede - params:', { empresaId: req.params.empresaId, sedeId: req.params.sedeId });
    try { console.log('createInventarioSede - body:', JSON.stringify(data)); } catch { console.log('createInventarioSede - body (unserializable)'); }
    console.log('createInventarioSede - usuariosAsignados:', data.usuariosAsignados || data.usuarioAsignado);
    console.log('createInventarioSede - fotos:', data.fotos);

    // Handle optional multipart upload fields for purchase/warranty documents (sede variant)
    try {
      const files = (req as any).files || [];
      const purchaseFieldNames = ['purchase_document','purchaseDocument','purchaseDocumentFile','purchase_document_file'];
      const warrantyFieldNames = ['warranty_document','warrantyDocument','warrantyDocumentFile','warranty_document_file'];
      for (const f of files) {
        if (!f || !f.fieldname) continue;
        try { console.log('createInventarioSede - incoming file:', { field: f.fieldname, originalname: f.originalname, mimetype: f.mimetype, size: f.size, path: (f as any).path }); } catch(_) {}
        if (purchaseFieldNames.includes(f.fieldname) || warrantyFieldNames.includes(f.fieldname)) {
          const uploaded = await uploadsService.uploadFile(f, (req as any).user || null);
          if (purchaseFieldNames.includes(f.fieldname)) {
            data.purchaseDocumentUrl = uploaded.url;
            data.purchaseDocumentDescription = data.purchaseDocumentDescription || data.purchase_document_description || '';
          }
          if (warrantyFieldNames.includes(f.fieldname)) {
            data.warrantyDocumentUrl = uploaded.url;
            data.warrantyDocumentDescription = data.warrantyDocumentDescription || data.warranty_document_description || '';
          }
        }
      }
    } catch (e) {
      console.error('Error uploading purchase/warranty document (sede):', e && (e.stack || e));
      try {
        const logEntry = { time: new Date().toISOString(), location: 'createInventarioSede - upload', error: (e && (e.stack || e.message)) || String(e), files: (req as any).files };
        fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
      } catch (_) {}
      return res.status(500).json({ ok: false, message: 'Error uploading document' });
    }

    // Resolve condicion_fisica from payload for sede endpoint as well and validate
    try {
      const payloadForCond: any = (req.body && req.body.data) ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : (req.body || {});
      let cond = (payloadForCond.condicion_fisica ?? payloadForCond.condicionFisica ?? payloadForCond.estadoFisico ?? '').toString().trim().toUpperCase();
      if (cond === '') cond = null as any;
      if (cond && !ALLOWED_CONDICIONES.has(cond)) {
        console.warn('createInventarioSede - condicion_fisica inválida, se ignora:', cond);
        try {
          const logEntry = { time: new Date().toISOString(), location: 'createInventarioSede - invalid condicion', cond, payload: payloadForCond };
          fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
        } catch (_) {}
        cond = null as any;
      }
      data.condicion_fisica = cond;
      data.condicionFisica = cond;
      console.log('createInventarioSede - parsed payload for condicion:', payloadForCond, 'condicion(normalized):', cond);
    } catch (e) { console.warn('createInventarioSede - error resolving condicion_fisica', e); }

    // assetId is generated on the backend; ignore missing assetId from frontend

    // Diagnostic: persist payload and resolved condicion to tmp_inventario_error.log for debugging (sede)
    try {
      const diag = { time: new Date().toISOString(), location: 'createInventarioSede - pre-insert diagnostic', payload: data };
      fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(diag, null, 2) + '\n-----\n');
    } catch (e) { console.warn('Could not write pre-insert diagnostic (sede)', e); }

    const inventario = await service.crearInventario({
      empresaId,
      sedeId,
      categoriaId: data.categoriaId,
      areaId: data.areaId,
      categoria: data.categoria || undefined,
      area: data.area || undefined,
      assetId: data.assetId,
      reservationId: data.reservationId,
      fabricante: data.fabricante,
      modelo: data.modelo,
      serie: data.serie,
      estadoActivo: data.estadoActivo,
      estadoOperativo: data.estadoOperativo,
      fechaCompra: data.fechaCompra,
      fechaFinGarantia: data.fechaFinGarantia,
      proveedor: data.proveedor,
      ip: data.ip,
      mac: data.mac,
      usuarioAsignado: data.usuarioAsignado,
      usuariosAsignados: data.usuariosAsignados,
      purchaseDocumentUrl: data.purchaseDocumentUrl || data.purchase_document_url,
      warrantyDocumentUrl: data.warrantyDocumentUrl || data.warranty_document_url,
      purchaseDocumentDescription: data.purchaseDocumentDescription || data.purchase_document_description,
      warrantyDocumentDescription: data.warrantyDocumentDescription || data.warranty_document_description,
      observaciones: data.observaciones,
      ram: data.ram,
      storages: data.storages,
      especificacion: data.especificacion,
      camposPersonalizados: data.camposPersonalizados || data.dynamicFields || data.campos || data.especificacion,
      camposPersonalizadosArray: data.camposPersonalizadosArray || data.dynamicArrayFields || data.storages,
      fotos: data.fotos || []
      ,
      // Map purchase/warranty metadata for sede endpoint as well
      tipoDocumentoCompra: data.tipoDocumentoCompra || data.tipo_documento_compra || null,
      numeroDocumentoCompra: data.numeroDocumentoCompra || data.numero_documento_compra || null,
      fechaCompraAproxYear: data.fechaCompraAproxYear || data.fecha_compra_aprox_year || data.fechaCompraAprox || null,
      garantia: data.garantia || data.garantiaDuracion || data.garantia_duracion || null
      ,
      // Pass normalized condicion fisica collected earlier
      condicionFisica: data.condicionFisica || data.condicion_fisica || null,
      codigoAccesoRemoto: data.codigoAccesoRemoto || data.codigo_acceso_remoto || null
    } as any);

    console.log('createInventarioSede - created:', inventario);
    // Re-fetch the row from DB to return canonical persisted data (includes fotos JSONB)
    try {
      const persisted = await service.obtenerInventario((inventario as any).id);
      if (persisted) {
        return res.status(201).json({ ok: true, data: persisted });
      }
    } catch (e) {
      console.warn('Could not re-fetch persisted inventario (sede), falling back to constructed object', e);
    }

    try {
      if (data && data.fotos && Array.isArray(data.fotos) && data.fotos.length > 0) {
        (inventario as any).fotos = data.fotos;
      }
    } catch (e) { /* ignore */ }

    res.status(201).json({ ok: true, data: inventario });
  } catch (error: any) {
    console.error("Error crear inventario en sede:", error);
    try {
      const logEntry = {
        time: new Date().toISOString(),
        route: '/api/empresas/:empresaId/sedes/:sedeId/inventario (sede)',
        params: { empresaId: req.params.empresaId, sedeId: req.params.sedeId },
        bodyPreview: (() => { try { return JSON.parse(JSON.stringify(req.body?.data ? (typeof req.body.data === 'string' ? req.body.data : req.body) : req.body)); } catch(e) { return 'unserializable'; } })(),
        files: Array.isArray((req as any).files) ? (req as any).files.map((f: any) => ({ fieldname: f.fieldname, originalname: f.originalname, size: f.size })) : (req as any).files || null,
        error: (error && (error.stack || error.message)) || String(error)
      };
      fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
    } catch (writeErr) {
      console.error('Could not write tmp_inventario_error.log', writeErr);
    }
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    if (error.message.includes("ya existe")) return res.status(409).json({ ok: false, message: error.message });
    if (error.message.includes("inválido")) return res.status(400).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

// ===== ACTUALIZAR INVENTARIO EN SEDE =====
export const updateInventarioSede = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const sedeId = parseInt(req.params.sedeId);
    const activoId = parseInt(req.params.activoId);
    
    // Parse payload WITHOUT calling extractPayload to avoid uploadedFotos being added
    let data: any = {};
    if (req.body && req.body.data) {
      try {
        data = JSON.parse(req.body.data);
      } catch (e) {
        data = req.body;
      }
    } else {
      data = req.body || {};
    }

    // Normalize dates
    if (data.fechaFinGarantia) {
      try {
        const d = new Date(data.fechaFinGarantia);
        if (!isNaN(d.getTime())) data.fechaFinGarantia = d.toISOString().split('T')[0];
      } catch (_) { /* keep original */ }
    }
    if (data.fechaCompra) {
      try {
        const d2 = new Date(data.fechaCompra);
        if (!isNaN(d2.getTime())) data.fechaCompra = d2.toISOString().split('T')[0];
      } catch (_) { /* keep original */ }
    }

    console.log('updateInventarioSede - params:', { empresaId, sedeId, activoId });
    console.log('updateInventarioSede - fotosExistentes:', data.fotosExistentes);
    console.log('updateInventarioSede - fotosNuevas:', data.fotosNuevas);
    console.log('updateInventarioSede - files count:', (req as any).files?.length || 0);

    // Handle fotos per frontend spec:
    // 1. fotosExistentes: photos user kept (not deleted)
    // 2. fotosNuevas: metadata for new photos
    // 3. files (req.files): physical files for new photos
    const fotosExistentes = Array.isArray(data.fotosExistentes) ? data.fotosExistentes : [];
    const fotosNuevas = Array.isArray(data.fotosNuevas) ? data.fotosNuevas : [];
    const files = (req as any).files || [];

    // Build uploaded photos metadata from files + fotosNuevas
    const fotosSubidas = files.map((file: any, idx: number) => {
      const meta = fotosNuevas[idx] || {};
      return {
        url: file.filename,
        name: meta.name || file.originalname,
        descripcion: meta.description || meta.descripcion || ''
      };
    });

    // Final fotos = existing + newly uploaded
    const fotosFinales = [...fotosExistentes, ...fotosSubidas];

    console.log('updateInventarioSede - fotosFinales count:', fotosFinales.length);

    // Pass fotosFinales to service (this takes precedence over legacy logic)
    data.fotosFinales = fotosFinales;

    // Handle optional purchase/warranty document files among req.files
    try {
      const filesAll = (req as any).files || [];
      for (const f of filesAll) {
        if (!f || !f.fieldname) continue;
        if (f.fieldname === 'purchase_document' || f.fieldname === 'warranty_document') {
          const uploaded = await uploadsService.uploadFile(f, (req as any).user || null);
          if (f.fieldname === 'purchase_document') {
            data.purchaseDocumentUrl = uploaded.url;
            data.purchaseDocumentDescription = data.purchaseDocumentDescription || data.purchase_document_description || '';
          }
          if (f.fieldname === 'warranty_document') {
            data.warrantyDocumentUrl = uploaded.url;
            data.warrantyDocumentDescription = data.warrantyDocumentDescription || data.warranty_document_description || '';
          }
        }
      }
    } catch (e) {
      console.error('Error uploading purchase/warranty document during updateInventarioSede:', e);
      return res.status(500).json({ ok: false, message: 'Error uploading document' });
    }

    // Determine user performing the update (if authentication middleware sets req.user)
    const usuarioId = (req as any).user ? (req as any).user.id : null;
    // Resolve condicion_fisica from incoming payload when updating via sede endpoint and validate
    try {
      const payloadForCond: any = (req.body && req.body.data) ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : (req.body || {});
      let cond = (payloadForCond.condicion_fisica ?? payloadForCond.condicionFisica ?? payloadForCond.estadoFisico ?? '').toString().trim().toUpperCase();
      if (cond === '') cond = null as any;
      if (cond && !ALLOWED_CONDICIONES.has(cond)) {
        console.warn('updateInventarioSede - condicion_fisica inválida, se ignora:', cond);
        try {
          const logEntry = { time: new Date().toISOString(), location: 'updateInventarioSede - invalid condicion', cond, payload: payloadForCond };
          fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(logEntry, null, 2) + '\n-----\n');
        } catch (_) {}
        cond = null as any;
      }
      console.log('updateInventarioSede - parsed payload for condicion:', payloadForCond, 'condicion(normalized):', cond);
      data.condicion_fisica = cond;
      data.condicionFisica = cond;
    } catch (e) { console.warn('updateInventarioSede - error resolving condicion_fisica', e); }
    // Delegate to service to update the inventario and handle fotos logic
    const updated = await service.actualizarInventario(activoId, data, { empresaId, sedeId, motivo: data.motivo || data.reason || null }, usuarioId);

    // Re-fetch persisted canonical row
    const persisted = await service.obtenerInventario(activoId);
    if (!persisted) return res.status(404).json({ ok: false, message: 'Inventario no encontrado después de actualizar' });
    return res.json({ ok: true, data: persisted });
  } catch (error: any) {
    console.error('Error actualizar inventario (sede):', error);
    if (error.message && error.message.includes('no encontrada')) return res.status(404).json({ ok: false, message: error.message });
    if (error.message && error.message.includes('inválido')) return res.status(400).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
};

export const getInventario = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const inventario = await service.obtenerInventario(id);
    if (!inventario) return res.status(404).json({ ok: false, message: "Inventario no encontrado" });
    res.json({ ok: true, data: inventario });
  } catch (error: any) {
    console.error("Error obtener inventario:", error);
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const listInventarioEmpresa = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    const inventarios = await service.listarInventarioEmpresa(empresaId);
    res.json({ ok: true, data: inventarios });
  } catch (error: any) {
    console.error("Error listar inventario:", error);
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

export const listInventarioSede = async (req: Request, res: Response) => {
  try {
    const sedeId = parseInt(req.params.sedeId);
    const soloSedeActual = req.query.soloSedeActual === 'true' || req.query.solo_sede_actual === 'true';
    const inventarios = await service.listarInventarioSede(sedeId, soloSedeActual);
    console.log('listInventarioSede - params:', { empresaId: req.params.empresaId, sedeId: req.params.sedeId, soloSedeActual });
    console.log('listInventarioSede - activos recuperados:', Array.isArray(inventarios) ? inventarios.length : 0);
    
    // Verificar campos críticos en response
    if (inventarios.length > 0) {
      console.log(`📤 RESPONSE para Sede ${sedeId} - Total activos: ${inventarios.length}`);
      inventarios.forEach((inv: any) => {
        console.log(`   - ${inv.assetId}: sedeId=${inv.sedeId}, sedeOriginalId=${inv.sedeOriginalId}, trasladado=${inv.trasladado}`);
        console.log(`     → En Sede ${sedeId}: ${inv.sedeId === sedeId ? '✅ OPERATIVO' : '🔒 BLOQUEADO'}`);
      });
    }
    
    const activosConTrasladado = inventarios.filter((inv: any) => inv.trasladado === true);
    if (activosConTrasladado.length > 0) {
      console.log(`⚠️ Frontend debe usar sedeId para determinar bloqueo, NO solo el campo trasladado`);
    }
    
    res.json({ ok: true, data: inventarios });
  } catch (error: any) {
    console.error("Error listar inventario de sede:", error);
    console.error('Error completo:', error && (error.stack || error));
    console.error('Request params:', { empresaId: req.params.empresaId, sedeId: req.params.sedeId });
    if (error.message.includes("no encontrada")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};

// ===== FOTOS =====
export const uploadFoto = async (req: Request, res: Response) => {
  try {
    const inventarioId = parseInt(req.params.inventarioId);
    const { url, descripcion } = req.body;

    if (!url) return res.status(400).json({ ok: false, message: "url requerida" });

    const foto = await service.agregarFoto(inventarioId, url, descripcion);
    res.status(201).json(foto);
  } catch (error: any) {
    console.error("Error subir foto:", error);
    if (error.message.includes("no encontrado")) return res.status(404).json({ ok: false, message: error.message });
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
};
