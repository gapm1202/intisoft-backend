import { pool } from "../../../config/db";
import { Empresa } from "../models/empresa.model";

const RETURNING_FIELDS = `id, nombre, ruc, direccion, direccion_fiscal AS "direccionFiscal", direccion_operativa AS "direccionOperativa",
  ciudad, razon_social AS "razonSocial", provincia, telefono, email, tipo_empresa AS "tipoEmpresa",
  pagina_web AS "paginaWeb", estado_contrato AS "estadoContrato",
  contactos_administrativos AS "contactosAdministrativos", contactos_tecnicos AS "contactosTecnicos",
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
    `INSERT INTO empresas (nombre, ruc, direccion, direccion_fiscal, direccion_operativa, ciudad, razon_social, provincia, telefono, email, tipo_empresa, pagina_web, estado_contrato, contactos_administrativos, contactos_tecnicos)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING ${RETURNING_FIELDS}`,
    [
      empresa.nombre,
      empresa.ruc || null,
      empresa.direccion || null,
      empresa.direccionFiscal || null,
      empresa.direccionOperativa || null,
      empresa.ciudad || null,
      empresa.razonSocial || null,
      empresa.provincia || null,
      empresa.telefono || null,
      empresa.email || null,
      empresa.tipoEmpresa || null,
      empresa.paginaWeb || null,
      empresa.estadoContrato || null,
      empresa.contactosAdministrativos ? JSON.stringify(empresa.contactosAdministrativos) : null,
      empresa.contactosTecnicos ? JSON.stringify(empresa.contactosTecnicos) : null,
    ]
  );
  return res.rows[0];
};

export const updateById = async (id: number, empresa: Partial<Empresa>): Promise<Empresa | null> => {
  const res = await pool.query(
    `UPDATE empresas SET
      nombre = COALESCE($1, nombre),
      ruc = COALESCE($2, ruc),
      direccion = COALESCE($3, direccion),
      direccion_fiscal = COALESCE($4, direccion_fiscal),
      direccion_operativa = COALESCE($5, direccion_operativa),
      ciudad = COALESCE($6, ciudad),
      razon_social = COALESCE($7, razon_social),
      provincia = COALESCE($8, provincia),
      telefono = COALESCE($9, telefono),
      email = COALESCE($10, email),
      tipo_empresa = COALESCE($11, tipo_empresa),
      pagina_web = COALESCE($12, pagina_web),
      estado_contrato = COALESCE($13, estado_contrato),
      contactos_administrativos = COALESCE($14, contactos_administrativos),
      contactos_tecnicos = COALESCE($15, contactos_tecnicos)
     WHERE id = $16
     RETURNING ${RETURNING_FIELDS}`,
    [
      empresa.nombre || null,
      empresa.ruc || null,
      empresa.direccion || null,
      empresa.direccionFiscal || null,
      empresa.direccionOperativa || null,
      empresa.ciudad || null,
      empresa.razonSocial || null,
      empresa.provincia || null,
      empresa.telefono || null,
      empresa.email || null,
      empresa.tipoEmpresa || null,
      empresa.paginaWeb || null,
      empresa.estadoContrato || null,
      empresa.contactosAdministrativos ? JSON.stringify(empresa.contactosAdministrativos) : null,
      empresa.contactosTecnicos ? JSON.stringify(empresa.contactosTecnicos) : null,
      id,
    ]
  );
  return res.rows[0] || null;
};

export const deleteById = async (id: number): Promise<boolean> => {
  const res = await pool.query("DELETE FROM empresas WHERE id = $1", [id]);
  return res.rowCount > 0;
};
