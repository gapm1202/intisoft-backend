// Ejemplo completo de componente React para enviar reportes de activos
// Copia este código en tu frontend y ajusta según tu estructura

import React, { useState } from 'react';

interface AssetReportFormProps {
  assetId: string;
  token?: string;
  usuarios?: Array<{
    id: string | number;
    nombre: string;
    email?: string;
    cargo?: string;
  }>;
}

export const AssetReportForm: React.FC<AssetReportFormProps> = ({ 
  assetId, 
  token, 
  usuarios = [] 
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [description, setDescription] = useState('');
  const [operational, setOperational] = useState<'Sí' | 'No'>('Sí');
  const [anydesk, setAnydesk] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    reportId?: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validar tipos de archivo
      const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
      const invalidFiles = files.filter(f => !validTypes.includes(f.type));
      
      if (invalidFiles.length > 0) {
        alert('Algunos archivos tienen formato inválido. Solo se permiten JPEG, PNG y MP4.');
        return;
      }
      
      // Validar tamaño (10MB máximo por archivo)
      const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
      
      if (oversizedFiles.length > 0) {
        alert('Algunos archivos son muy grandes. El tamaño máximo es 10MB por archivo.');
        return;
      }
      
      setAttachments(files.slice(0, 10)); // Máximo 10 archivos
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // Validar campos requeridos
      if (!reporterEmail || !description || !anydesk) {
        setSubmitResult({
          success: false,
          message: 'Por favor completa todos los campos requeridos'
        });
        setIsSubmitting(false);
        return;
      }

      // Construir FormData
      const formData = new FormData();
      
      // Campos requeridos
      formData.append('assetId', assetId);
      formData.append('reporterEmail', reporterEmail);
      formData.append('description', description);
      formData.append('anydesk', anydesk);
      
      // Token (si existe)
      if (token) {
        formData.append('token', token);
      }
      
      // Usuario seleccionado O nombre manual
      if (selectedUserId) {
        formData.append('reporterUserId', selectedUserId);
      } else if (reporterName) {
        formData.append('reporterName', reporterName);
      }
      
      // Estado operacional
      formData.append('operational', operational);
      
      // Archivos adjuntos
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      // Enviar request
      const response = await fetch('/public/activos/report', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitResult({
          success: true,
          message: 'Reporte enviado exitosamente',
          reportId: data.reportId
        });
        
        // Limpiar formulario
        setDescription('');
        setAnydesk('');
        setAttachments([]);
        setSelectedUserId('');
        setReporterName('');
        
      } else {
        setSubmitResult({
          success: false,
          message: data.message || 'Error al enviar el reporte'
        });
      }
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      setSubmitResult({
        success: false,
        message: 'Error de conexión. Por favor intenta de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fill email cuando se selecciona un usuario
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = usuarios.find(u => String(u.id) === userId);
    if (user && user.email) {
      setReporterEmail(user.email);
    }
  };

  return (
    <div className="asset-report-form">
      <h2>Reportar Problema con Activo</h2>
      <p>Activo: <strong>{assetId}</strong></p>

      {submitResult && (
        <div className={`alert ${submitResult.success ? 'alert-success' : 'alert-error'}`}>
          {submitResult.message}
          {submitResult.reportId && (
            <p>ID del reporte: {submitResult.reportId}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Selector de usuario (si hay usuarios disponibles) */}
        {usuarios.length > 0 && (
          <div className="form-group">
            <label htmlFor="userSelect">Usuario Reportante (opcional)</label>
            <select
              id="userSelect"
              value={selectedUserId}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="form-control"
            >
              <option value="">-- Otro usuario / Sin seleccionar --</option>
              {usuarios.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nombre} {user.cargo ? `(${user.cargo})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nombre manual (si no hay usuario seleccionado) */}
        {!selectedUserId && (
          <div className="form-group">
            <label htmlFor="reporterName">Nombre del Reportante</label>
            <input
              type="text"
              id="reporterName"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="form-control"
              placeholder="Tu nombre completo"
            />
          </div>
        )}

        {/* Email */}
        <div className="form-group">
          <label htmlFor="reporterEmail">Email del Reportante *</label>
          <input
            type="email"
            id="reporterEmail"
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
            className="form-control"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="description">Descripción del Problema *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control"
            rows={4}
            placeholder="Describe el problema con el activo..."
            required
          />
        </div>

        {/* Estado operacional */}
        <div className="form-group">
          <label htmlFor="operational">¿El equipo está operacional? *</label>
          <select
            id="operational"
            value={operational}
            onChange={(e) => setOperational(e.target.value as 'Sí' | 'No')}
            className="form-control"
            required
          >
            <option value="Sí">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* AnyDesk */}
        <div className="form-group">
          <label htmlFor="anydesk">Código AnyDesk *</label>
          <input
            type="text"
            id="anydesk"
            value={anydesk}
            onChange={(e) => setAnydesk(e.target.value)}
            className="form-control"
            placeholder="123456789"
            required
          />
          <small className="form-text text-muted">
            Código para acceso remoto de soporte técnico
          </small>
        </div>

        {/* Archivos adjuntos */}
        <div className="form-group">
          <label htmlFor="attachments">Archivos Adjuntos (opcional)</label>
          <input
            type="file"
            id="attachments"
            onChange={handleFileChange}
            className="form-control"
            accept="image/jpeg,image/png,video/mp4"
            multiple
          />
          <small className="form-text text-muted">
            Máximo 10 archivos. Formatos: JPG, PNG, MP4. Tamaño máximo: 10MB por archivo.
          </small>
          
          {attachments.length > 0 && (
            <ul className="file-list">
              {attachments.map((file, idx) => (
                <li key={idx}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
        </button>
      </form>
    </div>
  );
};

export default AssetReportForm;
