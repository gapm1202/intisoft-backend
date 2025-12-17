-- Migration 044: Create contracts schema and related tables
-- Contracts core
CREATE TABLE contracts (
  id BIGSERIAL PRIMARY KEY,
  empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_contrato VARCHAR(50) NOT NULL,
  estado_contrato VARCHAR(20) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  renovacion_automatica BOOLEAN NOT NULL DEFAULT false,
  responsable_comercial VARCHAR(150),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(150),
  updated_by VARCHAR(150),
  CONSTRAINT contratos_estado_check CHECK (estado_contrato IN ('activo','suspendido','vencido','historico')),
  CONSTRAINT contratos_tipo_check CHECK (tipo_contrato IN ('servicios','bolsa_horas','proyecto','otro')),
  CONSTRAINT contratos_fecha_check CHECK (fecha_fin >= fecha_inicio)
);

-- Solo un contrato activo por empresa
CREATE UNIQUE INDEX ux_contracts_empresa_activo
  ON contracts(empresa_id)
  WHERE estado_contrato = 'activo';

-- Services
CREATE TABLE contract_services (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  soporte_remoto BOOLEAN DEFAULT false,
  soporte_presencial BOOLEAN DEFAULT false,
  mantenimiento_preventivo BOOLEAN DEFAULT false,
  gestion_inventario BOOLEAN DEFAULT false,
  gestion_credenciales BOOLEAN DEFAULT false,
  monitoreo BOOLEAN DEFAULT false,
  informes_mensuales BOOLEAN DEFAULT false,
  gestion_accesos BOOLEAN DEFAULT false,
  horas_mensuales_incluidas INTEGER,
  exceso_horas_facturable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(150),
  updated_by VARCHAR(150),
  CONSTRAINT contract_services_hours_check CHECK (horas_mensuales_incluidas IS NULL OR horas_mensuales_incluidas >= 0)
);
CREATE UNIQUE INDEX ux_contract_services_contract ON contract_services(contract_id);

-- Preventive policy
CREATE TABLE contract_preventive_policy (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  incluye_preventivo BOOLEAN DEFAULT false,
  frecuencia VARCHAR(10),
  modalidad VARCHAR(20),
  aplica VARCHAR(50),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(150),
  updated_by VARCHAR(150),
  CONSTRAINT preventive_frecuencia_check CHECK (frecuencia IN ('3m','6m','8m','12m') OR frecuencia IS NULL),
  CONSTRAINT preventive_modalidad_check CHECK (modalidad IN ('presencial','remoto','mixto') OR modalidad IS NULL),
  CONSTRAINT preventive_aplica_check CHECK (aplica IN ('todos','categoria') OR aplica IS NULL)
);
CREATE UNIQUE INDEX ux_contract_preventive_policy_contract ON contract_preventive_policy(contract_id);

-- Economics
CREATE TABLE contract_economics (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tipo_facturacion VARCHAR(20) NOT NULL,
  monto_referencial NUMERIC(14,2),
  moneda VARCHAR(3) NOT NULL,
  dia_facturacion SMALLINT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(150),
  updated_by VARCHAR(150),
  CONSTRAINT econ_tipo_facturacion_check CHECK (tipo_facturacion IN ('mensual','por_evento','por_horas')),
  CONSTRAINT econ_moneda_check CHECK (moneda IN ('PEN','USD')),
  CONSTRAINT econ_dia_facturacion_check CHECK (dia_facturacion IS NULL OR (dia_facturacion >= 1 AND dia_facturacion <= 31))
);
CREATE UNIQUE INDEX ux_contract_economics_contract ON contract_economics(contract_id);

-- Documents
CREATE TABLE contract_documents (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  tipo VARCHAR(30) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by VARCHAR(150),
  version VARCHAR(50),
  CONSTRAINT doc_tipo_check CHECK (tipo IN ('contrato_firmado','anexo','addenda','otro'))
);
CREATE INDEX idx_contract_documents_contract ON contract_documents(contract_id);

-- History (auditoría)
CREATE TABLE contract_history (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  campo VARCHAR(100) NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario VARCHAR(150),
  motivo TEXT NOT NULL,
  tipo_cambio VARCHAR(30) NOT NULL,
  CONSTRAINT history_tipo_cambio_check CHECK (tipo_cambio IN ('estado','fecha','servicio','renovacion','documento','economico','preventivo','general','otro'))
);
CREATE INDEX idx_contract_history_contract ON contract_history(contract_id);

-- Trigger timestamps
CREATE OR REPLACE FUNCTION set_timestamp_contracts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contracts_set_timestamp BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION set_timestamp_contracts();
CREATE TRIGGER trg_contract_services_set_timestamp BEFORE UPDATE ON contract_services
FOR EACH ROW EXECUTE FUNCTION set_timestamp_contracts();
CREATE TRIGGER trg_contract_preventive_set_timestamp BEFORE UPDATE ON contract_preventive_policy
FOR EACH ROW EXECUTE FUNCTION set_timestamp_contracts();
CREATE TRIGGER trg_contract_economics_set_timestamp BEFORE UPDATE ON contract_economics
FOR EACH ROW EXECUTE FUNCTION set_timestamp_contracts();

-- Comments
COMMENT ON TABLE contracts IS 'Contratos por empresa (solo uno activo)';
COMMENT ON TABLE contract_services IS 'Servicios incluidos del contrato';
COMMENT ON TABLE contract_preventive_policy IS 'Política de mantenimientos preventivos';
COMMENT ON TABLE contract_economics IS 'Información económica y facturación';
COMMENT ON TABLE contract_documents IS 'Documentos asociados al contrato';
COMMENT ON TABLE contract_history IS 'Auditoría de cambios en el contrato';
