# Send WhatsApp Message
# FROM: +919443365797 (your WhatsApp Business number)
# TO: +919080408814 (recipient)

$ACCESS_TOKEN = "EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD"
$PHONE_NUMBER_ID = "1054890871033382"

Write-Host "=========================================="
Write-Host "Sending WhatsApp Message"
Write-Host "FROM: +919443365797 (Your Business Number)"
Write-Host "TO: +919080408814"
Write-Host "=========================================="
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    messaging_product = "whatsapp"
    to = "919080408814"
    type = "template"
    template = @{
        name = "doctor_scan_notification"
        language = @{
            code = "en"
        }
        components = @(
            @{
                type = "body"
                parameters = @(
                    @{ type = "text"; text = "Kumar" },
                    @{ type = "text"; text = "Test Patient" },
                    @{ type = "text"; text = "CT Scan - Head" },
                    @{ type = "text"; text = "March 4, 2026" }
                )
            },
            @{
                type = "button"
                sub_type = "url"
                index = "0"
                parameters = @(
                    @{ type = "text"; text = "test-case-123" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

Write-Host "Sending message..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID/messages" -Method Post -Headers $headers -Body $body
    
    Write-Host "=========================================="
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Message ID: $($response.messages[0].id)"
    Write-Host "Sent to: +919080408814"
    Write-Host "Viewer Link: https://nice4-d7886.web.app/viewer/test-case-123"
    Write-Host ""
    Write-Host "Check WhatsApp on +919080408814 for the message!"
    Write-Host ""
    
} catch {
    Write-Host "=========================================="
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Error Message: $($_.Exception.Message)"
    Write-Host ""
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error Details:"
        Write-Host "  Code: $($errorDetails.error.code)"
        Write-Host "  Message: $($errorDetails.error.message)"
        Write-Host "  Type: $($errorDetails.error.type)"
        Write-Host ""
    }
}

Write-Host "=========================================="
