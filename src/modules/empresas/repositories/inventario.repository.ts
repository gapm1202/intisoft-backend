import { pool } from "../../../config/db";
import { Categoria, Area, Inventario, RAM, Storage, Foto } from "../models/inventario.model";
import fs from 'fs';
import path from 'path';

const SERVER_BASE = process.env.SERVER_BASE_URL || process.env.SERVER_URL || 'http://localhost:4000';

const formatDateYMD = (d: any): string | null => {
  if (!d) return null;
  try {
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().split('T')[0];
  } catch (_) { return null; }
};

// Try to find a stored filename in uploads that ends with the provided original name
const resolveUploadedFilename = (originalName: string): string | null => {
  try {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) return null;
    const files = fs.readdirSync(uploadsDir);
    
    // 1. Exact match
    for (const f of files) {
      if (f === originalName) return f;
    }
    
    // 2. Try with spaces replaced by underscores (multer diskStorage pattern)
    const normalized = originalName.replace(/\s+/g, '_');
    for (const f of files) {
      if (f === normalized) return f;
    }
    
    // 3. Try endsWith for original name
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
      if (f.endsWith(originalName)) return f;
    }
    
    // 4. Try endsWith for normalized name (with underscores)
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
      if (f.endsWith(normalized)) return f;
    }
    
    // 5. Fuzzy match: check if the stored filename contains the base name (without extension)
    const baseName = originalName.replace(/\.[^.]+$/, ''); // remove extension
    const baseNormalized = baseName.replace(/\s+/g, '_');
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
      // Check if file contains the base name pattern (case-insensitive)
      if (f.toLowerCase().includes(baseNormalized.toLowerCase())) return f;
    }
    
    return null;
  } catch (e) {
    return null;
  }
};

const canonicalizeHttpUrl = (u: string): string => {
  try {
    const parsed = new URL(u);
    // encode each pathname segment
    const parts = parsed.pathname.split('/').map(p => encodeURIComponent(decodeURIComponent(p))).join('/');
    // Avoid double-encoding trailing slash
    parsed.pathname = parts;
    return parsed.toString();
  } catch (e) {
    // fallback: encode only the last segment
    if (!u) return u;
    const idx = u.lastIndexOf('/');
    if (idx === -1) return encodeURIComponent(u);
    const prefix = u.substring(0, idx + 1);
    const last = u.substring(idx + 1);
    return prefix + encodeURIComponent(last);
  }
};

const normalizeFoto = (f: any): Foto => {
  if (!f) return { id: 0, url: '', descripcion: '' } as Foto;
  // If a simple string is provided, treat as filename or URL
  if (typeof f === 'string') {
    const name = f;
    if (name.startsWith('http')) return { id: 0, url: canonicalizeHttpUrl(name), descripcion: '', name } as Foto;
    if (name.startsWith('/')) return { id: 0, url: canonicalizeHttpUrl(`${SERVER_BASE}${name}`), descripcion: '', name } as Foto;
    // bare filename: try to resolve actual stored filename
    const resolved = resolveUploadedFilename(name) || name;
    const filename = encodeURIComponent(resolved);
    return { id: 0, url: `${SERVER_BASE}/uploads/${filename}`, descripcion: '', name } as Foto;
  }

  // object case
  const rawUrl = f.url || f.name || '';
  if (typeof rawUrl === 'string' && rawUrl.startsWith('http')) {
    return {
      id: f.id || 0,
      url: canonicalizeHttpUrl(rawUrl),
      descripcion: f.descripcion || f.description || '',
      name: f.name || (() => { try { return new URL(rawUrl).pathname.split('/').pop() || ''; } catch { return rawUrl.split('/').pop() || ''; } })()
    } as Foto;
  }
  if (typeof rawUrl === 'string' && rawUrl.startsWith('/')) {
    const full = `${SERVER_BASE}${rawUrl}`;
    return {
      id: f.id || 0,
      url: canonicalizeHttpUrl(full),
      descripcion: f.descripcion || f.description || '',
      name: f.name || rawUrl.split('/').pop() || ''
    } as Foto;
  }

  // bare filename in object
  const candidate = (rawUrl && rawUrl.toString()) || '';
  const resolved = resolveUploadedFilename(candidate) || candidate;
  const filename = encodeURIComponent(resolved);
  return {
    id: f.id || 0,
    url: `${SERVER_BASE}/uploads/${filename}`,
    descripcion: f.descripcion || f.description || '',
    name: f.name || (candidate ? candidate.split('/').pop() : '')
  } as Foto;
};

const normalizeFotosArray = (arr: any): Foto[] => {
  if (!arr) return [];
  if (!Array.isArray(arr)) return [normalizeFoto(arr)];
  return arr.map(normalizeFoto);
};

const ensureAbsoluteFotos = (arr: any): Foto[] => {
  const list = Array.isArray(arr) ? arr : (arr ? [arr] : []);
  return list.map((f: any) => normalizeFoto(f));
};

// ===== CATEGORIAS =====
export const createCategoria = async (empresaId: number | null, nombre: string, subcategorias?: string[], campos?: any): Promise<Categoria> => {
  // Check existence first to return a friendly conflict error instead of letting PG throw
  try {
    const existsQuery = empresaId == null
      ? `SELECT id, empresa_id as "empresaId", nombre, subcategorias, COALESCE(campos, '[]'::jsonb) as campos, creado_en as "creadoEn" FROM categorias WHERE empresa_id IS NULL AND lower(nombre) = lower($1) LIMIT 1`
      : `SELECT id, empresa_id as "empresaId", nombre, subcategorias, COALESCE(campos, '[]'::jsonb) as campos, creado_en as "creadoEn" FROM categorias WHERE empresa_id = $1 AND lower(nombre) = lower($2) LIMIT 1`;

    const existsResult = empresaId == null
      ? await pool.query(existsQuery, [nombre])
      : await pool.query(existsQuery, [empresaId, nombre]);

    if (existsResult.rows && existsResult.rows.length > 0) {
      const e: any = new Error('Ya existe la categoría con ese nombre');
      e.code = '23505';
      throw e;
    }

    const query = `
      INSERT INTO categorias (empresa_id, nombre, subcategorias, campos)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, empresa_id as "empresaId", nombre, subcategorias, COALESCE(campos, '[]'::jsonb) as campos, creado_en as "creadoEn"
    `;
    const camposJson = campos ? JSON.stringify(campos) : JSON.stringify([]);
    const result = await pool.query(query, [empresaId || null, nombre, subcategorias || [], camposJson]);
    return result.rows[0];
  } catch (err: any) {
    // Normalize PG unique-violation into a friendly error with code '23505'
    if (err && (err.code === '23505' || (err.message && err.message.toLowerCase().includes('llave duplicada')))) {
      const e: any = new Error('Ya existe la categoría con ese nombre');
      e.code = '23505';
      throw e;
    }
    throw err;
  }
};

export const getCategoriasByEmpresa = async (empresaId: number): Promise<Categoria[]> => {
  const query = `
    SELECT id, empresa_id as "empresaId", nombre, subcategorias, creado_en as "creadoEn"
    FROM categorias WHERE empresa_id = $1
  `;
  const result = await pool.query(query, [empresaId]);
  return result.rows;
};

export const getAllCategorias = async (): Promise<Categoria[]> => {
  const query = `
    SELECT id, empresa_id as "empresaId", nombre, subcategorias, creado_en as "creadoEn",
      COALESCE(campos, '[]'::jsonb) as campos
    FROM categorias WHERE empresa_id IS NULL
    ORDER BY nombre
  `;
  const result = await pool.query(query);
  return result.rows;
};

