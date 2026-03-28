# WhatsApp Template with Direct Viewer Link
## Updated Template for DICOM Scan Notification

---

## 🎯 Updated Template: doctor_scan_notification

This template includes a **button** that links directly to the DICOM viewer for the specific case.

---

## 📝 Template Creation Steps

### Step 1: Go to Template Manager
- URL: https://business.facebook.com/wa/manage/message-templates/
- Click "Create Template"

### Step 2: Basic Info
- **Category**: UTILITY
- **Name**: `doctor_scan_notification`
- **Languages**: English

### Step 3: Template Content

**Header Section:**
- Toggle: OFF

**Body Section:**
```
Hello Dr. {{1}},

A new scan has been uploaded for your review.

Patient: {{2}}
Study Type: {{3}}
Upload Date: {{4}}

Click the button below to view the scan immediately.

Thank you,
Nice4 Diagnostics Team
```

**Footer Section:**
- Toggle: OFF (optional)

**Buttons Section:**
- Toggle: **ON** ✅
- Button Type: **URL**
- Button Text: `View Scan`
- URL Type: **Dynamic**
- URL: `https://nice4-d7886.web.app/viewer/{{5}}`

**Important:**
- `{{5}}` is the case ID variable
- This creates a dynamic link like: `https://nice4-d7886.web.app/viewer/abc123`

### Step 4: Add Sample Content

**Body Variables:**
1. Doctor Name: `Kumar`
2. Patient Name: `John Doe`
3. Study Type: `CT Scan - Head`
4. Upload Date: `March 1, 2026`

**Button URL Variable:**
5. Case ID: `test-case-123`

**Sample URL will be:** `https://nice4-d7886.web.app/viewer/test-case-123`

### Step 5: Preview & Submit
- Check preview on right side
- Verify button shows "View Scan"
- Click "Submit"

---

## 📱 How It Will Look on WhatsApp

```
┌─────────────────────────────────────┐
│ Hello Dr. Kumar,                    │
│                                     │
│ A new scan has been uploaded for    │
│ your review.                        │
│                                     │
│ Patient: John Doe                   │
│ Study Type: CT Scan - Head          │
│ Upload Date: March 1, 2026          │
│                                     │
│ Click the button below to view the  │
│ scan immediately.                   │
│                                     │
│ Thank you,                          │
│ Nice4 Diagnostics Team              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      🔗 View Scan           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

When doctor clicks "View Scan" button → Opens: `https://nice4-d7886.web.app/viewer/abc123`

---

## 🔧 How to Send This Template (After Approval)

### API Call with Button:

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919443365797",
    "type": "template",
    "template": {
      "name": "doctor_scan_notification",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "Kumar"
            },
            {
              "type": "text",
              "text": "John Doe"
            },
            {
              "type": "text",
              "text": "CT Scan - Head"
            },
            {
              "type": "text",
              "text": "March 1, 2026"
            }
          ]
        },
        {
          "type": "button",
          "sub_type": "url",
          "index": "0",
          "parameters": [
            {
              "type": "text",
              "text": "abc123xyz"
            }
          ]
        }
      ]
    }
  }'
```

**Key Points:**
- Body has 4 parameters (doctor name, patient, study type, date)
- Button has 1 parameter (case ID)
- Button index is "0" (first button)
- Case ID replaces `{{5}}` in the URL

---

## 📝 Alternative: Template with Call-to-Action Buttons

If you want multiple buttons:

### Template with 2 Buttons:

**Buttons Section:**
1. **Button 1**: URL Button
   - Text: `View Scan`
   - URL: `https://nice4-d7886.web.app/viewer/{{5}}`

2. **Button 2**: Quick Reply Button
   - Text: `Contact Support`

---

## 🎯 Updated Template 2: report_ready

### With Download Link:

**Body:**
```
Hello Dr. {{1}},

The report for your patient is now ready.

Patient: {{2}}
Report Type: {{3}}
Date: {{4}}

Click the button below to view and download the report.

Thank you,
Nice4 Diagnostics Team
```

