# WhatsApp API Test Commands
## For New Account Testing

---

## ⚠️ IMPORTANT: You Cannot Send "Hi" via WhatsApp Business API

WhatsApp Business API has strict rules:

### What You CAN Do:
✅ Send **approved template messages** to any number
✅ Reply with free text within 24 hours after user messages you

### What You CANNOT Do:
❌ Send simple text like "hi" to initiate conversation
❌ Send messages without approved templates
❌ Send promotional messages without user consent

---

## 🧪 Test Commands (After Templates Are Approved)

### Prerequisites:
1. Templates must be **APPROVED** first
2. You need your **Access Token**
3. Templates needed: `doctor_scan_notification` and `report_ready`

---

## Test 1: Send to +919443365797

### PowerShell Command:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ACCESS_TOKEN_HERE"
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
                    @{ type = "text"; text = "Test Patient" },
                    @{ type = "text"; text = "CT Scan - Head" },
                    @{ type = "text"; text = "March 1, 2026" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/1054890871033382/messages" -Method Post -Headers $headers -Body $body
```

### Bash/Terminal Command:
```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919443365797",
    "type": "template",
    "template": {
      "name": "doctor_scan_notification",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "Kumar"},
            {"type": "text", "text": "Test Patient"},
            {"type": "text", "text": "CT Scan - Head"},
            {"type": "text", "text": "March 1, 2026"}
          ]
        }
      ]
    }
  }'
```

---

## Test 2: Send to +919080408814

### PowerShell Command:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_ACCESS_TOKEN_HERE"
    "Content-Type" = "application/json"
}

$body = @{
    messaging_product = "whatsapp"
    to = "919080408814"
    type = "template"
    template = @{
        name = "report_ready"
        language = @{
            code = "en"
        }
        components = @(
            @{
                type = "body"
                parameters = @(
                    @{ type = "text"; text = "Kumar" },
                    @{ type = "text"; text = "Test Patient 2" },
                    @{ type = "text"; text = "Radiology Report - MRI" },
                    @{ type = "text"; text = "March 1, 2026" }
                )
            }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "https://graph.facebook.com/v18.0/1054890871033382/messages" -Method Post -Headers $headers -Body $body
```

### Bash/Terminal Command:
```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
    "type": "template",
    "template": {
      "name": "report_ready",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "Kumar"},
            {"type": "text", "text": "Test Patient 2"},
            {"type": "text", "text": "Radiology Report - MRI"},
            {"type": "text", "text": "March 1, 2026"}
          ]
        }
      ]
    }
  }'
```

---

## 📱 How to Send Free Text (Like "Hi")

### Option 1: User Messages You First
1. Have the recipient send ANY message to your WhatsApp Business number
2. Within 24 hours, you can reply with free text
3. Use this API call:

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
    "type": "text",
    "text": {
      "body": "Hi! Thanks for your message."
    }
  }'
```

### Option 2: Create a "Hello" Template
If you want to send "Hi" to initiate conversations, create a template:

**Template Name**: `hello_message`
**Category**: UTILITY
**Content**:
```
Hi! This is Nice4 Diagnostics. How can we help you today?
```

Then send it like other templates.

---

## 🔍 Expected Responses

### Success Response:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "919443365797",
      "wa_id": "919443365797"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLOTE5NDQzMzY1Nzk3FQIAERgSQzg5..."
    }
  ]
}
```

### Error Response (Template Not Approved):
```json
{
  "error": {
    "message": "(#132000) Template not found",
    "type": "OAuthException",
    "code": 132000
  }
}
```

### Error Response (Invalid Token):
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

---

## ✅ Testing Checklist

Before running tests:

- [ ] Templates are **APPROVED** (check Meta Business Suite)
- [ ] You have your **Access Token** ready
- [ ] Replace `YOUR_ACCESS_TOKEN_HERE` in commands
- [ ] Both phone numbers have WhatsApp installed
- [ ] Phone numbers are in international format (no + sign, just country code + number)

---

## 🎯 Quick Test Steps

1. **Create both templates** (follow WHATSAPP_TEMPLATE_CREATION_STEP_BY_STEP.md)
2. **Wait for approval** (15 mins to 24 hours)
3. **Copy your Access Token**
4. **Replace** `YOUR_ACCESS_TOKEN_HERE` in commands above
5. **Run Test 1** - Check +919443365797 for message
6. **Run Test 2** - Check +919080408814 for message
7. **Verify** both messages arrived

---

## 🛠️ Troubleshooting

### "Template not found" Error
- **Cause**: Template not approved yet
- **Fix**: Wait for approval, check status in Meta Business Suite

### "Invalid phone number" Error
- **Cause**: Wrong format
- **Fix**: Use format `919443365797` (no +, no spaces, no dashes)

### "Invalid access token" Error
- **Cause**: Token expired or wrong
- **Fix**: Generate new token from System User

### No message received
- **Cause**: Phone number not on WhatsApp
- **Fix**: Verify number has WhatsApp installed and active

---

## 📊 Your New Credentials

```
Phone Number ID: 1054890871033382
WABA ID: 1225949859701511
Access Token: (your permanent token)

Template 1: doctor_scan_notification (needs approval)
Template 2: report_ready (needs approval)
```

---

## 🎉 Next Steps

1. **Create templates** using the guide
2. **Wait for approval**
3. **Run these test commands**
4. **Verify messages arrive**
5. **Tell me**: "Tests successful, ready to update backend"
6. **I'll update** backend .env and redeploy

---

**Remember**: You MUST have approved templates before you can send any messages via WhatsApp Business API!
