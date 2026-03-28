# WhatsApp Final Setup - Complete Your Configuration

## ✅ Your Credentials (All Collected!)

```
Phone Number ID: 1042402002281075
Business Account ID: 908777428672260
Access Token: EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD
```

---

## 📝 STEP 1: Create Message Templates (10 minutes)

Before we can send messages, WhatsApp requires approved templates.

### A. Go to Message Templates
1. Open: **https://developers.facebook.com/**
2. Click **My Apps** → Your app
3. Click **WhatsApp** → **Message Templates**
4. Click **"Create Template"** button

### B. Create Template 1: Doctor Notification
1. **Template Name**: `doctor_scan_notification`
2. **Category**: Select **UTILITY**
3. **Language**: Select **English**
4. **Header**: Leave empty (or add your logo)
5. **Body**: Copy and paste this exactly:
```
Hi Dr. {{1}},

New DICOM scan uploaded for patient {{2}}.

View scan here: {{3}}

- ANBU Dental
```
6. **Footer** (optional): `Reply STOP to unsubscribe`
7. **Buttons**: Leave empty
8. Click **"Submit"**

### C. Create Template 2: Patient Notification
1. Click **"Create Template"** again
2. **Template Name**: `patient_scan_ready`
3. **Category**: Select **UTILITY**
4. **Language**: Select **English**
5. **Body**: Copy and paste this exactly:
```
Hello {{1}},

Your DICOM scan is ready for viewing.

Access your scan: {{2}}

For questions, contact your doctor.

- ANBU Dental
```
6. Click **"Submit"**

### D. Wait for Approval
- **Timeline**: Usually 1-2 hours (can be up to 24 hours)
- **Check Status**: Go back to Message Templates page
- **Status**: Should change from "Pending" to "Approved"
- **Email**: You'll receive approval notification

**⏳ While waiting for approval, continue to Step 2**

---

## 💻 STEP 2: Add Credentials to Backend (2 minutes)

### A. Open Backend Environment File
Navigate to: `dicom-backend/.env`

