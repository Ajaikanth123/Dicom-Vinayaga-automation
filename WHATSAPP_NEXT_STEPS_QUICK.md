# WhatsApp Setup - Next Steps (Quick Guide)

You've completed:
✅ Meta Business Account created
✅ Business verified
✅ Phone number added

---

## 🔑 STEP 1: Get Your 3 API Credentials (10 minutes)

### A. Get Phone Number ID & Business Account ID

1. Go to: **https://developers.facebook.com/**
2. Click **"My Apps"** (top right)
3. Click on your app name
4. In left sidebar, click **WhatsApp** → **API Setup**
5. You'll see:

```
From
Phone number ID: 123456789012345  [Copy]
```
**→ Click Copy and save this number**

6. Scroll down slightly, you'll see:
```
WhatsApp Business Account ID: 123456789012345  [Copy]
```
**→ Click Copy and save this number**

---

### B. Generate Access Token

1. Open new tab: **https://business.facebook.com/**
2. Click **gear icon** (⚙️) top left → **Business Settings**
3. In left sidebar, find **"Users"** section
4. Click **"System Users"**
5. Click **"Add"** button (top right)
6. Fill in:
   - Name: `DICOM Notification Service`
   - Role: **Admin**
7. Click **"Create System User"**
8. Click on the user name you just created
9. Click **"Generate New Token"** button
10. In popup:
    - **App**: Select your app from dropdown
    - **Permissions**: Check these 2 boxes:
      - ☑️ `whatsapp_business_messaging`
      - ☑️ `whatsapp_business_management`
11. Click **"Generate Token"**
12. **COPY THE TOKEN IMMEDIATELY** (starts with `EAA...`)
13. Save it securely - you won't see it again!

---

### C. Save Your Credentials

Create a text file with:
```
Phone Number ID: [paste here]
Business Account ID: [paste here]
Access Token: [paste here]
```

**Keep this file secure!**

---

## 📝 STEP 2: Create Message Templates (10 minutes)

WhatsApp requires pre-approved templates.

### Template 1: Doctor Notification

1. Go to: **https://developers.facebook.com/**
2. Click **My Apps** → Your app
3. Click **WhatsApp** → **Message Templates**
4. Click **"Create Template"**
5. Fill in:
   - **Name**: `doctor_scan_notification`
   - **Category**: `UTILITY`
   - **Language**: `English`
   - **Body**:
```
Hi Dr. {{1}},

New DICOM scan uploaded for patient {{2}}.

View scan here: {{3}}

- ANBU Dental
```
6. Click **"Submit"**

### Template 2: Patient Notification

1. Click **"Create Template"** again
2. Fill in:
   - **Name**: `patient_scan_ready`
   - **Category**: `UTILITY`
   - **Language**: `English`
   - **Body**:
```
Hello {{1}},

Your DICOM scan is ready for viewing.

Access your scan: {{2}}

For questions, contact your doctor.

- ANBU Dental
```
3. Click **"Submit"**

### Wait for Approval
- **Time**: Usually 1-2 hours (max 24 hours)
- **Check**: Go to Message Templates to see status
- **Status should change**: Pending → Approved

---

## 💻 STEP 3: Add Credentials to Backend (5 minutes)

### A. Edit Environment File

1. Open file: `dicom-backend/.env`
2. Add these 3 lines at the end:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=paste_your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=paste_your_business_account_id_here
WHATSAPP_ACCESS_TOKEN=paste_your_access_token_here
```

3. Replace with your actual values (no quotes, no spaces)

**Example**:
```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...
```

4. **Save the file**

---

## 🚀 STEP 4: Deploy Backend (5 minutes)

### Run Deployment Command

Open terminal and run:

```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --platform managed --region asia-south1 --allow-unauthenticated --memory 2Gi --timeout 300
```

Wait 2-3 minutes for deployment to complete.

---

## 🧪 STEP 5: Test WhatsApp (5 minutes)

### A. Send Test Message

1. Go to: **https://nice4-d7886.web.app**
2. Login to your system
3. Click **"Create Form"**
4. Fill in patient details
5. **Important**: In doctor phone field, enter YOUR WhatsApp number with country code
   - Example: `+919876543210` (India)
   - Example: `+14155551234` (USA)
6. Upload any DICOM file (or skip)
7. Click **"Submit"**

### B. Check Your WhatsApp

1. Open WhatsApp on your phone
2. You should receive a message from your business number
3. Message should include:
   - Doctor name
   - Patient name
   - Link to viewer

### C. Verify in System

1. Go to **"Manage Forms"** or **"Branch Patients"**
2. Find the case you created
3. Look for notification status badge
4. Should show: **✅ Sent** (green)

---

## ✅ Success Checklist

- [ ] Got Phone Number ID (15 digits)
- [ ] Got Business Account ID (15 digits)
- [ ] Got Access Token (starts with EAA)
- [ ] Created 2 message templates
- [ ] Templates approved (status: Approved)
- [ ] Added credentials to `dicom-backend/.env`
- [ ] Deployed backend successfully
- [ ] Sent test message
- [ ] Received WhatsApp message
- [ ] Link in message works
- [ ] Status shows "Sent" in system

---

## 🚨 Quick Troubleshooting

### Problem: Can't find System Users
- Make sure you're in **Business Settings** (not App Dashboard)
- Look under "Users" section in left sidebar

### Problem: Templates still pending after 24 hours
- Check if they were rejected
- Edit and resubmit with more professional language

### Problem: Test message not received
- Check phone number format: must be `+919876543210` (with + and country code)
- Verify templates are approved (not pending)
- Check backend logs for errors

### Problem: Status shows "Failed"
- Verify credentials are correct in `.env`
- Check for typos in access token
- Make sure you deployed after adding credentials

---

## 📞 Where to Get Help

### Check Template Status
https://developers.facebook.com/ → My Apps → Your App → WhatsApp → Message Templates

### Check Backend Logs
https://console.cloud.google.com/run → dicom-backend → Logs

### Meta Support
https://developers.facebook.com/docs/whatsapp

---

## 🎯 Summary

**What you need to do now:**
1. Get 3 credentials (10 min)
2. Create 2 templates (10 min)
3. Wait for template approval (1-2 hours)
4. Add credentials to `.env` (2 min)
5. Deploy backend (3 min)
6. Test (5 min)

**Total active time**: ~30 minutes + waiting for template approval

Once templates are approved and you deploy, WhatsApp will work automatically for all future cases!

---

**Ready?** Start with Step 1 to get your credentials!
