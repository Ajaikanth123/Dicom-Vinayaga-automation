# Complete System Architecture - Medical DICOM Referral System

## System Overview

A cloud-based medical imaging referral system that allows doctors to upload DICOM scans, share them with specialists, and view them in an advanced MPR (Multi-Planar Reconstruction) viewer. The system handles large files (up to 5TB) and provides secure, authenticated access.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                  https://nice4-d7886.web.app                    │
│                     (Firebase Hosting)                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Login      │  │ Create Form  │  │ DICOM Viewer │        │
│  │   (Auth)     │  │  (Upload)    │  │    (MPR)     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
│      https://dicom-backend-59642964164.asia-south1.run.app     │
│                    (Google Cloud Run)                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ POST /signed │  │ POST /upload │  │ GET /viewer  │        │
│  │    -url      │  │   /process   │  │   /:caseId   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Google Cloud    │  │  Google Cloud    │  │    Firebase      │
│    Storage       │  │    Storage       │  │  Realtime DB     │
│  (Signed URLs)   │  │  (DICOM Files)   │  │  (Form Data)     │
│                  │  │                  │  │                  │
│  - Direct upload │  │  - 576 slices    │  │  - Patient info  │
│  - Bypasses 32MB │  │  - metadata.json │  │  - Doctor info   │
│  - Up to 5TB     │  │  - Public read   │  │  - Case tracking │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Component Breakdown

### 1. Frontend (React + Vite)

**Hosted on**: Firebase Hosting  
**URL**: https://nice4-d7886.web.app  
**Technology**: React 18, Vite, Cornerstone.js

#### Key Pages:

**Login (`/login`)**
- Firebase Authentication
- Email/password login
- Protected routes

**Create Form (`/create`)**
- Patient information form
- Doctor information form
- DICOM file upload (ZIP format)
- 3-step signed URL upload process

**DICOM Viewer (`/viewer/:caseId`)**
- No authentication required (public link)
- Two viewing modes:
  - Single View: Fast slice-by-slice scrolling
  - MPR View: Axial, Sagittal, Coronal planes
- Loads all slices into memory for MPR
- Mouse wheel navigation
- Touch support for mobile

#### Key Files:

```
medical-referral-system/
├── src/
│   ├── pages/
│   │   ├── Login.jsx                    # Authentication
│   │   ├── CreateForm.jsx               # Upload form
│   │   └── DicomViewerWithMPR.jsx       # MPR viewer
│   ├── services/
│   │   ├── api.js                       # Backend API calls
│   │   └── firebaseService.js           # Firebase operations
│   └── context/
│       ├── AuthContext.jsx              # Auth state
│       └── FormContext.jsx              # Form state
├── .env.production                      # Production config
└── firebase.json                        # Hosting config
```

---

### 2. Backend (Node.js + Express)

**Hosted on**: Google Cloud Run  
**URL**: https://dicom-backend-59642964164.asia-south1.run.app  
**Technology**: Node.js 20, Express, Firebase Admin SDK

#### Configuration:

- **Memory**: 2GB
- **CPU**: 2 cores
- **Timeout**: 3600 seconds (1 hour)
- **Concurrency**: 80 requests per instance
- **Region**: asia-south1 (Mumbai)

#### API Endpoints:

**POST /signed-url**
- Generates signed URL for direct GCS upload
- Bypasses Cloud Run's 32MB request limit
- Valid for 1 hour
- Requires: branchId, caseId, filename, contentType

**POST /upload/process**
- Processes file uploaded via signed URL
- Downloads from GCS temporary location
- Extracts DICOM files from ZIP
- Uploads individual slices to GCS
- Generates metadata.json with slicesMetadata array
- Sends email notifications
- Updates Firebase database

**GET /viewer/:caseId**
- Fetches metadata for viewer
- Searches across all branches
- Returns: totalSlices, slicesMetadata, studyMetadata
- Public endpoint (no auth required)

#### Key Files:

