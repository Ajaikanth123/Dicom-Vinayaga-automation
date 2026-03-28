# DICOM Backend Server

Backend processing server for DICOM cloud viewer system.

## Features

- DICOM ZIP file extraction and processing
- Thumbnail and preview generation
- Progressive image tile generation
- Firebase Storage integration
- Email notifications
- Google Cloud Run deployment

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Add Firebase Service Account

Download your Firebase service account key from Firebase Console:
- Go to Project Settings > Service Accounts
- Click "Generate New Private Key"
- Save as `serviceAccountKey.json` in this directory

### 4. Configure Email

Choose one option:

**Option A: Gmail**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Option B: SendGrid**
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

## Local Development

```bash
npm run dev
```

Server will start on http://localhost:5000

## Deployment to Google Cloud Run

### 1. Install Google Cloud CLI

Download from: https://cloud.google.com/sdk/docs/install

### 2. Login and Set Project

```bash
gcloud auth login
gcloud config set project dicom-connect
```

### 3. Deploy

```bash
gcloud run deploy dicom-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 3600
```

### 4. Set Environment Variables

```bash
gcloud run services update dicom-backend \
  --region asia-south1 \
  --set-env-vars="EMAIL_SERVICE=gmail,EMAIL_USER=your-email@gmail.com"
```

## API Endpoints

### POST /upload
Upload DICOM ZIP and/or PDF report

**Request:**
- `dicomZip`: DICOM ZIP file (multipart/form-data)
- `pdfReport`: PDF report file (optional)
- `branchId`: Branch ID
- `caseId`: Case ID
- `patientName`, `patientId`, `patientEmail`
- `doctorName`, `doctorEmail`, `hospital`

**Response:**
```json
{
  "success": true,
  "caseId": "abc123",
  "dicom": {
    "viewerUrl": "https://...",
    "totalSlices": 150,
    "thumbnails": [...],
    "previews": [...]
  },
  "notifications": {
    "success": true
  }
}
```

### GET /viewer/:caseId
Get viewer data for a case

**Query Parameters:**
- `branchId`: Branch ID (required)
- `token`: Access token (optional)

## Architecture

```
Upload → Extract ZIP → Parse DICOM → Generate Images → Upload to Storage → Send Emails
```

## Cost Optimization

- Processes only first 20 slices for quick preview
- Uses WebP format (70% smaller than PNG)
- Caches processed images in Cloud Storage
- Auto-scales to zero when not in use

## Troubleshooting

**Error: Firebase Admin not initialized**
- Make sure `serviceAccountKey.json` exists
- Or set `FIREBASE_SERVICE_ACCOUNT` environment variable

**Error: Email send failed**
- Check email credentials
- For Gmail, use App Password (not regular password)
- Enable "Less secure app access" if needed

**Error: Out of memory**
- Increase Cloud Run memory: `--memory 4Gi`
- Process fewer slices at once

## License

MIT
