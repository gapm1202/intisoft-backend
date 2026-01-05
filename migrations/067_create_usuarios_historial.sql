-- Migration 067: Crear tabla usuarios_historial para auditoria de cambios
-- Proposito: Registrar historial completo de cambios en usuarios
-- Fecha: 2024-01-04

-- Crear tabla de historial de usuarios
CREATE TABLE IF NOT EXISTS usuarios_historial (
  historial_id SERIAL PRIMARY KEY,
  
  -- RELACIONES
  empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id INT NOT NULL REFERENCES usuarios_empresas(id) ON DELETE CASCADE,
  
  -- TIPO DE ACCION
  accion VARCHAR(50) NOT NULL,
  
  -- DETALLES DEL CAMBIO
  campo_modificado VARCHAR(100),
  valor_anterior TEXT,
  valor_nuevo TEXT,
  
  -- MOTIVO (OBLIGATORIO)
  motivo TEXT NOT NULL,
  observacion_adicional TEXT,
  
  -- AUDITORIA
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

-- INDICES
CREATE INDEX idx_historial_usuario ON usuarios_historial(usuario_id);
CREATE INDEX idx_historial_empresa ON usuarios_historial(empresa_id);
CREATE INDEX idx_historial_fecha ON usuarios_historial(fecha_cambio DESC);
CREATE INDEX idx_historial_accion ON usuarios_historial(accion);
CREATE INDEX idx_historial_realizado_por ON usuarios_historial(realizado_por);

-- Verificacion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'usuarios_historial') THEN
    RAISE NOTICE 'Tabla usuarios_historial creada correctamente';
  ELSE
    RAISE EXCEPTION 'Error: Tabla usuarios_historial no fue creada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes 
             WHERE tablename = 'usuarios_historial' AND indexname = 'idx_historial_usuario') THEN
    RAISE NOTICE 'Indices creados correctamente';
  END IF;
END $$;
