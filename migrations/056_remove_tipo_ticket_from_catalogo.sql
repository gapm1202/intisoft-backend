-- Migration 056: Remove tipo_ticket fields from catalogo tables
-- Remove tipo_ticket relationship from categories and subcategories

-- Remove columns from catalogo_categorias
ALTER TABLE catalogo_categorias 
DROP COLUMN IF EXISTS tipo_ticket;

-- Remove columns from catalogo_subcategorias
ALTER TABLE catalogo_subcategorias 
DROP COLUMN IF EXISTS tipo_ticket,
DROP COLUMN IF EXISTS hereda_tipo;

-- Migration completed
SELECT 'Migration 056: tipo_ticket fields removed from catalogo tables' AS result;
