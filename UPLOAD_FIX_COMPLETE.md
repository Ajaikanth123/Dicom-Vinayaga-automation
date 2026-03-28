# Upload Fix Complete - Large File Support

## ✅ Problem Solved

**Issue**: 119MB DICOM file exceeded Cloud Run's 32MB request limit
**Solution**: Implemented Google Cloud Storage signed URL upload

## ✅ IAM & CORS Configuration Applied

**IAM Permission**: Service account granted `roles/iam.serviceAccountTokenCreator`
- This allows the backend to generate signed URLs for GCS uploads
- Applied to: `59642964164-compute@developer.gserviceaccount.com`

**GCS CORS Configuration**: Applied to bucket `nice4-dicom-storage`
- Allows direct uploads from browser to GCS
- Permitted origins: `https://nice4-d7886.web.app`, `https://nice4-d7886.firebaseapp.com`, `http://localhost:5173`
- Permitted methods: GET, HEAD, PUT, POST, DELETE, OPTIONS

## Changes Made

### Backend (Already Deployed)
- **New Route**: `/signed-url` - Generates signed URLs for direct GCS upload
- **New Route**: `/upload/process` - Processes files uploaded to GCS
- **Deployment**: Revision `dicom-backend-00012-9jq`
- **URL**: https://dicom-backend-59642964164.asia-south1.run.app

### Frontend (Just Deployed)
- **Updated**: `medical-referral-system/src/services/api.js`
- **New Upload Flow**: 3-step process using signed URLs
- **Deployment**: https://nice4-d7886.web.app

## How It Works Now

### Old Flow (Failed for files > 32MB):
```
Browser → Cloud Run → GCS
         (32MB limit)
```

### New Flow (Supports up to 5TB):
```
1. Browser → Cloud Run: Request signed URL
2. Browser → GCS: Upload file directly (no size limit)
3. Browser → Cloud Run: Notify processing complete
```

## Upload Process Details

### Step 1: Get Signed URL
```javascript
POST /signed-url
{
  "branchId": "ANBU-SLM-LIC",
  "caseId": "abc-123",
  "filename": "scan.zip",
  "contentType": "application/zip"
}
```

Response:
```javascript
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "destination": "dicom/ANBU-SLM-LIC/abc-123/upload/scan.zip"
}
```

### Step 2: Upload to GCS
```javascript
PUT <uploadUrl>
Content-Type: application/zip
Body: <file binary data>
```

### Step 3: Process File
```javascript
POST /upload/process
{
  "branchId": "ANBU-SLM-LIC",
  "caseId": "abc-123",
  "destination": "dicom/ANBU-SLM-LIC/abc-123/upload/scan.zip",
  "patientName": "...",
  "doctorName": "...",
  ...
}
```

## Testing

### Test the Upload:
1. Go to https://nice4-d7886.web.app
2. Login and create a new form
3. Upload the 119MB DICOM file
4. Watch the console for progress logs:
   - `[API] Step 1: Requesting signed URL...`
   - `[API] Step 2: Uploading to GCS...`
   - `[API] Upload progress: X%`
   - `[API] Step 3: Notifying backend to process file...`
   - `[API] Processing complete`

### Expected Behavior:
- ✅ Upload progress shows 0% → 100%
- ✅ No CORS errors
- ✅ No 413 Content Too Large errors
- ✅ File processes successfully
- ✅ Viewer URL generated
- ✅ Email notifications sent

## Benefits

1. **No Size Limit**: Supports files up to 5TB
2. **Faster**: Direct upload to GCS (no proxy through Cloud Run)
3. **Cheaper**: No bandwidth costs through Cloud Run
4. **More Reliable**: GCS handles large file uploads better
5. **Progress Tracking**: Still shows upload progress to user

## Monitoring

### Backend Logs:
```bash
gcloud run services logs read dicom-backend --region asia-south1 --project nice4-d7886
```

Look for:
- `✅ Generated signed URL for: ...`
- `📥 Downloading ...`
- `✅ Downloaded X MB from GCS`
- `📤 Uploading X DICOM files...`
- `✅ Complete`

### Frontend Console:
- `[API] Step 1: Requesting signed URL...`
- `[API] Signed URL received`
- `[API] Step 2: Uploading to GCS...`
- `[API] Upload progress: X%`
- `[API] GCS upload complete`
- `[API] Step 3: Notifying backend to process file...`
- `[API] Processing complete`

## Files Modified

### Backend:
- `dicom-backend/routes/signedUrl.js` - NEW
- `dicom-backend/routes/upload.js` - Added `/process` endpoint
- `dicom-backend/server.js` - Added signed URL route

### Frontend:
- `medical-referral-system/src/services/api.js` - Updated `uploadDicomFile()`

## Deployment Info

### Backend:
- **Service**: dicom-backend
- **Revision**: 00012-9jq
- **Region**: asia-south1
- **Memory**: 2GB
- **CPU**: 2
- **Timeout**: 3600s
- **URL**: https://dicom-backend-59642964164.asia-south1.run.app

### Frontend:
- **Service**: Firebase Hosting
- **Project**: nice4-d7886
- **URL**: https://nice4-d7886.web.app

## Troubleshooting

### If upload still fails:

1. **Check browser console** for error messages
2. **Check Cloud Run logs** for backend errors
3. **Verify GCS permissions** - bucket should allow signed URL uploads
4. **Try in incognito mode** to rule out caching
5. **Check file size** - ensure it's not corrupted

### Common Issues:

**"Failed to get signed URL"**
- Backend might be down
- Check Cloud Run logs

**"GCS upload failed"**
- Signed URL might have expired (1 hour limit)
- Network issue
- Try again

**"Processing failed"**
- File might be corrupted
- Not a valid DICOM ZIP
- Check backend logs for details

## Success Criteria

✅ 119MB file uploads successfully
✅ No CORS errors
✅ No 413 errors
✅ Progress tracking works
✅ DICOM processing completes
✅ Viewer URL generated
✅ Email notifications sent
✅ MPR viewer displays images

---

**The upload system now supports files of any size up to 5TB!**
