# Simple WATI Test - No Parameters

$WATI_ENDPOINT = "https://live-mt-server.wati.io/10104636"
$WATI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDQvMjAyNiAwNDozODowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.FbanpEij92EwF33GNmGsSe45Z_gkPd6xGdwGyl3M83o"

Write-Host "Testing WATI API - Simple Template Send"
Write-Host "=========================================="
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $WATI_TOKEN"
    "Content-Type" = "application/json"
}

# Test 1: Send with minimal body
Write-Host "Test 1: Minimal body with template name only"
$body1 = @{
    template_name = "doctor_scan"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$WATI_ENDPOINT/api/v1/sendTemplateMessages?whatsappNumber=919080408814" -Method Post -Headers $headers -Body $body1
    Write-Host "✅ Response:" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "=========================================="
Write-Host ""

# Test 2: List available templates
Write-Host "Test 2: Get list of templates"
try {
    $templates = Invoke-RestMethod -Uri "$WATI_ENDPOINT/api/v1/getMessageTemplates" -Method Get -Headers $headers
    Write-Host "✅ Templates:" -ForegroundColor Green
    Write-Host ($templates | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "=========================================="
