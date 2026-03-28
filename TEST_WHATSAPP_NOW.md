# Test WhatsApp - Ready to Send!

## ✅ Status: CONFIGURED

WhatsApp is now properly configured and ready to send messages!

---

## 🧪 Send Test Message

### Option 1: Using PowerShell (Windows)

```powershell
$body = @{
    phoneNumber = "+919876543210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://dicom-backend-59642964164.asia-south1.run.app/whatsapp/test" -Method Post -Body $body -ContentType "application/json"
```

**Replace `+919876543210` with YOUR WhatsApp number!**

### Option 2: Using curl (if you have it)

```bash
curl -X POST https://dicom-backend-59642964164.asia-south1.run.app/whatsapp/test \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"+919876543210\"}"
```

**Replace `+919876543210` with YOUR WhatsApp number!**

---

## 📱 Phone Number Format

**IMPORTANT**: Your phone number MUST be in this format:
- ✅ `+919876543210` (India)
- ✅ `+14155551234` (USA)
- ✅ `+447700900123` (UK)

**NOT like this:**
- ❌ `9876543210` (missing +91)
- ❌ `+91 98765 43210` (has spaces)
- ❌ `+91-9876543210` (has dashes)

---

## 🎯 What You'll Receive

Within 30 seconds, you should receive a WhatsApp message that says:

```
Hi Dr. Test Doctor,

New DICOM scan for patient Test Patient.

View scan: https://nice4-d7886.web.app/viewer/test

Service: Test Service

Report will be sent separately once available.

- ANBU Dental
```

---

## ✅ If Message Received

Great! WhatsApp is working. Now you can:
1. Test via web app (create a real form)
2. Use it in production

---

## ❌ If Message NOT Received

### Check 1: Phone Number
- Make sure it has WhatsApp installed
- Make sure it's in international format (+country code)
- Make sure there are no spaces or dashes

### Check 2: WhatsApp Number
- The number must be able to receive business messages
- Some numbers block business accounts

### Check 3: Backend Response
Look at the response from the test command. It should say:
```json
{
  "success": true,
  "message": "Test message sent successfully",
  "messageId": "wamid.xxx",
  "phone": "+919876543210"
}
```

If it says `"success": false`, check the error message.

### Check 4: Meta Dashboard
1. Go to: https://developers.facebook.com/
2. My Apps → Your App → WhatsApp → Message Templates
3. Make sure `dicom_scan_notification` is "Active"

---

## 🔍 Check Backend Logs

To see what happened:

1. Go to: https://console.cloud.google.com/run
2. Click "dicom-backend"
3. Click "Logs" tab
4. Look for lines with `[WhatsApp]`

You should see:
```
[WhatsApp] Sending template "dicom_scan_notification" to +91...
[WhatsApp] Message sent successfully. ID: wamid.xxx
```

Or error messages if something failed.

---

## 📞 Your Turn!

**Tell me your WhatsApp number** (in +country code format) and I'll help you test it!

Or run one of the commands above with your number.

---

*WhatsApp is configured and ready - just need to test with your number!*
