-- Agrega la clave fuera_de_horario a exclusiones en sla_configuracion
DO $$
DECLARE
    row RECORD;
    exclusiones_json JSONB;
BEGIN
    FOR row IN SELECT id, exclusiones FROM sla_configuracion LOOP
        exclusiones_json := row.exclusiones;
        IF NOT exclusiones_json ? 'fuera_de_horario' THEN
            exclusiones_json := exclusiones_json || jsonb_build_object('fuera_de_horario', false);
            UPDATE sla_configuracion SET exclusiones = exclusiones_json WHERE id = row.id;
        END IF;
    END LOOP;
END $$;
