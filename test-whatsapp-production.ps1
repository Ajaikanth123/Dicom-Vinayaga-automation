# Test WhatsApp notification on production backend
# This tests the WATI integration

$backendUrl = "https://dicom-backend-59642964164.asia-south1.run.app"

Write-Host "Testing WhatsApp notification on production backend..." -ForegroundColor Cyan
Write-Host "Backend URL: $backendUrl" -ForegroundColor Yellow
Write-Host ""

# Test data
$testData = @{
    doctorPhone = "919080408814"
    doctorName = "Dr. Test Kumar"
    patientName = "Test Patient"
    studyType = "CT Scan - Head"
    uploadDate = "March 4, 2026"
    caseId = "test-case-123"
} | ConvertTo-Json

Write-Host "Sending test notification..." -ForegroundColor Cyan
Write-Host "Phone: 919080408814" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$backendUrl/whatsapp/send-dicom-notification" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $testData
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    if ($_.ErrorDetails) {
        Write-Host "Details:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "Note: Make sure +919080408814 is added as a contact in WATI dashboard" -ForegroundColor Yellow
Write-Host "Or have that number message +919443365797 first to open a conversation" -ForegroundColor Yellow
