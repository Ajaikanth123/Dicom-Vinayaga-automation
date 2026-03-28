# WhatsApp Automation Setup Instructions
## Step-by-Step Guide to Enable WhatsApp Notifications

---

## 📋 Overview

Your system is already built with WhatsApp integration code. You just need to:
1. Get WhatsApp Business API credentials from Meta
2. Add credentials to your backend configuration
3. Redeploy the backend
4. Test the notifications

**Time Required**: 3-4 days (mostly waiting for Meta approval)  
**Cost**: FREE for first 1,000 messages/month

---

## 🎯 What You'll Achieve

Once setup is complete, your system will automatically:
- ✅ Send WhatsApp messages when new DICOM files are uploaded
- ✅ Include patient name and case details
- ✅ Provide direct link to DICOM viewer
- ✅ Track delivery status (sent/failed)
- ✅ Show sender information

---

## 📱 STEP 1: Create Meta Business Account (30 minutes)

### 1.1 Go to Meta Business Suite
1. Open browser: **https://business.facebook.com/**
2. Click **"Create Account"**
3. Enter business details:
   - Business name: Your clinic name (e.g., "ANBU Dental")
   - Your name: Your full name
   - Business email: Your business email
4. Click **"Create"**

### 1.2 Verify Email
1. Check your email inbox
2. Click verification link from Facebook
3. Return to Meta Business Suite

### 1.3 Complete Business Profile
1. Click **Business Settings** (gear icon ⚙️)
2. Click **Business Info**
3. Fill in:
   - Legal business name
   - Business address
   - Business phone number
   - Business website (optional)
4. Click **Save**

**✅ Checkpoint**: Meta Business Account created

---

## 🏢 STEP 2: Verify Your Business (1-2 days wait)

### 2.1 Start Verification
1. In Business Settings, click **Security Center**
2. Click **Start Verification**

### 2.2 Upload Business Documents
Choose ONE document:
- Business license
- Tax registration certificate
- Articles of incorporation
- Business utility bill

**Requirements**:
- Document must be clear and readable
- Business name must match your Meta account
- Document must be current (not expired)

### 2.3 Submit for Review
1. Upload your document
2. Confirm business details match
3. Click **Submit**
4. Wait for email confirmation (1-2 business days)

**⏳ While Waiting**: Continue to Step 3

---

## 📱 STEP 3: Create WhatsApp Business App (15 minutes)

### 3.1 Go to Meta for Developers
1. Open: **https://developers.facebook.com/**
2. Click **My Apps** (top right)
3. Click **Create App**

### 3.2 Create App
1. Select **Business** as app type
2. Click **Next**
3. Fill in details:
   - App name: "Medical Referral Notifications" (or your choice)
   - App contact email: Your business email
   - Business Account: Select your business
4. Click **Create App**

### 3.3 Add WhatsApp Product
1. In app dashboard, find **Add Products**
2. Locate **WhatsApp** card
3. Click **Set Up**

**✅ Checkpoint**: WhatsApp added to your app

---

## 📞 STEP 4: Add Phone Number (After verification approved)

**⚠️ IMPORTANT**: 
- Use a phone number NOT currently on WhatsApp
- If it's on WhatsApp, delete that account first
- Wait 24 hours after deletion before using here

### 4.1 Register Phone Number
1. In app dashboard, click **WhatsApp** → **Getting Started**
2. Click **Add Phone Number**
3. Select **Register a phone number you own**
4. Enter number in international format:
   - India: `+919876543210`
   - USA: `+14155551234`
5. Click **Next**

### 4.2 Verify Phone Number
1. Choose verification method:
   - **SMS** (recommended)
   - **Voice call**
2. Enter 6-digit code you receive
3. Click **Verify**

### 4.3 Set Display Name
1. Enter display name: Your clinic name
2. This is what recipients see
3. Click **Save**

**✅ Checkpoint**: Phone number connected

---

## 🔑 STEP 5: Get API Credentials (10 minutes)

### 5.1 Get Phone Number ID
1. In WhatsApp settings, go to **API Setup**
2. Find **"Phone number ID"**
3. Click **Copy** icon
4. Save it in a text file

**Example**: `123456789012345` (15 digits)

### 5.2 Get Business Account ID
1. On same page, find **"WhatsApp Business Account ID"**
2. Click **Copy** icon
3. Save it in your text file

**Example**: `123456789012345` (15 digits)

### 5.3 Generate Access Token
1. Go to **Business Settings** → **System Users**
2. Click **Add** to create system user
3. Name: "DICOM Notification Service"
4. Role: **Admin**
5. Click **Create System User**
6. Click on the user name
7. Click **Generate New Token**
8. Select your app from dropdown
9. Check these permissions:
   - ☑️ `whatsapp_business_messaging`
   - ☑️ `whatsapp_business_management`
