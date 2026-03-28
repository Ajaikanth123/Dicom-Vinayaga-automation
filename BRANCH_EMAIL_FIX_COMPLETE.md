# Branch-Specific Email Fix Complete ✅

## Problem Identified

Emails were being sent from the **wrong email address**:
- **Expected**: `3danbudentalscansramnadu2@gmail.com` (Ramanathapuram branch)
- **Actual**: `clingam20@gmail.com` (default fallback email)

## Root Cause

The `branchId` parameter was **not being passed** to the `sendNotifications()` function in two places in `dicom-backend/routes/upload.js`:

1. Line 191: Auto-send after DICOM processing
2. Line 432: Manual notification send

Without the `branchId`, the email service couldn't load branch-specific SMTP settings from Firebase and fell back to environment variables.

## What Was Fixed

### 1. Firebase Database Setup
Ran `setup-branch-emails.js` to ensure Firebase has branch-specific settings:

```
emailSettings/
  └── branches/
      ├── ramanathapuram/
      │   ├── smtp/
      │   │   ├── host: "smtp.gmail.com"
      │   │   ├── port: 587
      │   │   └── auth/
      │   │       ├── user: "3danbudentalscansramnadu2@gmail.com"
      │   │       └── pass: "jvrpwdhdumxcazvm"
      │   └── organization/
      │       └── name: "3D Anbu Dental - Ramanathapuram"
      └── hosur/
          ├── smtp/
          │   └── auth/
          │       ├── user: "3danbuscanshosur2@gmail.com"
          │       └── pass: "hjlqhysbjuetikeq"
          └── organization/
              └── name: "3D Anbu Dental - Hosur"
```

### 2. Backend Code Fix

**File**: `dicom-backend/routes/upload.js`

**Change 1** (Line ~191):
```javascript
// BEFORE
const notificationResult = await sendNotifications(
  { doctorName, doctorEmail, hospital },
  { patientName, patientId, patientEmail },
  { viewerLink: result.dicom.viewerUrl, caseId, studyDate: result.dicom.studyMetadata?.studyDate }
);

// AFTER
const notificationResult = await sendNotifications(
  { doctorName, doctorEmail, hospital },
  { patientName, patientId, patientEmail },
  { viewerLink: result.dicom.viewerUrl, caseId, studyDate: result.dicom.studyMetadata?.studyDate },
  branchId  // ✅ Added branchId parameter
);
```

**Change 2** (Line ~432):
```javascript
// BEFORE
notifications = await sendNotifications(
  { doctorName, doctorEmail, hospital },
  { patientName, patientId, patientEmail },
  { viewerLink: viewerUrl, caseId }
);

// AFTER
notifications = await sendNotifications(
  { doctorName, doctorEmail, hospital },
  { patientName, patientId, patientEmail },
  { viewerLink: viewerUrl, caseId },
  branchId  // ✅ Added branchId parameter
);
```

## Deployment

**Backend Deployed**: ✅
- **Service**: dicom-backend
- **Revision**: dicom-backend-00016-8d6
- **Region**: asia-south1
- **URL**: https://dicom-backend-59642964164.asia-south1.run.app
- **Status**: Live and serving traffic

## How It Works Now

### Email Flow with Branch-Specific Settings:

1. **User logs in** to Ramanathapuram branch
2. **Creates form** with `branchId: "ramanathapuram"`
3. **Uploads DICOM** file
4. **Backend receives** upload with `branchId` parameter
5. **Email service** loads settings:
   ```javascript
   // Checks Firebase: emailSettings/branches/ramanathapuram/smtp
   // Finds: 3danbudentalscansramnadu2@gmail.com
   ```
6. **Email sent FROM**: `3danbudentalscansramnadu2@gmail.com` ✅
7. **Email displays**: "3D Anbu Dental Diagnostics LLP - Ramanathapuram"

### Branch Email Mapping:

