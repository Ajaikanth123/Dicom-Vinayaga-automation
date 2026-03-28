# Test Scan Uploaded Template
# Date: March 6, 2026
# Template: scan_uploaded (or the name you created in WATI)
# To: 9487823299

Write-Host "Testing Scan Uploaded Template..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiEndpoint = "https://live-mt-server.wati.io/10104636"
$accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAwODo0MTowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.0owBj3B26sx-t3LJgGI6Sa_9yS7FQ647SUshIcRmtZM"
$fromNumber = "919488060278"
$toNumber = "919487823299"

# Try different possible template names
$templateNames = @("scan_uploaded", "doctor_notify", "scan_notify")

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  API Endpoint: $apiEndpoint"
Write-Host "  From Number: +$fromNumber"
Write-Host "  To Number: +$toNumber"
Write-Host ""

foreach ($templateName in $templateNames) {
    Write-Host "Trying template: $templateName" -ForegroundColor Cyan
    
    # Prepare the request body
    $body = @{
        template_name = $templateName
        broadcast_name = "Scan Upload Notification"
        parameters = @(
            @{ name = "1"; value = "Dr. Visweswaran" }
            @{ name = "2"; value = "Rajesh Kumar" }
            @{ name = "3"; value = "P12345" }
            @{ name = "4"; value = "CT Scan - Head" }
            @{ name = "5"; value = "March 6, 2026" }
            @{ name = "6"; value = "https://nice4-d7886.web.app/viewer/test-case-456" }
        )
    } | ConvertTo-Json -Depth 10

    # Prepare headers
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }

    # Build URL with phone number as query parameter
    $url = "$apiEndpoint/api/v1/sendTemplateMessage?whatsappNumber=$toNumber"

    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
        
        Write-Host "✅ SUCCESS with template: $templateName" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host ($response | ConvertTo-Json -Depth 10)
        Write-Host ""
        Write-Host "Message sent to +$toNumber" -ForegroundColor Green
        Write-Host "Check WhatsApp on that number for the message!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Template used: $templateName" -ForegroundColor Cyan
        break
        
    } catch {
        Write-Host "❌ Failed with template: $templateName" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Error: $responseBody" -ForegroundColor Yellow
        }
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan
Write-Host ""
Write-Host "If all templates failed, please provide the exact template name you created in WATI." -ForegroundColor Yellow