### B. Add WhatsApp Configuration
Add these 3 lines at the END of the file:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=1042402002281075
WHATSAPP_BUSINESS_ACCOUNT_ID=908777428672260
WHATSAPP_ACCESS_TOKEN=EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD
```

### C. Save the File
Make sure to save the file after adding the lines.

**⚠️ Important Notes:**
- No quotes around values
- No spaces before or after `=`
- Token should be on one line (no line breaks)

---

## 🚀 STEP 3: Deploy Backend (3 minutes)

### A. Open Terminal/Command Prompt

### B. Navigate to Backend Folder
```bash
cd dicom-backend
```

### C. Deploy to Google Cloud Run
```bash
gcloud run deploy dicom-backend --source . --platform managed --region asia-south1 --allow-unauthenticated --memory 2Gi --timeout 300
```

### D. Wait for Deployment
- Takes 2-3 minutes
- You'll see build progress
- Success message: "Service URL: https://dicom-backend-59642964164.asia-south1.run.app"

---

## ⏳ STEP 4: Wait for Template Approval

Before testing, make sure your templates are approved:

1. Go to: **https://developers.facebook.com/**
2. My Apps → Your App → WhatsApp → Message Templates
3. Check status of both templates:
   - `doctor_scan_notification` → Should show "Approved"
   - `patient_scan_ready` → Should show "Approved"

**If still "Pending"**: Wait a bit longer (usually 1-2 hours)
**If "Rejected"**: Edit the template to be more professional and resubmit

---

## 🧪 STEP 5: Test WhatsApp Notifications (5 minutes)

### A. Prepare Test
1. Make sure templates are APPROVED (see Step 4)
2. Have your WhatsApp phone number ready (with country code)
   - Example: `+919876543210` (India)
   - Example: `+14155551234` (USA)

### B. Create Test Case
1. Go to: **https://nice4-d7886.web.app**
2. Login to your system
3. Click **"Create Form"**
4. Fill in patient details:
   - Patient Name: Test Patient
   - Any other required fields
5. **Important**: In the doctor phone field, enter YOUR WhatsApp number
   - Format: `+919876543210` (must include + and country code)
6. Upload a DICOM file (or skip if optional)
7. Click **"Submit"**

### C. Check Your WhatsApp
1. Open WhatsApp on your phone
2. Within 10-30 seconds, you should receive a message
3. Message should include:
   - Greeting with doctor name
   - Patient name
   - Link to DICOM viewer
   - Your clinic name

### D. Verify Link Works
1. Click the link in the WhatsApp message
2. Should open the DICOM viewer in browser
3. Should show the case details

### E. Check System Status
1. In your web app, go to **"Manage Forms"** or **"Branch Patients"**
2. Find the case you just created
3. Look for notification status badge
4. Should show: **✅ Sent** (green badge)

---

## ✅ Success Checklist

- [ ] Created 2 message templates
- [ ] Both templates approved (status: Approved)
- [ ] Added 3 credentials to `dicom-backend/.env`
- [ ] Deployed backend successfully
- [ ] Sent test message with your WhatsApp number
- [ ] Received WhatsApp message on your phone
- [ ] Message includes correct details
- [ ] Link in message works
- [ ] System shows "Sent" status (green badge)

---

## 🎉 You're Done!

Once all checklist items are complete, WhatsApp automation is fully working!

From now on, every time someone creates a form with a doctor's WhatsApp number, the system will automatically send a notification.

---

## 🚨 Troubleshooting

### Problem: Test message not received

**Check 1: Templates Approved?**
- Go to Message Templates page
- Both must show "Approved" (not "Pending" or "Rejected")

**Check 2: Phone Number Format**
- Must include country code: `+919876543210`
- Must start with `+`
- No spaces or dashes
- Example: ✅ `+919876543210` ❌ `9876543210`

**Check 3: Backend Deployed?**
- Make sure you ran the deploy command
- Check it completed successfully

**Check 4: Credentials Correct?**
- Open `dicom-backend/.env`
- Verify all 3 values are correct
- No typos in the token

### Problem: Status shows "Failed" (red badge)

**Solution:**
1. Go to Google Cloud Console: https://console.cloud.google.com/run
2. Click **dicom-backend**
3. Click **Logs** tab
4. Look for WhatsApp errors
5. Common issues:
   - Invalid phone number format
   - Template not approved
   - Token expired or invalid

### Problem: Templates rejected

**Common reasons:**
- Too promotional language
- Too many emojis
- Spelling errors
- Not professional enough

**Solution:**
1. Edit template to be more professional
2. Keep it informative, not promotional
3. Use proper grammar
4. Resubmit for approval

---

## 📊 Monitor Usage

### Check Message Delivery
- In your app: Look at notification badges (green = sent, red = failed)
- In Meta: Business Settings → WhatsApp → Analytics

### Monthly Limits
- First 1,000 conversations: FREE
- After that: ~₹0.40 per conversation (India)
- Your expected usage: ~200/month (well within free tier)

### Token Renewal
- Access token expires after 60 days
- You'll need to generate a new token
- Update `.env` and redeploy

---

## 📞 Support

### Check Template Status
https://developers.facebook.com/ → My Apps → Your App → WhatsApp → Message Templates

### Check Backend Logs
https://console.cloud.google.com/run → dicom-backend → Logs

### Meta Documentation
https://developers.facebook.com/docs/whatsapp

---

## 🎯 Next Steps After Setup

Once WhatsApp is working:

1. **Test with real cases** - Create actual patient referrals
2. **Train staff** - Show them how to enter phone numbers correctly
3. **Monitor delivery** - Check for failed messages daily
4. **Set reminders** - Token renewal in 60 days
5. **Scale up** - Use for all branches

---

**Questions?** Check the troubleshooting section or refer to the detailed guides:
- `WHATSAPP_SETUP_GUIDE.md` - Complete setup guide
- `WHATSAPP_API_CREDENTIALS_GUIDE.md` - Credential details
- `WHATSAPP_AUTOMATION_SETUP_INSTRUCTIONS.md` - Full instructions

---

*Last Updated: February 2026*
*Your credentials are configured and ready to use!*
