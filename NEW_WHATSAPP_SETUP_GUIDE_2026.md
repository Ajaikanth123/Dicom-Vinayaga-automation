# WhatsApp Business API Setup Guide - Fresh Account
## Complete Step-by-Step Process (March 2026)

---

## 📋 Overview

This guide walks you through setting up a brand new WhatsApp Business account from scratch, getting all the credentials, and creating message templates.

**What You'll Get:**
- WhatsApp Business Account
- Phone Number ID
- WhatsApp Business Account ID (WABA ID)
- Access Token (Permanent)
- Message Templates (Approved)

---

## 🚀 Step 1: Create Meta Business Account

### 1.1 Go to Meta Business Suite
1. Visit: https://business.facebook.com/
2. Click "Create Account"
3. Enter your business details:
   - Business Name: "Nice4 Diagnostics" (or your business name)
   - Your Name
   - Business Email
4. Click "Submit"

### 1.2 Verify Your Business (Optional but Recommended)
- Add business documents (GST certificate, business registration)
- This gives you higher sending limits
- Can be done later if needed

---

## 🚀 Step 2: Create WhatsApp Business App

### 2.1 Go to Meta for Developers
1. Visit: https://developers.facebook.com/
2. Click "My Apps" (top right)
3. Click "Create App"

### 2.2 Select App Type
- Choose: "Business"
- Click "Next"

### 2.3 App Details
- **Display Name**: "Nice4 Medical Referral System"
- **App Contact Email**: Your email
- **Business Account**: Select the business you created in Step 1
- Click "Create App"

### 2.4 Add WhatsApp Product
1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set Up"
3. Select your Business Account
4. Click "Continue"

---

## 🚀 Step 3: Get Your Phone Number

### 3.1 Add Phone Number
1. In WhatsApp > Getting Started
2. Click "Add Phone Number"
3. You have 2 options:

**Option A: Use Meta's Test Number (Quick Start)**
- Free test number provided by Meta
- Limited to 5 recipients
- Good for testing
- Click "Use test number"

**Option B: Add Your Own Number (Production)**
- Click "Add phone number"
- Enter your business phone number (must have WhatsApp)
- Verify via SMS/Call
- This becomes your official WhatsApp Business number

### 3.2 Note Down Phone Number ID
After adding the number:
1. Go to WhatsApp > API Setup
2. You'll see "Phone number ID" - **COPY THIS**
3. Example: `123456789012345`

---

## 🚀 Step 4: Get WhatsApp Business Account ID (WABA ID)

### 4.1 Find WABA ID
1. In your app, go to WhatsApp > Getting Started
2. Look for "WhatsApp Business Account ID"
3. **COPY THIS NUMBER**
4. Example: `123456789012345`

Alternative method:
1. Go to: https://business.facebook.com/settings/whatsapp-business-accounts
2. Click on your WhatsApp Business Account
3. The ID is in the URL: `...whatsapp-business-accounts/[WABA_ID]/`

---

## 🚀 Step 5: Generate Access Token (Permanent)

### 5.1 Create System User (Recommended for Production)
1. Go to: https://business.facebook.com/settings/system-users
2. Click "Add"
3. Enter name: "Nice4 Backend System"
4. Role: "Admin"
5. Click "Create System User"

### 5.2 Generate Token
1. Click on the system user you just created
2. Click "Generate New Token"
3. Select your app from dropdown
4. Select permissions:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
5. Token expiration: "Never" (for permanent token)
6. Click "Generate Token"
7. **COPY AND SAVE THIS TOKEN IMMEDIATELY** - You won't see it again!

Example token format:
```
EAARCyGNCBnYBO1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890
```

### 5.3 Assign Assets to System User
1. Still in System User settings
2. Click "Add Assets"
3. Select "Apps"
4. Find your app and toggle it ON
5. Select "Full Control"
6. Click "Save Changes"

---

## 🚀 Step 6: Configure Webhook (For Receiving Messages)

### 6.1 Set Webhook URL
1. In your app, go to WhatsApp > Configuration
2. Click "Edit" next to Webhook
3. Enter:
   - **Callback URL**: `https://dicom-backend-59642964164.asia-south1.run.app/whatsapp/webhook`
   - **Verify Token**: Create a random string (e.g., `nice4_webhook_secret_2026`)
