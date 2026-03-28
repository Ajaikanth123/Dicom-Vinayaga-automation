# ⚡ Updated Quick Start - Pure Google Cloud

## Backend with Google Cloud Storage (No Firebase Storage)

---

## 🎯 What Changed

- ❌ Removed Firebase Storage dependency
- ✅ Using Google Cloud Storage for everything
- ✅ Firebase only for Realtime Database (metadata)
- ✅ Simpler architecture
- ✅ Lower cost

---

## 📦 Architecture

```
Frontend → Backend (Cloud Run)
              ↓
    Google Cloud Storage
    ├── Original DICOM files
    ├── PDF reports
    └── Processed images
              ↓
    Firebase Realtime Database
    └── Metadata only
```

---

## 🚀 Setup Steps (1 Hour)

### Step 1: Create Google Cloud Storage Bucket (10 minutes)

```bash
# Login to Google Cloud
gcloud auth login
gcloud config set project dicom-connect

# Create storage bucket
gsutil mb -p dicom-connect -c STANDARD -l asia-south1 gs://dicom-connect-storage

# Make processed files public (for viewer)
gsutil iam ch allUsers:objectViewer gs://dicom-connect-storage

# Set CORS
echo '[{"origin":["*"],"method":["GET","HEAD"],"responseHeader":["Content-Type"],"maxAgeSeconds":3600}]' > cors.json
gsutil cors set cors.json gs://dicom-connect-storage
rm cors.json
```

### Step 2: Create Service Account (5 minutes)

```bash
# Create service account
gcloud iam service-accounts create dicom-backend-service \
  --display-name="DICOM Backend Service"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding dicom-connect \
  --member="serviceAccount:dicom-backend-service@dicom-connect.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Grant Firebase Admin role (for database)
gcloud projects add-iam-policy-binding dicom-connect \
  --member="serviceAccount:dicom-backend-service@dicom-connect.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

# Create key
cd dicom-backend
gcloud iam service-accounts keys create serviceAccountKey.json \
  --iam-account=dicom-backend-service@dicom-connect.iam.gserviceaccount.com
```

### Step 3: Install Backend Dependencies (2 minutes)

```bash
cd dicom-backend
npm install
```

### Step 4: Configure Environment (3 minutes)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=8080
NODE_ENV=production

# Firebase (only for database)
FIREBASE_PROJECT_ID=dicom-connect
FIREBASE_DATABASE_URL=https://dicom-connect-default-rtdb.firebaseio.com

# Google Cloud Storage
GCS_PROJECT_ID=dicom-connect
GCS_BUCKET_NAME=dicom-connect-storage

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# URLs
FRONTEND_URL=http://localhost:5173
VIEWER_URL=http://localhost:5173/viewer
```

### Step 5: Get Gmail App Password (5 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to App passwords
4. Create new: Mail > Other (DICOM Backend)
5. Copy password to `.env`

### Step 6: Test Locally (5 minutes)

```bash
npm run dev
```

Open: http://localhost:5000

Should see:
```json
{
  "status": "ok",
  "message": "DICOM Backend Server",
  "storage": "Google Cloud Storage"
}
```

### Step 7: Deploy to Cloud Run (15 minutes)

```bash
# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Deploy
gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 3600 \
  --max-instances 10

# Set environment variables
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="GCS_BUCKET_NAME=dicom-connect-storage,EMAIL_SERVICE=gmail,EMAIL_USER=your-email@gmail.com,EMAIL_PASSWORD=your-app-password"

# Set service account (from file)
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="FIREBASE_SERVICE_ACCOUNT=$(cat serviceAccountKey.json | tr -d '\n')"
```

### Step 8: Get Backend URL (1 minute)

```bash
gcloud run services describe dicom-backend \
  --region asia-south1 \
  --format='value(status.url)'
```

Copy the URL (e.g., `https://dicom-backend-xxx.run.app`)

### Step 9: Update Frontend (2 minutes)

Edit `medical-referral-system/.env`:

```env
VITE_API_URL=https://your-backend-url.run.app
VITE_VIEWER_URL=https://dicom-connect.web.app/viewer
```

### Step 10: Test End-to-End (10 minutes)

```bash
cd medical-referral-system
npm run dev
```

1. Go to http://localhost:5173
2. Login
3. Create form
4. Upload DICOM ZIP
5. Check email!

---

## ✅ What You Get

### Storage Structure

```
gs://dicom-connect-storage/
├── dicom/                    # Original files (private)
│   └── {branchId}/{caseId}/original.zip
├── reports/                  # PDF reports (private)
│   └── {branchId}/{caseId}/report.pdf
└── processed/                # Processed images (public)
    └── {caseId}/
        ├── metadata.json
        ├── thumbnails/*.webp
        └── previews/*.webp
```

### Firebase Database

```
forms/
└── {branchId}/
    └── {caseId}/
        ├── patient: {...}
        ├── doctor: {...}
        ├── dicomData:
        │   ├── viewerUrl
        │   ├── thumbnails: [...]
        │   └── previews: [...]
        └── caseTracking: {...}
```

---

## 💰 Updated Costs (100 cases/month)

| Service | Cost |
|---------|------|
| Google Cloud Storage | $1.20 |
| Cloud Run | $0.50 |
| Bandwidth | $0.60 |
| Firebase Database | Free |
| Email | Free |
| **Total** | **$2.30/month** |

**Even cheaper!** 🎉

---

## 🔍 Useful Commands

**View storage usage:**
```bash
gsutil du -sh gs://dicom-connect-storage
```

**List files:**
```bash
gsutil ls -r gs://dicom-connect-storage/processed/
```

**View logs:**
```bash
gcloud run services logs read dicom-backend --region asia-south1 --limit 50
```

**Update backend:**
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1
```

---

## 🐛 Troubleshooting

**Error: Bucket not found**
```bash
# Check bucket exists
gsutil ls gs://dicom-connect-storage

# Create if missing
gsutil mb -p dicom-connect -l asia-south1 gs://dicom-connect-storage
```

**Error: Permission denied**
```bash
# Check service account roles
gcloud projects get-iam-policy dicom-connect \
  --flatten="bindings[].members" \
  --filter="bindings.members:dicom-backend-service"
```

**Error: Files not accessible**
```bash
# Make bucket public
gsutil iam ch allUsers:objectViewer gs://dicom-connect-storage
```

---

## 📚 Documentation

- **Detailed Setup**: `dicom-backend/SETUP_GOOGLE_CLOUD_STORAGE.md`
- **Backend README**: `dicom-backend/README.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`

---

## ✅ Checklist

- [ ] Google Cloud Storage bucket created
- [ ] Service account created with keys
- [ ] Backend dependencies installed
- [ ] Environment variables configured
- [ ] Gmail app password obtained
- [ ] Backend tested locally
- [ ] Backend deployed to Cloud Run
- [ ] Frontend .env updated
- [ ] End-to-end test successful

---

**Pure Google Cloud setup complete!** 🚀

No Firebase Storage needed - everything in Google Cloud Storage!

