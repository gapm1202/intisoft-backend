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

export const create = async (req: Request, res: Response) => {
  try {
    const empresaId = parseInt(req.params.empresaId || req.params.id);
    if (isNaN(empresaId)) {
      return res.status(400).json({ message: "empresaId inválido" });
    }

    const { accion, motivo, tipo, destino, sedeId, cambios, extra } = req.body || {};

    if (!accion || typeof accion !== 'string') {
      return res.status(400).json({ message: "accion es requerida" });
    }
    if (motivo !== undefined && typeof motivo !== 'string') {
      return res.status(400).json({ message: "motivo debe ser string" });
    }

    const allowedActions = new Set([
      'EDITAR_EMPRESA','EDITAR_SEDE','ELIMINAR_SEDE','DESACTIVAR_SEDE','REACTIVAR_SEDE',
      'desactivar_sede','activar_sede','editar_empresa'
    ]);
    if (!allowedActions.has(accion)) {
      return res.status(400).json({ message: "accion inválida" });
    }
    type ActionType = 'EDITAR_EMPRESA' | 'EDITAR_SEDE' | 'ELIMINAR_SEDE' | 'DESACTIVAR_SEDE' | 'REACTIVAR_SEDE' | 'desactivar_sede' | 'activar_sede' | 'editar_empresa';
    const actionTyped = accion as ActionType;

    const user = (req as any).user || {};

    const changes: Record<string, any> = {
      tipo: tipo || null,
      destino: destino || null,
      sedeId: sedeId || null,
      cambios: cambios || null,
      extra: extra || null,
    };

    const saved = await service.createHistorial(
      empresaId,
      user.email,
      user.nombre,
      motivo,
      actionTyped,
      changes
    );

    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating historial:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