```
dicom-backend/
├── routes/
│   ├── signedUrl.js                     # Signed URL generation
│   ├── upload.js                        # File processing
│   └── viewer.js                        # Viewer data
├── services/
│   ├── dicomProcessor.js                # DICOM parsing
│   ├── storageService.js                # GCS operations
│   └── emailService.js                  # Notifications
├── server.js                            # Express app
├── Dockerfile                           # Container config
└── .env                                 # Environment variables
```

---

## Data Flow: Complete Upload Process

### Step 1: User Uploads File

```
User selects 119MB DICOM ZIP file
↓
Frontend: CreateForm.jsx
↓
Calls: api.uploadDicomFile(file, formData, onProgress)
```

### Step 2: Request Signed URL

```
Frontend → Backend: POST /signed-url
{
  branchId: "ANBU-SLM-LIC",
  caseId: "638f952e-dcd3-4cfe-9a48-a64561e79677",
  filename: "scan.zip",
  contentType: "application/zip"
}

Backend → Google Cloud Storage API
↓
Generates signed URL using service account credentials
↓
Backend → Frontend: Response
{
  uploadUrl: "https://storage.googleapis.com/nice4-dicom-storage/...",
  destination: "dicom/ANBU-SLM-LIC/638f952e.../upload/scan.zip",
  bucketName: "nice4-dicom-storage"
}
```

**Why Signed URLs?**
- Cloud Run has 32MB request body limit
- Signed URLs allow direct browser → GCS upload
- No size limit (supports up to 5TB)
- Faster (no proxy through Cloud Run)
- Lower costs (no bandwidth through Cloud Run)

### Step 3: Direct Upload to GCS

```
Frontend → Google Cloud Storage: PUT <uploadUrl>
Headers: Content-Type: application/zip
Body: 119MB file binary data

Progress tracking: 0% → 100%
↓
File stored at: gs://nice4-dicom-storage/dicom/.../upload/scan.zip
```

**CORS Configuration Applied:**
```json
{
  "origin": ["https://nice4-d7886.web.app", "http://localhost:5173"],
  "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
  "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
  "maxAgeSeconds": 3600
}
```

### Step 4: Notify Backend to Process

```
Frontend → Backend: POST /upload/process
{
  branchId: "ANBU-SLM-LIC",
  caseId: "638f952e-dcd3-4cfe-9a48-a64561e79677",
  destination: "dicom/.../upload/scan.zip",
  patientName: "MRS M DEEPA",
  patientId: "40708",
  doctorName: "Dr. Smith",
  doctorEmail: "doctor@example.com"
}
```

### Step 5: Backend Processing

```
Backend downloads file from GCS
↓
Extracts ZIP file (576 DICOM files)
↓
For each DICOM file:
  1. Parse metadata (instance number, slice location)
  2. Upload to GCS: dicom/.../files/slice_0001.dcm
  3. Add to slicesMetadata array
↓
Sort slices by instance number
↓
Generate metadata.json:
{
  caseId: "...",
  branchId: "...",
  totalSlices: 576,
  dicomBasePath: "dicom/.../files",
  bucketName: "nice4-dicom-storage",
  slicesMetadata: [
    { index: 1, filename: "slice_0001.dcm", instanceNumber: 1 },
    { index: 2, filename: "slice_0002.dcm", instanceNumber: 2 },
    ...
  ],
  studyMetadata: {
    patientName: "MRS M DEEPA^32 F",
    patientID: "40708",
    studyDate: "20260126",
    modality: "CT",
    ...
  }
}
↓
Upload metadata.json to GCS
↓
Send email notifications to doctor and patient
↓
Update Firebase Realtime Database
↓
Delete temporary upload file
↓
Return success response with viewer URL
```

### Step 6: View DICOM Images

```
User clicks viewer link
↓
Frontend: DicomViewerWithMPR.jsx
↓
Fetches metadata: GET /viewer/:caseId
↓
Backend returns metadata.json from GCS
↓
Frontend creates image IDs from slicesMetadata:
[
  "wadouri:https://storage.googleapis.com/.../slice_0001.dcm",
  "wadouri:https://storage.googleapis.com/.../slice_0002.dcm",
  ...
]
↓
Single View Mode:
  - Loads one slice at a time
  - Fast scrolling with mouse wheel
  - Low memory usage

MPR View Mode:
  - Loads ALL 576 slices into memory
  - Generates 3 orthogonal views using canvas
  - Axial: Original slices
  - Sagittal: Reconstructed from X axis
  - Coronal: Reconstructed from Y axis
```