**Button:**
- Type: URL
- Text: `View Report`
- URL: `https://nice4-d7886.web.app/viewer/{{5}}`

---

## 🔄 Backend Code Update (After Template Approval)

Your backend code in `whatsappService.js` will need to include the button parameter:

```javascript
// Example: Sending notification with viewer link
async function sendScanNotification(doctorPhone, doctorName, patientName, studyType, uploadDate, caseId) {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: doctorPhone,
      type: 'template',
      template: {
        name: 'doctor_scan_notification',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: doctorName },
              { type: 'text', text: patientName },
              { type: 'text', text: studyType },
              { type: 'text', text: uploadDate }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: caseId }  // This replaces {{5}} in URL
            ]
          }
        ]
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
```

---

## ✅ Benefits of Button Approach

1. **One-Click Access**: Doctor clicks button → Opens viewer directly
2. **No Copy-Paste**: No need to copy/paste URLs
3. **Mobile Friendly**: Works perfectly on mobile WhatsApp
4. **Professional**: Looks clean and modern
5. **Trackable**: You can track button clicks (with webhook)

---

## 📊 Template Comparison

### Without Button (Old):
```
...
Portal: https://nice4-d7886.web.app
```
❌ Doctor has to manually navigate to case
❌ Extra steps required

### With Button (New):
```
...
[View Scan Button]
```
✅ One click → Direct to viewer
✅ Includes case ID in URL
✅ Better user experience

---

## 🎨 Button Customization Options

### Button Text Options:
- `View Scan` ✅ (Recommended)
- `Open Viewer`
- `View Now`
- `See Scan`
- `Review Scan`

### URL Pattern Options:
1. **Viewer Page**: `https://nice4-d7886.web.app/viewer/{{5}}`
2. **Direct Case**: `https://nice4-d7886.web.app/case/{{5}}`
3. **With Branch**: `https://nice4-d7886.web.app/{{5}}/viewer/{{6}}`

---

## 🚀 Quick Setup Checklist

- [ ] Create template with button
- [ ] Set button text to "View Scan"
- [ ] Set URL to `https://nice4-d7886.web.app/viewer/{{5}}`
- [ ] Add 5 sample values (4 for body + 1 for button)
- [ ] Submit template
- [ ] Wait for approval
- [ ] Test with curl command
- [ ] Verify button works on WhatsApp
- [ ] Update backend code to include button parameter

---

## 🧪 Test Command with Button

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
    "type": "template",
    "template": {
      "name": "doctor_scan_notification",
      "language": {"code": "en"},
      "components": [
        {
          "type": "body",
          "parameters": [
            {"type": "text", "text": "Kumar"},
            {"type": "text", "text": "Test Patient"},
            {"type": "text", "text": "CT Scan - Head"},
            {"type": "text", "text": "March 1, 2026"}
          ]
        },
        {
          "type": "button",
          "sub_type": "url",
          "index": "0",
          "parameters": [
            {"type": "text", "text": "test-case-123"}
          ]
        }
      ]
    }
  }'
```

**Expected Result:**
- Message arrives on WhatsApp
- Shows "View Scan" button
- Clicking button opens: `https://nice4-d7886.web.app/viewer/test-case-123`

---

## 📱 Mobile Experience

1. Doctor receives WhatsApp notification
2. Sees patient details in message
3. Taps "View Scan" button
4. WhatsApp opens browser
5. Browser loads: `https://nice4-d7886.web.app/viewer/abc123`
6. Viewer opens with the specific case already loaded
7. Doctor can immediately start reviewing the scan

**Total time: 2-3 seconds from notification to viewing scan!**

---

## 🎯 Summary

**Old Template:**
- Generic portal link
- Doctor has to find the case manually
- Multiple steps

**New Template:**
- Direct viewer link with case ID
- One-click access
- Instant viewing

**This is much better for doctors!** 🎉

---

Create this updated template and let me know once it's approved. Then I'll update the backend code to send the case ID in the button parameter.
