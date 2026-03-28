# WhatsApp Final Deployment - Ready to Go!

## ✅ Templates Status: ACTIVE

All 3 templates are approved and ready to use:
- ✅ `new_case_complete` - Active
- ✅ `report_ready` - Active  
- ✅ `dicom_scan_notification` - Active

**Note**: "Quality pending" is normal - templates are fully functional!

---

## 🔑 Your Credentials

```
Phone Number ID: 1042402002281075
Business Account ID: 908777428672260
Access Token: EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD
```

---

## 📝 STEP 1: Add Credentials to Backend (2 minutes)

### Open File
Navigate to: `dicom-backend/.env`

### Add These 3 Lines at the END
```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=1042402002281075
WHATSAPP_BUSINESS_ACCOUNT_ID=908777428672260
WHATSAPP_ACCESS_TOKEN=EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD
```

### Save the File
Make sure to save after adding!

---

## 🚀 STEP 2: Deploy Backend (3 minutes)

### Open Terminal/Command Prompt

### Run These Commands:
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --platform managed --region asia-south1 --allow-unauthenticated --memory 2Gi --timeout 300
```

### Wait for Deployment
- Takes 2-3 minutes
- You'll see build progress
- Success: "Service URL: https://dicom-backend-59642964164.asia-south1.run.app"

---

## 🧪 STEP 3: Test WhatsApp (5 minutes)

### A. Prepare Your Phone Number
Format: `+919876543210` (with + and country code)

### B. Create Test Case
1. Go to: https://nice4-d7886.web.app
2. Login
3. Click "Create Form"
4. Fill patient details
5. **Important**: Doctor phone = YOUR WhatsApp number (+919876543210)
6. Upload DICOM file (optional)
7. Submit

### C. Check WhatsApp
- Open WhatsApp on your phone
- Within 30 seconds, you should receive message
- Message includes doctor name, patient name, and link

### D. Verify in System
- Go to "Manage Forms" or "Branch Patients"
- Find your test case
- Status should show: ✅ Sent (green badge)

---

## ✅ Success Checklist

- [ ] Added 3 credentials to `dicom-backend/.env`
- [ ] Saved the file
- [ ] Deployed backend successfully
- [ ] Created test form with your WhatsApp number
- [ ] Received WhatsApp message
- [ ] Link in message works
- [ ] System shows "Sent" status

---

## 🎉 You're Done!

Once all checklist items are complete, WhatsApp automation is fully working!

Every time someone creates a form with a doctor's WhatsApp number, the system will automatically send a notification with:
- Doctor name
- Patient name
- DICOM viewer link (if uploaded)
- Report link (if uploaded)

---

## 📊 What Happens Automatically

### Scenario 1: DICOM + Report Uploaded
- System uses template: `new_case_complete`
- Message includes both DICOM link and Report link

### Scenario 2: Only DICOM Uploaded
- System uses template: `dicom_scan_notification`
- Message includes DICOM link only
- Mentions report will be sent separately

### Scenario 3: Report Added Later
- System uses template: `report_ready`
- Message includes report link only

---

## 🔧 Maintenance

### Token Renewal (Every 60 Days)
1. Generate new access token in Facebook
2. Update `WHATSAPP_ACCESS_TOKEN` in `.env`
3. Redeploy backend

### Monitor Delivery
- Check notification badges in your app
- Green = Sent successfully
- Red = Failed (check phone number format)

### Monthly Usage
- First 1,000 messages: FREE
- Your expected usage: ~200/month
- Well within free tier!

---

## 🚨 Troubleshooting

### Message Not Received
1. Check phone number format: `+919876543210`
2. Verify templates are "Active"
3. Check backend logs for errors

### Status Shows "Failed"
1. Verify credentials in `.env` are correct
2. Check phone number has country code
3. Make sure backend was deployed after adding credentials

### Backend Logs
https://console.cloud.google.com/run → dicom-backend → Logs

---

## 📞 Support

### Check Templates
https://developers.facebook.com/ → My Apps → Your App → WhatsApp → Message Templates

### Backend Logs
https://console.cloud.google.com/run → dicom-backend → Logs

### Your System
https://nice4-d7886.web.app

---

**Ready to deploy?** Follow Steps 1-3 above and you'll have WhatsApp working in 10 minutes!