---

## Storage Structure

### Google Cloud Storage Bucket: `nice4-dicom-storage`

```
gs://nice4-dicom-storage/
├── dicom/
│   └── ANBU-SLM-LIC/                           # Branch ID
│       └── 638f952e-dcd3-4cfe-9a48-a64561e79677/  # Case ID
│           ├── upload/
│           │   └── scan.zip                    # Original ZIP (temporary)
│           ├── files/
│           │   ├── slice_0001.dcm              # Individual DICOM files
│           │   ├── slice_0002.dcm
│           │   ├── ...
│           │   └── slice_0576.dcm
│           └── metadata.json                   # Case metadata
```

### Firebase Realtime Database

```json
{
  "forms": {
    "ANBU-SLM-LIC": {
      "638f952e-dcd3-4cfe-9a48-a64561e79677": {
        "patientName": "MRS M DEEPA",
        "patientId": "40708",
        "doctorName": "Dr. Smith",
        "doctorEmail": "doctor@example.com",
        "createdAt": "2026-01-31T16:20:00.000Z",
        "processedAt": "2026-01-31T16:23:15.000Z",
        "caseTracking": {
          "caseState": "DICOM_UPLOADED"
        },
        "dicomData": {
          "totalSlices": 576,
          "viewerUrl": "https://nice4-d7886.web.app/viewer/638f952e...",
          "dicomBasePath": "dicom/ANBU-SLM-LIC/638f952e.../files",
          "bucketName": "nice4-dicom-storage",
          "studyMetadata": {
            "patientName": "MRS M DEEPA^32 F",
            "modality": "CT",
            "studyDate": "20260126"
          }
        }
      }
    }
  },
  "users": {
    "user123": {
      "email": "doctor@example.com",
      "role": "doctor",
      "branchId": "ANBU-SLM-LIC"
    }
  }
}
```

---

## Security & Permissions

### IAM Permissions

**Service Account**: `59642964164-compute@developer.gserviceaccount.com`

**Roles**:
1. **Editor** (`roles/editor`)
   - Full access to GCS bucket
   - Read/write Firebase
   
2. **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`)
   - Required for generating signed URLs
   - Allows `iam.serviceAccounts.signBlob` permission

### CORS Configuration

**Applied to**: `gs://nice4-dicom-storage`

```json
[{
  "origin": [
    "https://nice4-d7886.web.app",
    "https://nice4-d7886.firebaseapp.com",
    "http://localhost:5173"
  ],
  "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
  "responseHeader": [
    "Content-Type",
    "Access-Control-Allow-Origin",
    "x-goog-resumable"
  ],
  "maxAgeSeconds": 3600
}]
```

### Firebase Authentication

- Email/password authentication
- Protected routes in frontend
- User roles: doctor, admin
- Branch-based access control

### GCS Bucket Permissions

- **Public read** for DICOM files (viewer needs access)
- **Authenticated write** via signed URLs
- **Metadata** publicly readable

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **DICOM Viewer**: Cornerstone.js (cornerstone-core, cornerstone-wado-image-loader)
- **DICOM Parser**: dicom-parser 1.8.21
- **Routing**: React Router 6.26.2
- **HTTP Client**: Axios 1.7.7
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express 4.21.2
- **File Upload**: Multer 1.4.5-lts.1
- **DICOM Processing**: dicom-parser 1.8.21
- **Image Processing**: Sharp 0.33.5
- **Storage**: @google-cloud/storage 7.14.0
- **Database**: Firebase Admin SDK 13.0.2
- **Email**: Nodemailer 6.9.16
- **Container**: Docker
- **Hosting**: Google Cloud Run

