-- 029_add_purchase_warranty_description_inventario.sql
-- Añade campos de descripción de documentos de compra y garantía a la tabla inventario

ALTER TABLE inventario
  ADD COLUMN IF NOT EXISTS purchase_document_description VARCHAR(500),
  ADD COLUMN IF NOT EXISTS warranty_document_description VARCHAR(500);

-- Índice opcional por búsqueda rápida (si se requiere)
-- CREATE INDEX IF NOT EXISTS idx_inventario_purchase_doc_desc ON inventario (purchase_document_description);
