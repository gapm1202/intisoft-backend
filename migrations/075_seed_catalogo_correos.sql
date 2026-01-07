-- Seed data para catálogo de correos
-- Datos iniciales comunes para plataformas, tipos y protocolos

BEGIN;

-- ============ PLATAFORMAS CORREO ============

INSERT INTO plataformas_correo (codigo, nombre, tipo_plataforma, permite_reasignar, permite_conservar, observaciones) VALUES
('PLAT-MICRO', 'Microsoft 365', 'Cloud', true, true, 'Suite de Microsoft con Exchange Online'),
('PLAT-GOOGL', 'Google Workspace', 'Cloud', true, true, 'Anteriormente G Suite'),
('PLAT-EXCHA', 'Exchange Server On-Premise', 'On-Premise', true, true, 'Servidor Exchange local'),
('PLAT-ZOHO', 'Zoho Mail', 'Cloud', true, true, 'Plataforma de correo corporativo'),
('PLAT-POSTF', 'Postfix', 'On-Premise', false, true, 'Servidor de correo de código abierto');

-- ============ TIPOS CORREO ============

INSERT INTO tipos_correo (codigo, nombre, descripcion) VALUES
('TP-CORPO', 'Corporativo', 'Correo electrónico corporativo asignado a empleados'),
('TP-COMPA', 'Compartido', 'Buzón compartido entre múltiples usuarios'),
('TP-GRUPO', 'Grupo', 'Lista de distribución o grupo de correo'),
('TP-SERVI', 'Servicio', 'Cuenta de correo para servicios automáticos (noreply, alerts, etc.)'),
('TP-ADMIN', 'Administrativo', 'Cuenta administrativa (admin@, postmaster@, etc.)');

-- ============ PROTOCOLOS CORREO ============

INSERT INTO protocolos_correo (codigo, nombre, descripcion) VALUES
('PROT-EXCH', 'Exchange', 'Microsoft Exchange Server / Exchange Online'),
('PROT-IMAP', 'IMAP', 'Internet Message Access Protocol'),
('PROT-POP3', 'POP3', 'Post Office Protocol v3'),
('PROT-SMTP', 'SMTP', 'Simple Mail Transfer Protocol'),
('PROT-EWS', 'EWS', 'Exchange Web Services');

COMMIT;
