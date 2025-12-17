// EJEMPLO DE IMPLEMENTACIÓN FRONTEND
// Flujo para utilizar el nuevo sistema de códigos de activos

// ============================================
// 1. COMPONENTE: Vista de Selección de Código
// ============================================

interface AssetCodeState {
  selectedCategory: number | null;
  reservedCode: string | null;
  reservationId: number | null;
  expiresAt: Date | null;
  loading: boolean;
  error: string | null;
}

// Cuando usuario hace clic en "Generar" o "Reservar Código"
async function handleGenerateCode(empresaId: number, categoriaId: number) {
  const state = {
    loading: true,
    error: null
  };

  try {
    // Llamar endpoint para reservar código
    const response = await fetch(
      `/api/empresas/${empresaId}/activos/next-code?categoria=${categoriaId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    
    // Guardar información de reserva
    state.reservedCode = result.data.code;           // "IME-PC0001"
    state.reservationId = result.data.reservation_id; // 123
    state.expiresAt = new Date(result.data.expires_at);

    // Mostrar preview al usuario
    console.log(`✅ Código reservado: ${result.data.code}`);
    console.log(`   Expira en: ${result.data.expires_at}`);
    console.log(`   Reservation ID: ${result.data.reservation_id}`);

  } catch (error) {
    state.error = `No se pudo generar el código: ${error.message}`;
    console.error(state.error);
  } finally {
    state.loading = false;
  }

  return state;
}

// ============================================
// 2. VALIDACIÓN: Mostrar advertencia si expira
// ============================================

function showExpirationWarning(expiresAt: Date): void {
  const now = new Date();
  const timeLeft = (expiresAt.getTime() - now.getTime()) / 1000 / 60; // minutos

  if (timeLeft < 2) {
    console.warn('⚠️ ADVERTENCIA: Código expira en menos de 2 minutos');
    // Mostrar notificación al usuario
  } else if (timeLeft < 5) {
    console.warn(`⏰ Código expira en ${Math.floor(timeLeft)} minutos`);
  }
}

// ============================================
// 3. CREAR ACTIVO: Pasar código reservado
// ============================================

async function handleCreateActivo(
  empresaId: number,
  sedeId: number,
  formData: any,
  reservedCode: string,
  reservationId: number
) {
  try {
    // Payload DEBE incluir:
    // - assetId: el código reservado
    // - reservationId: el ID de la reserva
    const payload = {
      ...formData,
      categoriaId: formData.categoriaId,
      assetId: reservedCode,        // ✅ IMPORTANTE
      reservationId: reservationId, // ✅ IMPORTANTE
      fabricante: formData.fabricante,
      modelo: formData.modelo,
      serie: formData.serie,
      // ... más campos ...
    };

    const response = await fetch(
      `/api/empresas/${empresaId}/sedes/${sedeId}/inventario`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`Error al crear activo: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Activo creado:', result.data);

    // Limpiar estado
    return {
      success: true,
      activo: result.data
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// 4. FLUJO COMPLETO EN UN COMPONENTE
// ============================================

interface ActivoFormProps {
  empresaId: number;
  sedeId: number;
}

export function ActivoForm({ empresaId, sedeId }: ActivoFormProps) {
  const [code, setCode] = useState<string | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    categoriaId: null,
    fabricante: '',
    modelo: '',
    serie: ''
    // ... más campos ...
  });

  // Cuando usuario selecciona categoría y hace clic en "Generar Código"
  const handleGenerateClick = async () => {
    if (!formData.categoriaId) {
      alert('Por favor selecciona una categoría');
      return;
    }

    const state = await handleGenerateCode(empresaId, formData.categoriaId);
    
    if (state.error) {
      alert(state.error);
      return;
    }

    // Actualizar estado
    setCode(state.reservedCode);
    setReservationId(state.reservationId);
    setExpiresAt(state.expiresAt);

    // Mostrar preview
    alert(`Código generado: ${state.reservedCode}\nExpira en 15 minutos`);
  };

  // Cuando usuario hace submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !reservationId) {
      alert('Por favor genera un código primero');
      return;
    }

    // Validar que no haya expirado
    if (expiresAt && expiresAt < new Date()) {
      alert('El código ha expirado. Por favor genera uno nuevo.');
      setCode(null);
      setReservationId(null);
      return;
    }

    const result = await handleCreateActivo(
      empresaId,
      sedeId,
      formData,
      code,
      reservationId
    );

    if (result.success) {
      alert('✅ Activo creado exitosamente');
      // Limpiar formulario
      setCode(null);
      setReservationId(null);
      setExpiresAt(null);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Categoría:</label>
        <select 
          value={formData.categoriaId || ''} 
          onChange={(e) => setFormData({ ...formData, categoriaId: parseInt(e.target.value) })}
        >
          <option value="">Seleccionar</option>
          {/* opciones */}
        </select>
      </div>

      {/* Botón para generar código */}
      <button type="button" onClick={handleGenerateClick}>
        {code ? `Código: ${code} (generado)` : 'Generar Código'}
      </button>

      {/* Mostrar preview si hay código reservado */}
      {code && expiresAt && (
        <div style={{ color: 'green', marginBottom: '10px' }}>
          ✅ Tu código será: <strong>{code}</strong>
          <br />
          ⏰ Expira en: {expiresAt.toLocaleTimeString()}
        </div>
      )}

      {/* Formulario de activo */}
      <div>
        <label>Fabricante:</label>
        <input 
          type="text" 
          value={formData.fabricante}
          onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
        />
      </div>

      <div>
        <label>Modelo:</label>
        <input 
          type="text" 
          value={formData.modelo}
          onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
        />
      </div>

      <div>
        <label>Serie:</label>
        <input 
          type="text" 
          value={formData.serie}
          onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
        />
      </div>

      {/* Botón submit */}
      <button type="submit">Crear Activo</button>
    </form>
  );
}

// ============================================
// 5. CASOS ESPECIALES: FALLBACK
// ============================================

// Si usuario NO genera código (usa fallback)
async function handleCreateActivoFallback(
  empresaId: number,
  sedeId: number,
  formData: any
) {
  // Simplemente NO incluir assetId ni reservationId
  const payload = {
    ...formData,
    categoriaId: formData.categoriaId,
    // NO incluir assetId ni reservationId
    fabricante: formData.fabricante,
    // ... más campos ...
  };

  // El backend generará automáticamente un código
  const response = await fetch(
    `/api/empresas/${empresaId}/sedes/${sedeId}/inventario`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  return response.json();
}

// ============================================
// 6. CAMBIOS EN FLUJO EXISTENTE
// ============================================

// ANTES (sin reservación):
// 1. Usuario rellena formulario
// 2. Hace clic en "Crear"
// 3. Backend genera código
// ❌ Posible colisión si dos requests simultáneos

// DESPUÉS (con reservación):
// 1. Usuario selecciona categoría y hace clic en "Generar"
// 2. Backend reserva código (con lock transaccional)
// 3. Mostrar preview "Tu código será: IME-PC0001"
// 4. Usuario rellena formulario
// 5. Hace clic en "Crear"
// 6. Backend confirma reserva y crea activo
// ✅ SIN colisiones, código garantizado
