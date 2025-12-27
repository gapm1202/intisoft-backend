import { Request, Response } from 'express';
import slaService from '../services/sla.service';

export class SLAController {
  /**
   * GET /api/sla/configuracion/:empresaId
   * Obtener configuración SLA actual de la empresa
   */
  async getConfiguracion(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;

      const configuracion = await slaService.getConfiguration(empresaId);

      res.json(configuracion || null);
    } catch (error: any) {
      console.error('Error en getConfiguracion:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/sla/configuracion/:empresaId
   * Crear o actualizar configuración SLA completa
   *
   * Permite los campos fueraDeHorario (boolean) y requisitosPersonalizados (string[])
   * a nivel raíz del objeto enviado.
   */
  async upsertConfiguracion(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const usuario = (req as any).user?.nombre || 'sistema';
      const usuarioId = (req as any).user?.id;

      const configuracion = await slaService.upsertConfiguration(
        empresaId,
        req.body,
        usuario,
        usuarioId
      );

      res.status(201).json(configuracion);
    } catch (error: any) {
      console.error('Error en upsertConfiguracion:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/sla/seccion/:empresaId
   * Guardar cambios de una sección específica
   */
  async updateSeccion(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { seccion, data, motivo } = req.body;
      const usuario = (req as any).user?.nombre || 'sistema';
      const usuarioId = (req as any).user?.id;

      console.log('[SLA][controller.updateSeccion] inbound', {
        empresaId,
        seccion,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : null,
        usuario,
        usuarioId,
      });

      if (!seccion || !data) {
        res.status(400).json({ error: 'seccion y data son requeridos' });
        return;
      }

      const resultado = await slaService.updateSeccion(
        empresaId,
        seccion,
        data,
        usuario,
        usuarioId,
        motivo
      );

      res.json({
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error en updateSeccion:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/sla/editar/:empresaId
   * Registrar que el usuario quiere editar una sección (guarda motivo)
   */
  async editarSeccion(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { seccion, motivo } = req.body;
      const usuario = (req as any).user?.nombre || 'sistema';
      const usuarioId = (req as any).user?.id;

      if (!seccion || !motivo) {
        res.status(400).json({ error: 'seccion y motivo son requeridos' });
        return;
      }

      await slaService.recordEditEvent(empresaId, seccion, motivo, usuario, usuarioId);

      res.json({
        success: true,
        editPermission: true,
      });
    } catch (error: any) {
      console.error('Error en editarSeccion:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/sla/limpiar/:empresaId
   * Limpiar/resetear una sección a valores por defecto
   */
  async limpiarSeccion(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const { seccion, secciones } = req.body;

      console.log('[SLA][controller.limpiarSeccion] REQUEST RECEIVED', {
        empresaId,
        hasSeccion: !!seccion,
        hasSecciones: !!secciones,
        secciones: secciones || seccion,
      });

      let targetSecciones: string[] = [];

      if (Array.isArray(secciones) && secciones.length > 0) {
        targetSecciones = secciones;
        console.log('[SLA][controller.limpiarSeccion] using secciones array', { targetSecciones });
      } else if (seccion) {
        targetSecciones = [seccion];
        console.log('[SLA][controller.limpiarSeccion] using single seccion', { targetSecciones });
      } else {
        console.log('[SLA][controller.limpiarSeccion] ERROR: no seccion or secciones provided');
        res.status(400).json({ success: false, message: 'seccion o secciones son requeridos' });
        return;
      }

      console.log('[SLA][controller.limpiarSeccion] calling service with', { empresaId, targetSecciones });
      const cleaned = await slaService.limpiarSecciones(empresaId, targetSecciones);

      console.log('[SLA][controller.limpiarSeccion] service returned', { cleaned });

      res.json({
        success: true,
        message:
          cleaned.length === 1
            ? `Sección '${cleaned[0]}' eliminada correctamente`
            : `Secciones [${cleaned.join(', ')}] eliminadas correctamente`,
        secciones: cleaned,
      });
    } catch (error: any) {
      console.error('[SLA][controller.limpiarSeccion] CATCH ERROR:', {
        message: error.message,
        stack: error.stack,
      });
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/sla/historial/:empresaId
   * Obtener historial de cambios del SLA
   */
  async getHistorial(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
      const seccion = req.query.seccion as string | undefined;

      const historial = await slaService.getHistorial(empresaId, limit, skip, seccion);

      res.json(historial);
    } catch (error: any) {
      console.error('Error en getHistorial:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/sla/configuracion/:empresaId
   * Eliminar configuración SLA (soft delete)
   */
  async deleteConfiguracion(req: Request, res: Response): Promise<void> {
    try {
      const { empresaId } = req.params;

      await slaService.deleteConfiguration(empresaId);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error en deleteConfiguracion:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default new SLAController();
