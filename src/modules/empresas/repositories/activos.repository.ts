import { pool } from "../../../config/db";
import { Inventario } from "../models/inventario.model";

export const createActivo = async (activo: Partial<Inventario>): Promise<Inventario> => {
  // Note: legacy insert into 'activos' table kept for compatibility with other scripts
  const query = `
    INSERT INTO activos (
      empresa_id, sede_id, area, categoria, asset_id, fabricante, modelo, serie,
      usuario_asignado, estado_activo, proveedor, campos_dinamicos
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
    RETURNING id`;

  const camposJson = activo.especificacion ? JSON.stringify(activo.especificacion) : JSON.stringify([]);

  const params = [
    (activo as any).empresaId,
    (activo as any).sedeId || null,
    (activo as any).area || null,
    (activo as any).categoria || null,
    (activo as any).assetId,
    (activo as any).fabricante || null,
    (activo as any).modelo || null,
    (activo as any).serie || null,
    (activo as any).usuarioAsignado || null,
    (activo as any).estadoActivo || null,
    (activo as any).proveedor || null,
    camposJson
  ];

  try {
    const result = await pool.query(query, params as any[]);
    return result.rows[0] as Inventario;
  } catch (err) {
    console.error("activos.createActivo error:", err);
    throw err;
  }
};

export const getActivosByEmpresa = async (empresaId: number): Promise<Inventario[]> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", asset_id as "assetId",
    fabricante, modelo, serie, estado_activo as "estadoActivo", proveedor, campos_personalizados as "camposPersonalizados",
    campos_personalizados_array as "camposPersonalizadosArray", fotos, created_at as "createdAt", updated_at as "updatedAt", etiqueta_token as "etiquetaToken" FROM inventario WHERE empresa_id = $1`;
  const result = await pool.query(query, [empresaId]);
  return result.rows;
};

export const getActivosBySede = async (sedeId: number): Promise<Inventario[]> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", asset_id as "assetId",
    fabricante, modelo, serie, estado_activo as "estadoActivo", proveedor, campos_personalizados as "camposPersonalizados",
    campos_personalizados_array as "camposPersonalizadosArray", fotos, created_at as "createdAt", updated_at as "updatedAt", etiqueta_token as "etiquetaToken" FROM inventario WHERE sede_id = $1`;
  const result = await pool.query(query, [sedeId]);
  return result.rows;
};

export const getActivosByEmpresaAndSede = async (empresaId: number, sedeId: number): Promise<Inventario[]> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", asset_id as "assetId",
    fabricante, modelo, serie, estado_activo as "estadoActivo", proveedor, campos_personalizados as "camposPersonalizados",
    campos_personalizados_array as "camposPersonalizadosArray", fotos, created_at as "createdAt", updated_at as "updatedAt", etiqueta_token as "etiquetaToken" FROM inventario WHERE empresa_id = $1 AND sede_id = $2`;
  const result = await pool.query(query, [empresaId, sedeId]);
  return result.rows;
};

export const getActivosByIds = async (ids: number[]): Promise<any[]> => {
  if (!ids || ids.length === 0) return [];
  const query = `SELECT id, asset_id as "assetId", etiqueta_token as "etiquetaToken" FROM inventario WHERE id = ANY($1)`;
  const result = await pool.query(query, [ids]);
  return result.rows;
};

export const checkAssetIdExists = async (assetId: string): Promise<boolean> => {
  const query = `SELECT 1 FROM inventario WHERE asset_id = $1 LIMIT 1`;
  const result = await pool.query(query, [assetId]);
  return result.rows.length > 0;
};

export const getActivoById = async (id: number): Promise<Inventario | null> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", asset_id as "assetId",
    fabricante, modelo, serie, estado_activo as "estadoActivo", proveedor, campos_personalizados as "camposPersonalizados",
    campos_personalizados_array as "camposPersonalizadosArray", fotos, created_at as "createdAt", updated_at as "updatedAt", etiqueta_token as "etiquetaToken" FROM inventario WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const getActivoByToken = async (token: string): Promise<any | null> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", asset_id as "assetId",
    fabricante, modelo, serie, estado_activo as "estadoActivo", proveedor, campos_personalizados as "camposPersonalizados",
    campos_personalizados_array as "camposPersonalizadosArray", fotos, created_at as "createdAt", updated_at as "updatedAt", etiqueta_token as "etiquetaToken", usuarios_asignados, usuarios_asignados as "usuariosAsignados" FROM inventario WHERE etiqueta_token = $1 LIMIT 1`;
  const result = await pool.query(query, [token]);
  return result.rows[0] || null;
};

export const getActivoByAssetId = async (assetId: string): Promise<any | null> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", asset_id as "assetId",
    fabricante, modelo, serie, estado_activo as "estadoActivo", proveedor, campos_personalizados as "camposPersonalizados",
    campos_personalizados_array as "camposPersonalizadosArray", fotos, created_at as "createdAt", updated_at as "updatedAt", etiqueta_token as "etiquetaToken", usuarios_asignados, usuarios_asignados as "usuariosAsignados" FROM inventario WHERE asset_id = $1 LIMIT 1`;
  const result = await pool.query(query, [assetId]);
  return result.rows[0] || null;
};

export const setEtiquetaToken = async (id: number, token: string | null): Promise<void> => {
  const query = `UPDATE inventario SET etiqueta_token = $1, updated_at = NOW() WHERE id = $2`;
  await pool.query(query, [token, id]);
};

