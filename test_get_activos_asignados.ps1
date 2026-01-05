$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ'

Write-Host "Testing GET /api/empresas/86/usuarios/23..."
try {
    $resp = Invoke-RestMethod `
        -Uri 'http://localhost:4000/api/empresas/86/usuarios/23' `
        -Method GET `
        -Headers @{'Authorization' = "Bearer $token"}
    
    Write-Host "`n✅ SUCCESS" -ForegroundColor Green
    Write-Host "Usuario ID: $($resp.data.id)"
    Write-Host "Nombre: $($resp.data.nombreCompleto)"
    Write-Host "Cantidad Activos: $($resp.data.cantidadActivosAsignados)"
    Write-Host "`n📦 activosAsignados:"
    
    if ($resp.data.activosAsignados -and $resp.data.activosAsignados.Length -gt 0) {
        $resp.data.activosAsignados | ForEach-Object {
            Write-Host "  - ID: $($_.id) | Código: $($_.codigo) | Categoría: $($_.categoria)"
        }
    } else {
        Write-Host "  ⚠️ Array vacío" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ FAILED" -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message
}
