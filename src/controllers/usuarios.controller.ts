import { Request, Response } from "express";
import { pool } from "../config/db";

// GET /api/usuarios/administrativos
export const listAdministrativos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre FROM usuarios WHERE rol = 'administrador' OR rol = 'admin' ORDER BY nombre ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al listar usuarios administrativos:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