10. Click **Generate Token**
11. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

**Example**: `EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...` (very long)

### 5.4 Save Your Credentials
Create a file: `whatsapp-credentials-PRIVATE.txt`

```
Phone Number ID: 123456789012345
Business Account ID: 123456789012345
Access Token: EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...
```

**🔐 KEEP THIS FILE SECURE - DO NOT SHARE OR COMMIT TO GIT**

**✅ Checkpoint**: All credentials obtained

---

## 📝 STEP 6: Create Message Templates (15 minutes)

WhatsApp requires pre-approved templates for business messages.

### 6.1 Create Doctor Notification Template
1. In WhatsApp settings, click **Message Templates**
2. Click **Create Template**
3. Fill in:
   - **Name**: `doctor_scan_notification`
   - **Category**: `UTILITY`
   - **Language**: English
   - **Body**:
```
Hi Dr. {{1}},

New DICOM scan uploaded for patient {{2}}.

View scan here: {{3}}

- Your Clinic Name
```
4. Click **Submit**

### 6.2 Create Patient Notification Template
1. Click **Create Template** again
2. Fill in:
   - **Name**: `patient_scan_ready`
   - **Category**: `UTILITY`
   - **Language**: English
   - **Body**:
```
Hello {{1}},

Your DICOM scan is ready for viewing.

Access your scan: {{2}}

For questions, contact your doctor.

- Your Clinic Name
```
3. Click **Submit**

### 6.3 Wait for Approval
- **Timeline**: 1-2 hours (up to 24 hours)
- **Check status**: Message Templates section
- **Email**: You'll receive approval notification

**✅ Checkpoint**: Templates submitted

---

## 💻 STEP 7: Add Credentials to Backend (5 minutes)

### 7.1 Edit Backend Environment File
1. Open file: `dicom-backend/.env`
2. Add these lines at the end:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

3. Replace the values with your actual credentials:
   - Replace `your_phone_number_id_here` with your Phone Number ID
   - Replace `your_business_account_id_here` with your Business Account ID
   - Replace `your_access_token_here` with your Access Token

**Example**:
```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...
```

4. Save the file

**⚠️ IMPORTANT**: 
- Do NOT add quotes around the values
- Do NOT add spaces
- Make sure there are no line breaks in the token

**✅ Checkpoint**: Credentials added to backend

---

## 🚀 STEP 8: Deploy Backend (5 minutes)

### 8.1 Deploy to Google Cloud Run
1. Open terminal/command prompt
2. Navigate to backend folder:
```bash
cd dicom-backend
```

3. Deploy:
```bash
gcloud run deploy dicom-backend --source . --platform managed --region asia-south1 --allow-unauthenticated --memory 2Gi --timeout 300
```

4. Wait for deployment (2-3 minutes)
5. You'll see: "Service URL: https://dicom-backend-59642964164.asia-south1.run.app"

**✅ Checkpoint**: Backend deployed with WhatsApp credentials

---

## 🧪 STEP 9: Test WhatsApp Notifications (10 minutes)

### 9.1 Test with Your Own Number
1. Login to your system: https://nice4-d7886.web.app
2. Go to **Create Form**
3. Fill in patient details
4. In doctor phone field, enter YOUR WhatsApp number (with country code)
   - Example: `+919876543210`
5. Upload a DICOM file
6. Submit the form

### 9.2 Check WhatsApp
1. Open WhatsApp on your phone
2. You should receive a message from your business number
3. Message should include:
   - Doctor name
   - Patient name
   - Link to viewer
4. Click the link to verify it works

### 9.3 Check Delivery Status
1. In your system, go to **Manage Forms** or **Branch Patients**
2. Find the case you just created
3. Look at the notification status badge
4. Should show: ✅ Sent (green)

**If it shows ❌ Failed (red)**:
- Check your credentials are correct
- Verify templates are approved
- Check phone number format (+country code)

**✅ Checkpoint**: WhatsApp working!

---

## 📊 STEP 10: Monitor & Maintain

### Daily Monitoring
1. Check notification badges in Manage Forms
2. Look for failed messages (red badges)
3. Verify links are working

### Monthly Tasks
1. Check message usage in Meta Business Suite
2. Review costs (first 1,000 free)
3. Renew access token if needed (expires after 60 days)

### Token Renewal (Every 60 days)
1. Go to Business Settings → System Users
2. Click your system user
3. Click **Generate New Token**
4. Copy new token
5. Update `dicom-backend/.env`
6. Redeploy backend

---

## 🚨 Troubleshooting

### Problem: Messages Not Sending

