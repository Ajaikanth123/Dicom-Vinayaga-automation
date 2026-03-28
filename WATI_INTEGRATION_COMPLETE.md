# WATI WhatsApp Integration - Complete Setup
## March 4, 2026

---

## ✅ Configuration Complete

### WATI Credentials
- **API Endpoint**: `https://live-mt-server.wati.io/10104636`
- **Access Token**: Configured in `.env`
- **Phone Number**: +919443365797

### Template Details
- **Name**: `doctor_scan`
- **Status**: APPROVED ✅
- **Header**: "3D Anbu Scans"
- **Body Variables**: {{1}} to {{5}}
  - {{1}} = Doctor Name
  - {{2}} = Patient Name
  - {{3}} = Study Type
  - {{4}} = Upload Date
  - {{5}} = Viewer Link

---

## 📁 Files Updated

### 1. Backend Environment (`.env`)
```bash
WATI_API_ENDPOINT=https://live-mt-server.wati.io/10104636
WATI_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WATI_PHONE_NUMBER=919443365797
```

### 2. WATI Service (`dicom-backend/services/watiService.js`)
✅ Uses `whatsappNumbers` (plural)
✅ Sends numbered parameters (1, 2, 3, 4, 5)
✅ Includes header parameter
✅ Formats phone numbers correctly (no + prefix)
✅ Sends full viewer URL in parameter 5

---

## 🧪 Testing

### Before Testing - Important!

The phone number you're sending to MUST either:

**Option 1: Add as Contact in WATI**
1. Login to https://app.wati.io/
2. Go to "Contacts"
3. Click "Add Contact"
4. Phone: +919080408814
5. Name: Test Contact
6. Save

**Option 2: User Messages You First**
1. From +919080408814, send "Hi" to +919443365797
2. This opens a conversation window
3. Then you can send templates

### Test Command

```powershell
$json='{"template_name":"doctor_scan","broadcast_name":"Test","receivers":[{"whatsappNumbers":"919080408814","customParams":[{"name":"header","value":"3D Anbu Scans"},{"name":"1","value":"Dr. Kumar"},{"name":"2","value":"Test Patient"},{"name":"3","value":"CT Scan"},{"name":"4","value":"March 4, 2026"},{"name":"5","value":"https://nice4-d7886.web.app/viewer/test-123"}]}]}'

$headers=@{"Authorization"="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDQvMjAyNiAwNDozODowMyIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.FbanpEij92EwF33GNmGsSe45Z_gkPd6xGdwGyl3M83o";"Content-Type"="application/json"}

Invoke-RestMethod -Uri "https://live-mt-server.wati.io/10104636/api/v1/sendTemplateMessage" -Method POST -Headers $headers -Body $json
```

### Expected Success Response

```json
{
  "result": true,
  "info": "Message sent successfully"
}
```

---

## 🚀 Deployment

### 1. Deploy Backend

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

### 2. How It Works

```
User uploads DICOM scan
         ↓
Backend processes file
         ↓
Generates case ID (e.g., "abc123xyz")
         ↓
Calls watiService.sendDicomNotification()
         ↓
WATI sends WhatsApp message with:
  - Header: "3D Anbu Scans"
  - Doctor name
  - Patient details
  - Direct viewer link
         ↓
Doctor receives WhatsApp notification
         ↓
Clicks link → Opens viewer with case loaded
         ↓
Doctor reviews scan immediately
```

---

## 📱 WhatsApp Message Format

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

## 🔧 Backend Integration

### When DICOM is Uploaded

The backend automatically:

1. **Processes the DICOM file**
   - Extracts metadata
   - Generates thumbnails
   - Stores in Google Cloud Storage

2. **Creates case record**
   - Generates unique case ID
   - Stores in Firebase Database
   - Links to doctor

3. **Sends WhatsApp notification**
   ```javascript
   await watiService.sendDicomNotification(
     doctorPhone,      // "+919080408814"
     doctorName,       // "Dr. Kumar"
     patientName,      // "John Doe"
     studyType,        // "CT Scan - Head"
     uploadDate,       // "March 4, 2026"
     caseId            // "abc123xyz"
   );
   ```

4. **Doctor receives instant notification**
   - WhatsApp message with all details
   - Direct link to viewer
   - One-click access to scan

---

## ✅ Checklist

### Configuration
- [x] WATI credentials in `.env`
- [x] Template created and approved
- [x] Backend service updated
- [x] Phone number format correct (no +)
- [x] Numbered parameters (1-5)
- [x] Header parameter included

### Testing
- [ ] Add +919080408814 as contact in WATI
- [ ] Run test command
- [ ] Verify message arrives
- [ ] Check viewer link works
- [ ] Deploy backend
- [ ] Test from application

### Production
- [ ] Add all doctor phone numbers as contacts
- [ ] Test with real DICOM upload
- [ ] Verify end-to-end flow
- [ ] Monitor WATI dashboard for delivery status

---

## 🎯 Key Points

1. **Phone Number Format**: No + prefix (use `919080408814` not `+919080408814`)
2. **Parameter Names**: Use `"1"`, `"2"`, `"3"`, etc. (strings, not numbers)
3. **Header**: Include `{"name":"header","value":"3D Anbu Scans"}`
4. **Contacts**: Recipients must be added to WATI or message you first
5. **Template Name**: `doctor_scan` (exact match required)

---

## 🐛 Troubleshooting

### Error: "Whatsapp number should not be null or empty"
**Solution**: Add the phone number as a contact in WATI dashboard first

### Error: "Template not found"
**Solution**: Verify template name is exactly `doctor_scan` and status is APPROVED

### Error: "Invalid parameters"
**Solution**: Check you're sending exactly 6 parameters (header + 5 body variables)

### Message not arriving
**Solution**: 
1. Check WATI dashboard for delivery status
2. Verify phone number is registered with WhatsApp
3. Check template is approved
4. Ensure contact exists in WATI

---

## 📊 WATI Dashboard

Monitor your messages at: https://app.wati.io/

**Check:**
- Message delivery status
- Template approval status
- Contact list
- Conversation history
- Analytics

---

## 💰 WATI Pricing

Your messages are charged per template sent. Check your WATI plan for:
- Monthly message limits
- Per-message costs
- Conversation pricing

**Tip**: Utility templates (like scan notifications) are typically cheaper than marketing messages.

---

## 🎉 Success!

Once configured and tested, your DICOM system will automatically notify doctors via WhatsApp whenever a new scan is uploaded, with a direct link to view it immediately.

**Benefits:**
- Instant notifications
- One-click access to scans
- Professional branded messages
- Automated workflow
- Better doctor engagement

---

*Integration completed: March 4, 2026*  
*Template: doctor_scan (APPROVED)*  
*WATI Account: 10104636*