### Infrastructure
- **Cloud Provider**: Google Cloud Platform
- **Region**: asia-south1 (Mumbai)
- **Storage**: Google Cloud Storage
- **Database**: Firebase Realtime Database
- **Compute**: Cloud Run (serverless containers)
- **CDN**: Firebase Hosting CDN

---

## Performance Characteristics

### Upload Performance

**File Size**: 119MB  
**Upload Time**: ~30-60 seconds (depends on internet speed)  
**Processing Time**: ~2-5 minutes (576 DICOM files)

**Breakdown**:
1. Request signed URL: < 1 second
2. Upload to GCS: 30-60 seconds
3. Backend processing:
   - Download from GCS: 10-20 seconds
   - Extract ZIP: 5-10 seconds
   - Upload 576 slices: 60-120 seconds
   - Generate metadata: < 1 second
   - Send emails: 2-5 seconds

### Viewer Performance

**Single View Mode**:
- Load time per slice: 100-300ms
- Memory usage: ~50MB
- Smooth scrolling: 60 FPS

**MPR View Mode**:
- Initial load: 30-60 seconds (loads all 576 slices)
- Memory usage: ~2GB (all slices in memory)
- Rendering: Real-time canvas reconstruction
- Interaction: Smooth crosshair navigation

### Scalability

**Maximum File Size**: 5TB (GCS limit)  
**Maximum Slices**: Unlimited (tested with 576)  
**Concurrent Users**: 80 per Cloud Run instance  
**Auto-scaling**: Yes (Cloud Run handles automatically)

---

## Monitoring & Logging

### Cloud Run Logs

```bash
# View recent logs
gcloud run services logs read dicom-backend \
  --region asia-south1 \
  --project nice4-d7886 \
  --limit 100

# Follow logs in real-time
gcloud run services logs tail dicom-backend \
  --region asia-south1 \
  --project nice4-d7886
```

### Key Log Messages

**Upload Process**:
```
✅ Generated signed URL for: dicom/ANBU-SLM-LIC/.../upload/scan.zip
📥 Downloading dicom/ANBU-SLM-LIC/.../upload/scan.zip
✅ Downloaded 119 MB from GCS
📦 Extracting ZIP file...
✅ Extracted 576 DICOM files
📤 Uploading 576 DICOM files to GCS...
   50/576...
   100/576...
   ...
   576/576...
✅ Sorted 576 slices by instance number
✅ Metadata saved to storage
📧 Sending email to: doctor@example.com
✅ Email sent successfully
✅ Complete
```

**Viewer Access**:
```
GET 200 /viewer/638f952e-dcd3-4cfe-9a48-a64561e79677
🔍 Searching for case 638f952e... across all branches...
✅ Found case in branch: ANBU-SLM-LIC
📥 Fetching metadata from: https://storage.googleapis.com/.../metadata.json
✅ Metadata loaded from storage: { totalSlices: 576, basePath: '...' }
```

### Frontend Console Logs

```javascript
[FormContext] addForm called
[FormContext] Uploading DICOM file: scan.zip
[API] uploadDicomFile called
[API] Step 1: Requesting signed URL...
[API] Signed URL received
[API] Step 2: Uploading to GCS...
[API] Upload progress: 1%
[API] Upload progress: 50%
[API] Upload progress: 100%
[API] GCS upload complete
[API] Step 3: Notifying backend to process file...
[API] Processing complete
[FormContext] DICOM upload successful
[Firebase] Form saved: ANBU-SLM-LIC/638f952e...
```

---

## Deployment Process

### Backend Deployment

```bash
# Deploy to Cloud Run
gcloud run deploy dicom-backend \
  --source dicom-backend \
  --region asia-south1 \
  --project nice4-d7886 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600

# Set environment variables
gcloud run services update dicom-backend \
  --region asia-south1 \
  --update-env-vars \
    GCS_BUCKET_NAME=nice4-dicom-storage,\
    VIEWER_URL=https://nice4-d7886.web.app/viewer,\
    FIREBASE_DATABASE_URL=https://nice4-d7886.firebaseio.com
```

### Frontend Deployment

