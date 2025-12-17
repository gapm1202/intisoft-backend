-- Migration 046: Update contract_documents tipo constraint
-- Cambiar 'contrato' por 'contrato_firmado' en el CHECK constraint

ALTER TABLE contract_documents DROP CONSTRAINT IF EXISTS doc_tipo_check;
ALTER TABLE contract_documents ADD CONSTRAINT doc_tipo_check 
  CHECK (tipo IN ('contrato_firmado','anexo','addenda','otro'));

COMMENT ON TABLE contract_documents IS 'Documentos asociados al contrato (tipos: contrato_firmado, anexo, addenda, otro)';
