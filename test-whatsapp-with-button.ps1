# WhatsApp Template Test - With Button for Viewer Link
# Template: doctor_scan_notification (APPROVED)
# New Account - Phone Number ID: 1054890871033382

$ACCESS_TOKEN = "EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD"
$PHONE_NUMBER_ID = "1054890871033382"

Write-Host "=========================================="
Write-Host "WhatsApp Template Test with Viewer Link"
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
                    @{ type = "text"; text = "March 4, 2026" }
                )
            },
            @{
                type = "button"
                sub_type = "url"
                index = "0"
                parameters = @(
                    @{ type = "text"; text = "test-case-001" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID/messages" -Method Post -Headers $headers -Body $body
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Message ID: $($response.messages[0].id)"
    Write-Host "Viewer Link: https://nice4-d7886.web.app/viewer/test-case-001"
    Write-Host ""
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
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
                    @{ type = "text"; text = "March 4, 2026" }
                )
            },
            @{
                type = "button"
                sub_type = "url"
                index = "0"
                parameters = @(
                    @{ type = "text"; text = "test-case-002" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/$PHONE_NUMBER_ID/messages" -Method Post -Headers $headers -Body $body2
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Message ID: $($response2.messages[0].id)"
    Write-Host "Viewer Link: https://nice4-d7886.web.app/viewer/test-case-002"
    Write-Host ""
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
    Write-Host ""
}

Write-Host "=========================================="
Write-Host "Tests Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Check both phones for WhatsApp messages:"
Write-Host "  - +919443365797 (should receive CT Scan notification)"
Write-Host "  - +919080408814 (should receive MRI Scan notification)"
Write-Host ""
Write-Host "Each message should have:"
Write-Host "  ✓ Patient details (name, study type, date)"
Write-Host "  ✓ 'View Scan' button"
Write-Host "  ✓ Clicking button opens viewer with specific case"
Write-Host ""
Write-Host "Expected URLs:"
Write-Host "  - https://nice4-d7886.web.app/viewer/test-case-001"
Write-Host "  - https://nice4-d7886.web.app/viewer/test-case-002"
Write-Host ""
