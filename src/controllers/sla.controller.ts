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

  /**
   * GET /api/sla/schema/:seccion
   * Obtener la estructura/esquema esperado para una sección específica
   * Útil para el frontend para saber qué datos enviar
   */
  async getSchema(req: Request, res: Response): Promise<void> {
    try {
      const { seccion } = req.params;

      const schemas: Record<string, any> = {
        incidentes: {
          descripcion: 'Gestión de Incidentes - Categorización y priorización',
          estructura: {
            categoriaITIL: {
              tipo: 'string',
              obligatorio: false,
              valores: ['usuario', 'infraestructura', 'aplicacion', 'seguridad'],
              descripcion: 'Categoría ITIL del incidente'
            },
            impacto: {
              tipo: 'string',
              obligatorio: true,
              valores: ['alto', 'medio', 'bajo'],
              valorPorDefecto: 'medio',
              descripcion: 'Nivel de impacto del incidente'
            },
            urgencia: {
              tipo: 'string',
              obligatorio: true,
              valores: ['alta', 'media', 'baja'],
              valorPorDefecto: 'media',
              descripcion: 'Nivel de urgencia del incidente'
            },
            prioridadCalculada: {
              tipo: 'string',
              obligatorio: false,
              valores: ['Alta', 'Media', 'Baja'],
              valorPorDefecto: 'Media',
              descripcion: 'Prioridad calculada basada en impacto y urgencia'
            }
          },
          ejemploMinimo: {
            impacto: 'medio',
            urgencia: 'media'
          },
          ejemploCompleto: {
            categoriaITIL: 'infraestructura',
            impacto: 'alto',
            urgencia: 'alta',
            prioridadCalculada: 'Alta'
          }
        },
        alcance: {
          descripcion: 'Alcance del SLA - Define qué cubre el acuerdo',
          estructura: {
            slaActivo: { tipo: 'boolean', obligatorio: false, valorPorDefecto: false },
            aplicaA: { tipo: 'string', obligatorio: false, valores: ['incidentes'], valorPorDefecto: 'incidentes' },
            tipoServicioCubierto: { tipo: 'string', obligatorio: false, valorPorDefecto: 'incidente' }
          }
        },
        tiempos: {
          descripcion: 'Tiempos de respuesta y resolución por prioridad',
          estructura: {
            medicionSLA: { tipo: 'string', obligatorio: false, valores: ['horasHabiles', 'horasCalendario'] },
            tiemposPorPrioridad: { tipo: 'array', obligatorio: true, descripcion: 'Lista de tiempos por prioridad' }
          }
        }
      };

      if (!seccion) {
        // Retornar lista de secciones disponibles
        res.json({
          secciones: Object.keys(schemas),
          mensaje: 'Use GET /api/sla/schema/:seccion para obtener el esquema de una sección específica'
        });
        return;
      }

      const schema = schemas[seccion];
      if (!schema) {
        res.status(404).json({
          error: `Sección '${seccion}' no encontrada`,
          seccionesDisponibles: Object.keys(schemas)
        });
        return;
      }

      res.json(schema);
    } catch (error: any) {
      console.error('Error en getSchema:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/sla/defaults/:seccion
   * Obtener valores por defecto para una sección específica
   * Útil para inicializar formularios en el frontend
   */
  async getDefaults(req: Request, res: Response): Promise<void> {
    try {
      const { seccion } = req.params;

      // Valores por defecto exactos del backend
      const defaults: Record<string, any> = {
        incidentes: {
          impacto: 'medio',
          urgencia: 'media',
          prioridadCalculada: 'Media'
        },
        alcance: {
          slaActivo: false,
          aplicaA: 'incidentes',
          tipoServicioCubierto: 'incidente',
          serviciosCubiertos: {
            soporteRemoto: false,
            soportePresencial: false,
            atencionEnSede: false
          },
          activosCubiertos: {
            tipo: 'todos',
            categorias: [],
            categoriasPersonalizadas: []
          },
          sedesCubiertas: {
            tipo: 'todas',
            sedes: []
          },
          observaciones: ''
        },
        tiempos: {
          medicionSLA: 'horasHabiles',
          tiemposPorPrioridad: []
        },
        horarios: {
          dias: {
            Lunes: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
            Martes: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
            Miercoles: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
            Jueves: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
            Viernes: { atiende: true, horaInicio: '08:00', horaFin: '18:00' },
            Sabado: { atiende: false, horaInicio: '08:00', horaFin: '18:00' },
            Domingo: { atiende: false, horaInicio: '08:00', horaFin: '18:00' }
          },
          excluirFeriados: true,
          calendarioFeriados: ['1 de Enero - Año Nuevo'],
          atencionFueraHorario: false,
          aplicaSLAFueraHorario: false
        },
        requisitos: {
          obligacionesCliente: {
            autorizarIntervencion: false,
            accesoEquipo: false,
            infoClara: false
          },
          condicionesTecnicas: {
            equipoEncendido: false,
            conectividadActiva: false,
            accesoRemoto: false
          },
          responsabilidadesProveedor: {
            tecnicoAsignado: false,
            registroAtencion: false,
            informeTecnico: false
          }
        },
        exclusiones: {
          flags: {
            pendienteRespuestaCliente: false,
            esperandoRepuestos: false,
            esperandoProveedorExterno: false,
            fueraDeAlcance: false,
            fuerzaMayor: false
          }
        },
        alertas: {
          umbrales: [50, 75, 90],
          notificarA: {
            tecnicoAsignado: true,
            supervisor: true
          },
          accionAutomatica: 'notificar',
          estadosVisibles: ['🟢 Cumpliendo', '🟡 En riesgo', '🔴 Incumplido']
        }
      };

      if (!seccion) {
        res.json({
          secciones: Object.keys(defaults),
          mensaje: 'Use GET /api/sla/defaults/:seccion para obtener valores por defecto de una sección'
        });
        return;
      }

      const defaultValue = defaults[seccion];
      if (!defaultValue) {
        res.status(404).json({
          error: `Sección '${seccion}' no encontrada`,
          seccionesDisponibles: Object.keys(defaults)
        });
        return;
      }

      res.json({
        seccion,
        defaults: defaultValue,
        ejemplo: {
          seccion,
          data: defaultValue,
          motivo: 'Ejemplo de payload para guardar'
        }
      });
    } catch (error: any) {
      console.error('Error en getDefaults:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new SLAController();
