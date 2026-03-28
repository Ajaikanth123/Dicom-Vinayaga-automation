# Large File Upload Solution - Cloud Run 32MB Limit

## Problem Discovered

The CORS error was a **red herring**! The real issue was:

**Status Code: 413 Content Too Large**

- Your DICOM file is **119MB**
- Cloud Run has a **32MB request body size limit**
- When the request exceeds this limit, Cloud Run returns 413 BEFORE sending CORS headers
- The browser then reports a CORS error because no headers were received

## Solution: Google Cloud Storage Signed URLs

Instead of uploading through Cloud Run, we use **direct upload to GCS**:

### Flow:
1. Frontend requests a signed URL from backend (`POST /signed-url`)
2. Backend generates a temporary signed URL for GCS upload
3. Frontend uploads file directly to GCS using the signed URL (bypasses Cloud Run)
4. Frontend notifies backend that upload is complete (`POST /upload/process`)
5. Backend downloads file from GCS and processes it

### Benefits:
- No size limit (GCS supports files up to 5TB)
- Faster uploads (direct to GCS, no proxy through Cloud Run)
- Lower Cloud Run costs (no bandwidth through Cloud Run)
- More reliable for large files

## Backend Implementation

### New Endpoints:

**1. POST /signed-url** - Generate signed URL
```javascript
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
  "destination": "dicom/ANBU-SLM-LIC/abc-123/upload/scan.zip",
  "bucketName": "nice4-dicom-storage"
}
```

**2. POST /upload/process** - Process uploaded file
```javascript
{
  "branchId": "ANBU-SLM-LIC",
  "caseId": "abc-123",
  "destination": "dicom/ANBU-SLM-LIC/abc-123/upload/scan.zip",
  "patientName": "John Doe",
  "patientId": "P123",
  "doctorName": "Dr. Smith",
  "doctorEmail": "doctor@example.com"
}
```

## Frontend Changes Needed

You need to update the frontend upload logic in `medical-referral-system/src/services/api.js`:

```javascript
export const uploadDicomFile = async (file, formData, onProgress) => {
  try {
    // Step 1: Get signed URL
    const signedUrlResponse = await axios.post(`${BACKEND_URL}/signed-url`, {
      branchId: formData.branchId,
      caseId: formData.caseId,
      filename: file.name,
      contentType: 'application/zip'
    });

    const { uploadUrl, destination } = signedUrlResponse.data;

    // Step 2: Upload directly to GCS
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': 'application/zip'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    });

    // Step 3: Notify backend to process
    const processResponse = await axios.post(`${BACKEND_URL}/upload/process`, {
      branchId: formData.branchId,
      caseId: formData.caseId,
      destination,
      patientName: formData.patientName,
      patientId: formData.patientId,
      patientEmail: formData.patientEmail,
      doctorName: formData.doctorName,
      doctorEmail: formData.doctorEmail,
      hospital: formData.hospital
    });

    return processResponse.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
```

## Testing

1. Backend is deployed: `https://dicom-backend-59642964164.asia-south1.run.app`
2. New endpoints available:
   - `/signed-url` - Generate upload URL
   - `/upload/process` - Process uploaded file
3. Old `/upload` endpoint still works for files < 32MB

## ✅ Configuration Complete

All required configurations have been applied:

### 1. IAM Permission ✅
```bash
gcloud iam service-accounts add-iam-policy-binding \
  59642964164-compute@developer.gserviceaccount.com \
  --member="serviceAccount:59642964164-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=nice4-d7886
```
**Status**: APPLIED - Service account can now generate signed URLs

### 2. GCS CORS Configuration ✅
```bash
gsutil cors set dicom-backend/gcs-cors.json gs://nice4-dicom-storage
```
**Status**: APPLIED - Browser can now upload directly to GCS

### 3. Frontend Updated ✅
- Updated `medical-referral-system/src/services/api.js` with 3-step upload flow
- Deployed to Firebase Hosting

### 4. Backend Deployed ✅
- Revision: `dicom-backend-00012-9jq`
- Endpoints: `/signed-url` and `/upload/process`
- URL: https://dicom-backend-59642964164.asia-south1.run.app

## Next Steps

1. ✅ IAM permission granted
2. ✅ GCS CORS configured
3. ✅ Frontend deployed
4. ✅ Backend deployed
5. **→ TEST with 119MB file at https://nice4-d7886.web.app**

## Files Modified

- `dicom-backend/routes/signedUrl.js` - NEW: Signed URL generation
- `dicom-backend/routes/upload.js` - Added `/process` endpoint
- `dicom-backend/server.js` - Added signed URL route

## Deployment

Backend deployed successfully:
- Revision: `dicom-backend-00012-9jq`
- URL: `https://dicom-backend-59642964164.asia-south1.run.app`
- Memory: 2GB
- CPU: 2
- Timeout: 3600s (1 hour)

---

**The CORS configuration is correct - the issue was file size, not CORS!**
