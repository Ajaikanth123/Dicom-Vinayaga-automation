# WhatsApp Template Test Script
# Template: doctor_scan_notification (APPROVED)
# Phone Number ID: 1054890871033382

# REPLACE THIS WITH YOUR ACTUAL ACCESS TOKEN
$ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"
$PHONE_NUMBER_ID = "1054890871033382"

Write-Host "=========================================="
Write-Host "WhatsApp Template Test"
Write-Host "Template: doctor_scan_notification"
Write-Host "=========================================="
Write-Host ""

# Test 1: Send to +919443365797
Write-Host "Test 1: Sending to +919443365797"
Write-Host "------------------------------------------"

$headers = @{
    "Authorization" = "Bearer $ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    messaging_product = "whatsapp"
    to = "919443365797"
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
                    @{ type = "text"; text = "Test Patient 1" },
                    @{ type = "text"; text = "CT Scan - Head" },
                    @{ type = "text"; text = "March 1, 2026" },
                    @{ type = "text"; text = "https://nice4-d7886.web.app/viewer/test-case-001" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID/messages" -Method Post -Headers $headers -Body $body
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Message ID: $($response.messages[0].id)"
    Write-Host ""
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
}

Start-Sleep -Seconds 2

# Test 2: Send to +919080408814
Write-Host "Test 2: Sending to +919080408814"
Write-Host "------------------------------------------"

$body2 = @{
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
                    @{ type = "text"; text = "Test Patient 2" },
                    @{ type = "text"; text = "MRI Scan - Brain" },
                    @{ type = "text"; text = "March 1, 2026" },
                    @{ type = "text"; text = "https://nice4-d7886.web.app/viewer/test-case-002" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID/messages" -Method Post -Headers $headers -Body $body2
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Message ID: $($response2.messages[0].id)"
    Write-Host ""
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
}

Write-Host "=========================================="
Write-Host "Tests Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Check both phones for WhatsApp messages:"
Write-Host "  - +919443365797"
Write-Host "  - +919080408814"
Write-Host ""
Write-Host "Each message should have a clickable link to the viewer."
Write-Host ""
