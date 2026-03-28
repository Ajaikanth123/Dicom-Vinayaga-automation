# Deploy WhatsApp Backend - Authentication Required

## ✅ Credentials Added Successfully!

WhatsApp credentials have been added to `dicom-backend/.env`:
- Phone Number ID: 1042402002281075
- Business Account ID: 908777428672260
- Access Token: Added ✓

---

## 🔐 Authentication Issue

Your Google Cloud authentication has expired. You need to re-authenticate.

---

## 🚀 Deploy Backend (3 steps)

### Step 1: Re-authenticate with Google Cloud

Open terminal and run:
```bash
gcloud auth login
```

This will:
1. Open your browser
2. Ask you to login to Google
3. Grant permissions
4. Return to terminal

### Step 2: Navigate to Backend Folder

```bash
cd dicom-backend
```

### Step 3: Deploy

```bash
gcloud run deploy dicom-backend --source . --platform managed --region asia-south1 --allow-unauthenticated --memory 2Gi --timeout 300
```

Wait 2-3 minutes for deployment to complete.

---

## ✅ After Deployment

Once deployed successfully, you'll see:
```
Service URL: https://dicom-backend-59642964164.asia-south1.run.app
```

---

## 🧪 Test WhatsApp

1. Go to: https://nice4-d7886.web.app
2. Login
3. Create a new form
4. **Important**: Enter YOUR WhatsApp number in doctor phone field
   - Format: `+919876543210` (with + and country code)
5. Upload DICOM file (optional)
6. Submit form
7. Check your WhatsApp - you should receive a message within 30 seconds!

---

## 📊 Check Status

In your app:
- Go to "Manage Forms" or "Branch Patients"
- Find the case you created
- Look for notification status badge
- Should show: ✅ Sent (green)

---

## 🎉 You're Done!

Once you receive the WhatsApp message, the automation is fully working!

From now on, every form with a doctor's WhatsApp number will automatically send notifications.

---

## 🚨 If Message Not Received

1. **Check phone number format**: Must be `+919876543210` (with + and country code)
2. **Check backend logs**: https://console.cloud.google.com/run → dicom-backend → Logs
3. **Verify templates are active**: https://developers.facebook.com/ → My Apps → Your App → WhatsApp → Message Templates

---

**Ready?** Run the 3 commands above and test!
