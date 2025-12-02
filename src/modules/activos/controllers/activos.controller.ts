import { Request, Response } from 'express';
import * as service from '../services/activos.service';
import { Foto } from '../models/traslado.model';

export const getHistorialByActivo = async (req: Request, res: Response) => {
  try {
    const activoId = parseInt(req.params.activoId);
    if (isNaN(activoId)) return res.status(400).json({ ok: false, message: 'activoId inválido' });

    console.log('📜 Obteniendo historial completo del activo:', activoId);
    
    const rows = await service.getHistorialByActivo(activoId);
    
    console.log(`✅ Registros de historial encontrados: ${rows.length}`);
    
    return res.json({ ok: true, data: rows });
  } catch (err: any) {
    console.error('❌ Error obteniendo historial:', err && (err.stack || err));
    return res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
};

export const trasladarActivo = async (req: Request, res: Response) => {
  try {
    console.log('📦 Body recibido (keys):', Object.keys(req.body));
    console.log('📦 Body completo:', JSON.stringify(req.body, null, 2));
    console.log('📦 Files recibidos:', (req as any).files);
    
    const activoId = parseInt(req.params.id);
    if (isNaN(activoId)) {
      return res.status(400).json({ ok: false, message: 'ID de activo inválido' });
    }

    const {
      empresaId,
      sedeOrigenId,
      sedeDestino,
      sedeDestinoId,
      areaDestino,
      areaDestinoId,
      fechaTraslado,
      responsableEnvia,
      responsableRecibe,
      motivo,
      estadoEquipo,
      especificarFalla,
      observaciones,
      nuevoCodigoAsignado
    } = req.body;
    
    console.log('📋 Valores extraídos:', {
      empresaId,
      sedeOrigenId,
      sedeDestino,
      sedeDestinoId,
      areaDestino,
      areaDestinoId
    });
    
    // Aceptar sedeDestino o sedeDestinoId
    const sedeDestinoFinal = sedeDestinoId || sedeDestino;
    const areaDestinoFinal = areaDestinoId || areaDestino;
    
    console.log('🔍 nuevoCodigoAsignado recibido en FormData:', nuevoCodigoAsignado);
    if (nuevoCodigoAsignado) {
      console.log('🔄 Cambio de código solicitado:', nuevoCodigoAsignado);
    } else {
      console.log('⚠️ NO se recibió nuevoCodigoAsignado, se generará automáticamente');
    }

    // Validaciones
    if (!empresaId || !sedeOrigenId || !sedeDestinoFinal) {
      console.log('❌ Validación fallida - empresaId:', empresaId, 'sedeOrigenId:', sedeOrigenId, 'sedeDestino:', sedeDestinoFinal);
      return res.status(400).json({ 
        ok: false, 
        message: 'Faltan campos requeridos: empresaId, sedeOrigenId, sedeDestino' 
      });
    }

    if (!fechaTraslado || !responsableEnvia || !responsableRecibe || !motivo || !estadoEquipo) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Faltan campos requeridos: fechaTraslado, responsableEnvia, responsableRecibe, motivo, estadoEquipo' 
      });
    }

    // Procesar fotos subidas
    const uploadedFiles = ((req as any).files || []) as any[];
    const fotos: Foto[] = uploadedFiles.map((file: any) => ({
      url: `/uploads/${file.filename}`,
      descripcion: file.originalname
    }));

    console.log(`📦 Traslado de activo ${activoId}: ${uploadedFiles.length} fotos subidas`);

    const dto = {
      activoId,
      empresaId,
      sedeOrigenId,
      sedeDestino: sedeDestinoFinal,
      areaDestino: areaDestinoFinal,
      fechaTraslado,
      responsableEnvia,
      responsableRecibe,
      motivo,
      estadoEquipo,
      especificarFalla,
      observaciones,
      fotos,
      usuarioId: (req as any).userId || null,
      nuevoCodigoAsignado: nuevoCodigoAsignado || undefined
    };

    const result = await service.trasladarActivo(dto);
    
    return res.json({ 
      ok: true, 
      message: result.message,
      data: result.traslado
    });

  } catch (err: any) {
    console.error('trasladarActivo error:', err && (err.stack || err));
    return res.status(500).json({ 
      ok: false, 
      message: err.message || 'Error al realizar el traslado' 
    });
  }
};

export const getTrasladosByActivo = async (req: Request, res: Response) => {
  try {
    const activoId = parseInt(req.params.activoId);
    if (isNaN(activoId)) {
      return res.status(400).json({ ok: false, message: 'activoId inválido' });
    }

    const traslados = await service.getTrasladosByActivo(activoId);
    return res.json({ ok: true, data: traslados });
    
  } catch (err: any) {
    console.error('getTrasladosByActivo error:', err && (err.stack || err));
    return res.status(500).json({ 
      ok: false, 
      message: 'Error al obtener traslados' 
    });
  }
};

