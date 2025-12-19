-- Tabla SLA_Configuracion para almacenar configuraciones de SLA por empresa
CREATE TABLE IF NOT EXISTS sla_configuracion (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  
  -- Alcance
  alcance JSONB NOT NULL DEFAULT '{}',
  
  -- Gestión de Incidentes
  gestion_incidentes JSONB NOT NULL DEFAULT '{}',
  
  -- Tiempos
  tiempos JSONB NOT NULL DEFAULT '{}',
  
  -- Horarios
  horarios JSONB NOT NULL DEFAULT '{}',
  
  -- Requisitos
  requisitos JSONB NOT NULL DEFAULT '{}',
  
  -- Exclusiones
  exclusiones JSONB NOT NULL DEFAULT '{}',
  
  -- Alertas
  alertas JSONB NOT NULL DEFAULT '{}',
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT fk_sla_configuracion_empresa 
    FOREIGN KEY (empresa_id) 
    REFERENCES empresas(id) 
    ON DELETE CASCADE,
  CONSTRAINT uk_sla_config_empresa 
    UNIQUE(empresa_id, deleted_at)
);

-- Tabla HistorialSLA para auditoría de cambios
CREATE TABLE IF NOT EXISTS historial_sla (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  sla_configuracion_id INTEGER NOT NULL,
  
  -- Información del cambio
  seccion VARCHAR(50) NOT NULL CHECK (
    seccion IN ('alcance', 'incidentes', 'tiempos', 'horarios', 'requisitos', 'exclusiones', 'alertas')
  ),
  campo VARCHAR(255) NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  motivo VARCHAR(500),
  
  -- Usuario y auditoría
  usuario VARCHAR(255),
  usuario_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_historial_sla_empresa 
    FOREIGN KEY (empresa_id) 
    REFERENCES empresas(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_historial_sla_config 
    FOREIGN KEY (sla_configuracion_id) 
    REFERENCES sla_configuracion(id) 
    ON DELETE CASCADE
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_sla_config_empresa_id 
  ON sla_configuracion(empresa_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_historial_sla_empresa_id 
  ON historial_sla(empresa_id);

CREATE INDEX IF NOT EXISTS idx_historial_sla_config_id 
  ON historial_sla(sla_configuracion_id);

CREATE INDEX IF NOT EXISTS idx_historial_sla_created_at 
  ON historial_sla(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_historial_sla_seccion 
  ON historial_sla(seccion);