| Branch | Login Email | Sends FROM Email |
|--------|-------------|------------------|
| **Ramanathapuram** | `3danbudentalscansramnadu@gmail.com` | `3danbudentalscansramnadu2@gmail.com` |
| **Hosur** | `3danbuscanshosur@gmail.com` | `3danbuscanshosur2@gmail.com` |
| **Salem Gugai** | `anbudentalscans@gmail.com` | `clingam20@gmail.com` (default) |
| **Salem LIC** | `anbudentalscans@gmail.com` | `clingam20@gmail.com` (default) |

## Expected Behavior

### When Ramanathapuram User Sends Email:

**Email Header:**
```
From: 3D Anbu Dental Diagnostics LLP - Ramanathapuram
      <3danbudentalscansramnadu2@gmail.com>
To: doctor@example.com
Subject: New DICOM Scan Ready - Patient: [Name]
```

### When Hosur User Sends Email:

**Email Header:**
```
From: 3D Anbu Dental Diagnostics LLP - Hosur
      <3danbuscanshosur2@gmail.com>
To: doctor@example.com
Subject: New DICOM Scan Ready - Patient: [Name]
```

## Backend Logs to Verify

After sending an email, check logs:

```bash
gcloud run services logs read dicom-backend --region asia-south1 --limit 20
```

**Look for:**
```
[Email Service] Using branch-specific SMTP settings for: ramanathapuram
✅ Email sent to doctor: doctor@example.com
```

**NOT:**
```
[Email Service] Using global SMTP settings
[Email Service] Could not load Firebase settings, using environment variables
```

## Testing Steps

### Test 1: Ramanathapuram Branch Email

1. Login as: `3danbudentalscansramnadu@gmail.com`
2. Create a new case
3. Upload DICOM file
4. Send notification
5. **Check email FROM address**: Should be `3danbudentalscansramnadu2@gmail.com` ✅

### Test 2: Hosur Branch Email

1. Login as: `3danbuscanshosur@gmail.com`
2. Create a new case
3. Upload DICOM file
4. Send notification
5. **Check email FROM address**: Should be `3danbuscanshosur2@gmail.com` ✅

### Test 3: Salem Branch Email

1. Login as: `anbudentalscans@gmail.com`
2. Select Salem Gugai or Salem LIC
3. Create a new case
4. Upload DICOM file
5. Send notification
6. **Check email FROM address**: Should be `clingam20@gmail.com` (default) ✅

## Troubleshooting

### If still receiving from wrong email:

1. **Clear browser cache** and reload the page
2. **Check backend logs** for which SMTP settings are being used
3. **Verify Firebase** has the branch settings:
   - Go to Firebase Console → Realtime Database
   - Navigate to `emailSettings/branches/ramanathapuram`
   - Verify email and password are correct

4. **Re-run setup script** if needed:
   ```bash
   cd dicom-backend
   node setup-branch-emails.js
   ```

### Common Issues:

| Issue | Solution |
|-------|----------|
| Email from wrong address | Check branchId is being passed correctly |
| "Using global SMTP settings" in logs | Firebase branch settings not found |
| "Using environment variables" in logs | Firebase connection issue |
| Email not sending at all | Check Gmail app password is valid |

## Verification Checklist

- [x] Firebase database has branch-specific settings
- [x] Backend code passes branchId to sendNotifications
- [x] Backend deployed with fixes
- [ ] **Test Ramanathapuram email** - sends from correct address
- [ ] **Test Hosur email** - sends from correct address
- [ ] **Test Salem email** - sends from default address
- [ ] Backend logs show "Using branch-specific SMTP settings"

## Next Steps

1. ✅ Firebase configured with branch emails
2. ✅ Backend code fixed to pass branchId
3. ✅ Backend deployed
4. ⏳ **Test email from Ramanathapuram branch**
5. ⏳ Verify FROM address is correct
6. ⏳ Test email from Hosur branch
7. ⏳ Verify FROM address is correct

---

**Fixed**: February 13, 2026
**Deployed**: dicom-backend-00016-8d6
**Status**: ✅ Ready for Testing

**Try it now!** Create a new case in Ramanathapuram branch and check the email FROM address.
