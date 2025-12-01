-- 027_add_purchase_warranty_fields_inventario.sql
-- Añade campos de compra y garantía a la tabla inventario

ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS tipo_documento_compra VARCHAR(255),
  ADD COLUMN IF NOT EXISTS numero_documento_compra VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fecha_compra DATE,
  ADD COLUMN IF NOT EXISTS fecha_compra_aprox_year INTEGER,
  ADD COLUMN IF NOT EXISTS garantia_duracion VARCHAR(100),
  ADD COLUMN IF NOT EXISTS garantia_fecha_inicio DATE,
  ADD COLUMN IF NOT EXISTS garantia_fecha_fin DATE,
  ADD COLUMN IF NOT EXISTS purchase_document_url TEXT,
  ADD COLUMN IF NOT EXISTS warranty_document_url TEXT;

-- Índices opcionales
CREATE INDEX IF NOT EXISTS idx_inventario_numero_documento_compra ON inventario (numero_documento_compra);
CREATE INDEX IF NOT EXISTS idx_inventario_fecha_compra ON inventario (fecha_compra);
