# WATI Integration Troubleshooting

## Current Status

✅ API authentication works (Bearer token accepted)  
✅ Template name is correct (`doctor_scan`)  
✅ Parameters are numbered correctly (`{{1}}`, `{{2}}`, etc.)  
❌ Getting error: "There are no valid Receivers"

---

## The Problem

WATI API returns:
```json
{
  "result": false,
  "errors": {
    "error": "There are no valid Receivers",
    "invalidWhatsappNumbers": [],
    "invalidCustomParameters": []
  }
}
```

This means the phone number format or contact setup is the issue.

---

## Things to Check in WATI Dashboard

### 1. Check if Contacts Need to be Added First

1. Login to https://app.wati.io/
2. Go to **"Contacts"** section
3. Check if +919080408814 is in your contacts
4. If not, try adding it manually:
   - Click "Add Contact"
   - Phone: +919080408814
   - Name: Test Contact
   - Save

### 2. Check Template Status

1. Go to **"Templates"** section
2. Find template: `doctor_scan`
3. Verify:
   - Status: APPROVED ✅
   - Variables: `{{1}}`, `{{2}}`, `{{3}}`, `{{4}}`, `{{5}}`
   - Language: English

### 3. Try Sending Manually First

1. In WATI dashboard, go to **"Broadcast"** or **"Send Message"**
2. Try sending the `doctor_scan` template to +919080408814 manually
3. Note what phone number format WATI uses
4. Check if it works

### 4. Check API Documentation

1. In WATI dashboard, go to **"API Docs"** or **"Settings" > "API"**
2. Look for example of `sendTemplateMessages` endpoint
3. Check the exact format they show

---

## Alternative: Use WATI's Contact-Based API

Some WATI accounts require contacts to be added first. Try this:

### Step 1: Add Contact via API

```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    name = "Test Contact"
    phone = "+919080408814"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://live-mt-server.wati.io/10104636/api/v1/addContact" -Method Post -Headers $headers -Body $body
```

### Step 2: Then Send Template

After contact is added, try sending the template again.

---

## Alternative Endpoints to Try

### Option 1: sendSessionMessage (for active conversations)

```powershell
$url = "$WATI_ENDPOINT/api/v1/sendSessionMessage/919080408814"
$body = @{
    messageText = "Hello, this is a test message"
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
```

**Note:** This only works if there's an active conversation (within 24 hours of last message from user).

### Option 2: sendTemplateMessage (singular, not plural)

```powershell
$url = "$WATI_ENDPOINT/api/v1/sendTemplateMessage/919080408814"
$body = @{
    template_name = "doctor_scan"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" },
        @{ name = "2"; value = "Test Patient" },
        @{ name = "3"; value = "CT Scan" },
        @{ name = "4"; value = "March 4, 2026" },
        @{ name = "5"; value = "https://nice4-d7886.web.app/viewer/test-123" }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
```

---

## Phone Number Format Variations to Try

1. **With + prefix**: `+919080408814`
2. **Without + prefix**: `919080408814`
3. **With country code separated**: `91-9080408814`
4. **With spaces**: `91 9080408814`
5. **Just 10 digits**: `9080408814` (if WATI adds country code automatically)

---

## Quick Test Script

Save as `test-wati-formats.ps1`:

```powershell
$WATI_ENDPOINT = "https://live-mt-server.wati.io/10104636"
$WATI_TOKEN = "YOUR_TOKEN"

$headers = @{
    "Authorization" = "Bearer $WATI_TOKEN"
    "Content-Type" = "application/json"
}

# Try different phone formats
$phoneFormats = @(
    "+919080408814",
    "919080408814",
    "91-9080408814",
    "91 9080408814",
    "9080408814"
)

foreach ($phone in $phoneFormats) {
    Write-Host "Testing format: $phone"
    
    $body = @{
        template_name = "doctor_scan"
        parameters = @(
            @{ name = "1"; value = "Test" },
            @{ name = "2"; value = "Patient" },
            @{ name = "3"; value = "CT Scan" },
            @{ name = "4"; value = "Today" },
            @{ name = "5"; value = "test-123" }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$WATI_ENDPOINT/api/v1/sendTemplateMessages?whatsappNumber=$phone" -Method Post -Headers $headers -Body $body
        Write-Host "✅ SUCCESS with format: $phone" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json)
        break
    } catch {
        Write-Host "❌ Failed with format: $phone" -ForegroundColor Red
    }
    
    Write-Host ""
}
```

---

## Contact WATI Support

If none of the above works, contact WATI support:

1. Email: support@wati.io
2. Or use in-app chat in WATI dashboard
3. Ask them:
   - "What is the correct API format for sendTemplateMessages?"
   - "Do I need to add contacts before sending templates?"
   - "What phone number format should I use?"

---

## What We Know Works

✅ Your WATI credentials are correct  
✅ API authentication works  
✅ Template name `doctor_scan` exists  
✅ Numbered parameters `{{1}}` to `{{5}}` format is correct  

## What Doesn't Work Yet

❌ Phone number format or contact requirement

---

## Next Steps

1. Check WATI dashboard for contacts
2. Try adding +919080408814 as a contact manually
3. Try sending template manually through WATI dashboard
4. Check WATI API documentation for exact format
5. If still stuck, contact WATI support

---

*Once we figure out the correct format, I'll update the backend service and we can deploy!*

