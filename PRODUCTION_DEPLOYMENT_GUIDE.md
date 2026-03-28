# Production Deployment Guide

## ✅ DEPLOYMENT STATUS: SUCCESSFUL

**Backend**: https://dicom-backend-59642964164.asia-south1.run.app (Revision 00007-zq5)
**Frontend**: https://nice4-d7886.web.app
**Status**: Both deployed and working correctly
**CORS Issue**: ✅ RESOLVED (see CORS_FIX_SUMMARY.md for details)

---

## Overview

This guide will help you deploy your DICOM Medical Referral System to production using:
- **Frontend**: Firebase Hosting
- **Backend**: Google Cloud Run
- **Storage**: Google Cloud Storage (already configured)
- **Database**: Firebase Realtime Database (already configured)

## Prerequisites

✅ You already have:
- Google Cloud Project: `nice4-d7886`
- Google Cloud Storage bucket: `nice4-dicom-storage`
- Firebase Realtime Database configured
- Service account key: `dicom-backend/serviceAccountKey.json`

## Deployment Steps

### Step 1: Prepare Backend for Production

#### 1.1 Update Backend Environment Variables

The backend needs production URLs. We'll set these in Google Cloud Run.

#### 1.2 Build Backend Docker Image

Your `Dockerfile` is already created. We'll use it to deploy to Cloud Run.

### Step 2: Deploy Backend to Google Cloud Run

#### 2.1 Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 2.2 Deploy Backend
```bash
cd dicom-backend
gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,GCS_BUCKET_NAME=nice4-dicom-storage,FIREBASE_DATABASE_URL=https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app,MAX_FILE_SIZE=5368709120,EMAIL_USER=clingam20@gmail.com,EMAIL_PASS=your-app-password"
```

This will:
- Build your Docker image
- Deploy to Cloud Run
- Give you a URL like: `https://dicom-backend-xxxxx-uc.a.run.app`

### Step 3: Prepare Frontend for Production

#### 3.1 Update Frontend Environment Variables

Create production environment file:

**File**: `medical-referral-system/.env.production`
```env
VITE_BACKEND_URL=https://dicom-backend-xxxxx-uc.a.run.app
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=nice4-d7886.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nice4-d7886
VITE_FIREBASE_STORAGE_BUCKET=nice4-d7886.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app
```

#### 3.2 Update Viewer to Use Environment Variable

The viewer needs to use the production backend URL instead of localhost.

#### 3.3 Build Frontend
```bash
cd medical-referral-system
npm run build
```

This creates a `dist` folder with production-ready files.

### Step 4: Deploy Frontend to Firebase Hosting

#### 4.1 Initialize Firebase Hosting
```bash
cd medical-referral-system
firebase init hosting
```

Select:
- Use existing project: `nice4-d7886`
- Public directory: `dist`
- Single-page app: `Yes`
- Automatic builds: `No`

#### 4.2 Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

Your app will be live at: `https://nice4-d7886.web.app`

## Post-Deployment Configuration

### Update CORS in Backend

After deployment, update the backend CORS to only allow your production domain:

```javascript
app.use(cors({
  origin: ['https://nice4-d7886.web.app', 'https://nice4-d7886.firebaseapp.com'],
  credentials: true
}));
```

Redeploy backend after this change.

### Update Email Templates

Update email notification templates to use production URLs:
- Replace `http://localhost:5173` with `https://nice4-d7886.web.app`

## Testing Production Deployment

### Test Backend
```bash
curl https://dicom-backend-xxxxx-uc.a.run.app/
```

Should return: `{"status":"ok","message":"DICOM Backend Server",...}`

### Test Frontend
Open: `https://nice4-d7886.web.app`

### Test DICOM Upload
1. Go to your production URL
2. Upload a DICOM ZIP file
3. Check email for viewer link
4. Verify viewer works with MPR

## Monitoring and Logs

### Backend Logs (Cloud Run)
```bash
gcloud run logs read dicom-backend --region asia-south1
```

### Frontend Logs (Firebase Hosting)
- Go to Firebase Console → Hosting → Usage

### Storage Usage (Google Cloud Storage)
```bash
gsutil du -sh gs://nice4-dicom-storage
```

## Cost Estimation

### Monthly Costs (for 100 cases/month):

**Google Cloud Run (Backend)**
- Free tier: 2 million requests/month
- Estimated: $0 - $5/month

**Firebase Hosting (Frontend)**
- Free tier: 10 GB storage, 360 MB/day transfer
- Estimated: $0/month

**Google Cloud Storage**
- Storage: 100 cases × 500 MB = 50 GB × $0.020/GB = $1.00/month
- Network egress: 100 cases × 500 MB = 50 GB × $0.12/GB = $6.00/month
- Operations: ~$0.10/month

**Firebase Realtime Database**
- Free tier: 1 GB storage, 10 GB/month download
- Estimated: $0/month

**Total: ~$7-12/month for 100 cases**

## Rollback Plan

If something goes wrong:

### Rollback Backend
```bash
gcloud run services update-traffic dicom-backend \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region asia-south1
```

### Rollback Frontend
```bash
firebase hosting:rollback
```

## Security Checklist

Before going live:

- [ ] Remove all console.log statements with sensitive data
- [ ] Update CORS to only allow production domains
- [ ] Verify service account permissions are minimal
- [ ] Enable Cloud Run authentication if needed
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Enable Firebase App Check
- [ ] Review Firebase Security Rules
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for database
- [ ] Test disaster recovery procedures

## Maintenance

### Regular Tasks

**Weekly:**
- Check error logs
- Monitor storage usage
- Review email delivery rates

**Monthly:**
- Review costs
- Update dependencies
- Check for security updates
- Backup database

**Quarterly:**
- Performance optimization
- User feedback review
- Feature planning

## Troubleshooting

### Backend Not Responding
1. Check Cloud Run logs
2. Verify environment variables
3. Check service account permissions
4. Verify database connection

### Frontend Not Loading
1. Check browser console
2. Verify backend URL in .env.production
3. Check Firebase Hosting deployment
4. Clear browser cache

### DICOM Upload Failing
1. Check backend logs
2. Verify GCS bucket permissions
3. Check file size limits
4. Verify CORS configuration

### Viewer Not Loading Images
1. Check GCS bucket public access
2. Verify CORS on GCS bucket
3. Check metadata.json exists
4. Verify image URLs in metadata

## Support

For issues:
1. Check logs first
2. Review this guide
3. Check Google Cloud Console
4. Review Firebase Console

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure SSL certificate (automatic with Firebase)
3. Set up monitoring alerts
4. Create user documentation
5. Train staff on the system
6. Plan for scaling if needed

---

**Ready to deploy? Follow the steps above carefully and test thoroughly!**
