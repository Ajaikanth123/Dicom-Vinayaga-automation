# Scan Uploaded Template Ready ✅
## Template: scan_uploaded_d

**Date:** March 6, 2026  
**Status:** ✅ APPROVED and WORKING  
**Template Name:** `scan_uploaded_d`

---

## Test Results

### ✅ WhatsApp Message Sent Successfully

**Test Details:**
- From: +919488060278
- To: +919487823299
- Template: `scan_uploaded_d`
- Status: SUCCESS ✅
- Message ID: `17c22f6c-ef3d-49f9-bd41-f75b4fb344f2`

**Message Content:**
```
Hello Dr. Visweswaran,

A new scan has been uploaded and is ready for your review.

Patient Name: Rajesh Kumar
Patient ID: P12345
Study Type: CT Scan - Head
Upload Date: March 6, 2026

View the scan here:
https://nice4-d7886.web.app/viewer/test-case-789

Please review at your earliest convenience.

Thank you,
Nice4 Diagnostics Team
```

---

## Template Configuration

**Template Name:** `scan_uploaded_d`  
**Category:** UTILITY  
**Language:** English  
**Status:** APPROVED ✅

### Variables:
- `{{1}}` = Doctor Name
- `{{2}}` = Patient Name
- `{{3}}` = Patient ID
- `{{4}}` = Study Type
- `{{5}}` = Upload Date
- `{{6}}` = Viewer URL

---

## Code Integration

### Function Added to watiService.js

```javascript
async function sendScanUploadedNotification(
  doctorPhone, 
  doctorName, 
  patientName, 
  patientId, 
  studyType, 
  uploadDate, 
  caseId
) {
  const viewerUrl = `https://nice4-d7886.web.app/viewer/${caseId}`;
  
  const parameters = [
    { name: '1', value: String(doctorName) },
    { name: '2', value: String(patientName) },
    { name: '3', value: String(patientId) },
    { name: '4', value: String(studyType) },
    { name: '5', value: String(uploadDate) },
    { name: '6', value: viewerUrl }
  ];

  return await sendTemplateMessage(
    doctorPhone,
    'scan_uploaded_d',
    parameters
  );
}
```

### How to Use in Backend

In `dicom-backend/routes/upload.js`:

```javascript
import { sendScanUploadedNotification } from '../services/watiService.js';

// After DICOM processing is complete
if (doctorPhone) {
  await sendScanUploadedNotification(
    doctorPhone,
    doctorName,
    patientName,
    patientId,
    studyType,
    new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    caseId
  );
}
```

---

## Next Steps

### 1. Deploy Backend with New Function

```powershell
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1 --project nice4-d7886 --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 3600
```

### 2. Update Upload Route

Add the new function call in `dicom-backend/routes/upload.js` where DICOM processing completes.

### 3. Test in Production

1. Go to https://nice4-d7886.web.app
2. Login
3. Create Form
4. Fill patient information (including Patient ID)
5. Fill doctor phone: `9487823299`
6. Upload DICOM ZIP file
7. Submit

**Expected:** WhatsApp message arrives with detailed patient information

---

## Available Templates

### Current Templates:

1. **doctor_notify** (Old template)
   - Variables: Doctor Name, Patient Name, Study Type, Upload Date, Viewer URL
   - Status: APPROVED ✅
   - Use: Basic notification

2. **scan_uploaded_d** (New template)
   - Variables: Doctor Name, Patient Name, Patient ID, Study Type, Upload Date, Viewer URL
   - Status: APPROVED ✅
   - Use: Detailed notification with Patient ID

### Recommended Usage:

Use `scan_uploaded_d` for all new DICOM uploads as it includes more patient information (Patient ID).

---

## Testing Commands

### Test via PowerShell:
```powershell
./test-scan-uploaded-d.ps1
```

### Test via API:
```powershell
$body = @{
    template_name = "scan_uploaded_d"
    broadcast_name = "Test"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" }
        @{ name = "2"; value = "Patient Name" }
        @{ name = "3"; value = "P12345" }
        @{ name = "4"; value = "CT Scan" }
        @{ name = "5"; value = "March 6, 2026" }
        @{ name = "6"; value = "https://nice4-d7886.web.app/viewer/test" }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "https://live-mt-server.wati.io/10104636/api/v1/sendTemplateMessage?whatsappNumber=919487823299" -Method POST -Headers $headers -Body $body
```

---

## Summary

✅ Template `scan_uploaded_d` created and approved  
✅ Test message sent successfully  
✅ Function added to watiService.js  
✅ Ready for production deployment

**Next:** Deploy backend and test with real DICOM upload

---

**Document Status:** Complete  
**Last Updated:** March 6, 2026  
**Version:** 1.0
