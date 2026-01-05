# Test script for asignar-activo endpoint

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTczNzQ3MjkxNiwiZXhwIjoxNzM4MDc3NzE2fQ.SshDs8del2XCgmJVgVp6xkWfCdMNBnc5HWaMzrQlno4"

$body = @{
    activoId = "58"
    fechaAsignacion = "2026-01-04"
    motivo = "gdfdfdfdfdfdf"
    observacion = "gg"
} | ConvertTo-Json

try {
    Write-Host "Testing endpoint: POST /api/empresas/86/usuarios/11/asignar-activo" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod `
        -Uri "http://localhost:4000/api/empresas/86/usuarios/11/asignar-activo" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "`nSuccess!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
}
