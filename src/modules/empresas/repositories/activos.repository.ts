import { pool } from "../../../config/db";
import { Inventario } from "../models/inventario.model";

export const createActivo = async (activo: Partial<Inventario>): Promise<Inventario> => {
  const query = `
    INSERT INTO activos (
      empresa_id, sede_id, area, categoria, asset_id, fabricante, modelo, serie,
      usuario_asignado, correo_usuario, cargo_usuario, estado_activo, proveedor, campos_dinamicos
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
    RETURNING id, empresa_id as "empresaId", sede_id as "sedeId", area, categoria, asset_id as "assetId",
      fabricante, modelo, serie, usuario_asignado as "usuarioAsignado", correo_usuario as "correoUsuario",
      cargo_usuario as "cargoUsuario", estado_activo as "estadoActivo", proveedor, campos_dinamicos as "especificacion",
      created_at as "creadoEn", updated_at as "actualizadoEn"`;

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
    (activo as any).correoUsuario || null,
    (activo as any).cargoUsuario || null,
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
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", area, categoria, asset_id as "assetId",
    fabricante, modelo, serie, usuario_asignado as "usuarioAsignado", correo_usuario as "correoUsuario",
    cargo_usuario as "cargoUsuario", estado_activo as "estadoActivo", proveedor, campos_dinamicos as "especificacion",
    created_at as "creadoEn", updated_at as "actualizadoEn" FROM activos WHERE empresa_id = $1`;
  const result = await pool.query(query, [empresaId]);
  return result.rows;
};

export const getActivosBySede = async (sedeId: number): Promise<Inventario[]> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", area, categoria, asset_id as "assetId",
    fabricante, modelo, serie, usuario_asignado as "usuarioAsignado", correo_usuario as "correoUsuario",
    cargo_usuario as "cargoUsuario", estado_activo as "estadoActivo", proveedor, campos_dinamicos as "especificacion",
    created_at as "creadoEn", updated_at as "actualizadoEn" FROM activos WHERE sede_id = $1`;
  const result = await pool.query(query, [sedeId]);
  return result.rows;
};

export const getActivosByEmpresaAndSede = async (empresaId: number, sedeId: number): Promise<Inventario[]> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", area, categoria, asset_id as "assetId",
    fabricante, modelo, serie, usuario_asignado as "usuarioAsignado", correo_usuario as "correoUsuario",
    cargo_usuario as "cargoUsuario", estado_activo as "estadoActivo", proveedor, campos_dinamicos as "especificacion",
    created_at as "creadoEn", updated_at as "actualizadoEn" FROM activos WHERE empresa_id = $1 AND sede_id = $2`;
  const result = await pool.query(query, [empresaId, sedeId]);
  return result.rows;
};

export const checkAssetIdExists = async (assetId: string): Promise<boolean> => {
  const query = `SELECT 1 FROM activos WHERE asset_id = $1 LIMIT 1`;
  const result = await pool.query(query, [assetId]);
  return result.rows.length > 0;
};

export const getActivoById = async (id: number): Promise<Inventario | null> => {
  const query = `SELECT id, empresa_id as "empresaId", sede_id as "sedeId", area, categoria, asset_id as "assetId",
    fabricante, modelo, serie, usuario_asignado as "usuarioAsignado", correo_usuario as "correoUsuario",
    cargo_usuario as "cargoUsuario", estado_activo as "estadoActivo", proveedor, campos_dinamicos as "especificacion",
    created_at as "creadoEn", updated_at as "actualizadoEn" FROM activos WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

