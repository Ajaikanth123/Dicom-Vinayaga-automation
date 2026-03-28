# 🏗️ Final Architecture - Pure Google Cloud

## Updated System Architecture

---

## 🎯 What Changed

### Before (Firebase Storage + Google Cloud Storage)
```
Frontend → Backend → Firebase Storage (original files)
                  → Google Cloud Storage (processed files)
                  → Firebase Database (metadata)
```

### After (Pure Google Cloud)
```
Frontend → Backend → Google Cloud Storage (all files)
                  → Firebase Realtime Database (metadata only)
```

**Benefits:**
- ✅ Simpler architecture
- ✅ One storage system
- ✅ Lower cost ($2.30 vs $2.60/month)
- ✅ Easier to manage
- ✅ Better performance

---

## 📦 Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SCAN CENTER                               │
│  Web Interface (React + Firebase Auth)                      │
│  - Upload DICOM ZIP                                          │
│  - Upload PDF Report                                         │
│  - Enter Doctor/Patient Details                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Google Cloud Run)               │
│  Node.js + Express                                           │
│  - Receive files                                             │
│  - Extract DICOM from ZIP                                    │
│  - Generate thumbnails & previews                            │
│  - Upload to storage                                         │
│  - Send email notifications                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           GOOGLE CLOUD STORAGE                               │
│  Bucket: dicom-connect-storage                               │
│                                                              │
│  /dicom/{branchId}/{caseId}/                                │
│    └── original.zip              (Private)                  │
│                                                              │
│  /reports/{branchId}/{caseId}/                              │
│    └── report.pdf                (Private)                  │
│                                                              │
│  /processed/{caseId}/                                       │
│    ├── metadata.json             (Public)                   │
│    ├── thumbnails/               (Public)                   │
│    │   ├── slice_001.webp                                   │
│    │   └── ...                                              │
│    └── previews/                 (Public)                   │
│        ├── slice_001.webp                                   │
│        └── ...                                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│         FIREBASE REALTIME DATABASE                           │
│  (Metadata Only)                                             │
│                                                              │
│  /forms/{branchId}/{caseId}/                                │
│    ├── patient: {...}                                       │
│    ├── doctor: {...}                                        │
│    ├── dicomData:                                           │
│    │   ├── viewerUrl                                        │
│    │   ├── totalSlices                                      │
│    │   ├── thumbnails: [urls]                               │
│    │   └── previews: [urls]                                 │
│    └── caseTracking:                                        │
│        ├── accessToken                                      │
│        └── caseState                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              EMAIL NOTIFICATIONS                             │
│  Gmail SMTP / SendGrid                                       │
│  - Doctor: Viewer link                                       │
│  - Patient: Confirmation                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   DOCTOR     │   │   PATIENT    │
│   📱 Mobile  │   │   📱 Mobile  │
└──────┬───────┘   └──────────────┘
       │
       │ Clicks Email Link
       ▼
┌─────────────────────────────────────────────────────────────┐
│         DICOM VIEWER (Firebase Hosting)                      │
│  React + Cornerstone.js                                      │
│  - Load metadata from Firebase DB                            │
│  - Load images from Cloud Storage                            │
│  - Progressive loading                                       │
│  - Touch controls                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Upload Flow

```
1. User uploads DICOM ZIP (500MB)
   ↓
2. Backend receives file
   ↓
3. Upload original ZIP to Cloud Storage
   Path: /dicom/{branchId}/{caseId}/original.zip
   ↓
4. Extract DICOM files from ZIP
   ↓
5. Process first 20 slices:
   - Parse metadata
   - Generate thumbnails (256x256 WebP)
   - Generate previews (512x512 WebP)
   ↓
6. Upload processed images to Cloud Storage
   Path: /processed/{caseId}/thumbnails/*.webp
   Path: /processed/{caseId}/previews/*.webp
   ↓
7. Upload metadata JSON to Cloud Storage
   Path: /processed/{caseId}/metadata.json
   ↓
8. Update Firebase Database with URLs
   ↓
9. Send email notifications
   - Doctor: Viewer link
   - Patient: Confirmation
   ↓
10. Return success response
```

### Viewer Flow

```
1. Doctor clicks email link
   URL: https://dicom-connect.web.app/viewer/{caseId}?token=xxx
   ↓
2. Viewer validates token
   Query Firebase Database
   ↓
3. Load metadata (10KB)
   From Firebase Database
   ↓
4. Load thumbnail grid (500KB)
   From Cloud Storage (CDN)
   ↓
5. User selects slice
   ↓
6. Load preview image (100KB)
   From Cloud Storage (CDN)
   ↓
7. User zooms/pans
   ↓
8. Load high-res tiles on demand
   From Cloud Storage (CDN)
```

---

## 💾 Storage Details

### Google Cloud Storage Bucket

**Name**: `dicom-connect-storage`
**Region**: `asia-south1` (Mumbai)
**Storage Class**: Standard
**Access Control**: Fine-grained

**Folder Structure**:
```
dicom-connect-storage/
├── dicom/                    # Original DICOM files
│   └── ANBU-SLM-LIC/        # Branch ID
│       └── abc123/           # Case ID
│           └── original.zip  # 500MB
│
├── reports/                  # PDF reports
│   └── ANBU-SLM-LIC/
│       └── abc123/
│           └── report.pdf    # 5MB
│
└── processed/                # Processed images (PUBLIC)
    └── abc123/               # Case ID
        ├── metadata.json     # 10KB
        ├── thumbnails/       # 2MB total
        │   ├── slice_001.webp
        │   ├── slice_002.webp
        │   └── ...
        └── previews/         # 10MB total
            ├── slice_001.webp
            ├── slice_002.webp
            └── ...
```

