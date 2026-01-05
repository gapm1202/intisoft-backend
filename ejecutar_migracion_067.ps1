# ============================================================================
# Script de ejecución: Migration 067 - Tabla usuarios_historial
# ============================================================================
# Propósito: Crear tabla de historial de cambios en usuarios
# Uso: .\ejecutar_migracion_067.ps1
# ============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  MIGRATION 067: Tabla usuarios_historial        " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "inticorp"
$DB_USER = "postgres"
$MIGRATION_FILE = "migrations\067_create_usuarios_historial.sql"

# Solicitar password de forma segura
Write-Host "Ingrese la contraseña de PostgreSQL:" -ForegroundColor Yellow
$SecurePassword = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
$DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Configurar variable de entorno
$env:PGPASSWORD = $DB_PASSWORD

Write-Host ""
Write-Host "📋 Verificando archivo de migración..." -ForegroundColor Cyan

if (!(Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Error: No se encuentra el archivo $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo encontrado: $MIGRATION_FILE" -ForegroundColor Green
Write-Host ""

Write-Host "🔌 Conectando a PostgreSQL..." -ForegroundColor Cyan
Write-Host "   Host: $DB_HOST" -ForegroundColor Gray
Write-Host "   Puerto: $DB_PORT" -ForegroundColor Gray
Write-Host "   Base de datos: $DB_NAME" -ForegroundColor Gray
Write-Host "   Usuario: $DB_USER" -ForegroundColor Gray
Write-Host ""

# Ejecutar migración
Write-Host "🚀 Ejecutando migración 067..." -ForegroundColor Cyan
Write-Host ""

try {
    psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -f $MIGRATION_FILE

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ ¡Migración 067 ejecutada exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "==================================================" -ForegroundColor Cyan
        Write-Host "  VERIFICACIÓN POST-MIGRACIÓN                    " -ForegroundColor Cyan
        Write-Host "==================================================" -ForegroundColor Cyan
        Write-Host ""

        # Verificar tabla creada
        Write-Host "📊 Verificando tabla usuarios_historial..." -ForegroundColor Cyan
        $verifyQuery = "SELECT COUNT(*) as total FROM information_schema.tables WHERE table_name = 'usuarios_historial';"
        $result = psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -c $verifyQuery

        if ($result -match "1") {
            Write-Host "✅ Tabla usuarios_historial creada correctamente" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No se pudo verificar la tabla" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "📌 Próximos pasos:" -ForegroundColor Cyan
        Write-Host "   1. Reiniciar el servidor backend" -ForegroundColor White
        Write-Host "   2. Probar endpoints:" -ForegroundColor White
        Write-Host "      - POST /api/empresas/:id/usuarios/:id/asignar-activo" -ForegroundColor Gray
        Write-Host "      - POST /api/empresas/:id/usuarios/:id/cambiar-activo" -ForegroundColor Gray
        Write-Host "      - GET /api/empresas/:id/usuarios/:id/historial" -ForegroundColor Gray
        Write-Host "      - PUT /api/empresas/:id/usuarios/:id (con motivo)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ ¡Implementación completa!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Error ejecutando la migración" -ForegroundColor Red
        Write-Host "   Código de salida: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error:" $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    # Limpiar password
    $env:PGPASSWORD = ""
    Remove-Variable DB_PASSWORD -ErrorAction SilentlyContinue
}
