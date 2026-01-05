$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTc2NzU2NzM1MSwiZXhwIjoxNzY4MTcyMTUxfQ.LrikhNdgdAsLCfnSsKj5ufwp3DJvk-sr0nFcyXyefwQ'

Write-Host "Creating second usuario with activo 61..."
try {
    $result = Invoke-RestMethod `
        -Uri 'http://localhost:4000/api/empresas/86/usuarios' `
        -Method POST `
        -Headers @{
            'Authorization' = "Bearer $token"
            'Content-Type' = 'application/json'
        } `
        -Body '{"empresaId":"86","sedeId":"35","nombreCompleto":"Usuario2 Compartido","correo":"u2shared@test.co","cargo":"Tester","activoAsignadoId":"61"}'
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Usuario ID: $($result.data.id)"
    Write-Host "Activo Asignado: $($result.data.activoAsignadoId)"
    Write-Host "Cantidad Activos: $($result.data.cantidadActivosAsignados)"
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.ErrorDetails.Message)"
}
