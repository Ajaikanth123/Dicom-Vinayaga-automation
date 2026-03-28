# Google Cloud Storage Setup Guide

## Create and Configure Google Cloud Storage Bucket

---

## Step 1: Create Storage Bucket (5 minutes)

### Option A: Using Google Cloud Console (Easier)

1. Go to: https://console.cloud.google.com/storage
2. Select project: `dicom-connect`
3. Click **Create Bucket**
4. Configure:
   - **Name**: `dicom-connect-storage` (must be globally unique)
   - **Location type**: Region
   - **Location**: `asia-south1` (Mumbai) or closest to you
   - **Storage class**: Standard
   - **Access control**: Fine-grained
   - **Protection tools**: None (for now)
5. Click **Create**

### Option B: Using gcloud CLI (Faster)

```bash
# Create bucket
gsutil mb -p dicom-connect -c STANDARD -l asia-south1 gs://dicom-connect-storage

# Or if that name is taken, try with your project ID
gsutil mb -p dicom-connect -c STANDARD -l asia-south1 gs://dicom-connect-storage-$(gcloud config get-value project)
```

---

## Step 2: Configure Bucket Permissions (3 minutes)

### Make Processed Files Public (for viewer access)

```bash
# Allow public read access to processed files
gsutil iam ch allUsers:objectViewer gs://dicom-connect-storage
```

Or in Console:
1. Go to bucket: `dicom-connect-storage`
2. Click **Permissions** tab
3. Click **Grant Access**
4. Add principal: `allUsers`
5. Role: **Storage Object Viewer**
6. Click **Save**

---

## Step 3: Set CORS Configuration (2 minutes)

Create file `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:

```bash
gsutil cors set cors.json gs://dicom-connect-storage
```

---

## Step 4: Create Service Account (5 minutes)

### Option A: Using Console

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Select project: `dicom-connect`
3. Click **Create Service Account**
4. Configure:
   - **Name**: `dicom-backend-service`
   - **Description**: Backend service for DICOM processing
5. Click **Create and Continue**
6. Grant roles:
   - **Storage Admin** (for full storage access)
   - **Firebase Admin** (for database access)
7. Click **Continue** then **Done**
8. Click on the service account
9. Go to **Keys** tab
10. Click **Add Key** > **Create New Key**
11. Choose **JSON**
12. Save as `serviceAccountKey.json`

### Option B: Using gcloud CLI

```bash
# Create service account
gcloud iam service-accounts create dicom-backend-service \
  --display-name="DICOM Backend Service"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding dicom-connect \
  --member="serviceAccount:dicom-backend-service@dicom-connect.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Grant Firebase Admin role
gcloud projects add-iam-policy-binding dicom-connect \
  --member="serviceAccount:dicom-backend-service@dicom-connect.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# Create and download key
gcloud iam service-accounts keys create serviceAccountKey.json \
  --iam-account=dicom-backend-service@dicom-connect.iam.gserviceaccount.com
```

---

## Step 5: Test Storage Access (2 minutes)

```bash
# Upload test file
echo "test" > test.txt
gsutil cp test.txt gs://dicom-connect-storage/test.txt

# Check if file exists
gsutil ls gs://dicom-connect-storage/

# Download test file
gsutil cp gs://dicom-connect-storage/test.txt test-download.txt

# Delete test file
gsutil rm gs://dicom-connect-storage/test.txt
rm test.txt test-download.txt
```

---

## Step 6: Configure Backend Environment

Update `dicom-backend/.env`:

```env
# Google Cloud Storage
GCS_PROJECT_ID=dicom-connect
GCS_BUCKET_NAME=dicom-connect-storage

# Firebase (only for database)
FIREBASE_PROJECT_ID=dicom-connect
FIREBASE_DATABASE_URL=https://dicom-connect-default-rtdb.firebaseio.com
```

---

## Folder Structure in Bucket

```
dicom-connect-storage/
├── dicom/                    # Original DICOM ZIP files
│   └── {branchId}/
│       └── {caseId}/
│           └── original.zip
├── reports/                  # PDF reports
│   └── {branchId}/
│       └── {caseId}/
│           └── report.pdf
└── processed/                # Processed images (public)
    └── {caseId}/
        ├── metadata.json
        ├── thumbnails/
        │   ├── slice_001.webp
        │   ├── slice_002.webp
        │   └── ...
        └── previews/
            ├── slice_001.webp
            ├── slice_002.webp
            └── ...
```

---

## Security Best Practices

1. **Service Account Key**
   - Never commit `serviceAccountKey.json` to git
   - Add to `.gitignore`
   - Store securely

2. **Bucket Permissions**
   - Original DICOM files: Private (service account only)
   - Processed images: Public read (for viewer)
   - Reports: Private (service account only)

3. **Access Control**
   - Use signed URLs for private files (if needed later)
   - Token-based access in viewer
   - Regular audit of permissions

---

## Cost Optimization

**Storage Pricing (asia-south1):**
- Standard Storage: $0.020/GB/month
- Class A Operations (write): $0.05/10,000 ops
- Class B Operations (read): $0.004/10,000 ops
- Network Egress: $0.12/GB (to internet)

**For 100 cases/month:**
- Storage (60GB): $1.20
- Operations: $0.10
- Egress (5GB): $0.60
- **Total: ~$1.90/month**

**Optimization Tips:**
- Use WebP format (70% smaller)
- Set lifecycle rules to delete old files
- Use CDN for frequently accessed files
- Compress before upload

---

## Lifecycle Management (Optional)

Delete old processed files after 90 days:

Create `lifecycle.json`:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 90,
          "matchesPrefix": ["processed/"]
        }
      }
    ]
  }
}
```

Apply:

```bash
gsutil lifecycle set lifecycle.json gs://dicom-connect-storage
```

---

## Monitoring

**View Storage Usage:**
```bash
gsutil du -sh gs://dicom-connect-storage
```

**List Recent Files:**
```bash
gsutil ls -lh gs://dicom-connect-storage/processed/
```

**Check Bucket Info:**
```bash
gsutil ls -L -b gs://dicom-connect-storage
```

---

## Troubleshooting

**Error: Bucket name already exists**
- Bucket names are globally unique
- Try: `dicom-connect-storage-YOUR-PROJECT-ID`

**Error: Permission denied**
- Check service account has Storage Admin role
- Verify `serviceAccountKey.json` is correct

**Error: CORS issues**
- Apply CORS configuration
- Check browser console for specific error

**Files not accessible**
- Check bucket permissions
- Verify files are public (for processed images)
- Check file URLs

---

## Next Steps

1. ✅ Bucket created
2. ✅ Permissions configured
3. ✅ Service account created
4. ✅ Backend configured
5. ⏳ Test file upload
6. ⏳ Deploy backend

---

**Google Cloud Storage is ready!** 🎉

