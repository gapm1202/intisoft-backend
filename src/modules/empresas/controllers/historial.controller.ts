import { Request, Response } from "express";
import * as service from "../services/historial.service";

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    
    if (isNaN(empresaId)) {
      return res.status(400).json({ message: "empresaId inválido" });
    }

    const historial = await service.getHistorialByEmpresa(empresaId);
    res.json(historial);
  } catch (error) {
    console.error("Error getting historial:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
