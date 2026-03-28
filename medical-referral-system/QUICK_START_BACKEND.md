# ⚡ Quick Start - Backend Deployment

## Get Your Backend Running in 1 Hour

---

## ✅ Prerequisites

- [x] Node.js installed
- [x] Firebase project (dicom-connect)
- [ ] Google Cloud CLI installed
- [ ] Gmail account for notifications

---

## 🚀 Step-by-Step (Copy & Paste)

### Step 1: Install Backend Dependencies (2 minutes)

```bash
cd dicom-backend
npm install
```

### Step 2: Get Firebase Service Account (3 minutes)

1. Go to: https://console.firebase.google.com/
2. Select `dicom-connect` project
3. Click ⚙️ > Project Settings
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save as `serviceAccountKey.json` in `dicom-backend/` folder

### Step 3: Get Gmail App Password (5 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not enabled)
3. Go to **App passwords**
4. Select app: **Mail**
5. Select device: **Other** (type "DICOM Backend")
6. Click **Generate**
7. Copy the 16-character password

### Step 4: Configure Environment (2 minutes)

```bash
cd dicom-backend
cp .env.example .env
```

Edit `.env` and fill in:

```env
PORT=8080
NODE_ENV=production

FIREBASE_PROJECT_ID=dicom-connect
FIREBASE_STORAGE_BUCKET=dicom-connect.firebasestorage.app
FIREBASE_DATABASE_URL=https://dicom-connect-default-rtdb.firebaseio.com

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=paste-app-password-here

FRONTEND_URL=http://localhost:5173
VIEWER_URL=http://localhost:5173/viewer
```

### Step 5: Test Locally (5 minutes)

```bash
npm run dev
```

Open browser: http://localhost:5000

Should see:
```json
{
  "status": "ok",
  "message": "DICOM Backend Server"
}
```

✅ **Local backend working!**

### Step 6: Install Google Cloud CLI (10 minutes)

**Windows:**
1. Download: https://cloud.google.com/sdk/docs/install
2. Run installer
3. Open new PowerShell
4. Test: `gcloud --version`

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 7: Login to Google Cloud (2 minutes)

```bash
gcloud auth login
gcloud config set project dicom-connect
```

### Step 8: Enable APIs (3 minutes)

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 9: Deploy to Cloud Run (15 minutes)

```bash
cd dicom-backend

gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 3600 \
  --max-instances 10
```

Wait for deployment... ☕

You'll get a URL like:
```
https://dicom-backend-xxx-uc.a.run.app
```

### Step 10: Set Environment Variables (5 minutes)

```bash
# Set email config
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="EMAIL_SERVICE=gmail,EMAIL_USER=your-email@gmail.com,EMAIL_PASSWORD=your-app-password"

# Set Firebase service account
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | tr -d '\n')"

# Set URLs
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="FRONTEND_URL=https://dicom-connect.web.app,VIEWER_URL=https://dicom-connect.web.app/viewer"
```

### Step 11: Test Deployment (2 minutes)

```bash
# Get your URL
gcloud run services describe dicom-backend --region asia-south1 --format='value(status.url)'

# Test it
curl https://your-backend-url.run.app/
```

Should return:
```json
{
  "status": "ok",
  "message": "DICOM Backend Server",
  "version": "1.0.0"
}
```

✅ **Backend deployed!**

### Step 12: Update Frontend (3 minutes)

```bash
cd ../medical-referral-system
```

Edit `.env`:
```env
VITE_API_URL=https://your-backend-url.run.app
VITE_VIEWER_URL=https://dicom-connect.web.app/viewer
```

### Step 13: Test End-to-End (10 minutes)

```bash
npm run dev
```

1. Go to http://localhost:5173
2. Login
3. Create new form
4. Upload a DICOM ZIP file
5. Wait for processing
6. Check your email!

---

## 🎉 Done!

Your backend is now:
- ✅ Deployed to Google Cloud Run
- ✅ Processing DICOM files
- ✅ Sending email notifications
- ✅ Auto-scaling
- ✅ Production-ready

---

## 📊 What You Just Built

```
Frontend (localhost:5173)
    ↓
Backend (Cloud Run)
    ↓
Firebase Storage (DICOM files)
    ↓
Email Notifications
    ↓
Doctor receives link
```

---

## 💰 Cost

**Monthly (100 cases):**
- Cloud Run: $0.50
- Firebase Storage: $1.30
- Bandwidth: $0.60
- Email: Free
- **Total: $2.40/month**

---

## 🔍 Useful Commands

**View logs:**
```bash
gcloud run services logs read dicom-backend --region asia-south1 --limit 50
```

**Update backend:**
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1
```

**Check status:**
```bash
gcloud run services describe dicom-backend --region asia-south1
```

**Delete service:**
```bash
gcloud run services delete dicom-backend --region asia-south1
```

---

## 🐛 Troubleshooting

**Error: Service account not found**
```bash
# Re-upload service account
cd dicom-backend
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | tr -d '\n')"
```

**Error: Email not sending**
- Check Gmail App Password is correct
- Try sending test email from Gmail
- Check backend logs

**Error: Out of memory**
```bash
gcloud run services update dicom-backend \
  --region asia-south1 \
  --memory 4Gi
```

---

## 📚 Next Steps

1. ✅ Backend deployed
2. ⏳ Create DICOM viewer component
3. ⏳ Deploy frontend to Firebase Hosting
4. ⏳ Test with real DICOM files
5. ⏳ Train staff

---

## 🆘 Need Help?

**Check logs:**
```bash
gcloud run services logs read dicom-backend --region asia-south1
```

**Test email:**
- Use Postman to call `/upload` endpoint
- Check if email arrives

**Backend not responding:**
- Check if service is running
- Verify environment variables
- Check Firebase service account

---

**Backend is live! Ready for the next step?** 🚀

