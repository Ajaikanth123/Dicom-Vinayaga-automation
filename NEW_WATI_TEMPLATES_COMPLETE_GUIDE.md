# Complete WATI Templates Guide
## 3 Templates for Different Notification Scenarios

**Date:** March 6, 2026  
**WATI Dashboard:** https://app.wati.io/  
**Account:** 3danbudentalscansramnadu2@gmail.com

---

## Overview

You need to create 3 templates in WATI:

1. **scan_uploaded** - When DICOM file is uploaded (notify doctor to review scan)
2. **report_uploaded** - When both DICOM and report are uploaded (notify doctor)
3. **report_ready** - When only report is uploaded (notify doctor/patient)

---

## Template 1: DICOM Scan Uploaded
### Use Case: Notify doctor when scan is uploaded and ready to view

**Template Name:** `scan_uploaded`  
**Category:** UTILITY  
**Language:** English

### Header (Text):
```
New Scan Uploaded
```

### Body:
```
Hello Dr. {{1}},

A new scan has been uploaded and is ready for your review.

Patient Name: {{2}}
Patient ID: {{3}}
Study Type: {{4}}
Upload Date: {{5}}

View the scan here:
{{6}}

Please review at your earliest convenience.

Thank you,
Nice4 Diagnostics Team
```

### Footer:
```
Nice4 Diagnostics - Quality Imaging
```

### Buttons:
**Button 1 (URL):**
- Button Text: `View Scan`
- URL Type: Dynamic
- URL: `{{1}}`
- Variable: Use the viewer URL as the last parameter

**Button 2 (Phone):**
- Button Text: `Call Support`
- Phone Number: `+919488060278`

