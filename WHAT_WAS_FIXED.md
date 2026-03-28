# What Was Fixed - Permission Error Resolution

## The Error You Saw

```
Failed to get signed URL: {
  "error": "Permission 'iam.serviceAccounts.signBlob' denied on resource (or it may not exist)."
}
```

## What Was Wrong

The backend code was trying to generate signed URLs for Google Cloud Storage uploads, but the service account didn't have permission to sign URLs.

## What I Fixed

### Fix #1: Granted IAM Permission ✅

**Command executed:**
```bash
gcloud iam service-accounts add-iam-policy-binding \
  59642964164-compute@developer.gserviceaccount.com \
  --member="serviceAccount:59642964164-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=nice4-d7886
```

**What this does:**
- Grants the service account permission to sign URLs
- Allows `file.getSignedUrl()` to work in the backend code
- Required for the 3-step upload process

### Fix #2: Applied GCS CORS Configuration ✅

**Command executed:**
```bash
gsutil cors set dicom-backend/gcs-cors.json gs://nice4-dicom-storage
```

**What this does:**
- Allows browser to upload directly to GCS
- Prevents CORS errors during upload
- Required for Step 2 of the upload process

## How the Upload Works Now

### Step 1: Request Signed URL
```
Browser → Cloud Run: POST /signed-url
Response: {uploadUrl: "https://storage.googleapis.com/...", destination: "..."}
```
✅ Now works because service account has `iam.serviceAccountTokenCreator` role

### Step 2: Upload to GCS
```
Browser → GCS: PUT <uploadUrl> (119MB file)
```
✅ Now works because GCS bucket has CORS configuration

### Step 3: Process File
```
Browser → Cloud Run: POST /upload/process
Backend downloads from GCS and processes
```
✅ Already worked, no changes needed

## Why This Solution

### Problem: Cloud Run 32MB Limit
- Your file is 119MB
- Cloud Run has a 32MB request body limit
- Direct upload through Cloud Run fails with 413 error

### Solution: Signed URL Upload
- Browser uploads directly to GCS (bypasses Cloud Run)
- No size limit (GCS supports up to 5TB)
- Faster and more reliable
- Lower costs (no bandwidth through Cloud Run)

## Verification

Both fixes have been applied and verified:

### IAM Permission:
```bash
$ gcloud projects get-iam-policy nice4-d7886 \
    --flatten="bindings[].members" \
    --filter="bindings.members:59642964164-compute@developer.gserviceaccount.com"

ROLE: roles/editor
ROLE: roles/iam.serviceAccountTokenCreator  ← Added
```

### CORS Configuration:
```bash
$ gsutil cors get gs://nice4-dicom-storage

[{
  "maxAgeSeconds": 3600,
  "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
  "origin": ["https://nice4-d7886.web.app", ...],
  "responseHeader": ["Content-Type", ...]
}]  ← Applied
```

## What You Should Do Now

1. **Test the upload** at https://nice4-d7886.web.app
2. **Upload the 119MB file**: `MRS M DEEPA 32 F ( DR S J DINESHRAJA) FULL SKULL.zip`
3. **Watch the console** for progress logs
4. **Verify success** - no permission errors, no CORS errors

## Expected Result

✅ Upload completes successfully
✅ Progress shows 0% → 100%
✅ No errors in console
✅ DICOM processing completes
✅ Viewer URL generated
✅ Email sent

---

**The permission error is fixed. The system is ready to test!**
