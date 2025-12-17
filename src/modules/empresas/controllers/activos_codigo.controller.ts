import { Request, Response } from "express";
import * as service from "../services/activos_codigo.service";
import { pool } from "../../../config/db";

/**
 * GET /api/empresas/:empresaId/activos/next-code?categoria=<categoriaId>
 * 
 * Returns a reserved asset code with TTL
 * Response: { code: "IME-PC0001", sequence_number: 1, reservation_id: 123, expires_at: "2025-12-15T10:30:00Z" }
 */
export const getNextCode = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    const categoriaParam = (req.query.categoria as string) || '';
    let categoriaId: number | null = null;
    const userId = (req as any).user?.id;

    if (isNaN(empresaId)) {
      return res.status(400).json({ ok: false, message: "empresaId inválido" });
    }

    // Accept categoria as numeric ID (e.g., 5) or as code/name (e.g., "PC")
    if (categoriaParam && /^\d+$/.test(categoriaParam)) {
      categoriaId = parseInt(categoriaParam, 10);
    } else if (categoriaParam) {
      // Try resolve by codigo (preferred) or by nombre
      const resolved = await pool.query(
        `SELECT id FROM categorias 
         WHERE UPPER(codigo) = UPPER($1) 
            OR UPPER(nombre) = UPPER($1)
         ORDER BY codigo IS NULL, nombre ASC
         LIMIT 1`,
        [categoriaParam]
      );
      categoriaId = resolved.rows[0]?.id || null;
    }

    if (!categoriaId || isNaN(categoriaId)) {
      return res.status(400).json({ ok: false, message: "categoria requerida (use id numérico o código, ej: categoria=5 o categoria=PC)" });
    }

    console.log(`📦 Reservando código para empresa ${empresaId}, categoría ${categoriaId}`);

    const nextCode = await service.getNextCode(empresaId, categoriaId, userId, 15); // 15 min TTL

    console.log(`✅ Código reservado: ${nextCode.code}`);

    return res.json({
      ok: true,
      data: nextCode
    });
  } catch (error: any) {
    console.error("❌ Error obteniendo next-code:", error);

    if (error.message.includes("no encontrada")) {
      return res.status(404).json({
        ok: false,
        message: error.message
      });
    }

    return res.status(500).json({
      ok: false,
      message: "Error en el servidor"
    });
  }
};

/**
 * POST /api/empresas/:empresaId/activos/next-code?categoria=<categoriaId>
 * Alternative endpoint (same functionality as GET, some frontends prefer POST for side effects)
 */
export const postNextCode = async (req: Request, res: Response) => {
  // Delegate to GET handler
  await getNextCode(req, res);
};
