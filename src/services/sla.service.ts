import slaRepository from '../repositories/sla.repository';
import {
  SLAConfiguracion,
  SLAAlcance,
  SLAGestionIncidentes,
  SLATiempos,
  SLAHorarios,
  SLARequisitos,
  SLAExclusiones,
  SLAAlertas,
  DEFAULT_SLA_VALUES,
  HistorialSLAResponse,
} from '../models/sla.model';

export class SLAService {
  /**
   * Obtener configuración SLA de una empresa
   */
  async getConfiguration(empresaId: string): Promise<SLAConfiguracion | null> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    return slaRepository.getConfiguration(empresaId);
  }

  /**
   * Crear o actualizar configuración SLA completa
   */
  async upsertConfiguration(
    empresaId: string,
    data: Partial<SLAConfiguracion>,
    usuario: string,
    usuarioId?: number
  ): Promise<SLAConfiguracion> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    this.validateConfigurationData(data);

    return slaRepository.upsertConfiguration(empresaId, data, usuario, usuarioId);
  }

  /**
   * Actualizar una sección específica
   */
  async updateSeccion(
    empresaId: string,
    seccion: string,
    data: any,
    usuario: string,
    usuarioId?: number,
    motivo?: string
  ): Promise<any> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    if (!seccion) {
      throw new Error('seccion es requerida');
    }

    if (!this.isValidSeccion(seccion)) {
      throw new Error(
        `seccion inválida. Debe ser una de: alcance, incidentes, tiempos, horarios, requisitos, exclusiones, alertas`
      );
    }

    this.validateSeccionData(seccion, data);

    return slaRepository.updateSeccion(empresaId, seccion, data, usuario, usuarioId, motivo);
  }

  /**
   * Registrar evento de edición
   */
  async recordEditEvent(
    empresaId: string,
    seccion: string,
    motivo: string,
    usuario: string,
    usuarioId?: number
  ): Promise<void> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    if (!seccion) {
      throw new Error('seccion es requerida');
    }

    if (!motivo || motivo.trim() === '') {
      throw new Error('motivo es requerido');
    }

    if (!this.isValidSeccion(seccion)) {
      throw new Error(
        `seccion inválida. Debe ser una de: alcance, incidentes, tiempos, horarios, requisitos, exclusiones, alertas`
      );
    }

    return slaRepository.recordEditEvent(empresaId, seccion, motivo, usuario, usuarioId);
  }

  /**
   * Limpiar/resetear una sección a valores por defecto
   */
  async limpiarSeccion(empresaId: string, seccion: string): Promise<any> {
    return this.limpiarSecciones(empresaId, [seccion]);
  }

  async limpiarSecciones(empresaId: string, secciones: string[]): Promise<string[]> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    if (!secciones || secciones.length === 0) {
      throw new Error('debe proporcionar al menos una seccion');
    }

    for (const sec of secciones) {
      if (!this.isValidSeccion(sec)) {
        throw new Error(
          `seccion inválida. Debe ser una de: alcance, incidentes, tiempos, horarios, requisitos, exclusiones, alertas`
        );
      }
    }

    await slaRepository.limpiarSecciones(empresaId, secciones);
    return secciones;
  }

  /**
   * Obtener historial de cambios
   */
  async getHistorial(
    empresaId: string,
    limit?: number,
    skip?: number,
    seccion?: string
  ): Promise<HistorialSLAResponse> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    const finalLimit = limit || 100;
    const finalSkip = skip || 0;

    if (finalLimit < 1 || finalLimit > 1000) {
      throw new Error('limit debe estar entre 1 y 1000');
    }

    if (finalSkip < 0) {
      throw new Error('skip debe ser mayor o igual a 0');
    }

    if (seccion && !this.isValidSeccion(seccion)) {
      throw new Error(
        `seccion inválida. Debe ser una de: alcance, incidentes, tiempos, horarios, requisitos, exclusiones, alertas`
      );
    }

    return slaRepository.getHistorial(empresaId, finalLimit, finalSkip, seccion);
  }

  /**
   * Eliminar configuración SLA (soft delete)
   */
  async deleteConfiguration(empresaId: string): Promise<void> {
    if (!empresaId) {
      throw new Error('empresaId es requerido');
    }

    return slaRepository.deleteConfiguration(empresaId);
  }

  /**
   * Utilidades de validación
   */
  private isValidSeccion(
    seccion: string
  ): seccion is 'alcance' | 'incidentes' | 'tiempos' | 'horarios' | 'requisitos' | 'exclusiones' | 'alertas' {
    return ['alcance', 'incidentes', 'tiempos', 'horarios', 'requisitos', 'exclusiones', 'alertas'].includes(
      seccion
    );
  }

  private validateConfigurationData(data: any): void {
    // Validaciones básicas - pueden expandirse según requerimientos
    if (data.alcance && !data.alcance.aplicaA) {
      data.alcance.aplicaA = 'incidentes';
    }

    if (data.gestionIncidentes && !data.gestionIncidentes.prioridadCalculada) {
      data.gestionIncidentes.prioridadCalculada = 'Media';
    }
  }

  private validateSeccionData(seccion: string, data: any): void {
    switch (seccion) {
      case 'alcance':
        if (data.aplicaA && data.aplicaA !== 'incidentes') {
          throw new Error('aplicaA debe ser "incidentes"');
        }
        break;

      case 'incidentes':
        if (!data.tipos || typeof data.tipos !== 'object') {
          throw new Error('tipos debe ser un objeto');
        }
        break;

      case 'tiempos':
        if (data.medicionSLA && !['horasHabiles', 'horasCalendario'].includes(data.medicionSLA)) {
          throw new Error('medicionSLA debe ser "horasHabiles" o "horasCalendario"');
        }
        if (!Array.isArray(data.tiemposPorPrioridad)) {
          throw new Error('tiemposPorPrioridad debe ser un array');
        }
        break;

      case 'horarios':
        // Backward compat: accept old schema where dias is an array
        if (Array.isArray(data.dias)) {
          break;
        }
        // New schema: dias is an object with fixed day keys
        if (!data.dias || typeof data.dias !== 'object') {
          throw new Error('dias debe ser un objeto con llaves Lunes..Domingo');
        }
        const DAYS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
        for (const d of DAYS) {
          const v = data.dias[d];
          if (!v || typeof v !== 'object') {
            throw new Error(`dias.${d} es requerido`);
          }
          if (typeof v.atiende !== 'boolean') {
            throw new Error(`dias.${d}.atiende debe ser boolean`);
          }
          const isHHmm = (s: any) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
          if (!isHHmm(v.horaInicio) || !isHHmm(v.horaFin)) {
            throw new Error(`dias.${d}.horaInicio/horaFin deben ser HH:mm`);
          }
          if (v.atiende) {
            const toMinutes = (s: string) => parseInt(s.slice(0,2))*60 + parseInt(s.slice(3,5));
            if (toMinutes(v.horaFin) <= toMinutes(v.horaInicio)) {
              throw new Error(`dias.${d}.horaFin debe ser mayor que horaInicio`);
            }
          }
        }
        if (data.excluirFeriados !== undefined && typeof data.excluirFeriados !== 'boolean') {
          throw new Error('excluirFeriados debe ser boolean');
        }
        if (data.calendarioFeriados && !Array.isArray(data.calendarioFeriados)) {
          throw new Error('calendarioFeriados debe ser un array de strings');
        }
        if (data.atencionFueraHorario !== undefined && typeof data.atencionFueraHorario !== 'boolean') {
          throw new Error('atencionFueraHorario debe ser boolean');
        }
        if (data.aplicaSLAFueraHorario !== undefined && typeof data.aplicaSLAFueraHorario !== 'boolean') {
          throw new Error('aplicaSLAFueraHorario debe ser boolean');
        }
        break;

      case 'requisitos':
        if (!data.obligacionesCliente || !data.condicionesTecnicas || !data.responsabilidadesProveedor) {
          throw new Error(
            'requisitos debe incluir obligacionesCliente, condicionesTecnicas y responsabilidadesProveedor'
          );
        }
        break;

      case 'exclusiones':
        if (!data.flags || typeof data.flags !== 'object') {
          throw new Error('flags debe ser un objeto');
        }
        break;

      case 'alertas':
        if (!Array.isArray(data.umbrales)) {
          throw new Error('umbrales debe ser un array');
        }
        if (data.accionAutomatica && !['notificar', 'escalar'].includes(data.accionAutomatica)) {
          throw new Error('accionAutomatica debe ser "notificar" o "escalar"');
        }
        break;
    }
  }

  private getDefaultValuesPorSeccion(seccion: string): any {
    return (DEFAULT_SLA_VALUES as any)[seccion] || {};
  }
}

export default new SLAService();
