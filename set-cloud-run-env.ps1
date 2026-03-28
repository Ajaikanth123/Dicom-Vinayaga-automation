# PowerShell script to set Cloud Run environment variables including service account

# Read service account key
$serviceAccountJson = Get-Content "dicom-backend/serviceAccountKey.json" -Raw | ConvertFrom-Json | ConvertTo-Json -Compress

# Set environment variables
gcloud run services update dicom-backend `
  --region asia-south1 `
  --set-env-vars "NODE_ENV=production,GCS_BUCKET_NAME=nice4-dicom-storage,FIREBASE_DATABASE_URL=https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app,MAX_FILE_SIZE=5368709120,EMAIL_USER=clingam20@gmail.com,EMAIL_PASSWORD=xpfxlujieswemgos,FRONTEND_URL=https://nice4-d7886.web.app,VIEWER_URL=https://nice4-d7886.web.app/viewer,FIREBASE_SERVICE_ACCOUNT=$serviceAccountJson"

Write-Host "Environment variables updated successfully!"