export const createOrGetToken = async (req: Request, res: Response) => {
  try {
    // Accept either numeric internal id or asset code (e.g. "PC-0006") in the route param
    const rawParam = req.params.activoId || req.params.id || '';
    let activoId = parseInt(rawParam);
    let activo: any = null;
    if (isNaN(activoId)) {
      // try to resolve by asset code
      activo = await service.getActivoByAssetId(String(rawParam));
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
      activoId = activo.id;
    } else {
      activo = await service.getActivoById(activoId);
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
    }

    // Permission check is already handled by authorizeRole middleware

    try {
      const token = await service.getOrCreateEtiquetaToken(activoId);
      console.log('createOrGetToken - activo resolved:', { id: activo.id, assetId: activo.assetId });
      return res.status(200).json({ token, id: activo.id, assetId: activo.assetId });
    } catch (err: any) {
      if (err && err.message === 'ACTIVO_NOT_FOUND') return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
      console.error('createOrGetToken error:', err && (err.stack || err));
      return res.status(500).json({ ok: false, message: 'Error generando token' });
    }

  } catch (err: any) {
    console.error('createOrGetToken outer error:', err && (err.stack || err));
    return res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
};

export const getTokensBatch = async (req: Request, res: Response) => {
  try {
    // Accept ids in body (POST) as array, query csv, or body.codes as asset codes
    let ids: number[] = [];
    const body = (req as any).body || {};
    if (Array.isArray(body.ids)) {
      // Try parse numeric ids first
      ids = body.ids.map((v: any) => parseInt(String(v))).filter((n: number) => !isNaN(n));
      // If no numeric ids found, treat body.ids as array of asset codes (strings)
      if ((ids.length === 0) && body.ids.length > 0) {
        const codes = body.ids.map((c: any) => String(c));
        const resolved: number[] = [];
        for (const code of codes) {
          try {
            const activo = await service.getActivoByAssetId(code);
            if (activo && activo.id) resolved.push(activo.id);
          } catch (e) {
            console.warn('getTokensBatch - failed resolving code from body.ids array', code, e);
          }
        }
        ids = resolved;
      }
    } else if (typeof body.ids === 'string' && body.ids.trim() !== '') {
      // Accept CSV string in body.ids
      ids = String(body.ids).split(',').map((s: string) => parseInt(s)).filter((n: number) => !isNaN(n));
    } else {
      const idsParam = String(req.query.ids || '');
      if (idsParam) ids = idsParam.split(',').map(s => parseInt(s)).filter(n => !isNaN(n));
    }

    // If caller provided asset codes (e.g. ["PC-0001","PC-0002"]) resolve them
    if ((!ids || ids.length === 0) && Array.isArray(body.codes) && body.codes.length > 0) {
      const codes = body.codes.map((c: any) => String(c));
      const resolved: number[] = [];
      for (const code of codes) {
        try {
          const activo = await service.getActivoByAssetId(code);
          if (activo && activo.id) resolved.push(activo.id);
        } catch (e) {
          console.warn('getTokensBatch - failed resolving code', code, e);
        }
      }
      ids = resolved;
    }

    // Also accept CSV string in body.codes
    if ((!ids || ids.length === 0) && typeof body.codes === 'string' && body.codes.trim() !== '') {
      const codesArr = String(body.codes).split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
      const resolved2: number[] = [];
      for (const code of codesArr) {
        try {
          const activo = await service.getActivoByAssetId(code);
          if (activo && activo.id) resolved2.push(activo.id);
        } catch (e) {
          console.warn('getTokensBatch - failed resolving code (csv)', code, e);
        }
      }
      ids = resolved2;
    }

    if (!ids || ids.length === 0) {
      console.warn('getTokensBatch - request missing ids. req.body:', JSON.stringify(body), 'req.query:', req.query);
      return res.status(400).json({ ok: false, message: 'ids missing' });
    }

    try {
      const map = await service.getOrCreateTokensBatch(ids);
      return res.json({ ok: true, data: map });
    } catch (err: any) {
      console.error('getTokensBatch error:', err && (err.stack || err));
      return res.status(500).json({ ok: false, message: 'Error procesando tokens' });
    }

  } catch (err: any) {
    console.error('getTokensBatch outer error:', err && (err.stack || err));
    return res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
};

export const regenerateToken = async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.activoId || req.params.id || '';
    let activoId = parseInt(rawParam);
    let activo: any = null;
    if (isNaN(activoId)) {
      activo = await service.getActivoByAssetId(String(rawParam));
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
      activoId = activo.id;
    } else {
      activo = await service.getActivoById(activoId);
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
    }
    const user = (req as any).user;
    try {
      const token = await service.regenerateEtiquetaToken(activoId, user && user.id);
      console.log('regenerateToken - activo resolved:', { id: activo.id, assetId: activo.assetId });
      return res.json({ ok: true, token, id: activo.id, assetId: activo.assetId });
    } catch (err: any) {
      if (err && err.message === 'ACTIVO_NOT_FOUND') return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
      console.error('regenerateToken error:', err && (err.stack || err));
      return res.status(500).json({ ok: false, message: 'Error regenerando token' });
    }
  } catch (err: any) {
    console.error('regenerateToken outer error:', err && (err.stack || err));
    return res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
};

export const deleteToken = async (req: Request, res: Response) => {
  try {
    const rawParam = req.params.activoId || req.params.id || '';
    let activoId = parseInt(rawParam);
    let activo: any = null;
    if (isNaN(activoId)) {
      activo = await service.getActivoByAssetId(String(rawParam));
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
      activoId = activo.id;
    } else {
      activo = await service.getActivoById(activoId);
      if (!activo) return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
    }
    const user = (req as any).user;
    try {
      await service.deleteEtiquetaToken(activoId, user && user.id);
      return res.json({ ok: true });
    } catch (err: any) {
      if (err && err.message === 'ACTIVO_NOT_FOUND') return res.status(404).json({ ok: false, message: 'Activo no encontrado' });
      console.error('deleteToken error:', err && (err.stack || err));
      return res.status(500).json({ ok: false, message: 'Error borrando token' });
    }
  } catch (err: any) {
    console.error('deleteToken outer error:', err && (err.stack || err));
    return res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
};
