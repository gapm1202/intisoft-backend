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
