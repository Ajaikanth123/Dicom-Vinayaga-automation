# WhatsApp Notification Troubleshooting Guide
## March 4, 2026

---

## ✅ Current Status

### Environment Variables Set in Cloud Run
- ✅ `WATI_API_ENDPOINT`: https://live-mt-server.wati.io/10104636
- ✅ `WATI_ACCESS_TOKEN`: Configured
- ✅ `WATI_PHONE_NUMBER`: 919443365797

### Code Integration
- ✅ WATI service implemented (`dicom-backend/services/watiService.js`)
- ✅ WhatsApp notification called in upload route (line 478)
- ✅ Frontend sends `doctorPhone` in process request

---

## 🔍 How to Verify WhatsApp is Working

### Step 1: Check if Doctor Phone is Being Sent

When you upload a DICOM file, check the backend logs:

```powershell
gcloud run services logs read dicom-backend --region asia-south1 --project nice4-d7886 --limit 50
```

Look for:
- `📱 Sending WhatsApp notification to [phone number]`
- `[WATI] Preparing DICOM notification`
- `[WATI] Message sent successfully`

### Step 2: Verify Doctor Phone in Form

Make sure the doctor phone number is filled in the form:
1. Go to Create Form
2. Fill in Doctor Information section
3. **Doctor Phone** field must have a 10-digit number
4. Example: `9080408814` (without +91)

### Step 3: Check WATI Dashboard

1. Login to https://app.wati.io/
2. Go to "Contacts"
3. **IMPORTANT**: The recipient phone number MUST be added as a contact
4. Or the recipient must message your WATI number first

---

## 🐛 Common Issues

### Issue 1: "Doctor phone number is required"

**Cause**: Doctor phone not filled in the form

**Solution**:
1. Open Create Form
2. Scroll to Doctor Information
3. Fill the "Doctor Phone" field
4. Must be 10 digits (e.g., `9080408814`)

### Issue 2: No WhatsApp notification sent (but no error)

**Cause**: Phone number not in WATI contacts

**Solution**:
1. Login to https://app.wati.io/
2. Click "Contacts" → "Add Contact"
3. Add phone: +919080408814
4. Name: Test Doctor
5. Save

**OR**

Have the recipient send "Hi" to +919443365797 first

### Issue 3: "Template not found"

**Cause**: Template name mismatch or not approved

**Solution**:
1. Login to WATI dashboard
2. Go to "Templates"
3. Verify template name is exactly: `doctor_scan`
4. Status must be: **APPROVED** ✅

### Issue 4: Environment variables not set

**Cause**: Cloud Run doesn't have WATI credentials

**Solution** (Already done):
```powershell
gcloud run services update dicom-backend `
  --region asia-south1 `
  --project nice4-d7886 `
  --update-env-vars "WATI_API_ENDPOINT=https://live-mt-server.wati.io/10104636,WATI_ACCESS_TOKEN=[token],WATI_PHONE_NUMBER=919443365797"
```

---

## 🧪 Testing Steps

### Test 1: Direct WATI API Test

```powershell
$json='{"template_name":"doctor_scan","broadcast_name":"Test","receivers":[{"whatsappNumbers":"919080408814","customParams":[{"name":"header","value":"3D Anbu Scans"},{"name":"1","value":"Dr. Kumar"},{"name":"2","value":"Test Patient"},{"name":"3","value":"CT Scan"},{"name":"4","value":"March 4, 2026"},{"name":"5","value":"https://nice4-d7886.web.app/viewer/test-123"}]}]}'

$headers=@{
    "Authorization"="Bearer [YOUR_WATI_TOKEN]"
    "Content-Type"="application/json"
}

Invoke-RestMethod -Uri "https://live-mt-server.wati.io/10104636/api/v1/sendTemplateMessage" -Method POST -Headers $headers -Body $json
```

**Expected**: `{"result":true,"info":"Message sent successfully"}`

### Test 2: Upload DICOM with Doctor Phone

1. Go to https://nice4-d7886.web.app
2. Login
3. Create Form
4. Fill patient info
5. **Fill doctor phone**: `9080408814`
6. Fill doctor email
7. Upload DICOM ZIP
8. Submit

**Expected**: WhatsApp message arrives within 1 minute

### Test 3: Check Backend Logs

```powershell
gcloud run services logs read dicom-backend --region asia-south1 --project nice4-d7886 --limit 100 | Select-String "WATI|WhatsApp"
```

**Expected logs**:
```
📱 Sending WhatsApp notification to 919080408814
[WATI] Preparing DICOM notification
  Doctor: Dr. Kumar (919080408814)
  Patient: Test Patient
  Study Type: CT Scan
  Upload Date: March 4, 2026
  Case ID: abc123
[WATI] Sending template "doctor_scan" to 919080408814
[WATI] Message sent successfully
✅ WhatsApp notification sent successfully
📱 Viewer link: https://nice4-d7886.web.app/viewer/abc123
```

---

## 📋 Checklist

Before reporting "WhatsApp not working", verify:

- [ ] Doctor phone field is filled in the form (10 digits)
- [ ] Phone number is added as contact in WATI dashboard
- [ ] Template `doctor_scan` exists and is APPROVED
- [ ] Environment variables are set in Cloud Run
- [ ] Backend logs show "Sending WhatsApp notification"
- [ ] No errors in backend logs
- [ ] WATI dashboard shows message was sent

---

## 🔧 Quick Fixes

### Fix 1: Add Test Contact to WATI

```
1. Go to https://app.wati.io/
2. Contacts → Add Contact
3. Phone: +919080408814
4. Name: Test Doctor
5. Save
```

### Fix 2: Verify Environment Variables

```powershell
gcloud run services describe dicom-backend --region asia-south1 --project nice4-d7886 --format="value(spec.template.spec.containers[0].env)" | Select-String "WATI"
```

Should show:
- WATI_API_ENDPOINT
- WATI_ACCESS_TOKEN  
- WATI_PHONE_NUMBER

### Fix 3: Redeploy Backend (if needed)

```powershell
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1 --project nice4-d7886 --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 3600
```

---

## 📱 Expected WhatsApp Message Format

```
┌─────────────────────────────────────┐
│ 3D Anbu Scans                       │ ← Header
├─────────────────────────────────────┤
│ Hello Dr. Kumar,                    │
│                                     │
│ A new scan has been uploaded for    │
│ your review.                        │
│                                     │
│ Patient: John Doe                   │
│ Study Type: CT Scan - Head          │
│ Upload Date: March 4, 2026          │
│ https://nice4-d7886.web.app/viewer/│
│ abc123xyz                           │
│                                     │
│ Thank you,                          │
│ Nice4 Diagnostics Team              │
└─────────────────────────────────────┘
```

---

## 🎯 Next Steps

1. **Add your test phone as contact in WATI**
2. **Upload a DICOM file with doctor phone filled**
3. **Check backend logs for WATI messages**
4. **Verify message arrives on WhatsApp**

If still not working after these steps, check:
- WATI account status (not suspended)
- Template approval status
- Phone number format (must be 919080408814, not +919080408814)
- WATI API endpoint is correct

---

**Last Updated**: March 4, 2026  
**Status**: Environment variables configured ✅  
**Next**: Test with real upload
