import * as repo from "../repositories/inventario.repository";
import * as activosRepo from "../repositories/activos.repository";
import * as empresaRepo from "../repositories/empresa.repository";
import * as sedeRepo from "../repositories/sede.repository";
import * as codigoRepo from "../repositories/activos_codigo.repository";
import * as codigoService from "./activos_codigo.service";
import { Categoria, Area, Inventario, RAM, Storage, Foto } from "../models/inventario.model";

// ===== VALIDACIONES =====
const validateIP = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipv4Regex.test(ip);
};

const validateMAC = (mac: string): boolean => {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
};

const validateDate = (date: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

function computeAntiguedad(inv: any): { anios: number | null; meses: number | null; text: string | null } {
  const now = new Date();
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const nowYear = nowUtc.getUTCFullYear();

  // Accept multiple possible keys for purchase date
  const fechaCompraRaw = inv && (inv.fechaCompra || inv.fecha_compra || inv.fechaCompraStr || inv.fecha_compra_str);
  if (fechaCompraRaw) {
    const fc = new Date(fechaCompraRaw);
    if (!isNaN(fc.getTime())) {
      const fcUtc = new Date(Date.UTC(fc.getUTCFullYear(), fc.getUTCMonth(), fc.getUTCDate()));
      if (fcUtc.getTime() > nowUtc.getTime()) {
        return { anios: 0, meses: 0, text: '0 años' };
      }

      let years = nowUtc.getUTCFullYear() - fcUtc.getUTCFullYear();
      let months = nowUtc.getUTCMonth() - fcUtc.getUTCMonth();
      if (nowUtc.getUTCDate() < fcUtc.getUTCDate()) months -= 1;
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      if (years < 0) years = 0;
      if (months < 0) months = 0;
      const text = months > 0 ? `${years} años y ${months} meses` : `${years} años`;
      return { anios: years, meses: months, text: text.substring(0, 50) };
    }
  }

  // Fallback: approximate year (various possible keys)
  const approxYear = inv && (inv.fechaCompraAproxYear || inv.fecha_compra_aprox_year || inv.fechaCompraApproxYear || inv.fecha_compra_approx);
  if (typeof approxYear === 'number' || (typeof approxYear === 'string' && approxYear.match(/^\d{4}$/))) {
    const y = typeof approxYear === 'number' ? approxYear : parseInt(approxYear, 10);
    let years = nowYear - y;
    if (years < 0) years = 0;
    const text = `${years} años`;
    return { anios: years, meses: null, text: text.substring(0, 50) };
  }

  return { anios: null, meses: null, text: null };
}

// ===== CATEGORIAS =====
export const crearCategoria = async (empresaId: number | null, nombre: string, subcategorias?: string[], campos?: any): Promise<Categoria> => {
  if (empresaId) {
    // Validar que la empresa existe
    const empresa = await empresaRepo.getById(empresaId);
    if (!empresa) throw new Error("Empresa no encontrada");
  }

  if (!nombre || nombre.trim() === "") throw new Error("Nombre de categoría requerido");

  return repo.createCategoria(empresaId || null, nombre.trim(), subcategorias, campos);
};

export const crearCategoriaGlobal = async (nombre: string, subcategorias?: string[], campos?: any): Promise<Categoria> => {
  if (!nombre || nombre.trim() === "") throw new Error("Nombre de categoría requerido");

  return repo.createCategoria(null, nombre.trim(), subcategorias, campos);
};

export const listarCategorias = async (empresaId: number): Promise<Categoria[]> => {
  const empresa = await empresaRepo.getById(empresaId);
  if (!empresa) throw new Error("Empresa no encontrada");

  return repo.getCategoriasByEmpresa(empresaId);
};

export const listarCategoriasGlobales = async (): Promise<Categoria[]> => {
  return repo.getAllCategorias();
};

export const actualizarCategoriaGlobal = async (id: number, nombre?: string | null, subcategorias?: string[], campos?: any): Promise<Categoria> => {
  const existing = await repo.getCategoriaById(id);
  if (!existing) throw new Error("Categoría no encontrada");

  const nombreTrimmed = (nombre && typeof nombre === 'string') ? nombre.trim() : null;
  return repo.updateCategoria(id, nombreTrimmed, subcategorias, campos);
};

export const eliminarCategoriaGlobal = async (id: number): Promise<boolean> => {
  const existing = await repo.getCategoriaById(id);
  if (!existing) return false;
  return repo.deleteCategoria(id);
};

// ===== AREAS =====
export const crearArea = async (empresaId: number, nombre: string, sedeId?: number, responsable?: string): Promise<Area> => {
  const empresa = await empresaRepo.getById(empresaId);
  if (!empresa) throw new Error("Empresa no encontrada");

  if (sedeId) {
    const sede = await sedeRepo.getById(sedeId);
    if (!sede) throw new Error("Sede no encontrada");
  }

  if (!nombre || nombre.trim() === "") throw new Error("Nombre de área requerido");

  return repo.createArea(empresaId, nombre.trim(), sedeId, responsable || null);
};

export const listarAreas = async (empresaId: number): Promise<Area[]> => {
  const empresa = await empresaRepo.getById(empresaId);
  if (!empresa) throw new Error("Empresa no encontrada");

  return repo.getAreasByEmpresa(empresaId);
};

// ===== INVENTARIO =====
export const crearInventario = async (inv: Inventario): Promise<Inventario> => {
  console.log('crearInventario - llamado con:', JSON.stringify(inv));
  
  // Validaciones generales
  const empresa = await empresaRepo.getById(inv.empresaId);
  if (!empresa) throw new Error("Empresa no encontrada");

  if (inv.sedeId) {
    const sede = await sedeRepo.getById(inv.sedeId);
    if (!sede) throw new Error("Sede no encontrada");
  }

  // Check if a reserved code was provided and should be used
  const assetIdFromClient = (inv as any).assetId;
  const reservationIdFromClient = (inv as any).reservationId;
  
  let finalAssetId = assetIdFromClient;
  let reservationIdToConfirm: number | undefined = reservationIdFromClient;

  // If a code was provided and reservation ID exists, validate and use it
  if (assetIdFromClient && reservationIdFromClient) {
    console.log(`📝 Validando código reservado: ${assetIdFromClient} (reservation_id: ${reservationIdFromClient})`);
    
    const codeValidation = await codigoService.isCodeValidForCreation(
      assetIdFromClient,
      inv.empresaId,
      reservationIdFromClient
    );
    
    if (!codeValidation.valid) {
      console.warn(`⚠️ Código no válido: ${codeValidation.reason}`);
      throw new Error(codeValidation.reason || "Código no válido");
    }
    
    console.log(`✅ Código reservado validado: ${assetIdFromClient}`);
    finalAssetId = assetIdFromClient;
  } else {
    // Generate code automatically if not reserved
    console.log('⚠️ No se proporcionó código reservado, generando automáticamente');
    try {
      // Determine categoriaId to generate official code (EMP-CATNNNN)
      let categoriaId: number | undefined = (inv as any).categoriaId;

      if (!categoriaId && inv.categoria) {
        // Try resolve by name within empresa; if not found, try global categories
        try {
          const catsEmpresa = await repo.getCategoriasByEmpresa(inv.empresaId);
          const foundEmp = (catsEmpresa || []).find(c => c && c.nombre && c.nombre.toLowerCase() === String(inv.categoria).toLowerCase());
          if (foundEmp && foundEmp.id) categoriaId = foundEmp.id;
        } catch (_) { /* ignore and try global */ }
        if (!categoriaId) {
          try {
            const catsGlobal = await repo.getAllCategorias();
            const foundGlob = (catsGlobal || []).find(c => c && c.nombre && c.nombre.toLowerCase() === String(inv.categoria).toLowerCase());
            if (foundGlob && foundGlob.id) categoriaId = foundGlob.id;
          } catch (_) { /* ignore */ }
        }
      }

      if (!categoriaId) {
        console.warn('⚠️ crearInventario - categoriaId ausente y no se pudo resolver desde categoria (nombre).');
        throw new Error('Categoría requerida para generar código automáticamente');
      }

      // Reserve next official code for this empresa/categoria
      const reservation = await codigoService.getNextCode(inv.empresaId, categoriaId);
      finalAssetId = reservation.code;
      reservationIdToConfirm = reservation.reservation_id as any;
      console.log(`🔐 Código oficial reservado automáticamente: ${finalAssetId} (reservation_id: ${reservationIdToConfirm})`);
    } catch (e: any) {
      console.error('❌ crearInventario - ERROR al generar código oficial automáticamente:');
      console.error('   Error message:', e?.message);
      console.error('   Error code:', e?.code);
      console.error('   Error detail:', e?.detail);
      console.error('   Stack:', e?.stack);
      throw e;
    }
  }

  // Use reserved code path
  if (!finalAssetId || finalAssetId.trim() === "") {
    throw new Error("assetId requerido");
  }

  // Validar unicidad de assetId en tabla inventario
  const exists = await repo.checkAssetIdExists(finalAssetId);
  if (exists) {
    throw new Error("assetId ya existe (conflicto 409)");
  }

  // Update inventory with final asset ID
  (inv as any).assetId = finalAssetId;

  // Persist into detailed `inventario` table
  // compute antiguedad for manual assetId flow
  const a2 = computeAntiguedad(inv as any);
  if (a2.anios !== null) (inv as any).antiguedadAnios = a2.anios;
  if (typeof a2.meses !== 'undefined') (inv as any).antiguedadMeses = a2.meses;
  if (a2.text !== null) (inv as any).antiguedadText = a2.text;

  const created = await repo.createInventario(inv as any);
  console.log('crearInventario - creado en BD id=', (created as any).id, 'assetId=', (created as any).assetId);
  
  // Ya no hay tabla de reservas, no se necesita confirmar
  
  return created as Inventario;
};

export const obtenerInventario = async (id: number): Promise<Inventario | null> => {
  const inv = await repo.getInventarioById(id);
  if (!inv) return null;
  return inv as Inventario;
};

export const listarInventarioEmpresa = async (empresaId: number): Promise<Inventario[]> => {
  const empresa = await empresaRepo.getById(empresaId);
  if (!empresa) throw new Error("Empresa no encontrada");
  const items = await repo.getInventarioByEmpresa(empresaId);
  return items as Inventario[];
};

export const listarInventarioSede = async (sedeId: number, soloSedeActual: boolean = false): Promise<Inventario[]> => {
  const sede = await sedeRepo.getById(sedeId);
  if (!sede) throw new Error("Sede no encontrada");
  const items = await repo.getInventarioBySede(sedeId, sede.empresaId, soloSedeActual);
  return items as Inventario[];
};

// ===== FOTOS =====
export const agregarFoto = async (inventarioId: number, url: string, descripcion?: string): Promise<Foto> => {
  const inv = await repo.getInventarioById(inventarioId);
  if (!inv) throw new Error("Inventario no encontrado");

  return repo.addFoto(inventarioId, url, descripcion);
};

// ===== ACTUALIZAR INVENTARIO =====
export const actualizarInventario = async (inventarioId: number, data: any, opts?: { empresaId?: number, sedeId?: number, motivo?: string | null }, userId?: number | null): Promise<Inventario> => {
  const existing = await repo.getInventarioById(inventarioId);
  if (!existing) throw new Error('Inventario no encontrado');

  // Optionally validate empresaId/sedeId match
  if (opts && opts.empresaId && (existing as any).empresaId && opts.empresaId !== (existing as any).empresaId) {
    throw new Error('Empresa no encontrada o mismatch');
  }
  if (opts && opts.sedeId && (existing as any).sedeId && opts.sedeId !== (existing as any).sedeId) {
    throw new Error('Sede no encontrada o mismatch');
  }

  // Prepare partial update object
  const updateObj: any = {
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
    usuariosAsignados: data.usuariosAsignados || data.usuarioAsignado,
    camposPersonalizados: data.camposPersonalizados || data.dynamicFields || data.campos || data.especificacion,
    camposPersonalizadosArray: data.camposPersonalizadosArray || data.dynamicArrayFields || data.storages,
    observaciones: data.observaciones,
    purchaseDocumentUrl: data.purchaseDocumentUrl || data.purchase_document_url || null,
    warrantyDocumentUrl: data.warrantyDocumentUrl || data.warranty_document_url || null,
    purchaseDocumentDescription: data.purchaseDocumentDescription || data.purchase_document_description || null,
    warrantyDocumentDescription: data.warrantyDocumentDescription || data.warranty_document_description || null,
    codigoAccesoRemoto: data.codigoAccesoRemoto || data.codigo_acceso_remoto || null,
    empresaNombre: data.empresaNombre,
    sedeNombre: data.sedeNombre,
    area: data.area
  };

  // compute antiguedad from provided fechaCompra or approximate year
  const computed = computeAntiguedad({ fechaCompra: data.fechaCompra, fechaCompraAproxYear: data.fechaCompraAproxYear, fecha_compra_aprox_year: data.fecha_compra_aprox_year });
  if (computed.anios !== null) updateObj.antiguedadAnios = computed.anios;
  if (typeof computed.meses !== 'undefined') updateObj.antiguedadMeses = computed.meses;
  if (computed.text !== null) updateObj.antiguedadText = computed.text;

  // Capture fotos BEFORE any update for historial comparison
  const fotosAnteriores = await repo.getFotosByInventario(inventarioId);
  let fotosFinalesForHistorial: any[] | null = null;

  // Handle fotos logic per frontend spec:
  // If fotosFinales is provided, use it directly (fotosExistentes + fotosNuevas already merged in controller)
  // Otherwise fall back to old logic for backwards compatibility
  if (Array.isArray((data as any).fotosFinales)) {
    const fotosFinales = (data as any).fotosFinales;
    fotosFinalesForHistorial = fotosFinales;
    
    // Normalize for comparison
    const currentFotosJson = JSON.stringify(fotosAnteriores.map((f: any) => ({ url: f.url, name: f.name || '', descripcion: f.descripcion || '' })));
    const newFotosJson = JSON.stringify(fotosFinales.map((f: any) => ({ url: f.url, name: f.name || '', descripcion: f.descripcion || f.description || '' })));

    // Update fotos only if changed
    if (currentFotosJson !== newFotosJson) {
      // Delete all existing fotos and insert the final set
      await repo.deleteFotosByInventario(inventarioId);
      for (const f of fotosFinales) {
        const url = f.url || f.name || null;
        const descripcion = f.description || f.descripcion || f.desc || '';
        if (url) await repo.addFoto(inventarioId, url, descripcion);
      }
      // Sync fotos JSONB
      await repo.setFotosJsonb(inventarioId, fotosFinales);
    }
  } else {
    // Legacy/fallback logic for backwards compatibility with old frontend
    const uploadedFotos = Array.isArray((data as any).uploadedFotos) ? (data as any).uploadedFotos : [];
    const clientFotos = Array.isArray((data as any).fotos) ? (data as any).fotos.filter((f: any) => f && (typeof f.url === 'string' || typeof f.name === 'string')) : [];
    const replaceFotos = (data.replaceFotos === true || data.replaceFotos === 'true');

    if (uploadedFotos.length > 0 || clientFotos.length > 0) {
      const currentFotos = await repo.getFotosByInventario(inventarioId);
      const currentUrls = new Set(currentFotos.map((f: any) => f.url));

      if (replaceFotos) {
        await repo.deleteFotosByInventario(inventarioId);
        const toInsert = [...clientFotos, ...uploadedFotos];
        for (const f of toInsert) {
          const url = f.url || f.name || null;
          const descripcion = f.description || f.descripcion || f.desc || null;
          if (url) await repo.addFoto(inventarioId, url, descripcion);
        }
      } else {
        for (const f of clientFotos) {
          const url = f.url || f.name || null;
          const descripcion = f.description || f.descripcion || f.desc || null;
          if (url && !currentUrls.has(url)) {
            await repo.addFoto(inventarioId, url, descripcion);
            currentUrls.add(url);
          }
        }
        for (const f of uploadedFotos) {
          const url = f.url || f.name || null;
          const descripcion = f.description || f.descripcion || f.desc || null;
          if (url && !currentUrls.has(url)) {
            await repo.addFoto(inventarioId, url, descripcion);
            currentUrls.add(url);
          }
        }
      }
      const refreshedFotos = await repo.getFotosByInventario(inventarioId);
      await repo.setFotosJsonb(inventarioId, refreshedFotos);
    }
  }

  // Update main inventario row (fields only) + historial atomically
  const updated = await repo.updateInventarioByIdWithHistorial(inventarioId, updateObj, {
    empresaId: opts?.empresaId,
    sedeId: opts?.sedeId,
    motivo: (data && (data.motivo || data.reason)) || null,
    fotosAnteriores: fotosAnteriores,
    fotosFinales: fotosFinalesForHistorial
  }, userId || null);

  return updated as Inventario;
};