### Variable Mapping:
- `{{1}}` = Doctor Name
- `{{2}}` = Patient Name
- `{{3}}` = Patient ID
- `{{4}}` = Study Type (CT Scan, MRI, X-Ray, etc.)
- `{{5}}` = Upload Date
- `{{6}}` = Viewer URL (https://nice4-d7886.web.app/viewer/CASE_ID)

### Sample Values for Testing:
```
{{1}} = Dr. Visweswaran
{{2}} = Rajesh Kumar
{{3}} = P12345
{{4}} = CT Scan - Head
{{5}} = March 6, 2026
{{6}} = https://nice4-d7886.web.app/viewer/abc123
```

---

## Template 2: DICOM + Report Uploaded
### Use Case: Notify doctor when both scan and report are uploaded

**Template Name:** `scan_report_uploaded`  
**Category:** UTILITY  
**Language:** English

### Header (Text):
```
Scan and Report Available
```

### Body:
```
Hello Dr. {{1}},

A new scan and radiology report have been uploaded for your patient.

Patient Name: {{2}}
Patient ID: {{3}}
Study Type: {{4}}
Upload Date: {{5}}

View scan: {{6}}

The radiology report is also available for download.

Best regards,
Nice4 Diagnostics Team
```

### Footer:
```
Nice4 Diagnostics - Complete Care
```

### Buttons:
**Button 1 (URL):**
- Button Text: `View Scan`
- URL Type: Dynamic
- URL: `{{1}}`

**Button 2 (URL):**
- Button Text: `Download Report`
- URL Type: Dynamic
- URL: `{{2}}`

**Button 3 (Phone):**
- Button Text: `Contact Us`
- Phone Number: `+919488060278`

### Variable Mapping:
- `{{1}}` = Doctor Name
- `{{2}}` = Patient Name
- `{{3}}` = Patient ID
- `{{4}}` = Study Type
- `{{5}}` = Upload Date
- `{{6}}` = Viewer URL
- Button URL {{1}} = Viewer URL (same as {{6}})
- Button URL {{2}} = Report PDF URL

### Sample Values for Testing:
```
{{1}} = Dr. Visweswaran
{{2}} = Priya Sharma
{{3}} = P67890
{{4}} = MRI - Spine
{{5}} = March 6, 2026
{{6}} = https://nice4-d7886.web.app/viewer/xyz789
Button {{1}} = https://nice4-d7886.web.app/viewer/xyz789
Button {{2}} = https://storage.googleapis.com/nice4-dicom-storage/reports/xyz789.pdf
```

---

## Template 3: Report Only (No DICOM)
### Use Case: Notify when only report is uploaded (no scan viewing needed)

**Template Name:** `report_ready`  
**Category:** UTILITY  
**Language:** English

### Header (Text):
```
Radiology Report Ready
```

### Body:
```
Dear Dr. {{1}},

The radiology report for your patient is now ready for review.

Patient Name: {{2}}
Patient ID: {{3}}
Study Type: {{4}}
Report Date: {{5}}

Download report: {{6}}

If you have any questions, please contact us.

Best regards,
Nice4 Diagnostics Team
```

### Footer:
```
Nice4 Diagnostics
```

### Buttons:
**Button 1 (URL):**
- Button Text: `Download Report`
- URL Type: Dynamic
- URL: `{{1}}`

**Button 2 (Phone):**
- Button Text: `Call Us`
- Phone Number: `+919488060278`

### Variable Mapping:
- `{{1}}` = Doctor Name
- `{{2}}` = Patient Name
- `{{3}}` = Patient ID
- `{{4}}` = Study Type
- `{{5}}` = Report Date
- `{{6}}` = Report PDF URL
- Button URL {{1}} = Report PDF URL (same as {{6}})

### Sample Values for Testing:
```
{{1}} = Dr. Kumar
{{2}} = Anita Desai
{{3}} = P11223
{{4}} = X-Ray - Chest
{{5}} = March 6, 2026
{{6}} = https://storage.googleapis.com/nice4-dicom-storage/reports/report123.pdf
Button {{1}} = https://storage.googleapis.com/nice4-dicom-storage/reports/report123.pdf
```

---

## Step-by-Step: How to Create Each Template

### Step 1: Login to WATI
1. Go to https://app.wati.io/
2. Login with: `3danbudentalscansramnadu2@gmail.com`

### Step 2: Navigate to Templates
1. Click **"Templates"** in left sidebar
2. Click **"+ Create Template"** button

### Step 3: Fill Basic Information

**For Template 1 (scan_uploaded):**
- Template Name: `scan_uploaded`
- Category: Select **"UTILITY"**
- Language: Select **"English"**

**For Template 2 (scan_report_uploaded):**
- Template Name: `scan_report_uploaded`
- Category: Select **"UTILITY"**
- Language: Select **"English"**

**For Template 3 (report_ready):**
- Template Name: `report_ready`
- Category: Select **"UTILITY"**
- Language: Select **"English"**

### Step 4: Add Header
1. Click **"Add Header"**
2. Select **"Text"**
3. Copy-paste the header text from above

### Step 5: Add Body
1. In the Body section
2. Copy-paste the body text from above
3. Make sure variables `{{1}}`, `{{2}}`, etc. are in correct order

### Step 6: Add Footer (Optional)
1. Click **"Add Footer"**
2. Copy-paste the footer text from above

### Step 7: Add Buttons
1. Click **"Add Button"**
2. Select button type (URL or Phone)
3. Fill in button text and URL/phone number
4. Repeat for additional buttons

### Step 8: Preview
1. Check the preview on the right side
2. Verify all variables are in correct positions
3. Check button placement

### Step 9: Submit
1. Click **"Submit"** or **"Create Template"**
2. Wait for WhatsApp approval (1-24 hours)

### Step 10: Check Status
1. Go back to Templates section
2. Check status: PENDING → APPROVED ✅

---

## Code Integration

Once templates are approved, add these functions to `dicom-backend/services/watiService.js`:

### Function 1: Send Scan Uploaded Notification
```javascript
/**
 * Send notification when DICOM scan is uploaded
 */
async function sendScanUploadedNotification(doctorPhone, doctorName, patientName, patientId, studyType, uploadDate, viewerUrl) {
  try {
    console.log('[WATI] Sending scan uploaded notification');
    
    const parameters = [
      { name: '1', value: String(doctorName) },
      { name: '2', value: String(patientName) },
      { name: '3', value: String(patientId) },
      { name: '4', value: String(studyType) },
      { name: '5', value: String(uploadDate) },
      { name: '6', value: String(viewerUrl) }
    ];

    const result = await sendTemplateMessage(
      doctorPhone,
      'scan_uploaded',
      parameters
    );

    if (result.success) {
      console.log(`[WATI] Scan uploaded notification sent to ${doctorPhone}`);
    }

    return result;
  } catch (error) {
    console.error('[WATI] Scan uploaded notification error:', error);
    return { success: false, error: error.message };
  }
}
```

### Function 2: Send Scan + Report Uploaded Notification
```javascript
/**
 * Send notification when both DICOM scan and report are uploaded
 */
async function sendScanReportUploadedNotification(doctorPhone, doctorName, patientName, patientId, studyType, uploadDate, viewerUrl, reportUrl) {
  try {
    console.log('[WATI] Sending scan + report uploaded notification');
    
    const parameters = [
      { name: '1', value: String(doctorName) },
      { name: '2', value: String(patientName) },
      { name: '3', value: String(patientId) },
      { name: '4', value: String(studyType) },
      { name: '5', value: String(uploadDate) },
      { name: '6', value: String(viewerUrl) }
    ];

    const result = await sendTemplateMessage(
      doctorPhone,
      'scan_report_uploaded',
      parameters
    );

    if (result.success) {
      console.log(`[WATI] Scan + report notification sent to ${doctorPhone}`);
    }

    return result;
  } catch (error) {
    console.error('[WATI] Scan + report notification error:', error);
    return { success: false, error: error.message };
  }
}
```

### Function 3: Send Report Ready Notification
```javascript
/**
 * Send notification when only report is uploaded (no DICOM scan)
 */
async function sendReportReadyNotification(doctorPhone, doctorName, patientName, patientId, studyType, reportDate, reportUrl) {
  try {
    console.log('[WATI] Sending report ready notification');
    
    const parameters = [
      { name: '1', value: String(doctorName) },
      { name: '2', value: String(patientName) },
      { name: '3', value: String(patientId) },
      { name: '4', value: String(studyType) },
      { name: '5', value: String(reportDate) },
      { name: '6', value: String(reportUrl) }
    ];

    const result = await sendTemplateMessage(
      doctorPhone,
      'report_ready',
      parameters
    );

    if (result.success) {
      console.log(`[WATI] Report ready notification sent to ${doctorPhone}`);
    }

    return result;
  } catch (error) {
    console.error('[WATI] Report ready notification error:', error);
    return { success: false, error: error.message };
  }
}
```

### Export Functions
```javascript
export {
  sendTemplateMessage,
  sendDicomNotification,  // Existing function
  sendScanUploadedNotification,  // New
  sendScanReportUploadedNotification,  // New
  sendReportReadyNotification,  // New
  sendTextMessage,
  isConfigured,
  getStatus,
  formatPhoneNumber
};
```

---

## Usage in Backend Routes

### Scenario 1: DICOM Upload Only
In `dicom-backend/routes/upload.js`:

```javascript
import { sendScanUploadedNotification } from '../services/watiService.js';

// After DICOM processing is complete
if (doctorPhone) {
  const viewerUrl = `https://nice4-d7886.web.app/viewer/${caseId}`;
  
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
    viewerUrl
  );
}
```

### Scenario 2: DICOM + Report Upload
In `dicom-backend/routes/upload.js`:

```javascript
import { sendScanReportUploadedNotification } from '../services/watiService.js';

