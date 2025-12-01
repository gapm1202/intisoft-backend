import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export interface JwtPayloadCustom {
  id: number;
  rol: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(`authenticate - No token provided - ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayloadCustom;
    // Try to fetch additional user info from DB (email, nombre)
    try {
      // Try to fetch empresa_id as well (if column exists)
      const result = await pool.query("SELECT id, email, nombre, rol, empresa_id FROM usuarios WHERE id = $1", [payload.id]);
      const userRow = result.rows[0];
      if (userRow) {
        (req as any).user = { id: userRow.id, rol: userRow.rol, email: userRow.email, nombre: userRow.nombre, empresaId: userRow.empresa_id };
      } else {
        (req as any).user = { id: payload.id, rol: payload.rol };
      }
    } catch (dbErr) {
      // If DB fails or column doesn't exist, fallback to a safer query
      try {
        const result = await pool.query("SELECT id, email, nombre, rol FROM usuarios WHERE id = $1", [payload.id]);
        const userRow = result.rows[0];
        if (userRow) {
          (req as any).user = { id: userRow.id, rol: userRow.rol, email: userRow.email, nombre: userRow.nombre };
        } else {
          (req as any).user = { id: payload.id, rol: payload.rol };
        }
      } catch (e2) {
        (req as any).user = { id: payload.id, rol: payload.rol };
      }
    }

    // Log successful authentication with minimal info (no token printed)
    try {
      const u = (req as any).user;
      console.log(`authenticate - Authenticated user id=${u && u.id} rol=${u && u.rol} - ${req.method} ${req.originalUrl}`);
    } catch (e) {
      // ignore logging errors
    }

    next();
  } catch (err) {
    console.warn(`authenticate - Invalid token for ${req.method} ${req.originalUrl}:`, err && (err.message || err));
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "No autenticado" });
    if (!roles.includes(user.rol)) return res.status(403).json({ message: "Acceso denegado" });
    next();
  };
};
