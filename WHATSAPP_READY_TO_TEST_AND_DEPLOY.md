# WhatsApp Integration - Ready to Test & Deploy
## Updated: March 4, 2026

---

## ✅ What Has Been Updated

### 1. Backend Configuration (`.env`)
- ✅ Updated Phone Number ID: `1054890871033382` (new account)
- ✅ Updated WABA ID: `1225949859701511` (new account)
- ✅ Access Token: Same as before (still valid)

### 2. WhatsApp Service (`whatsappService.js`)
- ✅ Updated `sendDicomNotification()` function
- ✅ Now includes button parameter for viewer link
- ✅ Sends case ID as URL parameter
- ✅ Template: `doctor_scan_notification` (APPROVED)

### 3. Test Script Created
- ✅ File: `test-whatsapp-with-button.ps1`
- ✅ Includes actual access token
- ✅ Tests both phone numbers
- ✅ Includes button parameter with case ID

---

## 🧪 Step 1: Test the Template (DO THIS NOW)

### Run the Test Script:

```powershell
.\test-whatsapp-with-button.ps1
```

### What Will Happen:
1. Sends message to +919443365797 with CT Scan details
2. Sends message to +919080408814 with MRI Scan details
3. Each message includes "View Scan" button
4. Button links to: `https://nice4-d7886.web.app/viewer/test-case-XXX`

### Expected Result:
```
✅ SUCCESS!
Message ID: wamid.xxxxx
Viewer Link: https://nice4-d7886.web.app/viewer/test-case-001
```

### Check on WhatsApp:
- Open WhatsApp on both phones
- You should see a message with:
  - Doctor name: Kumar
  - Patient details
  - Study type and date
  - **"View Scan" button** ← This is the key feature!
- Click the button → Should open browser with viewer URL

---

## 🚀 Step 2: Deploy Backend (After Successful Test)

### Deploy Command:

```bash
cd dicom-backend
gcloud run deploy dicom-backend \
  --source . \
  --region asia-south1 \
  --project nice4-d7886 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600
```

### What Gets Deployed:
- ✅ New WhatsApp credentials (Phone Number ID: 1054890871033382)
- ✅ Updated `sendDicomNotification()` with button support
- ✅ Direct viewer links in WhatsApp messages

### Deployment Time:
- ~5-8 minutes
- Will create new revision (e.g., 00076-xxx)

---

## 🎯 Step 3: Test from Application

### After Backend Deployment:

1. **Upload a DICOM file** through your application
2. **Assign to a doctor** with WhatsApp number
3. **Check WhatsApp** on doctor's phone
4. **Verify:**
   - Message arrives with patient details
   - "View Scan" button is present
   - Clicking button opens viewer with correct case
   - Viewer loads the DICOM study

---

## 📋 Template Structure (For Reference)

### Template Name: `doctor_scan_notification`
**Status:** APPROVED ✅

### Body Variables (4):
1. `{{1}}` - Doctor Name
2. `{{2}}` - Patient Name
3. `{{3}}` - Study Type
4. `{{4}}` - Upload Date

### Button Variable (1):
5. `{{5}}` - Case ID (for URL)

### Button Configuration:
- Type: URL
- Text: "View Scan"
- URL: `https://nice4-d7886.web.app/viewer/{{5}}`

### Example:
When you send:
- Body: ["Dr. Kumar", "John Doe", "CT Scan", "March 4, 2026"]
- Button: ["abc123xyz"]

Doctor receives:
- Message with patient details
- Button that opens: `https://nice4-d7886.web.app/viewer/abc123xyz`

---

## 🔧 How Backend Calls WhatsApp API

### Updated Function Signature:

```javascript
sendDicomNotification(
  doctorPhone,    // "+919443365797"
  doctorName,     // "Dr. Kumar"
  patientName,    // "John Doe"
  studyType,      // "CT Scan - Head"
  uploadDate,     // "March 4, 2026"
  caseId          // "abc123xyz" ← NEW PARAMETER
)
```

### API Call Structure:

```json
{
  "messaging_product": "whatsapp",
  "to": "919443365797",
  "type": "template",
  "template": {
    "name": "doctor_scan_notification",
    "language": {"code": "en"},
    "components": [
      {
        "type": "body",
        "parameters": [
          {"type": "text", "text": "Dr. Kumar"},
          {"type": "text", "text": "John Doe"},
          {"type": "text", "text": "CT Scan - Head"},
          {"type": "text", "text": "March 4, 2026"}
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": "0",
        "parameters": [
          {"type": "text", "text": "abc123xyz"}
        ]
      }
    ]
  }
}
```

