# 🚀 Deployment Guide

## Complete Deployment Steps for DICOM Cloud Viewer

---

## Phase 1: Firebase Storage Setup (15 minutes)

### Step 1: Enable Firebase Storage

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `dicom-connect`
3. Click **Storage** in left sidebar
4. Click **Get Started**
5. Choose **Start in production mode**
6. Select region: `asia-south1` (Mumbai) or closest to you
7. Click **Done**

### Step 2: Configure Storage Rules

1. Click **Rules** tab in Firebase Storage
2. Replace with these rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Original DICOM files - auth required
    match /dicom/{branchId}/{caseId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // PDF reports - auth required
    match /reports/{branchId}/{caseId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Processed images - public read (for viewer)
    match /processed/{caseId}/{allPaths=**} {
      allow read: true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### Step 3: Test Storage

1. In Firebase Console, go to Storage
2. Click **Upload file**
3. Upload any test file
4. Verify it appears in the list
5. Delete the test file

✅ **Firebase Storage is now ready!**

---

## Phase 2: Backend Deployment (1 hour)

### Step 1: Install Google Cloud CLI

**Windows:**
1. Download from: https://cloud.google.com/sdk/docs/install
2. Run installer
3. Open new terminal/PowerShell
4. Run: `gcloud --version` to verify

**Mac/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud --version
```

### Step 2: Login to Google Cloud

```bash
gcloud auth login
gcloud config set project dicom-connect
```

### Step 3: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 4: Get Firebase Service Account Key

1. Go to Firebase Console
2. Click ⚙️ Settings > Project Settings
3. Go to **Service Accounts** tab
4. Click **Generate New Private Key**
5. Save file as `serviceAccountKey.json`
6. Move it to `dicom-backend/` folder

### Step 5: Configure Environment Variables

1. Open `dicom-backend/.env.example`
2. Copy to `dicom-backend/.env`
3. Fill in your values:

```env
PORT=8080
NODE_ENV=production

FIREBASE_PROJECT_ID=dicom-connect
FIREBASE_STORAGE_BUCKET=dicom-connect.firebasestorage.app
FIREBASE_DATABASE_URL=https://dicom-connect-default-rtdb.firebaseio.com

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

FRONTEND_URL=https://dicom-connect.web.app
VIEWER_URL=https://dicom-connect.web.app/viewer
```

**To get Gmail App Password:**
1. Go to Google Account settings
2. Security > 2-Step Verification
3. App passwords
4. Generate new app password
5. Copy and paste in .env

### Step 6: Deploy to Cloud Run

```bash
cd dicom-backend

# Deploy
gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 3600 \
  --max-instances 10
```

This will:
- Build Docker container
- Push to Container Registry
- Deploy to Cloud Run
- Give you a URL like: `https://dicom-backend-xxx-uc.a.run.app`

### Step 7: Set Environment Variables in Cloud Run

```bash
# Set email configuration
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="EMAIL_SERVICE=gmail,EMAIL_USER=your-email@gmail.com,EMAIL_PASSWORD=your-app-password"

# Set Firebase service account (from file)
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | tr -d '\n')"
```

### Step 8: Test Backend

```bash
# Get your Cloud Run URL
gcloud run services describe dicom-backend --region asia-south1 --format='value(status.url)'

# Test health endpoint
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

✅ **Backend is now deployed!**

---

## Phase 3: Frontend Configuration (10 minutes)

### Step 1: Update API URL

1. Open `medical-referral-system/.env`
2. Update with your Cloud Run URL:

```env
VITE_API_URL=https://your-backend-url.run.app
VITE_VIEWER_URL=https://dicom-connect.web.app/viewer
```

### Step 2: Test Local Frontend

```bash
cd medical-referral-system
npm run dev
```

1. Go to http://localhost:5173
2. Login
3. Try creating a form
4. Upload a test DICOM ZIP
5. Check if it processes

### Step 3: Deploy Frontend to Firebase Hosting

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (if not done)
cd medical-referral-system
firebase init hosting

# Select:
# - Use existing project: dicom-connect
# - Public directory: dist
# - Single-page app: Yes
# - GitHub deploys: No

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

Your app will be live at: `https://dicom-connect.web.app`

✅ **Frontend is now deployed!**

---

## Phase 4: Testing (30 minutes)

### Test 1: Upload DICOM

1. Go to your deployed app
2. Login
3. Create new form
4. Upload DICOM ZIP file
5. Wait for processing
6. Check email for notification

### Test 2: View DICOM

1. Click viewer link from email
2. Verify thumbnails load
3. Click a thumbnail
4. Verify preview loads
5. Test zoom/pan

### Test 3: Mobile Testing

1. Open viewer link on mobile phone
2. Test touch gestures
3. Verify fast loading
4. Test on 4G network

---

## Monitoring & Maintenance

### View Logs

**Backend Logs:**
```bash
gcloud run services logs read dicom-backend --region asia-south1 --limit 50
```

**Firebase Hosting Logs:**
- Go to Firebase Console > Hosting
- Click on your site
- View usage and errors

### Monitor Costs

**Google Cloud Console:**
- Go to: https://console.cloud.google.com/
- Billing > Reports
- Filter by service

**Expected Monthly Costs:**
- Cloud Run: $0.50
- Firebase Storage: $1.30
- Cloud Storage: $0.20
- Bandwidth: $0.60
- **Total: ~$2.60/month**

### Update Backend

```bash
cd dicom-backend

# Make changes to code

# Redeploy
gcloud run deploy dicom-backend \
  --source . \
  --region asia-south1
```

### Update Frontend

```bash
cd medical-referral-system

# Make changes

# Build and deploy
npm run build
firebase deploy --only hosting
```

---

## Troubleshooting

### Backend Issues

**Error: Service account not found**
```bash
# Re-upload service account
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | tr -d '\n')"
```

**Error: Out of memory**
```bash
# Increase memory
gcloud run services update dicom-backend \
  --region asia-south1 \
  --memory 4Gi
```

**Error: Timeout**
```bash
# Increase timeout
gcloud run services update dicom-backend \
  --region asia-south1 \
  --timeout 3600
```

### Frontend Issues

**Error: API not reachable**
- Check `.env` has correct backend URL
- Rebuild: `npm run build`
- Redeploy: `firebase deploy`

**Error: CORS issues**
- Backend should allow your frontend domain
- Check backend logs

### Email Issues

**Emails not sending**
- Verify Gmail App Password is correct
- Check backend logs: `gcloud run services logs read dicom-backend`
- Test email config in backend

---

## Security Checklist

- [ ] Firebase Storage rules configured
- [ ] Service account key secured (not in git)
- [ ] Environment variables set in Cloud Run
- [ ] HTTPS enabled (automatic with Cloud Run)
- [ ] Email credentials secured
- [ ] Access tokens working
- [ ] CORS configured correctly

---

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. ✅ Test with real DICOM files
4. ✅ Train staff on system
5. ⏳ Monitor for 1 week
6. ⏳ Add WhatsApp later (optional)

---

## Support

**Backend URL:** Check with `gcloud run services describe dicom-backend --region asia-south1`

**Frontend URL:** https://dicom-connect.web.app

**Logs:** `gcloud run services logs read dicom-backend --region asia-south1`

**Need help?** Check the logs first, then review error messages.

---

**Deployment Complete! 🎉**

Your DICOM cloud viewer is now live and ready to use!

