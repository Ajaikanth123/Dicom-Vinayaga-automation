# Test scan_uploaded_d Template
# Date: March 6, 2026
# Template: scan_uploaded_d
# To: 9487823299

Write-Host "Testing scan_uploaded_d Template..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiEndpoint = "https://live-mt-server.wati.io/10104636"
$accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAwODo0MTowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.0owBj3B26sx-t3LJgGI6Sa_9yS7FQ647SUshIcRmtZM"
$fromNumber = "919488060278"
$toNumber = "919487823299"
$templateName = "scan_uploaded_d"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  API Endpoint: $apiEndpoint"
Write-Host "  From Number: +$fromNumber"
Write-Host "  To Number: +$toNumber"
Write-Host "  Template: $templateName"
Write-Host ""

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
        @{ name = "6"; value = "https://nice4-d7886.web.app/viewer/test-case-789" }
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
    Write-Host ""
    Write-Host "Expected Message:" -ForegroundColor Cyan
    Write-Host "-----------------------------------"
    Write-Host "Hello Dr. Visweswaran,"
    Write-Host ""
    Write-Host "A new scan has been uploaded and is ready for your review."
    Write-Host ""
    Write-Host "Patient Name: Rajesh Kumar"
    Write-Host "Patient ID: P12345"
    Write-Host "Study Type: CT Scan - Head"
    Write-Host "Upload Date: March 6, 2026"
    Write-Host ""
    Write-Host "View the scan here:"
    Write-Host "https://nice4-d7886.web.app/viewer/test-case-789"
    Write-Host ""
    Write-Host "Please review at your earliest convenience."
    Write-Host ""
    Write-Host "Thank you,"
    Write-Host "Nice4 Diagnostics Team"
    Write-Host "-----------------------------------"
    
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
    Write-Host "1. Check if template 'scan_uploaded_d' is APPROVED in WATI dashboard"
    Write-Host "2. Verify recipient (+$toNumber) is added as contact in WATI"
    Write-Host "3. Check if access token is still valid"
    Write-Host "4. Verify template has 6 variables: {{1}} to {{6}}"
}

Write-Host ""
Write-Host "Test completed." -ForegroundColor Cyan
