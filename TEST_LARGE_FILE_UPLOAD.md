# Test Large File Upload - 119MB DICOM

## ✅ Configuration Complete

All required permissions and configurations have been applied:

### 1. IAM Permission ✅
```bash
Service Account: 59642964164-compute@developer.gserviceaccount.com
Role Added: roles/iam.serviceAccountTokenCreator
Status: APPLIED
```

This allows the backend to generate signed URLs for direct GCS uploads.

### 2. GCS CORS Configuration ✅
```bash
Bucket: gs://nice4-dicom-storage
Status: APPLIED
```

CORS Configuration:
```json
{
  "origin": [
    "https://nice4-d7886.web.app",
    "https://nice4-d7886.firebaseapp.com", 
    "http://localhost:5173"
  ],
  "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
  "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "x-goog-resumable"],
  "maxAgeSeconds": 3600
}
```

This allows the browser to upload directly to GCS without CORS errors.

## Test the Upload

### Step 1: Open the Application
Go to: https://nice4-d7886.web.app

### Step 2: Login
Use your credentials to login

### Step 3: Create New Form
1. Click "Create New Form"
2. Fill in patient and doctor details
3. Upload the 119MB DICOM file: `MRS M DEEPA 32 F ( DR S J DINESHRAJA) FULL SKULL.zip`

### Step 4: Monitor Console Logs
Open browser DevTools (F12) and watch for:

```
[API] Step 1: Requesting signed URL...
[API] Signed URL received: {uploadUrl: "...", destination: "..."}
[API] Step 2: Uploading to GCS...
[API] Upload progress: 1%
[API] Upload progress: 2%
...
[API] Upload progress: 100%
[API] GCS upload complete
[API] Step 3: Notifying backend to process file...
[API] Processing response: {success: true, ...}
[API] Processing complete
```

### Step 5: Verify Success
You should see:
- ✅ Upload progress reaches 100%
- ✅ No CORS errors
- ✅ No 413 errors
- ✅ Success message displayed
- ✅ Viewer URL generated
- ✅ Form saved to Firebase

## Expected Upload Flow

```
1. Browser → Cloud Run: POST /signed-url
   Response: {uploadUrl, destination}

2. Browser → GCS: PUT <uploadUrl> (119MB file)
   Direct upload to Google Cloud Storage
   Progress: 0% → 100%

3. Browser → Cloud Run: POST /upload/process
   Backend downloads from GCS and processes
   Response: {success, viewerUrl, ...}
```

## Troubleshooting

### If you see "Permission denied" error:
- IAM permission was just applied, may take 1-2 minutes to propagate
- Wait a moment and try again

### If you see CORS error on GCS upload:
- CORS configuration was just applied
- Try in incognito mode to clear cache
- Verify origin matches: https://nice4-d7886.web.app

### If upload stalls:
- Check network connection
- Check Cloud Run logs: `gcloud run services logs read dicom-backend --region asia-south1`
- Verify file is not corrupted

## Monitor Backend Processing

```bash
# Watch Cloud Run logs in real-time
gcloud run services logs read dicom-backend \
  --region asia-south1 \
  --project nice4-d7886 \
  --limit 50
```

Look for:
```
✅ Generated signed URL for: dicom/ANBU-SLM-LIC/.../upload/...
📥 Downloading dicom/ANBU-SLM-LIC/.../upload/...
✅ Downloaded 119 MB from GCS
📦 Extracting ZIP file...
✅ Extracted X DICOM files
📤 Uploading X DICOM files to GCS...
✅ Complete! Uploaded X files
📧 Sending email to: doctor@example.com
✅ Email sent successfully
```

## Success Criteria

- [x] IAM permission applied
- [x] GCS CORS configured
- [x] Backend deployed with signed URL support
- [x] Frontend deployed with 3-step upload
- [ ] 119MB file uploads successfully (TEST THIS NOW)
- [ ] No errors in console
- [ ] DICOM processing completes
- [ ] Viewer URL works
- [ ] Email notifications sent

---

**Ready to test! Try uploading the 119MB file now.**