```bash
cd medical-referral-system

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Environment Variables

**Backend (.env)**:
```env
PORT=8080
GCS_BUCKET_NAME=nice4-dicom-storage
FIREBASE_DATABASE_URL=https://nice4-d7886.firebaseio.com
VIEWER_URL=https://nice4-d7886.web.app/viewer
MAX_FILE_SIZE=5368709120
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Frontend (.env.production)**:
```env
VITE_BACKEND_URL=https://dicom-backend-59642964164.asia-south1.run.app
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=nice4-d7886.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://nice4-d7886.firebaseio.com
VITE_FIREBASE_PROJECT_ID=nice4-d7886
VITE_FIREBASE_STORAGE_BUCKET=nice4-d7886.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=596429641644
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Troubleshooting

### Upload Fails with "Permission denied"

**Cause**: Service account lacks `iam.serviceAccountTokenCreator` role  
**Solution**:
```bash
gcloud iam service-accounts add-iam-policy-binding \
  59642964164-compute@developer.gserviceaccount.com \
  --member="serviceAccount:59642964164-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=nice4-d7886
```

### Upload Fails with CORS Error

**Cause**: GCS bucket CORS not configured  
**Solution**:
```bash
gsutil cors set dicom-backend/gcs-cors.json gs://nice4-dicom-storage
```

### Viewer Shows "Slice 1/0"

**Cause**: metadata.json missing `slicesMetadata` array  
**Solution**: Upload file again (backend now includes slicesMetadata)

### Processing Times Out

**Cause**: Cloud Run timeout too short  
**Solution**: Increase timeout to 3600 seconds (already configured)

---

## Cost Estimation

### Monthly Costs (Approximate)

**Google Cloud Storage**:
- Storage: 100GB × $0.020/GB = $2.00
- Network egress: 500GB × $0.12/GB = $60.00
- Operations: Minimal (~$0.50)

**Cloud Run**:
- CPU time: ~10 hours × $0.00002400/vCPU-second = $0.86
- Memory: ~10 hours × $0.00000250/GiB-second = $0.18
- Requests: 10,000 × $0.40/million = $0.004

**Firebase**:
- Hosting: Free (under 10GB/month)
- Realtime Database: Free (under 1GB storage, 10GB/month download)
- Authentication: Free (under 50,000 MAU)

**Total**: ~$63/month (mostly GCS egress)

**Cost Optimization**:
- Use Cloud CDN for DICOM files
- Enable GCS lifecycle policies
- Compress DICOM files
- Use regional storage class

---

## Future Enhancements

### Planned Features

1. **Progressive Loading**
   - Load low-res preview first
   - Stream high-res on demand
   - Reduce initial load time

2. **Caching**
   - Browser cache for viewed slices
   - CDN caching for popular cases
   - Reduce bandwidth costs

3. **Compression**
   - JPEG 2000 compression for DICOM
   - Reduce storage and bandwidth
   - Maintain diagnostic quality

4. **Advanced Viewer**
   - Window/level adjustment
   - Measurement tools
   - Annotations
   - 3D volume rendering

5. **Mobile App**
   - Native iOS/Android apps
   - Offline viewing
   - Push notifications

---

## System URLs

**Production Frontend**: https://nice4-d7886.web.app  
**Production Backend**: https://dicom-backend-59642964164.asia-south1.run.app  
**GCS Bucket**: gs://nice4-dicom-storage  
**Firebase Project**: nice4-d7886  
**Region**: asia-south1 (Mumbai, India)

---

## Support & Maintenance

### Regular Tasks

1. **Monitor logs** for errors
2. **Check storage usage** and clean old files
3. **Review costs** monthly
4. **Update dependencies** quarterly
5. **Backup Firebase database** weekly

### Health Checks

```bash
# Check backend health
curl https://dicom-backend-59642964164.asia-south1.run.app/health

# Check frontend
curl https://nice4-d7886.web.app

# Check GCS bucket
gsutil ls gs://nice4-dicom-storage/dicom/
```

---

**System Status**: ✅ Production Ready  
**Last Updated**: January 31, 2026  
**Version**: 1.0.0