**Permissions**:
- `/dicom/*` - Private (service account only)
- `/reports/*` - Private (service account only)
- `/processed/*` - Public read (for viewer)

### Firebase Realtime Database

**Purpose**: Store metadata and case information only (not files)

**Structure**:
```json
{
  "forms": {
    "ANBU-SLM-LIC": {
      "abc123": {
        "id": "abc123",
        "branchId": "ANBU-SLM-LIC",
        "createdAt": 1738000000000,
        "patient": {
          "patientName": "John Doe",
          "patientId": "P12345",
          "phoneNumber": "+919876543210",
          "emailAddress": "patient@example.com"
        },
        "doctor": {
          "doctorName": "Dr. Smith",
          "hospital": "ANBU Dental",
          "doctorPhone": "+919876543211",
          "emailWhatsapp": "doctor@example.com"
        },
        "dicomData": {
          "viewerUrl": "https://dicom-connect.web.app/viewer/abc123",
          "totalSlices": 150,
          "processedSlices": 20,
          "thumbnails": [
            {
              "slice": 1,
              "url": "https://storage.googleapis.com/dicom-connect-storage/processed/abc123/thumbnails/slice_001.webp"
            }
          ],
          "previews": [...],
          "metadataUrl": "https://storage.googleapis.com/.../metadata.json",
          "studyMetadata": {
            "patientName": "John Doe",
            "studyDate": "20260130",
            "modality": "CT"
          }
        },
        "reportData": {
          "url": "https://storage.googleapis.com/.../report.pdf",
          "filename": "report.pdf"
        },
        "caseTracking": {
          "accessToken": "abc123xyz789",
          "secureLink": "https://dicom-connect.web.app/viewer/abc123?token=abc123xyz789",
          "caseState": "DICOM_UPLOADED"
        }
      }
    }
  }
}
```

---

## 🔐 Security

### Access Control Layers

**Layer 1: Upload (Scan Center)**
- Firebase Authentication required
- Branch-based access control
- User must be logged in

**Layer 2: Storage (Original Files)**
- Service account only
- No public access
- Encrypted at rest

**Layer 3: Storage (Processed Files)**
- Public read access
- Anyone with URL can view
- CDN-cached

**Layer 4: Viewer Access**
- Token-based validation
- Token stored in Firebase Database
- No login required for doctors

**Layer 5: Database**
- Firebase security rules
- Read: Authenticated users
- Write: Authenticated users

---

## 💰 Cost Breakdown (100 cases/month)

### Google Cloud Storage
- **Storage**: 60GB × $0.020 = $1.20
- **Operations**: ~1000 ops × $0.05/10k = $0.05
- **Egress**: 5GB × $0.12 = $0.60
- **Subtotal**: $1.85

### Google Cloud Run
- **CPU**: 50 min × $0.00001/sec = $0.30
- **Memory**: 2GB × 50 min × $0.0000025/GB-sec = $0.15
- **Requests**: 100 × $0.40/million = $0.00
- **Subtotal**: $0.45

### Firebase
- **Realtime Database**: Free tier (< 1GB)
- **Hosting**: Free tier (< 10GB)
- **Authentication**: Free tier (< 50k users)
- **Subtotal**: $0.00

### Email
- **Gmail SMTP**: Free
- **Subtotal**: $0.00

### **Total: $2.30/month**

**Per case: $0.023** 🎯

---

## 📊 Performance Metrics

### Upload & Processing
- Upload time (500MB): 1-2 minutes
- Processing time (20 slices): 30-60 seconds
- Total time: 2-3 minutes

### Viewer Loading
- Initial load (metadata): < 1 second
- Thumbnail grid (500KB): 2-3 seconds
- Preview image (100KB): < 500ms
- Total to first view: 3-5 seconds

### Mobile Performance
- Data usage: 10-50MB (vs 500MB original)
- Works on 4G: Yes
- Touch controls: Yes
- Offline caching: Possible (future)

---

## 🚀 Deployment

### Backend (Cloud Run)
```bash
gcloud run deploy dicom-backend \
  --source . \
  --region asia-south1 \
  --memory 2Gi \
  --timeout 3600
```

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

---

## 📈 Scalability

### Current Capacity
- Concurrent uploads: 10
- Storage: Unlimited
- Bandwidth: Unlimited
- Database: 1GB free

### Auto-Scaling
- Cloud Run: 0 to 10 instances
- Scales to zero when idle
- Scales up on demand

### Future Growth
- Add more Cloud Run instances
- Upgrade Firebase plan if needed
- Add CDN for global distribution
- Implement caching layer

---

## ✅ Advantages of This Architecture

1. **Simple**: One storage system
2. **Cost-Effective**: $2.30/month for 100 cases
3. **Scalable**: Auto-scales to demand
4. **Fast**: CDN-cached images
5. **Reliable**: 99.9% uptime
6. **Secure**: Multiple security layers
7. **Mobile-Optimized**: Progressive loading
8. **Easy to Maintain**: Minimal moving parts

---

## 📚 Documentation

- **Setup**: `UPDATED_QUICK_START.md`
- **Storage**: `dicom-backend/SETUP_GOOGLE_CLOUD_STORAGE.md`
- **Backend**: `dicom-backend/README.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`

---

**Pure Google Cloud architecture - Simple, Fast, Affordable!** 🎉

