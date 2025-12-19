import { pool } from '../config/db';
import {
  SLAConfiguracion,
  SLAAlcance,
  SLAGestionIncidentes,
  SLATiempos,
  SLAHorarios,
  SLARequisitos,
  SLAExclusiones,
  SLAAlertas,
  HistorialSLA,
  HistorialSLAResponse,
} from '../models/sla.model';

export class SLARepository {
  /**
   * Obtener configuración SLA de una empresa
   */
  async getConfiguration(empresaId: string): Promise<SLAConfiguracion | null> {
    const result = await pool.query(
      `SELECT 
        id,
        empresa_id as "empresaId",
        alcance,
        gestion_incidentes as "gestionIncidentes",
        tiempos,
        horarios,
        requisitos,
        exclusiones,
        alertas,
        created_at as "createdAt",
        updated_at as "updatedAt",
        deleted_at as "deletedAt"
      FROM sla_configuracion
      WHERE empresa_id = $1 AND deleted_at IS NULL`,
      [empresaId]
    );

    const config = result.rows[0] || null;
    if (config && config.horarios) {
      const h = config.horarios as any;
      if (Array.isArray(h.dias)) {
        const DAYS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
        const diasSet = new Set(h.dias || []);
        const horaInicio = h.horaInicio || '08:00';
        const horaFin = h.horaFin || '18:00';
        const diasObj: any = {};
        for (const d of DAYS) {
          const atiende = diasSet.has(d);
          diasObj[d] = { atiende, horaInicio, horaFin };
        }
        config.horarios = {
          dias: diasObj,
          excluirFeriados: h.excluirFeriados ?? true,
          calendarioFeriados: Array.isArray(h.calendarioFeriados) ? h.calendarioFeriados : [],
          atencionFueraHorario: h.atencionFueraHorario ?? false,
          aplicaSLAFueraHorario: h.aplicaSLAFueraHorario ?? false,
        };
      }
    }

    return config;
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Obtener configuración anterior
      const existingResult = await client.query(
        'SELECT * FROM sla_configuracion WHERE empresa_id = $1 AND deleted_at IS NULL',
        [empresaId]
      );

      const existing = existingResult.rows[0];

      // Actualizar o crear configuración
      let slaId: string;

      if (existing) {
        // Actualizar
        const updateResult = await client.query(
          `UPDATE sla_configuracion
           SET 
             alcance = COALESCE($2, alcance),
             gestion_incidentes = COALESCE($3, gestion_incidentes),
             tiempos = COALESCE($4, tiempos),
             horarios = COALESCE($5, horarios),
             requisitos = COALESCE($6, requisitos),
             exclusiones = COALESCE($7, exclusiones),
             alertas = COALESCE($8, alertas),
             updated_at = CURRENT_TIMESTAMP
           WHERE empresa_id = $1 AND deleted_at IS NULL
           RETURNING id`,
          [
            empresaId,
            data.alcance ? JSON.stringify(data.alcance) : null,
            data.gestionIncidentes ? JSON.stringify(data.gestionIncidentes) : null,
            data.tiempos ? JSON.stringify(data.tiempos) : null,
            data.horarios ? JSON.stringify(data.horarios) : null,
            data.requisitos ? JSON.stringify(data.requisitos) : null,
            data.exclusiones ? JSON.stringify(data.exclusiones) : null,
            data.alertas ? JSON.stringify(data.alertas) : null,
          ]
        );
        slaId = updateResult.rows[0].id;
      } else {
        // Crear
        const createResult = await client.query(
          `INSERT INTO sla_configuracion 
           (empresa_id, alcance, gestion_incidentes, tiempos, horarios, requisitos, exclusiones, alertas)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            empresaId,
            JSON.stringify(data.alcance || {}),
            JSON.stringify(data.gestionIncidentes || {}),
            JSON.stringify(data.tiempos || {}),
            JSON.stringify(data.horarios || {}),
            JSON.stringify(data.requisitos || {}),
            JSON.stringify(data.exclusiones || {}),
            JSON.stringify(data.alertas || {}),
          ]
        );
        slaId = createResult.rows[0].id;
      }

      await client.query('COMMIT');

      // Retornar configuración actualizada
      return this.getConfiguration(empresaId) as Promise<SLAConfiguracion>;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const columnName = this.getColumnName(seccion);

      console.log('[SLA][repo.updateSeccion] start', {
        empresaId,
        seccion,
        columnName,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : null,
        usuario,
        usuarioId,
      });

      // Obtener configuración actual (incluso si está soft-deleted)
      const configResult = await client.query(
        'SELECT * FROM sla_configuracion WHERE empresa_id = $1 ORDER BY created_at DESC LIMIT 1',
        [empresaId]
      );

      console.log('[SLA][repo.updateSeccion] query result', {
        empresaId,
        found: configResult.rows.length > 0,
        rowCount: configResult.rows.length,
        hasDeletedAt: configResult.rows[0]?.deleted_at ? true : false,
      });

      let config = configResult.rows[0];
      let wasDeleted = false;

      if (!config) {
        // Crear configuración base si no existe
        const createResult = await client.query(
          `INSERT INTO sla_configuracion (empresa_id, alcance, gestion_incidentes, tiempos, horarios, requisitos, exclusiones, alertas)
           VALUES ($1, '{}', '{}', '{}', '{}', '{}', '{}', '{}')
           RETURNING *`,
          [empresaId]
        );
        config = createResult.rows[0];

        console.log('[SLA][repo.updateSeccion] base config created', {
          empresaId,
          slaId: config.id,
        });
      } else if (config.deleted_at) {
        // Si estaba soft-deleted, reactivar
        wasDeleted = true;
        console.log('[SLA][repo.updateSeccion] reactivating soft-deleted config', {
          empresaId,
          slaId: config.id,
        });
      }

      const oldComplete = this.isConfigComplete(config);

      // Obtener valor anterior
      const valorAnterior = config[columnName];

      console.log('[SLA][repo.updateSeccion] prev value', {
        columnName,
        hasPrev: valorAnterior !== undefined && valorAnterior !== null,
      });

      // Actualizar (reactivar si estaba soft-deleted)
      const updateParams = [empresaId, JSON.stringify(data)];
      let updateQuery = `UPDATE sla_configuracion SET ${columnName} = $2, updated_at = CURRENT_TIMESTAMP`;
      
      if (wasDeleted) {
        updateQuery += `, deleted_at = NULL`;
      }
      
      updateQuery += ` WHERE empresa_id = $1 RETURNING *`;

      const updateResult = await client.query(updateQuery, updateParams);

      const updatedConfig = updateResult.rows[0];
      const slaId = updatedConfig.id;

      const newComplete = this.isConfigComplete(updatedConfig);

      console.log('[SLA][repo.updateSeccion] updated config', {
        empresaId,
        slaId,
        columnName,
      });

      // Crear historial SOLO cuando se completa el SLA por primera vez
      if (!oldComplete && newComplete) {
        await client.query(
          `INSERT INTO historial_sla 
           (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            empresaId,
            slaId,
            'completo',
            'SLA completo',
            null,  // valorAnterior vacío en creación inicial
            'Configuración SLA creada completamente',  // texto descriptivo, no JSON
            motivo || 'Guardado',
            usuario,
            usuarioId || null,
          ]
        );
      }

      // Si es edición de 'alcance' y viene un motivo, registrar diffs por campo
      if (seccion === 'alcance' && motivo) {
        const prevAlcance = (valorAnterior && typeof valorAnterior === 'object') ? valorAnterior : {};
        const currAlcance = (data && typeof data === 'object') ? data : {};

        const toTextActivo = (val: any) => {
          if (val === true) return 'Activo';
          if (val === false) return 'Inactivo';
          return '—';
        };
        const trimStr = (s: any) => (s ?? '').toString().trim();
        const arrToSet = (a: any): Set<string> => new Set(Array.isArray(a) ? a.map((x: any) => String(x)) : []);
        const setsEqual = (a: Set<string>, b: Set<string>) => {
          if (a.size !== b.size) return false;
          for (const v of a) if (!b.has(v)) return false;
          return true;
        };
        const listServicios = (obj: any): string[] => {
          const labels: string[] = [];
          if (obj?.soporteRemoto) labels.push('Soporte remoto');
          if (obj?.soportePresencial) labels.push('Soporte presencial');
          if (obj?.atencionEnSede) labels.push('Atención en sede');
          return labels;
        };

        // Diff: slaActivo
        const prevActivoTxt = toTextActivo(prevAlcance.slaActivo);
        const currActivoTxt = toTextActivo(currAlcance.slaActivo);
        if (prevActivoTxt !== currActivoTxt) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: SLA Activo',
              prevActivoTxt,
              currActivoTxt,
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: observaciones
        const prevObs = trimStr(prevAlcance.observaciones);
        const currObs = trimStr(currAlcance.observaciones);
        if (prevObs !== currObs) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Observaciones del alcance',
              prevObs,
              currObs,
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: tipoServicioCubierto
        const prevTipoServ = trimStr(prevAlcance.tipoServicioCubierto);
        const currTipoServ = trimStr(currAlcance.tipoServicioCubierto);
        if (prevTipoServ !== currTipoServ) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Tipo de servicio cubierto',
              prevTipoServ || '—',
              currTipoServ || '—',
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: serviciosCubiertos (como lista legible)
        const prevServList = listServicios(prevAlcance.serviciosCubiertos);
        const currServList = listServicios(currAlcance.serviciosCubiertos);
        if (!setsEqual(arrToSet(prevServList), arrToSet(currServList))) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Servicios cubiertos',
              prevServList.length ? prevServList.join(', ') : '—',
              currServList.length ? currServList.join(', ') : '—',
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: activosCubiertos.tipo
        const prevActTipo = trimStr(prevAlcance.activosCubiertos?.tipo);
        const currActTipo = trimStr(currAlcance.activosCubiertos?.tipo);
        if (prevActTipo !== currActTipo) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Tipo de activos cubiertos',
              prevActTipo || '—',
              currActTipo || '—',
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: activosCubiertos.categorias (+personalizadas)
        const prevCats = [
          ...(Array.isArray(prevAlcance.activosCubiertos?.categorias) ? prevAlcance.activosCubiertos.categorias : []),
          ...(Array.isArray(prevAlcance.activosCubiertos?.categoriasPersonalizadas) ? prevAlcance.activosCubiertos.categoriasPersonalizadas : []),
        ].map((x: any) => String(x).trim()).filter(Boolean);
        const currCats = [
          ...(Array.isArray(currAlcance.activosCubiertos?.categorias) ? currAlcance.activosCubiertos.categorias : []),
          ...(Array.isArray(currAlcance.activosCubiertos?.categoriasPersonalizadas) ? currAlcance.activosCubiertos.categoriasPersonalizadas : []),
        ].map((x: any) => String(x).trim()).filter(Boolean);
        if (!setsEqual(arrToSet(prevCats), arrToSet(currCats))) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Categorías de activos cubiertos',
              prevCats.length ? prevCats.join(', ') : '—',
              currCats.length ? currCats.join(', ') : '—',
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: sedesCubiertas.tipo
        const prevSedeTipo = trimStr(prevAlcance.sedesCubiertas?.tipo);
        const currSedeTipo = trimStr(currAlcance.sedesCubiertas?.tipo);
        if (prevSedeTipo !== currSedeTipo) {
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Alcance de sedes',
              prevSedeTipo || '—',
              currSedeTipo || '—',
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }

        // Diff: sedesCubiertas.sedes (resolver id -> nombre)
        const prevSedesIds = (Array.isArray(prevAlcance.sedesCubiertas?.sedes) ? prevAlcance.sedesCubiertas.sedes : []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n));
        const currSedesIds = (Array.isArray(currAlcance.sedesCubiertas?.sedes) ? currAlcance.sedesCubiertas.sedes : []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n));
        if (!setsEqual(arrToSet(prevSedesIds), arrToSet(currSedesIds))) {
          const unionIds = Array.from(new Set<number>([...prevSedesIds, ...currSedesIds]));
          let nombresMap = new Map<number, string>();
          if (unionIds.length > 0) {
            const sedesRes = await client.query(
              `SELECT id, nombre FROM sedes WHERE id = ANY($1::int[])`,
              [unionIds]
            );
            for (const r of sedesRes.rows) {
              nombresMap.set(Number(r.id), String(r.nombre));
            }
          }
          const prevNames = prevSedesIds.map((id: number) => nombresMap.get(id) || String(id));
          const currNames = currSedesIds.map((id: number) => nombresMap.get(id) || String(id));
          await client.query(
            `INSERT INTO historial_sla 
             (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              empresaId,
              slaId,
              'alcance',
              'Alcance SLA: Sedes cubiertas',
              prevNames.length ? prevNames.join(', ') : '—',
              currNames.length ? currNames.join(', ') : '—',
              motivo,
              usuario,
              usuarioId || null,
            ]
          );
        }
      }

      await client.query('COMMIT');

      console.log('[SLA][repo.updateSeccion] COMMIT OK', {
        empresaId,
        slaId,
        seccion,
        columnName,
      });

      return data;
    } catch (error) {
      console.error('[SLA][repo.updateSeccion] error, doing ROLLBACK', {
        empresaId,
        seccion,
        error: (error as any)?.message,
      });
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    const config = await this.getConfiguration(empresaId);

    if (!config) {
      throw new Error('SLA Configuration not found');
    }

    await pool.query(
      `INSERT INTO historial_sla 
       (empresa_id, sla_configuracion_id, seccion, campo, valor_anterior, valor_nuevo, motivo, usuario, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        empresaId,
        config.id,
        seccion,
        this.getNombreSeccion(seccion),
        JSON.stringify('Guardado'),
        JSON.stringify('Editando'),
        motivo,
        usuario,
        usuarioId || null,
      ]
    );
  }

