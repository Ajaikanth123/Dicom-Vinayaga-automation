# Get New Access Token for WhatsApp Business Account
## Error: "You do not have the necessary permissions"

---

## 🔴 Problem

The current access token doesn't have permission to send messages on behalf of your new WhatsApp Business Account (WABA ID: 1225949859701511).

**Error Message:**
```
(#200) You do not have the necessary permissions to send messages 
on behalf of this WhatsApp Business Account
```

---

## ✅ Solution: Generate New Access Token

### Step 1: Go to Meta Business Suite

1. Open: https://business.facebook.com/settings/whatsapp-business-accounts
2. Click on your WhatsApp Business Account: **1225949859701511**

### Step 2: Go to System Users

1. In left sidebar, click **"System users"**
2. Or go directly: https://business.facebook.com/settings/system-users

### Step 3: Create or Select System User

**Option A: Create New System User**
1. Click **"Add"** button
2. Name: `Nice4 DICOM System`
3. Role: **Admin**
4. Click **"Create System User"**

**Option B: Use Existing System User**
1. Find your existing system user
2. Click on it to open

### Step 4: Generate Access Token

1. Click **"Generate New Token"** button
2. Select your App (or create one if needed)
3. **Select Permissions:**
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
4. Token Expiration: **Never** (or 60 days if you prefer)
5. Click **"Generate Token"**
6. **COPY THE TOKEN** - You won't see it again!

### Step 5: Assign Assets to System User

1. Click **"Add Assets"** button
2. Select **"WhatsApp Accounts"**
3. Find your WABA: **1225949859701511**
4. Toggle **"Full Control"** ON
5. Click **"Save Changes"**

---

## 🔧 Alternative Method: Use App Access Token

### Step 1: Go to Meta for Developers

1. Open: https://developers.facebook.com/apps
2. Select your app (or create new one)

### Step 2: Add WhatsApp Product

1. In left sidebar, click **"Add Product"**
2. Find **"WhatsApp"** and click **"Set Up"**

### Step 3: Get Access Token

1. Go to **WhatsApp > Getting Started**
2. You'll see **"Temporary access token"** section
3. Click **"Generate Token"**
4. Copy the token

**Note:** This is temporary (24 hours). For permanent token, use System User method above.

### Step 4: Make Token Permanent

1. Go to **WhatsApp > Configuration**
2. Click **"Generate Permanent Token"**
3. Select permissions:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
4. Copy the permanent token

---

## 🧪 Test New Token

### Update .env file:

```bash
WHATSAPP_ACCESS_TOKEN=YOUR_NEW_TOKEN_HERE
```

### Test with curl:

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_NEW_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
    "type": "template",
    "template": {
      "name": "doctor_scan_notification",
      "language": {"code": "en"},
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "Kumar"},
            {"type": "text", "text": "Test Patient"},
            {"type": "text", "text": "CT Scan"},
            {"type": "text", "text": "March 4, 2026"}
          ]
        },
        {
          "type": "button",
          "sub_type": "url",
          "index": "0",
          "parameters": [
            {"type": "text", "text": "test-123"}
          ]
        }
      ]
    }
  }'
```

---

## 📋 Quick Checklist

- [ ] Go to Meta Business Suite
- [ ] Create/Select System User
- [ ] Generate Access Token with correct permissions
- [ ] Assign WhatsApp Account to System User
- [ ] Copy the new token
- [ ] Update `dicom-backend/.env` with new token
- [ ] Test with curl command
- [ ] Verify message arrives on WhatsApp

---

## 🔍 Verify Your Setup

### Check Phone Number ID:

```bash
curl -X GET \
  'https://graph.facebook.com/v18.0/1225949859701511/phone_numbers' \
  -H 'Authorization: Bearer YOUR_NEW_TOKEN_HERE'
```

**Expected Response:**
```json
{
  "data": [
    {
      "verified_name": "Nice4 Diagnostics",
      "display_phone_number": "+91 94433 65797",
      "id": "1054890871033382",
      "quality_rating": "GREEN"
    }
  ]
}
```

### Check Template Status:

```bash
curl -X GET \
  'https://graph.facebook.com/v18.0/1225949859701511/message_templates?fields=name,status,components' \
  -H 'Authorization: Bearer YOUR_NEW_TOKEN_HERE'
```

**Expected Response:**
```json
{
  "data": [
    {
      "name": "doctor_scan_notification",
      "status": "APPROVED",
      "components": [...]
    }
  ]
}
```

---

## 🎯 Common Issues

### Issue 1: "Invalid OAuth access token"
**Solution:** Token is expired or incorrect. Generate new token.

### Issue 2: "Permissions error"
**Solution:** System User doesn't have WhatsApp Account assigned. Go to System Users > Add Assets > WhatsApp Accounts.

### Issue 3: "Phone number not found"
**Solution:** Phone Number ID is incorrect. Verify with the GET request above.

### Issue 4: "Template not found"
**Solution:** Template not approved yet, or wrong WABA ID. Check template status.

---

## 📝 Important Notes

1. **System User Token** = Permanent (recommended for production)
2. **App Token** = Can expire (need to refresh)
3. **Temporary Token** = 24 hours only (for testing)

4. **Required Permissions:**
   - `whatsapp_business_management` - Manage WhatsApp Business Account
   - `whatsapp_business_messaging` - Send messages

5. **Token Security:**
   - Never commit tokens to Git
   - Store in `.env` file
   - Use environment variables in production
   - Rotate tokens periodically

---

## 🚀 After Getting New Token

1. Update `dicom-backend/.env`:
   ```
   WHATSAPP_ACCESS_TOKEN=YOUR_NEW_PERMANENT_TOKEN
   ```

2. Test locally:
   ```powershell
   .\send-whatsapp-test.ps1
   ```

3. Deploy backend:
   ```bash
   cd dicom-backend
   gcloud run deploy dicom-backend --source . --region asia-south1 --project nice4-d7886 --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 3600
   ```

4. Test from application

---

## 📞 Need Help?

If you're still having issues:

1. Verify WABA ID: **1225949859701511**
2. Verify Phone Number ID: **1054890871033382**
3. Verify Phone Number: **+919443365797**
4. Check System User has "Full Control" on WhatsApp Account
5. Check token has both required permissions
6. Try generating a fresh token

---

*The old token was for the old account (WABA: 908777428672260). You need a new token for the new account (WABA: 1225949859701511).*

