import { pool } from '../../../config/db';
import { Traslado, CreateTrasladoDto, Foto } from '../models/traslado.model';
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

const resolveUploadedFilename = (originalName: string): string | null => {
  try {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) return null;
    const files = fs.readdirSync(uploadsDir);
    
    for (const f of files) {
      if (f === originalName) return f;
    }
    
    const normalized = originalName.replace(/\s+/g, '_');
    for (const f of files) {
      if (f === normalized) return f;
    }
    
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
      if (f.endsWith(originalName)) return f;
    }
    
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
      if (f.endsWith(normalized)) return f;
    }
    
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const baseNormalized = baseName.replace(/\s+/g, '_');
    for (let i = files.length - 1; i >= 0; i--) {
      const f = files[i];
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
    const parts = parsed.pathname.split('/').map(p => encodeURIComponent(decodeURIComponent(p))).join('/');
    parsed.pathname = parts;
    return parsed.toString();
  } catch (e) {
    if (!u) return u;
    const idx = u.lastIndexOf('/');
    if (idx === -1) return encodeURIComponent(u);
    const prefix = u.substring(0, idx + 1);
    const last = u.substring(idx + 1);
    return prefix + encodeURIComponent(last);
  }
};

const normalizeFoto = (f: any): Foto => {
  if (!f) return { url: '', descripcion: '' };
  
  if (typeof f === 'string') {
    const name = f;
    if (name.startsWith('http')) return { url: canonicalizeHttpUrl(name), descripcion: '' };
    if (name.startsWith('/')) return { url: canonicalizeHttpUrl(`${SERVER_BASE}${name}`), descripcion: '' };
    const resolved = resolveUploadedFilename(name) || name;
    const filename = encodeURIComponent(resolved);
    return { url: `${SERVER_BASE}/uploads/${filename}`, descripcion: '' };
  }

  const rawUrl = f.url || f.name || '';
  if (typeof rawUrl === 'string' && rawUrl.startsWith('http')) {
    return {
      url: canonicalizeHttpUrl(rawUrl),
      descripcion: f.descripcion || f.description || ''
    };
  }

  if (typeof rawUrl === 'string' && rawUrl.startsWith('/')) {
    return {
      url: canonicalizeHttpUrl(`${SERVER_BASE}${rawUrl}`),
      descripcion: f.descripcion || f.description || ''
    };
  }

  const resolved = resolveUploadedFilename(rawUrl) || rawUrl;
  const filename = encodeURIComponent(resolved);
  return {
    url: `${SERVER_BASE}/uploads/${filename}`,
    descripcion: f.descripcion || f.description || ''
  };
};

const normalizeFotosArray = (arr: any): Foto[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeFoto);
};

export const createTraslado = async (dto: CreateTrasladoDto): Promise<Traslado> => {
  const fotosNormalized = normalizeFotosArray(dto.fotos || []);
  
  const query = `
    INSERT INTO traslados (
      activo_id,
      empresa_id,
      sede_origen_id,
      sede_destino_id,
      area_destino,
      fecha_traslado,
      responsable_envia,
      responsable_recibe,
      motivo,
      estado_equipo,
      especificar_falla,
      observaciones,
      fotos
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  
  const values = [
    dto.activoId,
    parseInt(dto.empresaId),
    parseInt(dto.sedeOrigenId),
    parseInt(dto.sedeDestino),
    dto.areaDestino || null,
    formatDateYMD(dto.fechaTraslado),
    dto.responsableEnvia,
    dto.responsableRecibe,
    dto.motivo,
    dto.estadoEquipo,
    dto.especificarFalla || null,
    dto.observaciones || null,
    JSON.stringify(fotosNormalized)
  ];
  
  const result = await pool.query(query, values);
  const row = result.rows[0];
  
  return {
    id: row.id,
    activoId: row.activo_id,
    empresaId: row.empresa_id,
    sedeOrigenId: row.sede_origen_id,
    sedeDestinoId: row.sede_destino_id,
    areaDestino: row.area_destino,
    fechaTraslado: formatDateYMD(row.fecha_traslado) || '',
    responsableEnvia: row.responsable_envia,
    responsableRecibe: row.responsable_recibe,
    motivo: row.motivo,
    estadoEquipo: row.estado_equipo,
    especificarFalla: row.especificar_falla,
    observaciones: row.observaciones,
    fotos: normalizeFotosArray(row.fotos),
    createdAt: row.created_at
  };
};

export const getTrasladosByActivo = async (activoId: number): Promise<Traslado[]> => {
  const query = `
    SELECT * FROM traslados
    WHERE activo_id = $1
    ORDER BY fecha_traslado DESC, created_at DESC
  `;
  
  const result = await pool.query(query, [activoId]);
  
  return result.rows.map(row => ({
    id: row.id,
    activoId: row.activo_id,
    empresaId: row.empresa_id,
    sedeOrigenId: row.sede_origen_id,
    sedeDestinoId: row.sede_destino_id,
    areaDestino: row.area_destino,
    fechaTraslado: formatDateYMD(row.fecha_traslado) || '',
    responsableEnvia: row.responsable_envia,
    responsableRecibe: row.responsable_recibe,
    motivo: row.motivo,
    estadoEquipo: row.estado_equipo,
    especificarFalla: row.especificar_falla,
    observaciones: row.observaciones,
    fotos: normalizeFotosArray(row.fotos),
    createdAt: row.created_at
  }));
};