export const getCategoriaById = async (id: number): Promise<Categoria | null> => {
  const query = `
    SELECT id, empresa_id as "empresaId", nombre, subcategorias, creado_en as "creadoEn",
      COALESCE(campos, '[]'::jsonb) as campos
    FROM categorias WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const updateCategoria = async (id: number, nombre: string, subcategorias?: string[], campos?: any): Promise<Categoria> => {
  const query = `
    UPDATE categorias SET nombre = COALESCE($1, nombre), subcategorias = $2, campos = $3::jsonb
    WHERE id = $4
    RETURNING id, empresa_id as "empresaId", nombre, subcategorias, COALESCE(campos, '[]'::jsonb) as campos, creado_en as "creadoEn";
  `;
  const camposJson = campos ? JSON.stringify(campos) : JSON.stringify([]);
  const result = await pool.query(query, [nombre, subcategorias || [], camposJson, id]);
  return result.rows[0];
};

export const deleteCategoria = async (id: number): Promise<boolean> => {
  const query = `DELETE FROM categorias WHERE id = $1 RETURNING id`;
  const result = await pool.query(query, [id]);
  return result.rows.length > 0;
};

// ===== AREAS =====
export const createArea = async (empresaId: number, nombre: string, sedeId?: number, responsable?: string): Promise<Area> => {
  const query = `
    INSERT INTO areas (empresa_id, sede_id, nombre, responsable)
    VALUES ($1, $2, $3, $4)
    RETURNING id, empresa_id as "empresaId", sede_id as "sedeId", nombre, responsable, creado_en as "creadoEn"
  `;
  const result = await pool.query(query, [empresaId, sedeId || null, nombre, responsable || null]);
  return result.rows[0];
};

export const getAreasByEmpresa = async (empresaId: number): Promise<Area[]> => {
  const query = `
    SELECT id, empresa_id as "empresaId", sede_id as "sedeId", nombre, responsable, creado_en as "creadoEn"
    FROM areas WHERE empresa_id = $1
  `;
  const result = await pool.query(query, [empresaId]);
  return result.rows;
};

export const getAreaById = async (id: number): Promise<Area | null> => {
  const query = `
    SELECT id, empresa_id as "empresaId", sede_id as "sedeId", nombre, responsable, creado_en as "creadoEn"
    FROM areas WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

// ===== INVENTARIO =====
export const createInventario = async (inv: Inventario): Promise<Inventario> => {
  // Build columns and params dynamically to avoid placeholder mismatches
  const columns = [
    'empresa_id', 'sede_id',
    'asset_id', 'categoria', 'area', 'fabricante', 'modelo', 'serie',
    'estado_activo', 'estado_operativo', 'fecha_compra',
    'proveedor', 'ip', 'mac', 'usuarios_asignados',
    'campos_personalizados', 'campos_personalizados_array', 'observaciones',
    'purchase_document_url', 'warranty_document_url', 'purchase_document_description', 'warranty_document_description',
    'tipo_documento_compra', 'numero_documento_compra', 'fecha_compra_aprox_year',
    'garantia', 'condicion_fisica', 'antiguedad_anios', 'antiguedad_meses', 'antiguedad_text', 'fotos'
  ];

  const params = [
    inv.empresaId,
    inv.sedeId || null,
    inv.assetId,
    inv.categoria || null,
    inv.area || null,
    inv.fabricante || null,
    inv.modelo || null,
    inv.serie || null,
    inv.estadoActivo || null,
    inv.estadoOperativo || null,
    inv.fechaCompra || null,
    inv.proveedor || null,
    inv.ip || null,
    inv.mac || null,
    // usuarios_asignados jsonb
    JSON.stringify((inv as any).usuariosAsignados || (inv as any).usuarioAsignado ? (Array.isArray((inv as any).usuariosAsignados) ? (inv as any).usuariosAsignados : [(inv as any).usuarioAsignado]) : []),
    // campos personalizados
    JSON.stringify((inv as any).camposPersonalizados || (inv as any).dynamicFields || (inv as any).campos || (inv as any).especificacion || {}),
    JSON.stringify((inv as any).camposPersonalizadosArray || (inv as any).dynamicArrayFields || (inv as any).storages || []),
    inv.observaciones || null,
    (inv as any).purchaseDocumentUrl || (inv as any).purchase_document_url || null,
    (inv as any).warrantyDocumentUrl || (inv as any).warranty_document_url || null,
    (inv as any).purchaseDocumentDescription || (inv as any).purchase_document_description || null,
    (inv as any).warrantyDocumentDescription || (inv as any).warranty_document_description || null,
    // purchase/warranty document metadata
    (inv as any).tipoDocumentoCompra || (inv as any).tipo_documento_compra || null,
    (inv as any).numeroDocumentoCompra || (inv as any).numero_documento_compra || null,
    (inv as any).fechaCompraAproxYear || (inv as any).fecha_compra_aprox_year || null,
    (inv as any).garantia || null,
    // condicion_fisica
    ((inv as any).condicionFisica || (inv as any).condicion_fisica) ? String((inv as any).condicionFisica || (inv as any).condicion_fisica).toUpperCase() : null,
    (inv as any).antiguedadAnios || (inv as any).antiguedad_anios || null,
    (inv as any).antiguedadMeses || (inv as any).antiguedad_meses || null,
    (inv as any).antiguedadText || (inv as any).antiguedad_text || null,
    JSON.stringify((inv as any).fotos || [])
  ];

  // Map of column -> type casting suffix to apply to placeholder
  const typeSuffix: Record<string,string> = {
    'fecha_compra': '::date',
    'usuarios_asignados': '::jsonb',
    'campos_personalizados': '::jsonb',
    'campos_personalizados_array': '::jsonb',
    'fotos': '::jsonb'
  };

  const placeholders = columns.map((col, i) => `$${i+1}${typeSuffix[col] || ''}`).join(',');
  const query = `INSERT INTO inventario (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`;

  try {
    console.log('createInventario - insert params preview:', JSON.stringify(params.slice(0,10)) + (params.length>10? '...':''));
    const result = await pool.query(query, params as any[]);
    // normalize returned row to match Inventario interface (aliases)
    const row = result.rows[0];
    const fotos = normalizeFotosArray(row.fotos);
    return {
    id: row.id,
    empresaId: row.empresa_id,
    sedeId: row.sede_id,
    assetId: row.asset_id,
    categoria: row.categoria,
    area: row.area,
    fabricante: row.fabricante,
    modelo: row.modelo,
    serie: row.serie,
    estadoActivo: row.estado_activo,
    estadoOperativo: row.estado_operativo,
    fechaCompra: row.fecha_compra,
    fechaCompraStr: formatDateYMD(row.fecha_compra),
    proveedor: row.proveedor,
    ip: row.ip,
    mac: row.mac,
    purchaseDocumentUrl: row.purchase_document_url,
    warrantyDocumentUrl: row.warranty_document_url,
    purchaseDocumentDescription: row.purchase_document_description,
    warrantyDocumentDescription: row.warranty_document_description,
    tipoDocumentoCompra: row.tipo_documento_compra,
    numeroDocumentoCompra: row.numero_documento_compra,
    fechaCompraAproxYear: row.fecha_compra_aprox_year,
    garantia: row.garantia,
    condicionFisica: row.condicion_fisica,
    antiguedadAnios: row.antiguedad_anios,
    antiguedadMeses: row.antiguedad_meses,
    antiguedadText: row.antiguedad_text,
    usuarioAsignado: null,
    camposPersonalizados: row.campos_personalizados,
    camposPersonalizadosArray: row.campos_personalizados_array,
    observaciones: row.observaciones,
    fotos: fotos,
    creadoEn: row.created_at,
    actualizadoEn: row.updated_at
    } as Inventario;
  } catch (err) {
    console.error('createInventario - SQL error, params:', params);
    console.error('createInventario - error:', err && (err.stack || err));
    throw err;
  }
};

// Wrap createInventario with logging of SQL errors (kept above as implementation)

export const getInventarioById = async (id: number): Promise<Inventario | null> => {
  const query = `
    SELECT
      id, empresa_id, sede_id,
      asset_id, categoria, area, fabricante, modelo, serie,
      estado_activo, estado_operativo, fecha_compra,
      proveedor, ip, mac, usuarios_asignados,
      campos_personalizados, campos_personalizados_array, observaciones, fotos,
      purchase_document_url, warranty_document_url, purchase_document_description, warranty_document_description,
      tipo_documento_compra, numero_documento_compra, fecha_compra_aprox_year,
      garantia,
      condicion_fisica,
      antiguedad_anios, antiguedad_meses, antiguedad_text,
      created_at, updated_at
    FROM inventario WHERE id = $1`;
  const result = await pool.query(query, [id]);
  const row = result.rows[0];
  console.log('GET inventario - row completo (by id):', row);
  if (!row) return null;
  const parseIfString = (v: any) => {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  };

  const parsedUsuario = parseIfString(row.usuarios_asignados);
  const usuariosAsignados = Array.isArray(parsedUsuario) ? parsedUsuario : (parsedUsuario ? [parsedUsuario] : []);

  const camposPersonalizados = parseIfString(row.campos_personalizados);
  const camposPersonalizadosArray = parseIfString(row.campos_personalizados_array);
  const fotos = normalizeFotosArray(parseIfString(row.fotos));

  return {
    id: row.id,
    empresaId: row.empresa_id,
    sedeId: row.sede_id,
    assetId: row.asset_id,
    categoria: row.categoria,
    area: row.area,
    fabricante: row.fabricante,
    modelo: row.modelo,
    serie: row.serie,
    estadoActivo: row.estado_activo,
    estadoOperativo: row.estado_operativo,
    fechaCompra: row.fecha_compra,
    fechaCompraStr: formatDateYMD(row.fecha_compra),
    proveedor: row.proveedor,
    ip: row.ip,
    mac: row.mac,
    purchaseDocumentUrl: row.purchase_document_url,
    warrantyDocumentUrl: row.warranty_document_url,
    purchaseDocumentDescription: row.purchase_document_description,
    warrantyDocumentDescription: row.warranty_document_description,
    tipoDocumentoCompra: row.tipo_documento_compra,
    numeroDocumentoCompra: row.numero_documento_compra,
    fechaCompraAproxYear: row.fecha_compra_aprox_year,
    garantia: row.garantia,
    condicionFisica: row.condicion_fisica,
    antiguedadAnios: row.antiguedad_anios,
    antiguedadMeses: row.antiguedad_meses,
    antiguedadText: row.antiguedad_text,
    usuarioAsignado: usuariosAsignados.length > 0 ? usuariosAsignados[0] : null,
    usuariosAsignados: usuariosAsignados,
    camposPersonalizados: camposPersonalizados,
    camposPersonalizadosArray: camposPersonalizadosArray,
    campos_personalizados: row.campos_personalizados,
    campos_personalizados_array: row.campos_personalizados_array,
    observaciones: row.observaciones,
    fotos: fotos,
    creadoEn: row.created_at,
    actualizadoEn: row.updated_at
  } as Inventario;
};

  export const getInventarioByEmpresa = async (empresaId: number): Promise<Inventario[]> => {
    const query = `
      SELECT
        id, empresa_id, sede_id, sede_original_id,
        asset_id, categoria, area, fabricante, modelo, serie,
        estado_activo, estado_operativo, fecha_compra,
        proveedor, ip, mac, usuarios_asignados,
        campos_personalizados, campos_personalizados_array, observaciones, fotos,
        purchase_document_url, warranty_document_url, purchase_document_description, warranty_document_description,
        tipo_documento_compra, numero_documento_compra, fecha_compra_aprox_year,
        garantia,
        condicion_fisica,
        antiguedad_anios, antiguedad_meses, antiguedad_text,
        created_at, updated_at
      FROM inventario WHERE empresa_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(query, [empresaId]);
    const parseIfString = (v: any) => {
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    return result.rows.map((row: any) => {
      const parsedUsuario = parseIfString(row.usuarios_asignados);
      const usuariosAsignados = Array.isArray(parsedUsuario) ? parsedUsuario : (parsedUsuario ? [parsedUsuario] : []);
      const camposPersonalizados = parseIfString(row.campos_personalizados);
      const camposPersonalizadosArray = parseIfString(row.campos_personalizados_array);
      const fotos = normalizeFotosArray(parseIfString(row.fotos));

      return {
        id: row.id,
        empresaId: row.empresa_id,
        sedeId: row.sede_id,
        assetId: row.asset_id,
        categoria: row.categoria,
        area: row.area,
        fabricante: row.fabricante,
        modelo: row.modelo,
        serie: row.serie,
        estadoActivo: row.estado_activo,
        estadoOperativo: row.estado_operativo,
        fechaCompra: row.fecha_compra,
        proveedor: row.proveedor,
        ip: row.ip,
        mac: row.mac,
        purchaseDocumentUrl: row.purchase_document_url,
        warrantyDocumentUrl: row.warranty_document_url,
        purchaseDocumentDescription: row.purchase_document_description,
        warrantyDocumentDescription: row.warranty_document_description,
        tipoDocumentoCompra: row.tipo_documento_compra,
        numeroDocumentoCompra: row.numero_documento_compra,
        fechaCompraAproxYear: row.fecha_compra_aprox_year,
        garantia: row.garantia,
        condicionFisica: row.condicion_fisica,
        antiguedadAnios: row.antiguedad_anios,
        antiguedadMeses: row.antiguedad_meses,
        antiguedadText: row.antiguedad_text,
        usuarioAsignado: usuariosAsignados.length > 0 ? usuariosAsignados[0] : null,
        usuariosAsignados: usuariosAsignados,
        camposPersonalizados: camposPersonalizados,
        camposPersonalizadosArray: camposPersonalizadosArray,
        observaciones: row.observaciones,
        fotos: fotos,
        fechaCompraStr: formatDateYMD(row.fecha_compra),
        creadoEn: row.created_at,
        actualizadoEn: row.updated_at
      } as Inventario;
    });
  };

export const getInventarioBySede = async (sedeId: number, empresaId: number, soloSedeActual: boolean = false): Promise<Inventario[]> => {
  // Mostrar activos en AMBAS sedes (original Y destino):
  // - sede_id = sedeId: activos actualmente en esta sede (OPERATIVOS, se manejan desde aquí)
  // - sede_original_id = sedeId: activos creados aquí pero trasladados (BLOQUEADOS, solo lectura)
  // Campo trasladado = (sede_id != sede_original_id) indica si fue trasladado
  // Frontend usa sede_id === sedeActual para determinar si es operativo o bloqueado
  const whereClause = soloSedeActual 
    ? 'WHERE empresa_id = $1 AND (sede_id = $2 OR sede_original_id = $2)' 
    : 'WHERE empresa_id = $1';
  const params = soloSedeActual ? [empresaId, sedeId] : [empresaId];
  
  const query = `
    SELECT
      id, empresa_id, sede_id, sede_original_id,
      asset_id, categoria, area, fabricante, modelo, serie,
      estado_activo, estado_operativo, fecha_compra,
      proveedor, ip, mac, usuarios_asignados,
      campos_personalizados, campos_personalizados_array, observaciones, fotos,
      purchase_document_url, warranty_document_url, purchase_document_description, warranty_document_description,
      tipo_documento_compra, numero_documento_compra, fecha_compra_aprox_year,
      garantia,
      condicion_fisica,
      antiguedad_anios, antiguedad_meses, antiguedad_text,
      created_at, updated_at,
      (sede_id IS DISTINCT FROM sede_original_id) as trasladado
    FROM inventario ${whereClause} ORDER BY created_at DESC`;
    try {
    const result = await pool.query(query, params);
    console.log('getInventarioBySede - empresaId=', empresaId, 'sedeId=', sedeId, 'soloSedeActual=', soloSedeActual, 'WHERE=', whereClause, 'rows=', result.rows.length);
    
    // Debug: clasificar activos según están en esta sede o fueron trasladados
    const activosOperativos = result.rows.filter((r: any) => r.sede_id === sedeId);
    const activosBloqueados = result.rows.filter((r: any) => r.sede_original_id === sedeId && r.sede_id !== sedeId);
    
    console.log(`📊 Activos visibles en Sede ${sedeId}:`);
    console.log(`   ✅ OPERATIVOS (sede_id=${sedeId}, se manejan aquí): ${activosOperativos.length}`);
    if (activosOperativos.length > 0) {
      console.log('      ', activosOperativos.map((r: any) => `${r.asset_id} (original=${r.sede_original_id}, trasladado=${r.trasladado || false})`).join(', '));
    }
    console.log(`   🔒 BLOQUEADOS (sede_original_id=${sedeId}, trasladados fuera): ${activosBloqueados.length}`);
    if (activosBloqueados.length > 0) {
      console.log('      ', activosBloqueados.map((r: any) => `${r.asset_id} (ahora en sede ${r.sede_id})`).join(', '));
    }
    const parseIfString = (v: any) => {
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    return result.rows.map((row: any) => {
      const parsedUsuario = parseIfString(row.usuarios_asignados);
      const usuariosAsignados = Array.isArray(parsedUsuario) ? parsedUsuario : (parsedUsuario ? [parsedUsuario] : []);
      const camposPersonalizados = parseIfString(row.campos_personalizados);
      const camposPersonalizadosArray = parseIfString(row.campos_personalizados_array);
      const fotos = normalizeFotosArray(parseIfString(row.fotos));

      return {
        id: row.id,
        empresaId: row.empresa_id,
        sedeId: row.sede_id,
        sedeOriginalId: row.sede_original_id,
        trasladado: row.trasladado || false,
        // empresaNombre / sedeNombre removed from DB schema
        assetId: row.asset_id,
        categoria: row.categoria,
        area: row.area,
        fabricante: row.fabricante,
        modelo: row.modelo,
        serie: row.serie,
        estadoActivo: row.estado_activo,
        estadoOperativo: row.estado_operativo,
        fechaCompra: row.fecha_compra,
        fechaCompraStr: formatDateYMD(row.fecha_compra),
        proveedor: row.proveedor,
        ip: row.ip,
        mac: row.mac,
        purchaseDocumentUrl: row.purchase_document_url,
        warrantyDocumentUrl: row.warranty_document_url,
        purchaseDocumentDescription: row.purchase_document_description,
        warrantyDocumentDescription: row.warranty_document_description,
        tipoDocumentoCompra: row.tipo_documento_compra,
        numeroDocumentoCompra: row.numero_documento_compra,
        fechaCompraAproxYear: row.fecha_compra_aprox_year,
        garantia: row.garantia,
        condicionFisica: row.condicion_fisica,
        antiguedadAnios: row.antiguedad_anios,
        antiguedadMeses: row.antiguedad_meses,
        antiguedadText: row.antiguedad_text,
        usuarioAsignado: usuariosAsignados.length > 0 ? usuariosAsignados[0] : null,
        usuariosAsignados: usuariosAsignados,
        // correo and cargo removed from table
        camposPersonalizados: camposPersonalizados,
        camposPersonalizadosArray: camposPersonalizadosArray,
        observaciones: row.observaciones,
        fotos: fotos,
        creadoEn: row.created_at,
        actualizadoEn: row.updated_at
      } as any;
      });
  } catch (err) {
    console.error('getInventarioBySede - SQL error for empresaId', empresaId, 'sedeId', sedeId, err);
    throw err;
  }
};

export const checkAssetIdExists = async (assetId: string): Promise<boolean> => {
  const query = `SELECT 1 FROM inventario WHERE asset_id = $1 LIMIT 1`;
  const result = await pool.query(query, [assetId]);
  return result.rows.length > 0;
};

export const getLastAssetCodeByPrefix = async (prefix: string): Promise<string | null> => {
  const likePattern = `${prefix}-%`;
  const query = `SELECT asset_id FROM inventario WHERE asset_id LIKE $1 ORDER BY asset_id DESC LIMIT 1`;
  const result = await pool.query(query, [likePattern]);
  return result.rows[0] ? result.rows[0].asset_id : null;
};

export const createInventarioWithGeneratedAsset = async (prefix: string, inv: Inventario): Promise<Inventario> => {
  // Use serializable transaction with retry to avoid race conditions when generating numeric suffix
  const maxAttempts = 5;
  let attempt = 0;
  const likePattern = `${prefix}-%`;

  const client = await pool.connect();
  try {
    while (attempt < maxAttempts) {
      attempt++;
      try {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

        // Códigos GLOBALES - únicos en TODA la base de datos
        // Buscar el máximo número con el prefijo sin filtrar por empresa ni sede
          // Ahora usamos formato de 4 dígitos: PREFIX-0001
          const regexPattern = `^${prefix}-[0-9]{4}$`;
        
        const maxQuery = `SELECT COALESCE(MAX((regexp_replace(asset_id, '^.*-(\\d+)$', '\\1'))::INTEGER), 0) AS maxnum FROM inventario WHERE asset_id ~ $1`;
        const maxParams = [regexPattern];
        
        console.log(`🌐 Generando código GLOBAL - Prefix: ${prefix}, EmpresaId: ${inv.empresaId}, SedeId: ${inv.sedeId || 'NULL'}`);
        
        const maxRes = await client.query(maxQuery, maxParams);
        const nextNum = (maxRes.rows[0] && maxRes.rows[0].maxnum ? parseInt(maxRes.rows[0].maxnum, 10) : 0) + 1;
          const generated = `${prefix}-${String(nextNum).padStart(4, '0')}`;
        
        console.log(`🔢 Código GLOBAL generado - Prefix: ${prefix}, Max en BD: ${maxRes.rows[0]?.maxnum || 0}, Generado: ${generated}, Para Empresa: ${inv.empresaId}, Sede: ${inv.sedeId || 'NULL'}`);

        // Prepare insert params (same as createInventario) - using usuarios_asignados jsonb
        const insertQuery = `
          INSERT INTO inventario (
            empresa_id, sede_id, sede_original_id,
            asset_id, categoria, area, fabricante, modelo, serie,
            estado_activo, estado_operativo, fecha_compra,
            proveedor, ip, mac, usuarios_asignados,
            campos_personalizados, campos_personalizados_array, observaciones,
            purchase_document_url, warranty_document_url, purchase_document_description, warranty_document_description,
            tipo_documento_compra, numero_documento_compra, fecha_compra_aprox_year,
                  garantia,
                  condicion_fisica,
            antiguedad_anios, antiguedad_meses, antiguedad_text, fotos
          )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::date,$13,$14,$15,$16::jsonb,$17::jsonb,$18::jsonb,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32::jsonb)
          RETURNING *
        `;

        const params = [
          inv.empresaId,
          inv.sedeId || null,
          inv.sedeId || null, // sede_original_id = sede_id al crear
          generated,
          inv.categoria || null,
          inv.area || null,
          inv.fabricante || null,
          inv.modelo || null,
          inv.serie || null,
          inv.estadoActivo || null,
          inv.estadoOperativo || null,
          inv.fechaCompra || null,
          inv.proveedor || null,
          inv.ip || null,
          inv.mac || null,
          // usuarios_asignados jsonb
          JSON.stringify((inv as any).usuariosAsignados || (inv as any).usuarioAsignado ? (Array.isArray((inv as any).usuariosAsignados) ? (inv as any).usuariosAsignados : [(inv as any).usuarioAsignado]) : []),
          JSON.stringify((inv as any).camposPersonalizados || (inv as any).dynamicFields || (inv as any).campos || (inv as any).especificacion || {}),
          JSON.stringify((inv as any).camposPersonalizadosArray || (inv as any).dynamicArrayFields || (inv as any).storages || []),
          inv.observaciones || null,
          (inv as any).purchaseDocumentUrl || (inv as any).purchase_document_url || null,
          (inv as any).warrantyDocumentUrl || (inv as any).warranty_document_url || null,
          (inv as any).purchaseDocumentDescription || (inv as any).purchase_document_description || null,
          (inv as any).warrantyDocumentDescription || (inv as any).warranty_document_description || null,
          // purchase/warranty document metadata: tipo/numero/approx-year (accept various keys)
          (inv as any).tipoDocumentoCompra || (inv as any).tipo_documento_compra || null,
          (inv as any).numeroDocumentoCompra || (inv as any).numero_documento_compra || null,
          (inv as any).fechaCompraAproxYear || (inv as any).fecha_compra_aprox_year || null,
          // accept garantia (camelCase from frontend)
          (inv as any).garantia || null,
          // condicion_fisica: accept camelCase or snake_case and normalize to uppercase code
          ((inv as any).condicionFisica || (inv as any).condicion_fisica) ? String((inv as any).condicionFisica || (inv as any).condicion_fisica).toUpperCase() : null,
          (inv as any).antiguedadAnios || (inv as any).antiguedad_anios || null,
          (inv as any).antiguedadMeses || (inv as any).antiguedad_meses || null,
          (inv as any).antiguedadText || (inv as any).antiguedad_text || null,
          JSON.stringify((inv as any).fotos || [])
        ];
          // params will include condicion_fisica at position 30 (index 29)

        // Debug: log fecha params passed to INSERT inside transaction
        console.log('✍️ Insertando activo:', {
          empresaId: params[0],
          sedeId: params[1],
          assetId: generated,
          categoria: params[4],
          fechaCompra: params[11]
        });
        // Debug: log query placeholder count and params length to diagnose PG error
        try {
          // Compute the exact highest placeholder index used in the SQL (e.g. $1..$28)
          const matches = Array.from(insertQuery.matchAll(/\$(\d+)/g)).map(m => parseInt(m[1], 10));
          const maxPlaceholderIndex = matches.length ? Math.max(...matches) : 0;
          const rawDollarCount = (insertQuery.match(/\$/g) || []).length;
          console.log('DEBUG insertQuery maxPlaceholderIndex:', maxPlaceholderIndex, 'rawDollarCount:', rawDollarCount);

          if (maxPlaceholderIndex !== params.length) {
            // Write a diagnostic entry to tmp_inventario_error.log to capture exact SQL + params
            try {
              const diag = {
                time: new Date().toISOString(),
                location: 'createInventarioWithGeneratedAsset - placeholder mismatch',
                maxPlaceholderIndex,
                paramsLength: params.length,
                rawDollarCount,
                insertSnippet: insertQuery.replace(/\s+/g, ' ').substring(0, 2000),
                paramsPreview: params.slice(0, 50)
              };
              fs.appendFileSync(path.resolve(process.cwd(), 'tmp_inventario_error.log'), JSON.stringify(diag) + '\n-----\n');
            } catch (e) {
              console.error('Failed to write placeholder diagnostic file', e);
            }
            // Don't throw here: allow flow to continue and use the programmatically rebuilt query
            console.warn(`Placeholder mismatch detected (sql max $${maxPlaceholderIndex} vs params ${params.length}). Using rebuilt INSERT query instead.`);
          }
        } catch (e) {
          console.error('Placeholder check failed', e && (e.stack || e));
        }
        console.log('DEBUG insertQuery snippet:', insertQuery.replace(/\s+/g, ' ').substring(0, 240));
        console.log('DEBUG params.length =', params.length);
        // avoid logging full params to not leak secrets, but show trimmed preview
        console.log('DEBUG params preview:', JSON.stringify(params.slice(0, 10)) + (params.length > 10 ? '... (truncated)' : ''));

        // Rebuild insert query programmatically to ensure placeholders/types match params
        const columnsTx = [
          'empresa_id','sede_id','sede_original_id',
          'asset_id','categoria','area','fabricante','modelo','serie',
          'estado_activo','estado_operativo','fecha_compra',
          'proveedor','ip','mac','usuarios_asignados',
          'campos_personalizados','campos_personalizados_array','observaciones',
          'purchase_document_url','warranty_document_url','purchase_document_description','warranty_document_description',
          'tipo_documento_compra','numero_documento_compra','fecha_compra_aprox_year',
          'garantia','condicion_fisica','antiguedad_anios','antiguedad_meses','antiguedad_text','fotos'
        ];
        const typeSuffixTx: Record<string,string> = {
          'fecha_compra': '::date',
          'usuarios_asignados': '::jsonb',
          'campos_personalizados': '::jsonb',
          'campos_personalizados_array': '::jsonb',
          'fotos': '::jsonb'
        };
        const placeholdersTx = columnsTx.map((c, i) => `$${i+1}${typeSuffixTx[c] || ''}`).join(',');
        const finalInsertQuery = `INSERT INTO inventario (${columnsTx.join(',')}) VALUES (${placeholdersTx}) RETURNING *`;

        const insertRes = await client.query(finalInsertQuery, params as any[]);
        await client.query('COMMIT');

        const row = insertRes.rows[0];
        return {
          id: row.id,
          empresaId: row.empresa_id,
          sedeId: row.sede_id,
          assetId: row.asset_id,
          categoria: row.categoria,
          area: row.area,
          fabricante: row.fabricante,
          modelo: row.modelo,
          serie: row.serie,
          estadoActivo: row.estado_activo,
          estadoOperativo: row.estado_operativo,
          fechaCompra: row.fecha_compra,
          proveedor: row.proveedor,
          ip: row.ip,
          mac: row.mac,
          purchaseDocumentUrl: row.purchase_document_url,
          warrantyDocumentUrl: row.warranty_document_url,
          purchaseDocumentDescription: row.purchase_document_description,
          warrantyDocumentDescription: row.warranty_document_description,
          tipoDocumentoCompra: row.tipo_documento_compra,
          numeroDocumentoCompra: row.numero_documento_compra,
          fechaCompraAproxYear: row.fecha_compra_aprox_year,
          garantia: row.garantia,
            condicionFisica: row.condicion_fisica,
          antiguedadAnios: row.antiguedad_anios,
          antiguedadMeses: row.antiguedad_meses,
          antiguedadText: row.antiguedad_text,
          usuarioAsignado: null,
          camposPersonalizados: row.campos_personalizados,
          camposPersonalizadosArray: row.campos_personalizados_array,
          observaciones: row.observaciones,
          fotos: normalizeFotosArray(row.fotos),
          fechaCompraStr: formatDateYMD(row.fecha_compra),
          creadoEn: row.created_at,
          actualizadoEn: row.updated_at
        } as Inventario;
      } catch (err: any) {
        await client.query('ROLLBACK');
        // If serialization failure, retry a few times
        const code = err && (err.code || err.sqlState || '');
        if (code === '40001' || (err && err.message && err.message.toLowerCase().includes('serialization'))) {
          // retry
          console.warn(`createInventarioWithGeneratedAsset - serialization failure, retrying attempt ${attempt}`);
          await new Promise(r => setTimeout(r, 50 * attempt));
          continue;
        }
        console.error('createInventarioWithGeneratedAsset - error:', err && (err.stack || err));
        throw err;
      }
    }
    throw new Error('createInventarioWithGeneratedAsset - Max retry attempts exceeded');
  } finally {
    client.release();
  }
};

// ===== RAM =====
export const addRam = async (inventarioId: number, tipo: string, capacidad: string): Promise<RAM> => {
  const query = `
    INSERT INTO inventario_ram (inventario_id, tipo, capacidad)
    VALUES ($1, $2, $3)
    RETURNING tipo, capacidad
  `;
  const result = await pool.query(query, [inventarioId, tipo, capacidad]);
  return result.rows[0];
};

export const getRamByInventario = async (inventarioId: number): Promise<RAM[]> => {
  const query = `SELECT tipo, capacidad FROM inventario_ram WHERE inventario_id = $1`;
  const result = await pool.query(query, [inventarioId]);
  return result.rows;
};

// ===== STORAGE =====
export const addStorage = async (inventarioId: number, tipo: string, capacidad: string): Promise<Storage> => {
  const query = `
    INSERT INTO inventario_storage (inventario_id, tipo, capacidad)
    VALUES ($1, $2, $3)
    RETURNING tipo, capacidad
  `;
  const result = await pool.query(query, [inventarioId, tipo, capacidad]);
  return result.rows[0];
};

export const getStorageByInventario = async (inventarioId: number): Promise<Storage[]> => {
  const query = `SELECT tipo, capacidad FROM inventario_storage WHERE inventario_id = $1`;
  const result = await pool.query(query, [inventarioId]);
  return result.rows;
};

// ===== FOTOS =====
export const addFoto = async (inventarioId: number, url: string, descripcion?: string): Promise<Foto> => {
  const query = `
    INSERT INTO inventario_fotos (inventario_id, url, descripcion)
    VALUES ($1, $2, $3)
    RETURNING id, url, descripcion
  `;
  try {
    const result = await pool.query(query, [inventarioId, url, descripcion || null]);
    // Normalize returned row so caller always receives absolute + encoded URL
    const r = result.rows[0];
    return normalizeFoto(r) as Foto;
  } catch (err: any) {
    // If the auxiliary table doesn't exist (migration not applied), don't break the whole flow.
    // Fall back to returning a minimal Foto object and log the issue for later migration.
    if (err && (err.code === '42P01' || (err.message && err.message.includes('inventario_fotos')))) {
      console.warn('addFoto - inventario_fotos table missing, falling back to fotos JSONB. Error:', err.message || err);
      // Ensure fallback is normalized
      return normalizeFoto({ id: 0, url, descripcion: descripcion || '' }) as Foto;
    }
    throw err;
  }
};

export const getFotosByInventario = async (inventarioId: number): Promise<Foto[]> => {
  const query = `SELECT id, url, descripcion FROM inventario_fotos WHERE inventario_id = $1`;
  try {
    const result = await pool.query(query, [inventarioId]);
    // Ensure all returned fotos are absolute and URL-encoded
    return ensureAbsoluteFotos(result.rows || []);
  } catch (err: any) {
    if (err && (err.code === '42P01' || (err.message && err.message.includes('inventario_fotos')))) {
      console.warn('getFotosByInventario - inventario_fotos table missing, returning empty array. Error:', err.message || err);
      return [];
    }
    throw err;
  }
};

export const deleteFotosByInventario = async (inventarioId: number): Promise<number> => {
  const query = `DELETE FROM inventario_fotos WHERE inventario_id = $1 RETURNING id`;
  try {
    const result = await pool.query(query, [inventarioId]);
    return result.rows.length;
  } catch (err: any) {
    if (err && (err.code === '42P01' || (err.message && err.message.includes('inventario_fotos')))) {
      console.warn('deleteFotosByInventario - inventario_fotos table missing, nothing to delete. Error:', err.message || err);
      return 0;
    }
    throw err;
  }
};

export const setFotosJsonb = async (inventarioId: number, fotos: Foto[]): Promise<void> => {
  const query = `UPDATE inventario SET fotos = $1::jsonb, updated_at = now() WHERE id = $2`;
  // Normalize fotos before storing so stored JSONB contains absolute, encoded URLs
  const normalized = ensureAbsoluteFotos(fotos || []);
  const fotosJson = normalized ? JSON.stringify(normalized) : JSON.stringify([]);
  await pool.query(query, [fotosJson, inventarioId]);
};

export const updateInventarioById = async (id: number, inv: any): Promise<Inventario> => {
  const query = `
    UPDATE inventario SET
      fabricante = COALESCE($1, fabricante),
      modelo = COALESCE($2, modelo),
      serie = COALESCE($3, serie),
      estado_activo = COALESCE($4, estado_activo),
      estado_operativo = COALESCE($5, estado_operativo),
      fecha_compra = COALESCE($6::date, fecha_compra),
      proveedor = COALESCE($7, proveedor),
      ip = COALESCE($8, ip),
      mac = COALESCE($9, mac),
      usuarios_asignados = COALESCE($10::jsonb, usuarios_asignados),
      campos_personalizados = COALESCE($11::jsonb, campos_personalizados),
      campos_personalizados_array = COALESCE($12::jsonb, campos_personalizados_array),
      observaciones = COALESCE($13, observaciones),
      purchase_document_url = COALESCE($14, purchase_document_url),
      warranty_document_url = COALESCE($15, warranty_document_url),
      purchase_document_description = COALESCE($16, purchase_document_description),
      warranty_document_description = COALESCE($17, warranty_document_description),
      antiguedad_anios = COALESCE($18, antiguedad_anios),
      antiguedad_meses = COALESCE($19, antiguedad_meses),
      antiguedad_text = COALESCE($20, antiguedad_text),
      garantia = COALESCE($21, garantia),
      condicion_fisica = COALESCE($22, condicion_fisica),
      area = COALESCE($23, area),
      updated_at = now()
    WHERE id = $24
    RETURNING *
  `;

  const params = [
    inv.fabricante || null,
    inv.modelo || null,
    inv.serie || null,
    inv.estadoActivo || null,
    inv.estadoOperativo || null,
    inv.fechaCompra || null,
    inv.proveedor || null,
    inv.ip || null,
    inv.mac || null,
    JSON.stringify(inv.usuariosAsignados || (inv.usuarioAsignado ? [inv.usuarioAsignado] : [])),
    JSON.stringify(inv.camposPersonalizados || {}),
    JSON.stringify(inv.camposPersonalizadosArray || []),
    inv.observaciones || null,
    inv.purchaseDocumentUrl || inv.purchase_document_url || null,
    inv.warrantyDocumentUrl || inv.warranty_document_url || null,
    inv.purchaseDocumentDescription || inv.purchase_document_description || null,
    inv.warrantyDocumentDescription || inv.warranty_document_description || null,
    inv.antiguedadAnios || inv.antiguedad_anios || null,
    inv.antiguedadMeses || inv.antiguedad_meses || null,
    inv.antiguedadText || inv.antiguedad_text || null,
    inv.garantia || null,
    // condicion_fisica for update
    ((inv as any).condicionFisica || (inv as any).condicion_fisica) ? String((inv as any).condicionFisica || (inv as any).condicion_fisica).toUpperCase() : null,
    inv.area || null,
    id
  ];

  const result = await pool.query(query, params as any[]);
  const row = result.rows[0];
  if (!row) throw new Error('Inventario no encontrado');

  const parseIfString = (v: any) => {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v;
  };

  const parsedUsuario = parseIfString(row.usuarios_asignados);
  const usuariosAsignados = Array.isArray(parsedUsuario) ? parsedUsuario : (parsedUsuario ? [parsedUsuario] : []);

  const camposPersonalizados = parseIfString(row.campos_personalizados);
  const camposPersonalizadosArray = parseIfString(row.campos_personalizados_array);
  const fotos = normalizeFotosArray(parseIfString(row.fotos));

  return {
    id: row.id,
    empresaId: row.empresa_id,
    sedeId: row.sede_id,
    assetId: row.asset_id,
    categoria: row.categoria,
    area: row.area,
    fabricante: row.fabricante,
    modelo: row.modelo,
    serie: row.serie,
    estadoActivo: row.estado_activo,
    estadoOperativo: row.estado_operativo,
    fechaCompra: row.fecha_compra,
    proveedor: row.proveedor,
    ip: row.ip,
    mac: row.mac,
    purchaseDocumentUrl: row.purchase_document_url,
    warrantyDocumentUrl: row.warranty_document_url,
    purchaseDocumentDescription: row.purchase_document_description,
    warrantyDocumentDescription: row.warranty_document_description,
    garantia: row.garantia,
    condicionFisica: row.condicion_fisica,
    antiguedadAnios: row.antiguedad_anios,
    antiguedadMeses: row.antiguedad_meses,
    antiguedadText: row.antiguedad_text,
    usuarioAsignado: usuariosAsignados.length > 0 ? usuariosAsignados[0] : null,
    usuariosAsignados: usuariosAsignados,
    camposPersonalizados: camposPersonalizados,
    camposPersonalizadosArray: camposPersonalizadosArray,
    observaciones: row.observaciones,
    fotos: fotos,
    fechaCompraStr: formatDateYMD(row.fecha_compra),
    creadoEn: row.created_at,
    actualizadoEn: row.updated_at
  } as Inventario;
};

export const updateInventarioByIdWithHistorial = async (id: number, inv: any, opts?: { empresaId?: number | null, sedeId?: number | null, motivo?: string | null, fotosAnteriores?: any[], fotosFinales?: any[] | null }, usuarioId?: number | null): Promise<Inventario> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the row to avoid concurrent updates
    const selectQ = `SELECT * FROM inventario WHERE id = $1 FOR UPDATE`;
    const sel = await client.query(selectQ, [id]);
    const oldRow = sel.rows[0];
    if (!oldRow) {
      await client.query('ROLLBACK');
      throw new Error('Inventario no encontrado');
    }

    // Perform update
    const query = `
      UPDATE inventario SET
        fabricante = COALESCE($1, fabricante),
        modelo = COALESCE($2, modelo),
        serie = COALESCE($3, serie),
        estado_activo = COALESCE($4, estado_activo),
        estado_operativo = COALESCE($5, estado_operativo),
        fecha_compra = COALESCE($6::date, fecha_compra),
        proveedor = COALESCE($7, proveedor),
        ip = COALESCE($8, ip),
        mac = COALESCE($9, mac),
        usuarios_asignados = COALESCE($10::jsonb, usuarios_asignados),
        campos_personalizados = COALESCE($11::jsonb, campos_personalizados),
        campos_personalizados_array = COALESCE($12::jsonb, campos_personalizados_array),
        observaciones = COALESCE($13, observaciones),
        garantia = COALESCE($14, garantia),
        condicion_fisica = COALESCE($15, condicion_fisica),
        area = COALESCE($16, area),
        updated_at = now()
        WHERE id = $17
      RETURNING *
    `;

    const params = [
      inv.fabricante || null,
      inv.modelo || null,
      inv.serie || null,
      inv.estadoActivo || null,
      inv.estadoOperativo || null,
      inv.fechaCompra || null,
      inv.proveedor || null,
      inv.ip || null,
      inv.mac || null,
      JSON.stringify(inv.usuariosAsignados || (inv.usuarioAsignado ? [inv.usuarioAsignado] : [])),
      JSON.stringify(inv.camposPersonalizados || {}),
      JSON.stringify(inv.camposPersonalizadosArray || []),
      inv.observaciones || null,
      // accept garantia in historial update flow as well
        inv.garantia || null,
        // condicion_fisica for update in historial flow
        ((inv as any).condicionFisica || (inv as any).condicion_fisica) ? String((inv as any).condicionFisica || (inv as any).condicion_fisica).toUpperCase() : null,
        inv.area || null,
        id
    ];

    const upd = await client.query(query, params as any[]);
    let newRow = upd.rows[0];

    // If antiguedad fields were provided, persist them in a separate UPDATE to avoid reindexing placeholders
    if (typeof inv.antiguedadAnios !== 'undefined' || typeof inv.antiguedadMeses !== 'undefined' || typeof inv.antiguedadText !== 'undefined') {
      const updateAntQ = `
        UPDATE inventario SET
          antiguedad_anios = COALESCE($1, antiguedad_anios),
          antiguedad_meses = COALESCE($2, antiguedad_meses),
          antiguedad_text = COALESCE($3, antiguedad_text),
          updated_at = now()
        WHERE id = $4
        RETURNING *
      `;
      const updAntRes = await client.query(updateAntQ, [inv.antiguedadAnios || null, inv.antiguedadMeses || null, inv.antiguedadText || null, id]);
      if (updAntRes.rows && updAntRes.rows[0]) newRow = updAntRes.rows[0];
    }

    // Helper to parse JSON strings
    const parseIfString = (v: any) => {
      if (typeof v === 'string') {
        try { return JSON.parse(v); } catch { return v; }
      }
      return v;
    };

    const mapRow = (row: any) => {
      const parsedUsuario = parseIfString(row.usuarios_asignados);
      const usuariosAsignados = Array.isArray(parsedUsuario) ? parsedUsuario : (parsedUsuario ? [parsedUsuario] : []);
      const camposPersonalizados = parseIfString(row.campos_personalizados);
      const camposPersonalizadosArray = parseIfString(row.campos_personalizados_array);
      const fotos = normalizeFotosArray(parseIfString(row.fotos));
      return {
        id: row.id,
        empresaId: row.empresa_id,
        sedeId: row.sede_id,
        assetId: row.asset_id,
        categoria: row.categoria,
        area: row.area,
        fabricante: row.fabricante,
        modelo: row.modelo,
        serie: row.serie,
        estadoActivo: row.estado_activo,
        estadoOperativo: row.estado_operativo,
        fechaCompra: row.fecha_compra,
        proveedor: row.proveedor,
        ip: row.ip,
        mac: row.mac,
        purchaseDocumentUrl: row.purchase_document_url,
        warrantyDocumentUrl: row.warranty_document_url,
        purchaseDocumentDescription: row.purchase_document_description,
        warrantyDocumentDescription: row.warranty_document_description,
        tipoDocumentoCompra: row.tipo_documento_compra,
        numeroDocumentoCompra: row.numero_documento_compra,
        fechaCompraAproxYear: row.fecha_compra_aprox_year,
        garantia: row.garantia,
        condicionFisica: row.condicion_fisica,
        usuarioAsignado: usuariosAsignados.length > 0 ? usuariosAsignados[0] : null,
        usuariosAsignados: usuariosAsignados,
        camposPersonalizados: camposPersonalizados,
        camposPersonalizadosArray: camposPersonalizadosArray,
        observaciones: row.observaciones,
        fotos: fotos,
        fechaCompraStr: formatDateYMD(row.fecha_compra),
        creadoEn: row.created_at,
        actualizadoEn: row.updated_at
      } as Inventario;
    };

    const beforeObj = mapRow(oldRow);
    const afterObj = mapRow(newRow);

    // Compute changes (exclude timestamps)
    const exclude = new Set(['creadoEn', 'actualizadoEn']);
    const changes: any[] = [];
    const keys = new Set<string>([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    keys.forEach((k) => {
      if (exclude.has(k)) return;
      const bRaw = (beforeObj as any)[k];
      const aRaw = (afterObj as any)[k];
      const b = (typeof bRaw === 'object' && bRaw !== null) ? JSON.stringify(bRaw) : bRaw;
      const a = (typeof aRaw === 'object' && aRaw !== null) ? JSON.stringify(aRaw) : aRaw;
      if (b !== a) {
        changes.push({ field: k, before: bRaw === undefined ? null : bRaw, after: aRaw === undefined ? null : aRaw });
      }
    });

    if (changes.length > 0) {
      // Insert one row per changed field into historial_activos with per-field columns
      const insertPerFieldQ = `
        INSERT INTO historial_activos (activo_id, asset_id, campo_modificado, valor_anterior, valor_nuevo, motivo, usuario_id, fecha_modificacion, inventario_id, empresa_id, sede_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8, $9, $10)
      `;
      const empresaIdToUse = (opts && typeof opts.empresaId !== 'undefined') ? opts.empresaId : (beforeObj.empresaId || null);
      const sedeIdToUse = (opts && typeof opts.sedeId !== 'undefined') ? opts.sedeId : (beforeObj.sedeId || null);
      const motivoToUse = (opts && typeof opts.motivo !== 'undefined') ? opts.motivo : null;

      for (const ch of changes) {
        const campo = ch.field;
        const valBefore = (typeof ch.before === 'object' && ch.before !== null) ? JSON.stringify(ch.before) : (ch.before === null ? null : String(ch.before));
        const valAfter = (typeof ch.after === 'object' && ch.after !== null) ? JSON.stringify(ch.after) : (ch.after === null ? null : String(ch.after));
        const assetCode = beforeObj && (beforeObj as any).assetId ? (beforeObj as any).assetId : null;
        await client.query(insertPerFieldQ, [id, assetCode, campo, valBefore, valAfter, motivoToUse, usuarioId || null, id, empresaIdToUse, sedeIdToUse]);
      }
    }

    // Register fotos change in historial if fotos were updated
    // Only register the actual changes (added/removed photos), not the complete array
    if (opts && Array.isArray(opts.fotosAnteriores) && opts.fotosFinales !== null && opts.fotosFinales !== undefined) {
      const fotosAnteriores = opts.fotosAnteriores;
      const fotosFinales = opts.fotosFinales;
      
      // Normalize for comparison (compare only url for identity)
      const fotosAnterioresNormalized = fotosAnteriores.map((f: any) => ({ url: f.url, name: f.name || '', descripcion: f.descripcion || '' }));
      const fotosFinalesNormalized = fotosFinales.map((f: any) => ({ url: f.url, name: f.name || '', descripcion: f.descripcion || f.description || '' }));
      
      // Detect added photos (present in finales but not in anteriores)
      const agregadas = fotosFinalesNormalized.filter((fn: any) => 
        !fotosAnterioresNormalized.some((fa: any) => fa.url === fn.url)
      );
      
      // Detect removed photos (present in anteriores but not in finales)
      const eliminadas = fotosAnterioresNormalized.filter((fa: any) => 
        !fotosFinalesNormalized.some((fn: any) => fn.url === fa.url)
      );
      
      const insertFotosHistorialQ = `
        INSERT INTO historial_activos (activo_id, asset_id, campo_modificado, valor_anterior, valor_nuevo, motivo, usuario_id, fecha_modificacion, inventario_id, empresa_id, sede_id)
        VALUES ($1, $2, 'fotos', $3, $4, $5, $6, now(), $7, $8, $9)
      `;
      const empresaIdToUse = (opts && typeof opts.empresaId !== 'undefined') ? opts.empresaId : (beforeObj.empresaId || null);
      const sedeIdToUse = (opts && typeof opts.sedeId !== 'undefined') ? opts.sedeId : (beforeObj.sedeId || null);
      const motivoToUse = (opts && typeof opts.motivo !== 'undefined') ? opts.motivo : null;
      const assetCode = beforeObj && (beforeObj as any).assetId ? (beforeObj as any).assetId : null;
      
      // Register ADDED photos
      if (agregadas.length > 0) {
        const agregadasResumen = agregadas.map((f: any) => ({ description: f.descripcion || f.name || '' }));
        await client.query(insertFotosHistorialQ, [
          id, assetCode, '-', JSON.stringify(agregadasResumen), motivoToUse, usuarioId || null, id, empresaIdToUse, sedeIdToUse
        ]);
        console.log('✅ Fotos agregadas registradas en historial_activos:', agregadas.length);
      }
      
      // Register REMOVED photos
      if (eliminadas.length > 0) {
        const eliminadasResumen = eliminadas.map((f: any) => ({ description: f.descripcion || f.name || '' }));
        await client.query(insertFotosHistorialQ, [
          id, assetCode, JSON.stringify(eliminadasResumen), 'Eliminada', motivoToUse, usuarioId || null, id, empresaIdToUse, sedeIdToUse
        ]);
        console.log('✅ Fotos eliminadas registradas en historial_activos:', eliminadas.length);
      }
    }

    await client.query('COMMIT');

    return afterObj;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { }
    throw err;
  } finally {
    client.release();
  }
};

export const insertHistorial = async (inventarioId: number, empresaId: number | null, sedeId: number | null, assetId: string | null, cambios: any[], usuarioId: number | null, motivo?: string | null) => {
  const query = `
    INSERT INTO historial_activos (inventario_id, empresa_id, sede_id, asset_id, cambios, usuario_id, motivo, creado_en)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, now())
    RETURNING id
  `;
  const cambiosJson = cambios ? JSON.stringify(cambios) : JSON.stringify([]);
  const result = await pool.query(query, [inventarioId, empresaId, sedeId, assetId, cambiosJson, usuarioId, motivo || null]);
  return result.rows[0];
};
