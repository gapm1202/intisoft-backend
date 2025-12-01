-- Crear tabla historial
CREATE TABLE IF NOT EXISTS historial (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario VARCHAR(255),
  nombre_usuario VARCHAR(255),
  motivo TEXT,
  accion VARCHAR(50) NOT NULL CHECK (accion IN ('EDITAR_EMPRESA', 'EDITAR_SEDE', 'ELIMINAR_SEDE')),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Crear índice para búsquedas frecuentes por empresa
CREATE INDEX IF NOT EXISTS idx_historial_empresa_fecha ON historial(empresa_id, fecha DESC);
