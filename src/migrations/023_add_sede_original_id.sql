-- Agregar campo sede_original_id para rastrear la sede original del activo
-- Esto permite mostrar activos trasladados en su sede original (bloqueados/grises)

-- 1. Agregar columna sede_original_id
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS sede_original_id INTEGER REFERENCES sedes(id) ON DELETE SET NULL;

-- 2. Inicializar sede_original_id con el valor actual de sede_id para activos existentes
UPDATE inventario SET sede_original_id = sede_id WHERE sede_original_id IS NULL;

-- 3. Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_inventario_sede_original ON inventario(sede_original_id);

-- Nota: 
-- - Al crear un activo: sede_id = X, sede_original_id = X
-- - Al trasladar: sede_id = Y (nueva), sede_original_id = X (mantiene original)
-- - Frontend puede calcular: trasladado = (sede_id != sede_original_id)
