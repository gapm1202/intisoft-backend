import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { pool } from '../config/db';
import crypto from 'crypto';

interface EmailActivoData {
  id: number;
  assetId: string;
  categoria: string;
  fabricante?: string;
  modelo?: string;
  etiquetaToken: string;
  fechaAsignacion: Date;
}

interface EmailUsuarioData {
  id: number;
  nombreCompleto: string;
  correo: string;
  cargo?: string;
  empresaNombre: string;
  sedeNombre: string;
  activos: EmailActivoData[];
}

/**
 * Configurar transporter de nodemailer con las credenciales del .env
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Generar código QR en formato base64 para un activo
 */
async function generarQRActivo(etiquetaToken: string): Promise<string> {
  const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
  const qrUrl = `${frontendUrl}/public/activos?token=${etiquetaToken}`;
  
  try {
    const qrDataURL = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    // Debug: Verificar que el QR se generó correctamente
    console.log(`[EMAIL] 🔍 QR generado para token ${etiquetaToken.substring(0, 16)}...`);
    console.log(`[EMAIL] 📊 QR Data URI inicio: ${qrDataURL.substring(0, 50)}`);
    
    if (!qrDataURL.startsWith('data:image/png;base64,')) {
      console.error('[EMAIL] ❌ QR generado NO es un Data URI válido!');
      return '';
    }
    
    console.log('[EMAIL] ✅ QR Data URI válido');
    return qrDataURL;
  } catch (error) {
    console.error('[EMAIL] ❌ Error generando QR:', error);
    return '';
  }
}

/**
 * Generar HTML del email de bienvenida
 */