---

## 🎨 How It Looks on WhatsApp

```
┌─────────────────────────────────────┐
│ Hello Dr. Kumar,                    │
│                                     │
│ A new scan has been uploaded for    │
│ your review.                        │
│                                     │
│ Patient: John Doe                   │
│ Study Type: CT Scan - Head          │
│ Upload Date: March 4, 2026          │
│                                     │
│ Click the button below to view the  │
│ scan immediately.                   │
│                                     │
│ Thank you,                          │
│ Nice4 Diagnostics Team              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      🔗 View Scan           │   │ ← CLICKABLE BUTTON
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**When doctor clicks button:**
→ Opens: `https://nice4-d7886.web.app/viewer/abc123xyz`
→ Viewer loads with that specific case
→ Doctor can immediately start reviewing

---

## ✅ Verification Checklist

### Before Deployment:
- [ ] Test script runs successfully
- [ ] Messages arrive on both test phones
- [ ] "View Scan" button is visible
- [ ] Clicking button opens correct URL
- [ ] URL format is correct: `https://nice4-d7886.web.app/viewer/test-case-XXX`

### After Deployment:
- [ ] Backend deploys successfully
- [ ] New revision is active
- [ ] Upload DICOM file through app
- [ ] WhatsApp notification arrives
- [ ] Button opens viewer with correct case
- [ ] DICOM study loads in viewer

---

## 🔍 Troubleshooting

### If Test Fails:

**Error: "Invalid phone number"**
- Check phone number format: `919443365797` (no + or spaces)
- Verify number is registered with WhatsApp

**Error: "Template not found"**
- Verify template name: `doctor_scan_notification`
- Check template status is APPROVED
- Wait 5 minutes after approval

**Error: "Invalid parameter count"**
- Body should have 4 parameters
- Button should have 1 parameter
- Total: 5 parameters

**Message arrives but no button:**
- Check template has button configured
- Verify button type is "url"
- Confirm button parameter is sent

**Button doesn't work:**
- Check URL format in template
- Verify case ID is being sent correctly
- Test URL manually in browser

---

## 📊 Comparison: Old vs New

### Old Implementation:
```javascript
sendDicomNotification(
  doctorPhone,
  doctorName,
  patientName,
  dicomUrl,      // Full URL in message body
  reportUrl,
  service
)
```
❌ Doctor has to manually navigate
❌ No direct link to specific case
❌ Extra steps required

### New Implementation:
```javascript
sendDicomNotification(
  doctorPhone,
  doctorName,
  patientName,
  studyType,
  uploadDate,
  caseId         // Used in button URL
)
```
✅ One-click access via button
✅ Direct link to specific case
✅ Better user experience

---

## 🎯 Next Steps

### Immediate (Now):
1. Run test script: `.\test-whatsapp-with-button.ps1`
2. Verify messages on both phones
3. Confirm button works

### After Successful Test:
1. Deploy backend with new configuration
2. Test from application (upload DICOM)
3. Verify end-to-end flow

### Future Enhancements:
1. Add webhook to track button clicks
2. Send follow-up if doctor doesn't click within X hours
3. Add "Report Ready" template with similar button
4. Track which doctors engage most with notifications

---

## 📝 Files Modified

1. **dicom-backend/.env**
   - Updated WHATSAPP_PHONE_NUMBER_ID
   - Updated WHATSAPP_BUSINESS_ACCOUNT_ID

2. **dicom-backend/services/whatsappService.js**
   - Updated sendDicomNotification() function
   - Added button parameter support
   - Changed function signature

3. **test-whatsapp-with-button.ps1** (NEW)
   - Ready-to-run test script
   - Includes actual access token
   - Tests both phone numbers

---

## 🚀 Ready to Go!

Everything is configured and ready. Just run the test script to verify the template works, then deploy the backend.

**Test Command:**
```powershell
.\test-whatsapp-with-button.ps1
```

**Deploy Command:**
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1 --project nice4-d7886 --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 3600
```

---

*Updated: March 4, 2026*  
*Template: doctor_scan_notification (APPROVED)*  
*New Account: Phone Number ID 1054890871033382*