4. Click "Verify and Save"

### 6.2 Subscribe to Webhook Fields
1. In Webhook Fields section
2. Subscribe to:
   - ✅ `messages` (to receive messages)
   - ✅ `message_status` (to track delivery)
3. Click "Save"

---

## 🚀 Step 7: Create Message Templates

### 7.1 Go to Message Templates
1. In your app, go to WhatsApp > Message Templates
2. Or visit: https://business.facebook.com/wa/manage/message-templates/

### 7.2 Create Template 1: Doctor Scan Notification

**Click "Create Template"**

**Template Details:**
- **Name**: `doctor_scan_notification`
- **Category**: `UTILITY`
- **Languages**: English

**Template Content:**
```
Hello Dr. {{1}},

A new scan has been uploaded for your review.

Patient: {{2}}
Study Type: {{3}}
Upload Date: {{4}}

Please log in to the portal to view the scan.

Portal: https://nice4-d7886.web.app

Thank you,
Nice4 Diagnostics Team
```

**Variables:**
1. `{{1}}` = Doctor Name
2. `{{2}}` = Patient Name
3. `{{3}}` = Study Type (e.g., "CT Scan - Head")
4. `{{4}}` = Upload Date

**Click "Submit"** - Wait for approval (usually 15 minutes to 24 hours)

---

### 7.3 Create Template 2: Report Ready Notification

**Click "Create Template"**

**Template Details:**
- **Name**: `report_ready`
- **Category**: `UTILITY`
- **Languages**: English

**Template Content:**
```
Hello Dr. {{1}},

The report for your patient is now ready.

Patient: {{2}}
Report Type: {{3}}
Date: {{4}}

You can download the report from the portal.

Portal: https://nice4-d7886.web.app

Thank you,
Nice4 Diagnostics Team
```

**Variables:**
1. `{{1}}` = Doctor Name
2. `{{2}}` = Patient Name
3. `{{3}}` = Report Type
4. `{{4}}` = Date

**Click "Submit"** - Wait for approval

---

### 7.4 Template Approval Tips

**To Get Quick Approval:**
- Use clear, professional language
- No promotional content
- No emojis in templates (can be added in actual messages)
- Include business name
- Make purpose clear
- Use UTILITY category for transactional messages

**Approval Time:**
- Usually: 15 minutes to 2 hours
- Sometimes: Up to 24 hours
- Check status in Message Templates section

---

## 🚀 Step 8: Test Your Setup

### 8.1 Send Test Message via API

Use this curl command to test (replace with your values):

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
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
            {
              "type": "text",
              "text": "Kumar"
            },
            {
              "type": "text",
              "text": "John Doe"
            },
            {
              "type": "text",
              "text": "CT Scan - Head"
            },
            {
              "type": "text",
              "text": "March 1, 2026"
            }
          ]
        }
      ]
    }
  }'