**Check 1: Credentials**
- Verify Phone Number ID is correct (15 digits)
- Verify Access Token starts with `EAA`
- Check for typos in `.env` file

**Check 2: Templates**
- Go to Message Templates in Meta
- Verify status is "Approved" (not "Pending" or "Rejected")
- Wait if still pending

**Check 3: Phone Number Format**
- Must include country code: `+919876543210`
- No spaces or dashes
- No leading zeros after country code

**Check 4: Backend Logs**
1. Go to: https://console.cloud.google.com/run
2. Click **dicom-backend**
3. Click **Logs** tab
4. Look for WhatsApp errors

### Problem: Template Rejected

**Common Reasons**:
- Too promotional (avoid "Buy now", "Limited offer")
- Too many emojis
- Spelling errors
- Not professional enough

**Solution**:
1. Edit template to be more professional
2. Keep it informative, not promotional
3. Resubmit for approval

### Problem: Access Token Expired

**Symptoms**:
- Messages suddenly stop working
- Error: "Invalid OAuth access token"

**Solution**:
1. Generate new token (see Step 5.3)
2. Update `.env` file
3. Redeploy backend

### Problem: Phone Number Already in Use

**Solution**:
1. Delete WhatsApp account on that number
2. Wait 24 hours
3. Try registering again

---

## 💰 Pricing Information

### Free Tier
- **First 1,000 conversations/month**: FREE
- Conversation = 24-hour window with a user

### After Free Tier
- **India**: ₹0.40 per conversation (~$0.005)
- **USA**: $0.05 per conversation

### Your Expected Usage
- 100 cases/month × 2 messages = 200 conversations
- **Cost**: FREE (well within free tier)

---

## ✅ Final Checklist

Before considering setup complete:
- [ ] Meta Business Account created and verified
- [ ] WhatsApp Business App created
- [ ] Phone number added and verified
- [ ] All 3 credentials obtained and saved securely
- [ ] Message templates created and approved
- [ ] Credentials added to `dicom-backend/.env`
- [ ] Backend deployed to Google Cloud Run
- [ ] Test message sent successfully
- [ ] Test message received on WhatsApp
- [ ] Link in message works correctly
- [ ] Notification status shows "Sent" in system

---

## 📞 Support Resources

### Meta Documentation
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Business Help Center: https://www.facebook.com/business/help
- Developer Community: https://developers.facebook.com/community

### Your System
- Frontend: https://nice4-d7886.web.app
- Backend: https://dicom-backend-59642964164.asia-south1.run.app
- Google Cloud Console: https://console.cloud.google.com/run?project=nice4-d7886

---

## 🎯 Quick Reference

### Where to Find Things

**Phone Number ID & Business Account ID**:
- https://developers.facebook.com/
- My Apps → Your App → WhatsApp → API Setup

**Access Token**:
- https://business.facebook.com/
- Business Settings → System Users → Generate Token

**Message Templates**:
- https://developers.facebook.com/
- My Apps → Your App → WhatsApp → Message Templates

**Backend Environment File**:
- `dicom-backend/.env`

**Deploy Backend**:
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --platform managed --region asia-south1 --allow-unauthenticated --memory 2Gi --timeout 300
```

---

## 📝 Important Notes

### Security
- ⚠️ Never share your Access Token
- ⚠️ Never commit `.env` file to Git
- ⚠️ Rotate token every 60 days
- ⚠️ Keep credentials file secure

### Compliance
- ✅ Only send transactional messages (not promotional)
- ✅ Include opt-out option if required
- ✅ Follow WhatsApp Business Policy
- ✅ Don't spam users

### Best Practices
- Test with your own number first
- Monitor delivery rates
- Keep templates professional
- Respond to user replies promptly
- Stay within free tier limits

---

## 🎉 You're All Set!

Once you complete all steps, your WhatsApp automation will be fully functional. Users will automatically receive WhatsApp notifications when:
- New DICOM files are uploaded
- Reports are ready
- Cases are updated

The system handles everything automatically - you just needed to provide the credentials!

---

## 📧 Need Help?

If you get stuck at any step:
1. Check the troubleshooting section above
2. Review the detailed guides:
   - `WHATSAPP_SETUP_GUIDE.md` (comprehensive guide)
   - `WHATSAPP_API_CREDENTIALS_GUIDE.md` (credential details)
3. Check Meta's documentation
4. Contact Meta support if needed

**Most Common Issues**:
- Waiting for business verification (be patient, 1-2 days)
- Waiting for template approval (usually 1-2 hours)
- Phone number format (must include +country code)
- Access token typos (copy carefully!)

---

*Last Updated: February 2026*
*System Version: 1.0.0*
