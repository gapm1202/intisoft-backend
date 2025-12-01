-- Drop audit_trail table as it's no longer needed
-- All audit information is now tracked in the historial table
DROP TABLE IF EXISTS audit_trail CASCADE;