```

### 8.2 Check Message Status
- Message should arrive on WhatsApp within seconds
- Check your phone: +919080408814
- If it works, setup is complete!

---

## 📝 Step 9: Update Your Backend Configuration

### 9.1 Credentials Summary

After completing all steps, you should have:

```
WHATSAPP_ACCESS_TOKEN=EAARCyGNCBnYBO1234... (your new token)
WHATSAPP_PHONE_NUMBER_ID=123456789012345 (your new phone number ID)
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345 (your WABA ID)
WHATSAPP_VERIFY_TOKEN=nice4_webhook_secret_2026 (your webhook verify token)
```

### 9.2 Where to Update

**File**: `dicom-backend/.env`

Replace the old values with your new ones:
```env
# WhatsApp Configuration (NEW - March 2026)
WHATSAPP_ACCESS_TOKEN=YOUR_NEW_TOKEN_HERE
WHATSAPP_PHONE_NUMBER_ID=YOUR_NEW_PHONE_NUMBER_ID_HERE
WHATSAPP_BUSINESS_ACCOUNT_ID=YOUR_NEW_WABA_ID_HERE
WHATSAPP_VERIFY_TOKEN=nice4_webhook_secret_2026
```

---

## 🔍 Step 10: Verify Template Status

### 10.1 Check Template Approval
1. Go to: https://business.facebook.com/wa/manage/message-templates/
2. Look for your templates
3. Status should be:
   - ✅ **APPROVED** (green) - Ready to use
   - ⏳ **PENDING** (yellow) - Wait for approval
   - ❌ **REJECTED** (red) - Edit and resubmit

### 10.2 Template Names to Use in Code
Once approved, use these exact names:
- `doctor_scan_notification`
- `report_ready`

---

## 📊 Important Limits & Quotas

### Messaging Limits (New Account)
- **Tier 1** (Default): 1,000 unique users per 24 hours
- **Tier 2** (After 7 days): 10,000 unique users per 24 hours
- **Tier 3** (After verification): 100,000 unique users per 24 hours

### Quality Rating
- Maintain high quality to avoid restrictions
- Don't spam users
- Only send relevant messages
- Respond to user messages promptly

---

## 🛠️ Troubleshooting

### Issue: "Phone number not registered"
**Solution:**
- Make sure you added and verified the phone number in Step 3
- Wait 5-10 minutes after adding number
- Check phone number format: `91` + `10-digit number` (no spaces, no +)

### Issue: "Template not found"
**Solution:**
- Template must be APPROVED first
- Check exact template name (case-sensitive)
- Wait for approval (can take up to 24 hours)

### Issue: "Invalid access token"
**Solution:**
- Generate new token from System User
- Make sure token has correct permissions
- Token should start with `EAAR...`

### Issue: "Webhook verification failed"
**Solution:**
- Check callback URL is correct
- Verify token matches in both webhook config and backend .env
- Make sure backend is deployed and accessible

---

## 📞 Testing Checklist

Before going live, test:

- [ ] Access token works (send test message via curl)
- [ ] Phone number ID is correct
- [ ] Templates are APPROVED
- [ ] Test message received on WhatsApp
- [ ] Webhook receives delivery status
- [ ] Backend .env file updated with new credentials
- [ ] Backend redeployed with new credentials

---

## 🎯 Next Steps After Setup

1. **Update Backend .env** with all new credentials
2. **Redeploy Backend** to apply changes
3. **Test from Application** - Upload a scan and check if WhatsApp notification arrives
4. **Monitor Quality Rating** in Meta Business Suite
5. **Request Higher Tier** if you need more than 1,000 messages/day

---

## 📚 Useful Links

- **Meta Business Suite**: https://business.facebook.com/
- **Meta for Developers**: https://developers.facebook.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **Message Templates**: https://business.facebook.com/wa/manage/message-templates/
- **System Users**: https://business.facebook.com/settings/system-users
- **WhatsApp Manager**: https://business.facebook.com/wa/manage/home/

---

## 🔐 Security Best Practices

1. **Never share your Access Token** - It's like a password
2. **Use System User tokens** - Not personal user tokens
3. **Set token to never expire** - For production stability
4. **Store tokens in .env file** - Never commit to git
5. **Rotate tokens periodically** - Every 6-12 months
6. **Monitor usage** - Check for unusual activity

---

## 📝 Credentials Template

Fill this out as you go through the setup:

```
=== WhatsApp Business Credentials ===

Business Name: _______________________
App Name: _______________________
App ID: _______________________

Phone Number: +91 _______________________
Phone Number ID: _______________________

WhatsApp Business Account ID (WABA): _______________________

Access Token: 
EAAR_______________________

Verify Token (for webhook): _______________________

Template Names:
1. doctor_scan_notification - Status: [ ] Pending [ ] Approved
2. report_ready - Status: [ ] Pending [ ] Approved

Webhook URL: https://dicom-backend-59642964164.asia-south1.run.app/whatsapp/webhook

Setup Date: March ___, 2026
```

---

**Setup Time Estimate**: 30-45 minutes (excluding template approval wait time)

**Template Approval Wait**: 15 minutes to 24 hours

**Total Time to Go Live**: 1-2 hours (if templates approved quickly)

---

Good luck with your setup! Once you have all the credentials, let me know and I'll help you update the backend configuration.
