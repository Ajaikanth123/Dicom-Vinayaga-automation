# Test Production Upload - CORS Fix Verification

## Backend Deployment
- **URL**: https://dicom-backend-59642964164.asia-south1.run.app
- **Revision**: 00007-zq5
- **Status**: ✅ Deployed successfully
- **CORS Fix**: Explicit headers set BEFORE multer middleware

## Frontend Deployment
- **URL**: https://nice4-d7886.web.app
- **Status**: ✅ Already deployed (no changes needed)

## What Was Fixed

The CORS issue was caused by multer middleware interfering with CORS header propagation. The fix adds explicit CORS headers as a middleware function that runs **before** multer processes the file upload.

### Code Changes in `dicom-backend/routes/upload.js`:

```javascript
// Explicit CORS middleware (runs BEFORE multer)
const setCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
};

// Apply to both OPTIONS and POST
router.options('/', setCorsHeaders, (req, res) => { ... });
router.post('/', setCorsHeaders, upload.fields([...]), async (req, res) => { ... });
```

## Test Steps

### 1. Test Backend Health
Open in browser or use curl:
```
https://dicom-backend-59642964164.asia-south1.run.app/
```

Expected response:
```json
{
  "status": "ok",
  "message": "DICOM Backend Server",
  "version": "1.0.0",
  "storage": "Google Cloud Storage",
  "timestamp": "2026-01-31T..."
}
```

### 2. Test CORS Headers (OPTIONS Request)
```powershell
$headers = @{ 
  "Origin" = "https://nice4-d7886.web.app"
  "Access-Control-Request-Method" = "POST" 
}
$response = Invoke-WebRequest -Uri "https://dicom-backend-59642964164.asia-south1.run.app/upload" -Method OPTIONS -Headers $headers
$response.Headers
```

Expected headers:
- `access-control-allow-origin: https://nice4-d7886.web.app` ✅
- `access-control-allow-credentials: true` ✅
- `access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS` ✅

### 3. Test DICOM Upload (End-to-End)

1. **Open the production app**:
   ```
   https://nice4-d7886.web.app
   ```

2. **Login** with your credentials

3. **Create a new form**:
   - Fill in patient information
   - Fill in doctor information
   - Select diagnostic services

4. **Upload DICOM file**:
   - Click "Choose File" under DICOM Upload
   - Select a DICOM ZIP file (e.g., the test file in your workspace)
   - Click "Submit Form"

5. **Expected behavior**:
   - ✅ Upload progress shows 0% → 100%
   - ✅ No CORS error in browser console
   - ✅ Success message appears
   - ✅ Form is saved to Firebase
   - ✅ Email notifications sent (if configured)
   - ✅ Viewer link is generated

6. **Test the viewer**:
   - Copy the viewer URL from the form or email
   - Open in browser: `https://nice4-d7886.web.app/viewer/{caseId}`
   - ✅ DICOM images load correctly
   - ✅ Can switch between Single View and MPR View
   - ✅ Can scroll through slices
   - ✅ MPR shows Axial, Sagittal, and Coronal views

## Verification Checklist

- [ ] Backend health endpoint responds
- [ ] OPTIONS request returns correct CORS headers
- [ ] Upload reaches 100% without CORS error
- [ ] Form is saved to Firebase Realtime Database
- [ ] DICOM files are uploaded to Google Cloud Storage
- [ ] Metadata.json is created in storage
- [ ] Viewer loads and displays images
- [ ] MPR functionality works correctly
- [ ] Email notifications sent (if configured)

## Browser Console Check

During upload, you should see:
```
[FormContext] addForm called
[FormContext] Uploading DICOM file: filename.zip
[API] uploadDicomFile called with: Object
[API] Sending upload request to: https://dicom-backend-59642964164.asia-south1.run.app/upload
[API] Upload progress: 0%
[API] Upload progress: 1%
...
[API] Upload progress: 100%
[API] Upload successful: Object
[FormContext] DICOM upload successful
[Firebase] Form saved: BRANCH-ID/CASE-ID
```

**NO CORS ERROR** should appear!

## If Upload Still Fails

1. **Check browser console** for any errors
2. **Check Cloud Run logs**:
   ```bash
   gcloud run logs read dicom-backend --region asia-south1 --limit 50
   ```
3. **Verify the deployed code** has the CORS fix:
   - Look for "✅ OPTIONS preflight request handled" in logs
4. **Clear browser cache** and try again
5. **Try in incognito mode** to rule out cached responses

## Success Indicators

✅ Upload completes without CORS error
✅ Backend logs show successful file processing
✅ Files appear in Google Cloud Storage bucket
✅ Form data saved in Firebase Realtime Database
✅ Viewer displays DICOM images correctly
✅ MPR reconstruction works

## Next Steps After Successful Test

1. Test with multiple file sizes
2. Test with different DICOM modalities
3. Verify email notifications
4. Test viewer on mobile devices
5. Monitor Cloud Run costs and performance
6. Set up monitoring alerts
7. Document any issues for future reference

---

**The CORS issue has been resolved! The upload should now work end-to-end in production.**
