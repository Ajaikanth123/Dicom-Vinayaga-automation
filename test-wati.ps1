# WATI WhatsApp Test Script
# Send message FROM +919443365797 TO +919080408814

# WATI Credentials
$WATI_ENDPOINT = "https://live-mt-server.wati.io/10104636"
$WATI_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDQvMjAyNiAwNDozODowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.FbanpEij92EwF33GNmGsSe45Z_gkPd6xGdwGyl3M83o"

Write-Host "=========================================="
Write-Host "WATI WhatsApp Test"
Write-Host "FROM: +919443365797 (Your WATI Number)"
Write-Host "TO: +919080408814"
Write-Host "=========================================="
Write-Host ""

# Credentials are configured

$headers = @{
    "Authorization" = "Bearer $WATI_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    template_name = "doctor_scan"
    broadcast_name = "Test DICOM Notification"
    receivers = @(
        @{
            whatsappNumbers = "+919080408814"
            customParams = @(
                @{
                    name = "1"
                    value = "Dr. Kumar"
                },
                @{
                    name = "2"
                    value = "Test Patient"
                },
                @{
                    name = "3"
                    value = "CT Scan - Head"
                },
                @{
                    name = "4"
                    value = "March 4, 2026"
                },
                @{
                    name = "5"
                    value = "test-case-123"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Sending template message..." -ForegroundColor Yellow
Write-Host "Template: doctor_scan"
Write-Host "Recipient: +919080408814"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$WATI_ENDPOINT/api/v1/sendTemplateMessage" -Method Post -Headers $headers -Body $body
    
    Write-Host "=========================================="
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Message sent successfully!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)"
    Write-Host ""
    Write-Host "Check WhatsApp on +919080408814"
    Write-Host "Expected viewer link: https://nice4-d7886.web.app/viewer/test-case-123"
    Write-Host ""
    
} catch {
    Write-Host "=========================================="
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)"
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Error Details:"
        Write-Host $_.ErrorDetails.Message
        Write-Host ""
    }
    
    Write-Host "Common Issues:"
    Write-Host "1. Wrong API endpoint or token"
    Write-Host "2. Template not approved in WATI"
    Write-Host "3. Template name mismatch"
    Write-Host "4. Variable names don't match template"
    Write-Host ""
}

Write-Host "=========================================="
