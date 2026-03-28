# WATI WhatsApp Test - Correct Format

$WATI_ENDPOINT = "https://live-mt-server.wati.io/10104636"
$WATI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDQvMjAyNiAwNDozODowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.FbanpEij92EwF33GNmGsSe45Z_gkPd6xGdwGyl3M83o"

Write-Host "=========================================="
Write-Host "WATI WhatsApp Test"
Write-Host "FROM: +919443365797"
Write-Host "TO: +919443365797 (Your own number)"
Write-Host "=========================================="
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $WATI_TOKEN"
    "Content-Type" = "application/json"
}

# WATI Format: Use query parameter for phone number
$phoneNumber = "919443365797"
$templateName = "doctor_scan"

$body = @{
    template_name = $templateName
    broadcast_name = "DICOM Notification"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" },
        @{ name = "2"; value = "Test Patient" },
        @{ name = "3"; value = "CT Scan - Head" },
        @{ name = "4"; value = "March 4, 2026" },
        @{ name = "5"; value = "https://nice4-d7886.web.app/viewer/test-case-123" }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Sending message..." -ForegroundColor Yellow
Write-Host "Template: $templateName"
Write-Host "Phone: +$phoneNumber"
Write-Host ""

try {
    # WATI API endpoint with phone number as query parameter
    $url = "$WATI_ENDPOINT/api/v1/sendTemplateMessages?whatsappNumber=$phoneNumber"
    
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    
    Write-Host "=========================================="
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Response:"
    Write-Host ($response | ConvertTo-Json -Depth 5)
    Write-Host ""
    Write-Host "Check WhatsApp on +919443365797 (your phone)!"
    Write-Host ""
    
} catch {
    Write-Host "=========================================="
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:"
        Write-Host $_.ErrorDetails.Message
        Write-Host ""
    }
}

Write-Host "=========================================="
