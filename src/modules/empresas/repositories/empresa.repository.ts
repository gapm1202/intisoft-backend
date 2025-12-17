import { pool } from "../../../config/db";
import { Empresa } from "../models/empresa.model";

const RETURNING_FIELDS = `id, nombre, codigo AS "codigo", codigo_cliente AS "codigoCliente", ruc,
  direccion_fiscal AS "direccionFiscal", direccion_operativa AS "direccionOperativa",
  ciudad, provincia, tipo_empresa AS "tipoEmpresa",
  pagina_web AS "paginaWeb", estado_contrato AS "estadoContrato",
  contactos_admin AS "contactosAdmin",
  contactos_tecnicos AS "contactosTecnicos",
  observaciones_generales AS "observacionesGenerales",
  autorizacion_facturacion AS "autorizacionFacturacion",
  creado_en`;

export const getAll = async (): Promise<Empresa[]> => {
  const res = await pool.query(`SELECT ${RETURNING_FIELDS} FROM empresas ORDER BY id`);
  return res.rows;
};

export const getById = async (id: number): Promise<Empresa | null> => {
  const res = await pool.query(`SELECT ${RETURNING_FIELDS} FROM empresas WHERE id = $1`, [id]);
  return res.rows[0] || null;
};

export const create = async (empresa: Empresa): Promise<Empresa> => {
  const res = await pool.query(
    `INSERT INTO empresas (nombre, codigo, codigo_cliente, ruc, direccion_fiscal, direccion_operativa, ciudad, provincia, tipo_empresa, pagina_web, estado_contrato, contactos_admin, contactos_tecnicos, observaciones_generales, autorizacion_facturacion)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15)
     RETURNING ${RETURNING_FIELDS}`,
    [
      empresa.nombre,
      empresa.codigo || 'XXX',
      empresa.codigoCliente || null,
      empresa.ruc || null,
      empresa.direccionFiscal || null,
      empresa.direccionOperativa || null,
      empresa.ciudad || null,
      empresa.provincia || null,
      empresa.tipoEmpresa || null,
      empresa.paginaWeb || null,
      empresa.estadoContrato || null,
      empresa.contactosAdmin ? JSON.stringify(empresa.contactosAdmin) : JSON.stringify([]),
      empresa.contactosTecnicos ? JSON.stringify(empresa.contactosTecnicos) : JSON.stringify([]),
      empresa.observacionesGenerales || null,
      empresa.autorizacionFacturacion || false,
    ]
  );
  return res.rows[0];
};

export const updateById = async (id: number, empresa: Partial<Empresa>): Promise<Empresa | null> => {
  const res = await pool.query(
    `UPDATE empresas SET
      nombre = COALESCE($1, nombre),
      ruc = COALESCE($2, ruc),
      direccion_fiscal = COALESCE($3, direccion_fiscal),
      direccion_operativa = COALESCE($4, direccion_operativa),
      ciudad = COALESCE($5, ciudad),
      provincia = COALESCE($6, provincia),
      tipo_empresa = COALESCE($7, tipo_empresa),
      pagina_web = COALESCE($8, pagina_web),
      estado_contrato = COALESCE($9, estado_contrato),
      contactos_admin = COALESCE($10::jsonb, contactos_admin),
      contactos_tecnicos = COALESCE($11::jsonb, contactos_tecnicos),
      observaciones_generales = COALESCE($12, observaciones_generales),
      autorizacion_facturacion = COALESCE($13, autorizacion_facturacion)
     WHERE id = $14
     RETURNING ${RETURNING_FIELDS}`,
    [
      empresa.nombre || null,
      empresa.ruc || null,
      empresa.direccionFiscal || null,
      empresa.direccionOperativa || null,
      empresa.ciudad || null,
      empresa.provincia || null,
      empresa.tipoEmpresa || null,
      empresa.paginaWeb || null,
      empresa.estadoContrato || null,
      empresa.contactosAdmin ? JSON.stringify(empresa.contactosAdmin) : null,
      empresa.contactosTecnicos ? JSON.stringify(empresa.contactosTecnicos) : null,
      empresa.observacionesGenerales || null,
      empresa.autorizacionFacturacion !== undefined ? empresa.autorizacionFacturacion : null,
      id,
    ]
  );
  return res.rows[0] || null;
};

export const deleteById = async (id: number): Promise<boolean> => {
  const res = await pool.query("DELETE FROM empresas WHERE id = $1", [id]);
  return res.rowCount > 0;
};
