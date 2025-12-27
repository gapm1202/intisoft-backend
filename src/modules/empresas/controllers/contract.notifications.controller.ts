import { Request, Response } from "express";
import * as service from "../services/contract.notifications.service";

export const getProximosAVencer = async (req: Request, res: Response) => {
  try {
    const dias = parseInt(req.query.dias as string) || 30;
    const contratos = await service.getContratosProximosAVencer(dias);
    res.json(contratos);
  } catch (error) {
    console.error("Error getProximosAVencer:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
