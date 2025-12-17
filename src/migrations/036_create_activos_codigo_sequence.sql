-- Migration 036: Create activos_codigo_sequence table for managing asset code sequences per company/category

-- This table tracks the next available sequence number for asset codes
-- Format: <EMP_CODE>-<CAT><NNNN>
-- Example: IME-PC0001
-- Counter is global per empresa and per categoria

CREATE TABLE IF NOT EXISTS activos_codigo_sequence (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  categoria_id INTEGER NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(empresa_id, categoria_id),
  FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- This table tracks reserved codes to prevent concurrent collisions
-- A code is reserved when frontend requests next-code endpoint
-- It's confirmed/released when the activo is actually created

CREATE TABLE IF NOT EXISTS activos_codigo_reserved (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  categoria_id INTEGER NOT NULL,
  sequence_number INTEGER NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  user_id INTEGER,
  confirmed BOOLEAN DEFAULT FALSE,
  activo_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- Index for checking expired reservations
CREATE INDEX IF NOT EXISTS idx_activos_codigo_reserved_expires_at ON activos_codigo_reserved(expires_at);
CREATE INDEX IF NOT EXISTS idx_activos_codigo_reserved_empresa_id ON activos_codigo_reserved(empresa_id);
CREATE INDEX IF NOT EXISTS idx_activos_codigo_reserved_codigo ON activos_codigo_reserved(codigo);

-- Index for efficient lookups by empresa and categoria
CREATE INDEX IF NOT EXISTS idx_activos_codigo_sequence_empresa_categoria ON activos_codigo_sequence(empresa_id, categoria_id);
