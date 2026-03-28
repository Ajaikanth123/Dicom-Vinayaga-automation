# Deployment Checklist

## Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Google Cloud SDK installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Google Cloud (`gcloud auth login`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Project set to nice4-d7886 (`gcloud config set project nice4-d7886`)

### ✅ Environment Setup
- [ ] Backend `.env` file configured with all variables
- [ ] Frontend `.env.production` created (copy from `.env.production.template`)
- [ ] Service account key exists: `dicom-backend/serviceAccountKey.json`
- [ ] Email credentials configured (EMAIL_USER, EMAIL_PASS)

### ✅ Code Review
- [ ] All console.log with sensitive data removed
- [ ] No hardcoded localhost URLs (except in development)
- [ ] CORS configuration ready for production
- [ ] Error handling in place
- [ ] Loading states implemented

### ✅ Testing Locally
- [ ] Backend runs without errors (`npm start` in dicom-backend)
- [ ] Frontend runs without errors (`npm run dev` in medical-referral-system)
- [ ] Can upload DICOM files successfully
- [ ] Email notifications work
- [ ] Viewer loads and displays images
- [ ] MPR mode works correctly
- [ ] Mobile view works on network IP

## Deployment Steps

### Step 1: Deploy Backend ⏱️ ~5-10 minutes
- [ ] Navigate to `dicom-backend` folder
- [ ] Run deployment command (see deploy.md)
- [ ] Wait for deployment to complete
- [ ] Copy the Cloud Run URL provided
- [ ] Test backend URL: `curl https://your-backend-url.run.app/`
- [ ] Verify response shows `{"status":"ok"}`

### Step 2: Configure Frontend ⏱️ ~2 minutes
- [ ] Navigate to `medical-referral-system` folder
- [ ] Edit `.env.production` file
- [ ] Add backend URL from Step 1
- [ ] Add Firebase configuration values
- [ ] Save file

### Step 3: Build Frontend ⏱️ ~2-3 minutes
- [ ] Run `npm run build`
- [ ] Verify `dist` folder created
- [ ] Check for build errors
- [ ] Verify no warnings about missing env variables

### Step 4: Deploy Frontend ⏱️ ~2-5 minutes
- [ ] Run `firebase deploy --only hosting`
- [ ] Wait for deployment to complete
- [ ] Copy the Firebase Hosting URL
- [ ] Open URL in browser
- [ ] Verify app loads correctly

### Step 5: Update Backend CORS ⏱️ ~5 minutes
- [ ] Edit `dicom-backend/server.js`
- [ ] Update CORS to include Firebase Hosting URLs
- [ ] Redeploy backend
- [ ] Test CORS by accessing frontend

## Post-Deployment Testing

### Backend Tests
- [ ] Health check: `curl https://your-backend-url.run.app/`
- [ ] Check logs: `gcloud run logs read dicom-backend --region asia-south1 --limit 20`
- [ ] Verify no errors in logs

### Frontend Tests
- [ ] Open production URL: `https://nice4-d7886.web.app`
- [ ] Login works
- [ ] Dashboard loads
- [ ] Navigation works
- [ ] No console errors

### Full Integration Tests
- [ ] Upload a small DICOM ZIP file (test file)
- [ ] Verify upload progress shows correctly
- [ ] Check backend logs for upload processing
- [ ] Verify email notification received
- [ ] Open viewer link from email
- [ ] Verify all 576 slices load
- [ ] Test Single View mode
- [ ] Test MPR View mode
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] DICOM upload completes successfully
- [ ] Viewer loads within 5 seconds
- [ ] MPR loads all slices within 60 seconds
- [ ] No memory leaks in browser

## Monitoring Setup

### Cloud Run Monitoring
- [ ] Set up alerts for errors
- [ ] Set up alerts for high latency
- [ ] Set up alerts for high memory usage
- [ ] Configure log retention

### Firebase Monitoring
- [ ] Enable Performance Monitoring
- [ ] Enable Crashlytics (optional)
- [ ] Set up usage alerts

### Cost Monitoring
- [ ] Set up billing alerts
- [ ] Set budget limit
- [ ] Review cost estimates

## Security Checklist

### Backend Security
- [ ] CORS restricted to production domains only
- [ ] Environment variables not exposed
- [ ] Service account has minimal permissions
- [ ] File upload size limits configured
- [ ] Rate limiting considered (optional)

### Frontend Security
- [ ] Firebase Security Rules reviewed
- [ ] No API keys in client code
- [ ] Authentication working correctly
- [ ] User permissions enforced

### Storage Security
- [ ] GCS bucket permissions reviewed
- [ ] Public access only for processed files
- [ ] CORS configured correctly
- [ ] Lifecycle policies set (optional)

## Documentation

- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create user guide
- [ ] Create admin guide
- [ ] Document troubleshooting steps

## Backup and Recovery

- [ ] Database backup strategy defined
- [ ] Storage backup strategy defined
- [ ] Rollback procedure documented
- [ ] Disaster recovery plan created

## Communication

- [ ] Notify team of deployment
- [ ] Share production URLs
- [ ] Share login credentials (securely)
- [ ] Schedule training session
- [ ] Collect feedback

## Post-Launch Monitoring (First 24 Hours)

### Hour 1
- [ ] Check error logs
- [ ] Monitor user activity
- [ ] Verify email delivery

### Hour 6
- [ ] Review performance metrics
- [ ] Check storage usage
- [ ] Verify all features working

### Hour 24
- [ ] Review full day logs
- [ ] Check costs
- [ ] Gather user feedback
- [ ] Plan improvements

## Success Criteria

✅ Deployment is successful if:
- [ ] Backend responds to health checks
- [ ] Frontend loads without errors
- [ ] Users can login
- [ ] DICOM upload works end-to-end
- [ ] Email notifications delivered
- [ ] Viewer displays images correctly
- [ ] MPR mode works
- [ ] Mobile access works
- [ ] No critical errors in logs
- [ ] Performance meets expectations

## Rollback Plan

If deployment fails:
1. [ ] Identify the issue
2. [ ] Check logs for errors
3. [ ] Rollback backend if needed
4. [ ] Rollback frontend if needed
5. [ ] Notify team
6. [ ] Fix issues locally
7. [ ] Test thoroughly
8. [ ] Redeploy

## Support Contacts

- **Google Cloud Support**: https://console.cloud.google.com/support
- **Firebase Support**: https://firebase.google.com/support
- **Your Team**: [Add contact info]

---

## Quick Reference

### Production URLs
- **Frontend**: https://nice4-d7886.web.app
- **Backend**: [Fill after deployment]
- **Viewer**: https://nice4-d7886.web.app/viewer/{caseId}

### Important Commands
```bash
# View backend logs
gcloud run logs read dicom-backend --region asia-south1

# Redeploy backend
cd dicom-backend && gcloud run deploy dicom-backend --source . --region asia-south1

# Redeploy frontend
cd medical-referral-system && npm run build && firebase deploy --only hosting

# Rollback frontend
firebase hosting:rollback
```

---

**Print this checklist and check off items as you complete them!**