async function generarHtmlBienvenida(userData: EmailUsuarioData): Promise<string> {
  let activosHtml = '';
  
  if (userData.activos && userData.activos.length > 0) {
    // Generar sección para cada activo con su QR
    for (let i = 0; i < userData.activos.length; i++) {
      const activo = userData.activos[i];
      const frontendUrl = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
      const urlCompleta = `${frontendUrl}/public/activos?token=${activo.etiquetaToken}`;
      const qrCode = await generarQRActivo(activo.etiquetaToken);
      const fechaFormateada = new Date(activo.fechaAsignacion).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      // Debug: Verificar QR
      if (qrCode) {
        console.log(`[EMAIL] ✅ QR generado para activo ${activo.assetId}`);
      } else {
        console.log(`[EMAIL] ⚠️ QR NO generado para activo ${activo.assetId}`);
      }
      
      activosHtml += `
        <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; background-color: #f9f9f9;">
          <h3 style="margin-top: 0; color: #333;">📦 Equipo #${i + 1}</h3>
          <div style="background: white; padding: 15px; border-radius: 5px;">
            <p style="margin: 8px 0;"><strong>Código:</strong> ${activo.assetId}</p>
            <p style="margin: 8px 0;"><strong>Tipo:</strong> ${activo.categoria}</p>
            ${activo.fabricante ? `<p style="margin: 8px 0;"><strong>Marca:</strong> ${activo.fabricante}</p>` : ''}
            ${activo.modelo ? `<p style="margin: 8px 0;"><strong>Modelo:</strong> ${activo.modelo}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Asignado:</strong> ${fechaFormateada}</p>
          </div>
          
          ${qrCode ? `
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: white; border-radius: 5px;">
            <p style="font-weight: bold; margin-bottom: 10px; color: #333;">📱 ESCANEA ESTE QR PARA REPORTAR PROBLEMAS:</p>
            
            <!-- QR CODE -->
            <img src="${qrCode}" 
                 alt="QR ${activo.assetId}" 
                 style="display: block; width: 200px; height: 200px; margin: 10px auto; border: 2px solid #ddd; padding: 10px; background: white;"/>
            
            <!-- LINK DEBAJO DEL QR -->
            <a href="${urlCompleta}" 
               style="font-size: 12px; color: #3b82f6; word-break: break-all; display: block; margin-top: 15px; text-decoration: none;">
              ${urlCompleta}
            </a>
            
            <p style="font-size: 12px; color: #666; margin-top: 15px;">
              Si tienes algún problema con este equipo,<br/>
              escanea el QR o haz clic en el enlace de arriba.
            </p>
          </div>
          ` : `
          <div style="text-align: center; margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
            <p style="color: #856404; margin: 0;">⚠️ No se pudo generar el código QR para este equipo.</p>
            <a href="${urlCompleta}" 
               style="font-size: 12px; color: #3b82f6; word-break: break-all; display: block; margin-top: 10px; text-decoration: none;">
              ${urlCompleta}
            </a>
          </div>
          `}
        </div>
      `;
    }
  } else {
    activosHtml = `
      <div style="border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; background-color: #fff3cd;">
        <p style="margin: 0; color: #856404;">
          ⚠️ Por el momento no tienes equipos asignados.<br/><br/>
          Cuando se te asigne algún equipo, recibirás una notificación con los 
          detalles del mismo y su código QR para reportar incidencias.
        </p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Intiscorp</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">INTISCORP</h1>
      <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 14px;">Sistema de Gestión de Activos</p>
    </div>
    
    <!-- Saludo -->
    <div style="padding: 30px;">
      <h2 style="color: #333; margin-top: 0;">Estimado/a ${userData.nombreCompleto},</h2>
      <p style="color: #555; line-height: 1.6;">
        ¡Bienvenido/a al sistema de gestión de activos de Intiscorp!
      </p>
      <p style="color: #555; line-height: 1.6;">
        Tu cuenta ha sido creada exitosamente. A continuación encontrarás toda la 
        información importante sobre tu usuario y los equipos asignados.
      </p>
    </div>
    
    <!-- Datos del Usuario -->
    <div style="padding: 0 30px 20px 30px;">
      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #667eea;">📋 TUS DATOS DE USUARIO</h3>
        <p style="margin: 8px 0; color: #333;"><strong>👤 Nombre:</strong> ${userData.nombreCompleto}</p>
        <p style="margin: 8px 0; color: #333;"><strong>📧 Correo:</strong> ${userData.correo}</p>
        <p style="margin: 8px 0; color: #333;"><strong>🏢 Empresa:</strong> ${userData.empresaNombre}</p>
        <p style="margin: 8px 0; color: #333;"><strong>🏪 Sede:</strong> ${userData.sedeNombre}</p>
        ${userData.cargo ? `<p style="margin: 8px 0; color: #333;"><strong>💼 Cargo:</strong> ${userData.cargo}</p>` : ''}
      </div>
    </div>
    
    <!-- Equipos Asignados -->
    <div style="padding: 0 30px 20px 30px;">
      <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
        🖥️ EQUIPOS ASIGNADOS
      </h3>
      ${activosHtml}
    </div>
    
    <!-- Instrucciones -->
    <div style="padding: 0 30px 20px 30px;">
      <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 20px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #2196F3;">❓ ¿CÓMO REPORTAR UN PROBLEMA?</h3>
        <p style="color: #333; line-height: 1.6; margin: 10px 0;">
          Cada equipo tiene su propio código QR (mostrado arriba).
        </p>
        <p style="color: #333; line-height: 1.6; margin: 10px 0;">
          <strong>Para reportar una incidencia:</strong>
        </p>
        <ol style="color: #333; line-height: 1.8; margin: 10px 0;">
          <li>Escanea el QR del equipo con problemas</li>
          <li>Se abrirá un formulario de reporte</li>
          <li>Describe el problema</li>
          <li>Envía el reporte</li>
        </ol>
        <p style="color: #333; line-height: 1.6; margin: 10px 0;">
          Nuestro equipo de soporte técnico será notificado de inmediato.
        </p>
      </div>
    </div>
    
    <!-- Importante -->
    <div style="padding: 0 30px 30px 30px;">
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #856404;">⚠️ IMPORTANTE</h3>
        <ul style="color: #856404; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
          <li>Conserva este correo para futuras referencias</li>
          <li>Los códigos QR también están impresos en las etiquetas de cada equipo</li>
          <li>Si pierdes acceso a los QR, contacta con soporte</li>
          <li>Eres responsable del cuidado de los equipos asignados</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #666; margin: 5px 0; font-size: 14px;">
        ¿Necesitas ayuda? Contacta con nuestro equipo de soporte técnico.
      </p>
      <p style="color: #999; margin: 15px 0 5px 0; font-size: 12px;">
        Atentamente,<br/>
        <strong>Equipo de Soporte Técnico</strong><br/>
        Intiscorp
      </p>
      <p style="color: #ccc; margin: 15px 0 0 0; font-size: 11px;">
        Este es un correo automático, por favor no responder.
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
}

/**
 * Obtener datos completos del usuario para el email
 */
async function obtenerDatosUsuario(usuarioId: number): Promise<EmailUsuarioData | null> {
  const client = await pool.connect();
  
  try {
    const query = `
      SELECT 
        ue.id,
        ue.nombre_completo,
        ue.correo,
        ue.cargo,
        e.nombre as empresa_nombre,
        s.nombre as sede_nombre,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN i.id IS NOT NULL THEN
                JSON_BUILD_OBJECT(
                  'id', i.id,
                  'assetId', i.asset_id,
                  'categoria', i.categoria,
                  'fabricante', i.fabricante,
                  'modelo', i.modelo,
                  'etiquetaToken', i.etiqueta_token,
                  'fechaAsignacion', ua.fecha_asignacion
                )
              ELSE NULL
            END
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'::json
        ) as activos_data
      FROM usuarios_empresas ue
      INNER JOIN empresas e ON ue.empresa_id = e.id
      INNER JOIN sedes s ON ue.sede_id = s.id
      LEFT JOIN usuarios_activos ua ON ue.id = ua.usuario_id AND ua.activo = TRUE
      LEFT JOIN inventario i ON ua.activo_id = i.id
      WHERE ue.id = $1
      GROUP BY ue.id, e.nombre, s.nombre
    `;
    
    const result = await client.query(query, [usuarioId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    let activos: EmailActivoData[] = Array.isArray(row.activos_data) ? row.activos_data : [];
    
    // Generar tokens para activos que no los tienen
    const activosSinToken = activos.filter(a => !a.etiquetaToken);
    if (activosSinToken.length > 0) {
      console.log(`[EMAIL] 🔑 Generando tokens para ${activosSinToken.length} activos...`);
      
      await client.query('BEGIN');
      
      for (const activo of activosSinToken) {
        const token = crypto.randomBytes(32).toString('hex');
        await client.query(
          'UPDATE inventario SET etiqueta_token = $1, updated_at = NOW() WHERE id = $2',
          [token, activo.id]
        );
        activo.etiquetaToken = token;
        console.log(`[EMAIL] ✅ Token generado para activo ${activo.assetId}: ${token.substring(0, 16)}...`);
      }
      
      await client.query('COMMIT');
    }
    
    return {
      id: row.id,
      nombreCompleto: row.nombre_completo,
      correo: row.correo,
      cargo: row.cargo,
      empresaNombre: row.empresa_nombre,
      sedeNombre: row.sede_nombre,
      activos: activos,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[EMAIL] Error obteniendo datos usuario:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Enviar email de bienvenida a un usuario recién creado
 */
export async function enviarEmailBienvenida(usuarioId: number): Promise<boolean> {
  try {
    console.log(`[EMAIL] 📧 Preparando email de bienvenida para usuario ${usuarioId}...`);
    
    // Obtener datos del usuario y sus activos
    const userData = await obtenerDatosUsuario(usuarioId);
    
    if (!userData) {
      console.error(`[EMAIL] ❌ No se encontraron datos para usuario ${usuarioId}`);
      return false;
    }
    
    console.log(`[EMAIL] ✅ Datos obtenidos: ${userData.nombreCompleto} (${userData.correo})`);
    console.log(`[EMAIL] 📦 Activos asignados: ${userData.activos.length}`);
    
    // Generar HTML del email
    const htmlContent = await generarHtmlBienvenida(userData);
    
    // Debug: Verificar que el HTML contiene QR codes
    const qrCount = (htmlContent.match(/data:image\/png;base64,/g) || []).length;
    console.log(`[EMAIL] 🔍 QR codes en HTML: ${qrCount}`);
    console.log(`[EMAIL] 📄 HTML generado: ${htmlContent.length} caracteres`);
    
    // Verificar que hay imágenes embebidas
    if (qrCount > 0) {
      console.log(`[EMAIL] ✅ HTML contiene ${qrCount} QR code(s) embebido(s)`);
    } else {
      console.log('[EMAIL] ⚠️ HTML NO contiene QR codes embebidos!');
    }
    
    // Enviar email SOLO como HTML (no texto plano)
    const info = await transporter.sendMail({
      from: `"Intiscorp - Soporte Técnico" <${process.env.SMTP_USER}>`,
      to: userData.correo,
      subject: 'Bienvenido a Intiscorp - Tus equipos y acceso a soporte técnico',
      html: htmlContent, // ✅ Solo HTML, NO usar "text"
    });
    
    console.log(`[EMAIL] ✅ Email enviado exitosamente a ${userData.correo}`);
    console.log(`[EMAIL] 📨 Message ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ Error enviando email de bienvenida:', error);
    return false;
  }
}

/**
 * Verificar conexión SMTP
 */
export async function verificarConexionSMTP(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[EMAIL] ✅ Conexión SMTP verificada correctamente');
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ Error verificando conexión SMTP:', error);
    return false;
  }
}
