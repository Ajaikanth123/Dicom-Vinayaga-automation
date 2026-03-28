# Test Meta WhatsApp Business API
# Send message from +919488060278 to 9487823299 using template "doctor_notify"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Meta WhatsApp Business API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "From: +919488060278" -ForegroundColor Yellow
Write-Host "To: 9487823299" -ForegroundColor Yellow
Write-Host "Template: doctor_notify" -ForegroundColor Yellow
Write-Host "Business ID: 1652551635938467" -ForegroundColor Yellow
Write-Host "Phone Number ID: 991779777357300" -ForegroundColor Yellow
Write-Host ""

# Configuration
$phoneNumberId = "991779777357300"
$accessToken = "EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD"
$recipientPhone = "919487823299"  # Must include country code
$templateName = "doctor_notify"

# API endpoint
$url = "https://graph.facebook.com/v21.0/$phoneNumberId/messages"

# Request body
$body = @{
    messaging_product = "whatsapp"
    to = $recipientPhone
    type = "template"
    template = @{
        name = $templateName
        language = @{
            code = "en"
        }
        components = @(
            @{
                type = "body"
                parameters = @(
                    @{
                        type = "text"
                        text = "Dr. Kumar"
                    },
                    @{
                        type = "text"
                        text = "Test Patient"
                    },
                    @{
                        type = "text"
                        text = "CT Scan"
                    },
                    @{
                        type = "text"
                        text = "March 4, 2026"
                    },
                    @{
                        type = "text"
                        text = "https://nice4-d7886.web.app/viewer/test-123"
                    }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

Write-Host "Sending WhatsApp message..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Message ID: $($response.messages[0].id)" -ForegroundColor Green
    Write-Host "Status: Message sent successfully" -ForegroundColor Green
    
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    
    if ($_.ErrorDetails) {
        Write-Host "Details:" -ForegroundColor Red
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorDetails | ConvertTo-Json -Depth 10
        Write-Host ""
        
        # Common error explanations
        if ($errorDetails.error.code -eq 131047) {
            Write-Host "⚠️  Template not found or not approved" -ForegroundColor Yellow
            Write-Host "   Check: https://business.facebook.com/wa/manage/message-templates/" -ForegroundColor Yellow
        }
        elseif ($errorDetails.error.code -eq 131026) {
            Write-Host "⚠️  Recipient phone number not registered with WhatsApp" -ForegroundColor Yellow
        }
        elseif ($errorDetails.error.code -eq 100) {
            Write-Host "⚠️  Invalid parameter or missing required field" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
