-- ============================================================================
-- EJECUTAR ESTA MIGRACIÓN MANUALMENTE EN pgAdmin o cliente PostgreSQL
-- ============================================================================
-- Base de datos: inticorp
-- Usuario: postgres
-- ============================================================================

-- Crear tabla de historial de usuarios
CREATE TABLE IF NOT EXISTS usuarios_historial (
  historial_id SERIAL PRIMARY KEY,
  
  -- RELACIONES
  empresa_id INT NOT NULL REFERENCES empresas(empresa_id) ON DELETE CASCADE,
  usuario_id INT NOT NULL REFERENCES usuarios_empresas(id) ON DELETE CASCADE,
  
  -- TIPO DE ACCIÓN
  accion VARCHAR(50) NOT NULL,
  
  -- DETALLES DEL CAMBIO
  campo_modificado VARCHAR(100),
  valor_anterior TEXT,
  valor_nuevo TEXT,
  
  -- MOTIVO (OBLIGATORIO)
  motivo TEXT NOT NULL,
  observacion_adicional TEXT,
  
  -- AUDITORÍA
  realizado_por INT REFERENCES usuarios_empresas(id) ON DELETE SET NULL,
  nombre_quien_realizo VARCHAR(255),
  fecha_cambio TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_origen VARCHAR(45),
  
  -- METADATA
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_accion CHECK (accion IN (
    'CREACION', 
    'EDICION', 
    'ASIGNACION_ACTIVO', 
    'CAMBIO_ACTIVO', 
    'DESACTIVACION',
    'LIBERACION_ACTIVO'
  ))
);

-- ÍNDICES
CREATE INDEX idx_historial_usuario ON usuarios_historial(usuario_id);
CREATE INDEX idx_historial_empresa ON usuarios_historial(empresa_id);
CREATE INDEX idx_historial_fecha ON usuarios_historial(fecha_cambio DESC);
CREATE INDEX idx_historial_accion ON usuarios_historial(accion);
CREATE INDEX idx_historial_realizado_por ON usuarios_historial(realizado_por);

-- Comentarios
COMMENT ON TABLE usuarios_historial IS 'Historial completo de cambios realizados en usuarios';
COMMENT ON COLUMN usuarios_historial.accion IS 'Tipo de acción: CREACION, EDICION, ASIGNACION_ACTIVO, CAMBIO_ACTIVO, DESACTIVACION, LIBERACION_ACTIVO';

-- Verificar que se creó
SELECT 'Tabla usuarios_historial creada correctamente' as resultado
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios_historial');
