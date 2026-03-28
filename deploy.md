# Quick Deployment Commands

## Prerequisites

1. Install Google Cloud SDK:
```bash
# Download from: https://cloud.google.com/sdk/docs/install
```

2. Login to Google Cloud:
```bash
gcloud auth login
gcloud config set project nice4-d7886
```

3. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

## Step-by-Step Deployment

### STEP 1: Deploy Backend to Cloud Run

```bash
cd dicom-backend

# Deploy to Cloud Run
gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,GCS_BUCKET_NAME=nice4-dicom-storage,FIREBASE_DATABASE_URL=https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app,MAX_FILE_SIZE=5368709120"
```

**IMPORTANT**: After deployment, you'll get a URL like:
```
https://dicom-backend-xxxxx-as.a.run.app
```

**Copy this URL!** You'll need it for the next step.

### STEP 2: Configure Frontend with Backend URL

1. Copy the backend URL from Step 1
2. Create `.env.production` file:

```bash
cd ../medical-referral-system
cp .env.production.template .env.production
```

3. Edit `.env.production` and add your backend URL:
```env
VITE_BACKEND_URL=https://dicom-backend-xxxxx-as.a.run.app
```

4. Also copy your Firebase config from `.env` to `.env.production`

### STEP 3: Build Frontend

```bash
cd medical-referral-system
npm run build
```

This creates a `dist` folder.

### STEP 4: Initialize Firebase Hosting (First Time Only)

```bash
firebase init hosting
```

Answer the prompts:
- **Project**: Select `nice4-d7886`
- **Public directory**: `dist`
- **Single-page app**: `Yes`
- **Automatic builds**: `No`
- **Overwrite index.html**: `No`

### STEP 5: Deploy Frontend to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be live at:
```
https://nice4-d7886.web.app
```

### STEP 6: Update Backend CORS (Important!)

After frontend is deployed, update backend CORS:

1. Edit `dicom-backend/server.js`:
```javascript
app.use(cors({
  origin: [
    'https://nice4-d7886.web.app',
    'https://nice4-d7886.firebaseapp.com'
  ],
  credentials: true
}));
```

2. Redeploy backend:
```bash
cd dicom-backend
gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1
```

## Testing Production

### Test Backend
```bash
curl https://your-backend-url.run.app/
```

Should return JSON with status "ok".

### Test Frontend
Open: `https://nice4-d7886.web.app`

### Test Full Flow
1. Login to your app
2. Upload a DICOM ZIP file
3. Check email for viewer link
4. Open viewer link and test MPR

## Updating After Changes

### Update Backend Only
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1
```

### Update Frontend Only
```bash
cd medical-referral-system
npm run build
firebase deploy --only hosting
```

### Update Both
```bash
# Backend
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1

# Frontend
cd ../medical-referral-system
npm run build
firebase deploy --only hosting
```

## View Logs

### Backend Logs
```bash
gcloud run logs read dicom-backend --region asia-south1 --limit 50
```

### Real-time Backend Logs
```bash
gcloud run logs tail dicom-backend --region asia-south1
```

## Rollback if Needed

### Rollback Backend
```bash
# List revisions
gcloud run revisions list --service dicom-backend --region asia-south1

# Rollback to previous
gcloud run services update-traffic dicom-backend \
  --to-revisions=REVISION_NAME=100 \
  --region asia-south1
```

### Rollback Frontend
```bash
firebase hosting:rollback
```

## Common Issues

### Issue: Backend deployment fails
**Solution**: Check that all environment variables are set correctly

### Issue: Frontend can't connect to backend
**Solution**: Verify VITE_BACKEND_URL in .env.production matches your Cloud Run URL

### Issue: CORS errors
**Solution**: Make sure backend CORS includes your Firebase Hosting URL

### Issue: Images not loading in viewer
**Solution**: Check GCS bucket CORS configuration and public access

## Production URLs

After deployment, save these URLs:

- **Frontend**: https://nice4-d7886.web.app
- **Backend**: https://dicom-backend-xxxxx-as.a.run.app
- **Viewer**: https://nice4-d7886.web.app/viewer/{caseId}

## Cost Monitoring

Check costs:
```bash
gcloud billing accounts list
gcloud billing projects describe nice4-d7886
```

Or visit: https://console.cloud.google.com/billing

---

**You're ready to deploy! Start with Step 1 above.**