  /**
   * Limpiar una o varias secciones (elimina completamente el registro si todas las secciones, sino pone NULL)
   */
  async limpiarSecciones(empresaId: string, secciones: string[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      console.log('[SLA][repo.limpiarSecciones] === START ===', { empresaId, secciones });

      // Mapear secciones a nombres estándar si llegaron nombres BD
      const standardSecciones = secciones.map((s) => {
        if (s === 'gestion_incidentes') return 'incidentes';
        return s;
      });

      const allSecciones = ['alcance', 'incidentes', 'tiempos', 'horarios', 'requisitos', 'exclusiones', 'alertas'];
      
      console.log('[SLA][repo.limpiarSecciones] mapping result', {
        input: secciones,
        output: standardSecciones,
        allSecciones,
      });

      // Verificar cada una
      const missingFromStandard = allSecciones.filter((s) => !standardSecciones.includes(s));
      console.log('[SLA][repo.limpiarSecciones] missing sections', { missingFromStandard });

      const cleaningAll = allSecciones.every((s) => standardSecciones.includes(s));
      console.log('[SLA][repo.limpiarSecciones] cleaningAll result', { cleaningAll, totalReceived: secciones.length, totalExpected: allSecciones.length });

      if (cleaningAll) {
        console.log('[SLA][repo.limpiarSecciones] EXECUTING: soft delete entire config');
        
        // Marcar la fila como eliminada (soft delete)
        const deleteResult = await client.query(
          `UPDATE sla_configuracion 
           SET deleted_at = CURRENT_TIMESTAMP 
           WHERE empresa_id = $1`,
          [empresaId]
        );

        console.log('[SLA][repo.limpiarSecciones] SOFT DELETED entire config', {
          empresaId,
          rowsAffected: deleteResult.rowCount,
          secciones,
        });
      } else {
        console.log('[SLA][repo.limpiarSecciones] EXECUTING: partial clean (HARD DELETE columns not supported, using NULL)');
        
        // Solo limpiar las secciones especificadas (poner NULL)
        const columns = secciones.map((s) => this.getColumnName(s));
        console.log('[SLA][repo.limpiarSecciones] mapped columns', { secciones, columns });

        const configResult = await client.query(
          'SELECT * FROM sla_configuracion WHERE empresa_id = $1',
          [empresaId]
        );

        if (!configResult.rows[0]) {
          // No hay nada que limpiar
          await client.query('COMMIT');
          console.log('[SLA][repo.limpiarSecciones] no config to clean', { empresaId });
          client.release();
          return;
        }

        const sets: string[] = [];
        columns.forEach((col) => {
          sets.push(`${col} = NULL`);
        });

        const updateQuery = `UPDATE sla_configuracion SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE empresa_id = $1`;

        const updateResult = await client.query(updateQuery, [empresaId]);

        console.log('[SLA][repo.limpiarSecciones] set columns to NULL', {
          empresaId,
          secciones,
          columns,
          rowsAffected: updateResult.rowCount,
        });
      }

      await client.query('COMMIT');

      console.log('[SLA][repo.limpiarSecciones] COMMIT OK', {
        empresaId,
        secciones,
      });
    } catch (error) {
      console.error('[SLA][repo.limpiarSecciones] error, doing ROLLBACK', {
        empresaId,
        secciones,
        error: (error as any)?.message,
      });
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener historial de cambios
   */
  async getHistorial(
    empresaId: string,
    limit: number = 100,
    skip: number = 0,
    seccion?: string
  ): Promise<HistorialSLAResponse> {
    let query = `SELECT * FROM historial_sla WHERE empresa_id = $1`;
    const params: any[] = [empresaId];
    let paramIndex = 2;

    if (seccion) {
      query += ` AND seccion = $${paramIndex}`;
      params.push(seccion);
      paramIndex++;
    }

    // Total
    const totalResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    // Items con paginación
    const itemsQuery =
      query +
      ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, skip);

    const itemsResult = await pool.query(itemsQuery, params);

    const items = itemsResult.rows.map((row: any) => ({
      id: row.id,
      empresaId: row.empresa_id,
      slaConfiguracionId: row.sla_configuracion_id,
      seccion: row.seccion,
      campo: row.campo,
      valorAnterior: row.valor_anterior,
      valorNuevo: row.valor_nuevo,
      motivo: row.motivo,
      usuario: row.usuario,
      usuarioId: row.usuario_id,
      fecha: this.formatDate(row.created_at),
      createdAt: row.created_at,
    }));

    return { total, items };
  }

  /**
   * Soft delete de configuración SLA
   */
  async deleteConfiguration(empresaId: string): Promise<void> {
    await pool.query(
      `UPDATE sla_configuracion 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE empresa_id = $1`,
      [empresaId]
    );
  }

  /**
   * Utilidades
   */
  private camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  private getColumnName(seccion: string): string {
    const map: Record<string, string> = {
      alcance: 'alcance',
      incidentes: 'gestion_incidentes',
      tiempos: 'tiempos',
      horarios: 'horarios',
      requisitos: 'requisitos',
      exclusiones: 'exclusiones',
      alertas: 'alertas',
    };

    const column = map[seccion];

    if (!column) {
      throw new Error(`Sección inválida: ${seccion}`);
    }

    return column;

  }

  private hasContent(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  private isConfigComplete(config: any): boolean {
    if (!config) return false;

    return (
      this.hasContent(config.alcance) &&
      this.hasContent(config.gestion_incidentes) &&
      this.hasContent(config.tiempos) &&
      this.hasContent(config.horarios) &&
      this.hasContent(config.requisitos) &&
      this.hasContent(config.exclusiones) &&
      this.hasContent(config.alertas)
    );
  }

  private getNombreSeccion(seccion: string): string {
    const nombres: Record<string, string> = {
      alcance: 'Alcance del SLA',
      incidentes: 'Gestión de Incidentes',
      tiempos: 'Tiempos',
      horarios: 'Horarios',
      requisitos: 'Requisitos',
      exclusiones: 'Exclusiones',
      alertas: 'Alertas',
    };
    return nombres[seccion] || seccion;
  }

  private formatDate(d: any): string {
    try {
      const dt = new Date(d);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const HH = String(dt.getHours()).padStart(2, '0');
      const MM = String(dt.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
    } catch {
      return String(d);
    }
  }
}

export default new SLARepository();
