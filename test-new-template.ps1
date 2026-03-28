# Test New WATI Template
# Date: March 6, 2026
# From: 9488060278
# To: 9487823299

Write-Host "Testing New WATI Template..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiEndpoint = "https://live-mt-server.wati.io/10104636"
$accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAwODo0MTowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.0owBj3B26sx-t3LJgGI6Sa_9yS7FQ647SUshIcRmtZM"
$fromNumber = "919488060278"
$toNumber = "919487823299"
$templateName = "doctor_notify"  # Update this if you created a new template name

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  API Endpoint: $apiEndpoint"
Write-Host "  From Number: +$fromNumber"
Write-Host "  To Number: +$toNumber"
Write-Host "  Template: $templateName"
Write-Host ""

# Prepare the request body
$body = @{
    template_name = $templateName
    broadcast_name = "DICOM Upload Test"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" }
        @{ name = "2"; value = "Test Patient" }
        @{ name = "3"; value = "CT Scan - Head" }
        @{ name = "4"; value = "March 6, 2026" }
        @{ name = "5"; value = "https://nice4-d7886.web.app/viewer/test-case-123" }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body
Write-Host ""

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# Build URL with phone number as query parameter
$url = "$apiEndpoint/api/v1/sendTemplateMessage?whatsappNumber=$toNumber"

Write-Host "Sending request to WATI..." -ForegroundColor Cyan
Write-Host "URL: $url"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "Message sent to +$toNumber" -ForegroundColor Green
    Write-Host "Check WhatsApp on that number for the message!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure the recipient (+$toNumber) is added as a contact in WATI dashboard"
    Write-Host "2. Verify the template '$templateName' is APPROVED in WATI"
    Write-Host "3. Check if the access token is still valid"
    Write-Host "4. Ensure the phone number format is correct (919487823299)"
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan
