# Meta WhatsApp Business API Setup Guide

Complete step-by-step guide to set up WhatsApp notifications for your DICOM viewer system.

---

## 📋 Prerequisites

Before starting, you need:
- ✅ A phone number that is NOT currently using WhatsApp (will be used for business)
- ✅ Facebook account (personal)
- ✅ Business documents (for verification)
- ✅ Business email address
- ✅ Business website (optional but helpful)

**Important**: The phone number you use CANNOT be registered with regular WhatsApp. If it is, you must delete that WhatsApp account first.

---

## 🚀 PHASE 1: Create Facebook Business Account (Day 1 - 30 minutes)

### Step 1.1: Go to Meta Business Suite
1. Open browser and go to: **https://business.facebook.com/**
2. Click **"Create Account"**
3. Enter your business details:
   - Business name: `ANBU Dental` (or your clinic name)
   - Your name: Your full name
   - Business email: Your business email

### Step 1.2: Verify Your Email
1. Check your email inbox
2. Click the verification link from Facebook
3. Return to Meta Business Suite

### Step 1.3: Add Business Details
1. Go to **Business Settings** (gear icon)
2. Click **Business Info**
3. Fill in:
   - Legal business name
   - Business address
   - Business phone number
   - Business website (if you have one)
4. Click **Save**

**✅ Checkpoint**: You now have a Facebook Business Account

---

## 🏢 PHASE 2: Business Verification (Day 1 - Submit, Wait 1-2 days)

### Step 2.1: Start Verification Process
1. In Meta Business Suite, go to **Business Settings**
2. Click **Security Center** in left menu
3. Click **Start Verification**

### Step 2.2: Choose Verification Method

**Option A: Business Documents** (Recommended)
Upload ONE of these:
- Business license
- Tax registration certificate
- Articles of incorporation
- Business utility bill

**Option B: Phone Verification**
- Receive a call with verification code
- Only works for some countries

**Option C: Domain Verification**
- Add a meta-tag to your website
- Only if you have a website

### Step 2.3: Submit Documents
1. Choose **Business Documents**
2. Click **Upload Documents**
3. Select your business license/registration
4. Add business details:
   - Business name (must match document)
   - Business address (must match document)
   - Business phone number
5. Click **Submit**

### Step 2.4: Wait for Approval
- **Timeline**: 1-2 business days (sometimes faster)
- **Email**: You'll receive confirmation email
- **Status**: Check in Business Settings > Security Center

**⏳ Wait Time**: While waiting, continue to Phase 3 to prepare

---

## 📱 PHASE 3: Create WhatsApp Business App (Day 1 - 15 minutes)

### Step 3.1: Go to Meta for Developers
1. Open: **https://developers.facebook.com/**
2. Click **My Apps** (top right)
3. Click **Create App**

### Step 3.2: Select App Type
1. Choose **Business**
2. Click **Next**

### Step 3.3: Add App Details
1. App name: `ANBU Dental DICOM Notifications`
2. App contact email: Your business email
3. Business Account: Select your business account
4. Click **Create App**

### Step 3.4: Add WhatsApp Product
1. In your app dashboard, scroll to **Add Products**
2. Find **WhatsApp** card
3. Click **Set Up**

**✅ Checkpoint**: WhatsApp is now added to your app

---

## 📞 PHASE 4: Add Phone Number (Day 2-3, After Verification)

**⚠️ IMPORTANT**: Wait until your business is verified before this step!

### Step 4.1: Access WhatsApp Settings
1. In your app dashboard, click **WhatsApp** in left menu
2. Click **Getting Started**

### Step 4.2: Add Phone Number
1. Click **Add Phone Number**
2. Choose **Register a phone number you own**
3. Enter phone number in international format:
   - Example: `+919876543210` (India)
   - Example: `+14155551234` (USA)
4. Click **Next**

### Step 4.3: Verify Phone Number
1. Choose verification method:
   - **SMS** (recommended)
   - **Voice call**
2. Enter the 6-digit code you receive
3. Click **Verify**

### Step 4.4: Set Display Name
1. Enter business display name: `ANBU Dental`
2. This is what recipients will see
3. Click **Save**

**✅ Checkpoint**: Phone number is now connected to WhatsApp Business

---

## 🔑 PHASE 5: Get API Credentials (Day 2-3 - 10 minutes)

### Step 5.1: Get Phone Number ID
1. In WhatsApp settings, go to **API Setup**
2. Find **Phone Number ID**
3. Copy and save it (looks like: `123456789012345`)

### Step 5.2: Get WhatsApp Business Account ID
1. In same page, find **WhatsApp Business Account ID**
2. Copy and save it (looks like: `123456789012345`)

### Step 5.3: Generate Access Token
1. Go to **System Users** in Business Settings
2. Click **Add** to create system user
3. Name: `DICOM Notification Service`
4. Role: **Admin**
5. Click **Create System User**
6. Click **Generate New Token**
7. Select your app
8. Select permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
9. Click **Generate Token**
10. **COPY AND SAVE THIS TOKEN** (you won't see it again!)

**🔐 Save These Credentials**:
```
Phone Number ID: 123456789012345
Business Account ID: 123456789012345
Access Token: EAAxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📝 PHASE 6: Create Message Template (Day 2-3 - 15 minutes)

WhatsApp requires pre-approved templates for business messages.

### Step 6.1: Go to Message Templates
1. In WhatsApp settings, click **Message Templates**
2. Click **Create Template**

### Step 6.2: Create Doctor Notification Template
1. **Template Name**: `doctor_scan_notification`
2. **Category**: `UTILITY`
3. **Language**: English
4. **Header**: None (or add logo)
5. **Body**:
```
Hi Dr. {{1}},

New DICOM scan uploaded for patient {{2}}.

View scan here: {{3}}

- ANBU Dental
```
6. **Footer**: `Reply STOP to unsubscribe`
7. **Buttons**: None (or add "View Scan" button)
8. Click **Submit**

### Step 6.3: Create Patient Notification Template
1. Click **Create Template** again
2. **Template Name**: `patient_scan_ready`
3. **Category**: `UTILITY`
4. **Language**: English
5. **Body**:
```
Hello {{1}},

Your DICOM scan is ready for viewing.

Access your scan: {{2}}

For questions, contact your doctor.

- ANBU Dental
```
6. Click **Submit**

### Step 6.4: Wait for Template Approval
- **Timeline**: Usually 1-2 hours (can be up to 24 hours)
- **Status**: Check in Message Templates section
- **Email**: You'll receive approval notification

**✅ Checkpoint**: Templates are submitted and awaiting approval

---

## 💻 PHASE 7: Integrate with Your Backend (Day 3 - 1 hour)

### Step 7.1: Add Credentials to Backend

Edit `dicom-backend/.env`:
```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
```

### Step 7.2: Install Required Package
```bash
cd dicom-backend
npm install axios
```

### Step 7.3: Create WhatsApp Service

I'll create the service file for you in the next step.

---

## 🧪 PHASE 8: Testing (Day 3 - 30 minutes)

### Step 8.1: Test with Your Own Number
1. Send a test message to your own WhatsApp
2. Verify you receive it
3. Check message format

### Step 8.2: Test Template Variables
1. Ensure doctor name appears correctly
2. Ensure patient name appears correctly
3. Ensure link works

### Step 8.3: Test End-to-End
1. Upload a DICOM file through your system
2. Verify WhatsApp is sent automatically
3. Click the link and verify viewer opens

---

## 📊 PHASE 9: Monitor & Maintain

### Daily Monitoring
- Check message delivery status in Meta Business Suite
- Monitor failed messages
- Check for template rejections

### Monthly Tasks
- Review message costs (free tier: 1000 messages/month)
- Check for policy updates
- Renew access token if needed (tokens expire after 60 days)

---

## 🚨 Common Issues & Solutions

### Issue 1: Business Verification Rejected
**Solution**: 
- Ensure documents are clear and readable
- Business name must match exactly
- Resubmit with different documents

### Issue 2: Phone Number Already in Use
**Solution**:
- Delete existing WhatsApp account on that number
- Wait 24 hours
- Try again

### Issue 3: Template Rejected
**Solution**:
- Remove promotional language
- Keep it professional and informative
- Don't use emojis excessively
- Resubmit with changes

### Issue 4: Messages Not Sending
**Solution**:
- Check access token is valid
- Verify phone number ID is correct
- Ensure recipient number is in international format (+91...)
- Check template is approved

### Issue 5: Access Token Expired
**Solution**:
- Generate new token in System Users
- Update `.env` file
- Restart backend server

---

## 💰 Pricing (As of 2024)

### Free Tier
- First 1,000 conversations per month: **FREE**
- Conversation = 24-hour window with a user

### Paid Tier (After 1,000)
- India: ₹0.40 per conversation (~$0.005)
- USA: $0.05 per conversation

**Your Expected Cost**:
- 100 cases/month × 2 messages = 200 conversations
- **Cost: FREE** (well within free tier)

---

## 📞 Support Resources

### Meta Support
- Developer Docs: https://developers.facebook.com/docs/whatsapp
- Business Help: https://www.facebook.com/business/help
- Community Forum: https://developers.facebook.com/community

### Status Pages
- WhatsApp Status: https://status.fb.com/
- API Status: Check Meta for Developers dashboard

---

## ✅ Final Checklist

Before going live, ensure:
- [ ] Business verified on Meta
- [ ] Phone number added and verified
- [ ] Access token generated and saved
- [ ] Message templates approved
- [ ] Backend service created and tested
- [ ] Test messages sent successfully
- [ ] End-to-end workflow tested
- [ ] Error handling implemented
- [ ] Monitoring set up

---

## 🎯 Next Steps

Once setup is complete:
1. I'll create the `whatsappService.js` file
2. I'll integrate it with your upload flow
3. We'll test with real DICOM uploads
4. Deploy to production

**Estimated Total Time**: 3-4 days (mostly waiting for verification)

---

## 📝 Notes

- Keep your access token secure (never commit to Git)
- Rotate tokens every 60 days for security
- Monitor message delivery rates
- Stay compliant with WhatsApp policies
- Don't send spam or promotional messages

---

**Ready to start?** Begin with Phase 1 and let me know when you complete each phase!