// After both DICOM and report are processed
if (doctorPhone && reportPdfUrl) {
  const viewerUrl = `https://nice4-d7886.web.app/viewer/${caseId}`;
  
  await sendScanReportUploadedNotification(
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
    viewerUrl,
    reportPdfUrl
  );
}
```

### Scenario 3: Report Only Upload
In `dicom-backend/routes/upload.js` or new report route:

```javascript
import { sendReportReadyNotification } from '../services/watiService.js';

// After report is uploaded
if (doctorPhone && reportPdfUrl) {
  await sendReportReadyNotification(
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
    reportPdfUrl
  );
}
```

---

## Testing Scripts

### Test Template 1: Scan Uploaded
Create `test-scan-uploaded.ps1`:

```powershell
$apiEndpoint = "https://live-mt-server.wati.io/10104636"
$accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAwODo0MTowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.0owBj3B26sx-t3LJgGI6Sa_9yS7FQ647SUshIcRmtZM"
$toNumber = "919487823299"

$body = @{
    template_name = "scan_uploaded"
    broadcast_name = "Test Scan Upload"
    parameters = @(
        @{ name = "1"; value = "Dr. Visweswaran" }
        @{ name = "2"; value = "Rajesh Kumar" }
        @{ name = "3"; value = "P12345" }
        @{ name = "4"; value = "CT Scan - Head" }
        @{ name = "5"; value = "March 6, 2026" }
        @{ name = "6"; value = "https://nice4-d7886.web.app/viewer/test-123" }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$url = "$apiEndpoint/api/v1/sendTemplateMessage?whatsappNumber=$toNumber"

Write-Host "Testing scan_uploaded template..." -ForegroundColor Cyan
Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
Write-Host "✅ Test complete!" -ForegroundColor Green
```

### Test Template 2: Scan + Report Uploaded
Create `test-scan-report-uploaded.ps1`:

```powershell
$apiEndpoint = "https://live-mt-server.wati.io/10104636"
$accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAwODo0MTowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.0owBj3B26sx-t3LJgGI6Sa_9yS7FQ647SUshIcRmtZM"
$toNumber = "919487823299"

$body = @{
    template_name = "scan_report_uploaded"
    broadcast_name = "Test Scan + Report"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" }
        @{ name = "2"; value = "Priya Sharma" }
        @{ name = "3"; value = "P67890" }
        @{ name = "4"; value = "MRI - Spine" }
        @{ name = "5"; value = "March 6, 2026" }
        @{ name = "6"; value = "https://nice4-d7886.web.app/viewer/xyz789" }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$url = "$apiEndpoint/api/v1/sendTemplateMessage?whatsappNumber=$toNumber"

Write-Host "Testing scan_report_uploaded template..." -ForegroundColor Cyan
Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
Write-Host "✅ Test complete!" -ForegroundColor Green
```

### Test Template 3: Report Ready
Create `test-report-ready.ps1`:

```powershell
$apiEndpoint = "https://live-mt-server.wati.io/10104636"
$accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAwODo0MTowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.0owBj3B26sx-t3LJgGI6Sa_9yS7FQ647SUshIcRmtZM"
$toNumber = "919487823299"

$body = @{
    template_name = "report_ready"
    broadcast_name = "Test Report Ready"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" }
        @{ name = "2"; value = "Anita Desai" }
        @{ name = "3"; value = "P11223" }
        @{ name = "4"; value = "X-Ray - Chest" }
        @{ name = "5"; value = "March 6, 2026" }
        @{ name = "6"; value = "https://storage.googleapis.com/nice4-dicom-storage/reports/test.pdf" }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$url = "$apiEndpoint/api/v1/sendTemplateMessage?whatsappNumber=$toNumber"

Write-Host "Testing report_ready template..." -ForegroundColor Cyan
Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
Write-Host "✅ Test complete!" -ForegroundColor Green
```

---

## Summary Checklist

### Templates to Create:
- [ ] `scan_uploaded` - DICOM scan uploaded notification
- [ ] `scan_report_uploaded` - DICOM + report uploaded notification
- [ ] `report_ready` - Report only notification

### For Each Template:
- [ ] Login to WATI dashboard
- [ ] Create template with exact name
- [ ] Copy-paste header, body, footer
- [ ] Add buttons (URL and Phone)
- [ ] Submit for approval
- [ ] Wait for APPROVED status
- [ ] Test with PowerShell script
- [ ] Add function to watiService.js
- [ ] Update backend routes
- [ ] Deploy backend
- [ ] Test in production

---

## Quick Reference

**WATI Dashboard:** https://app.wati.io/  
**API Endpoint:** https://live-mt-server.wati.io/10104636  
**Phone Number:** +919488060278  
**Test Recipient:** +919487823299

**Template Names:**
1. `scan_uploaded`
2. `scan_report_uploaded`
3. `report_ready`

---

**Document Status:** Complete  
**Last Updated:** March 6, 2026  
**Version:** 1.0
