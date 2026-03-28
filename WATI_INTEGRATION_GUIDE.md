# WATI WhatsApp Integration Guide
## Using WATI API Instead of Direct Meta API

---

## 🎯 What is WATI?

WATI (WhatsApp Team Inbox) is a third-party WhatsApp Business API provider that simplifies WhatsApp integration. It provides:
- Easy-to-use API
- Template management
- Team inbox
- Analytics
- No need for Meta Business Manager complexity

---

## 🔑 Get WATI API Credentials

### Step 1: Login to WATI Dashboard

1. Go to: https://app.wati.io/
2. Login with your account

### Step 2: Get API Credentials

1. Click on **"API Docs"** or **"Settings"** in left sidebar
2. Go to **"API Access"** section
3. You'll find:
   - **API Endpoint**: `https://live-server-XXXX.wati.io`
   - **Access Token**: Your permanent API token

**Example:**
```
API Endpoint: https://live-server-12345.wati.io
Access Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 WATI API Documentation

### Send Template Message

**Endpoint:**
```
POST https://live-server-XXXX.wati.io/api/v1/sendTemplateMessage
```

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "template_name": "doctor_scan_notification",
  "broadcast_name": "DICOM Upload Notification",
  "receivers": [
    {
      "whatsappNumber": "919080408814",
      "customParams": [
        {"name": "name", "value": "Dr. Kumar"},
        {"name": "patient", "value": "John Doe"},
        {"name": "study", "value": "CT Scan - Head"},
        {"name": "date", "value": "March 4, 2026"}
      ]
    }
  ]
}
```

---

## 🔧 Update Backend for WATI

### 1. Update `.env` File

```bash
# WATI Configuration (Replace Meta WhatsApp Config)
WATI_API_ENDPOINT=https://live-server-XXXX.wati.io
WATI_ACCESS_TOKEN=your_wati_access_token_here
WATI_PHONE_NUMBER=919443365797
```

### 2. Create WATI Service

Create new file: `dicom-backend/services/watiService.js`

```javascript
import axios from 'axios';

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN;

/**
 * Format phone number for WATI (no + prefix, just digits)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  // Remove all non-digits
  let formatted = phone.replace(/\D/g, '');
  // Ensure it starts with country code
  if (!formatted.startsWith('91') && formatted.length === 10) {
    formatted = '91' + formatted;
  }
  return formatted;
}

/**
 * Send template message via WATI
 */
async function sendTemplateMessage(to, templateName, parameters) {
  try {
    if (!WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) {
      throw new Error('WATI credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    console.log(`[WATI] Sending template "${templateName}" to ${formattedPhone}`);

    const response = await axios.post(
      `${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage`,
      {
        template_name: templateName,
        broadcast_name: 'DICOM Notification',
        receivers: [
          {
            whatsappNumber: formattedPhone,
            customParams: parameters
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WATI] Message sent successfully`);
    console.log(`[WATI] Response:`, response.data);
    
    return { 
      success: true, 
      data: response.data,
      phone: formattedPhone
    };
  } catch (error) {
    console.error('[WATI] Send error:', error.response?.data || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    };
  }
}

/**
 * Send DICOM notification to doctor with viewer link
 */
async function sendDicomNotification(doctorPhone, doctorName, patientName, studyType, uploadDate, caseId) {
  try {
    console.log('[WATI] Preparing DICOM notification');
    console.log(`  Doctor: ${doctorName} (${doctorPhone})`);
    console.log(`  Patient: ${patientName}`);
    console.log(`  Study Type: ${studyType}`);
    console.log(`  Case ID: ${caseId}`);

    // WATI template parameters
    const parameters = [
      { name: 'doctor_name', value: doctorName },
      { name: 'patient_name', value: patientName },
      { name: 'study_type', value: studyType },
      { name: 'upload_date', value: uploadDate },
      { name: 'case_id', value: caseId }
    ];

    const result = await sendTemplateMessage(
      doctorPhone,
      'doctor_scan_notification',
      parameters
    );

    if (result.success) {
      result.viewerUrl = `https://nice4-d7886.web.app/viewer/${caseId}`;
    }

    return result;
  } catch (error) {
    console.error('[WATI] DICOM notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send simple text message (if enabled in WATI)
 */
async function sendTextMessage(to, message) {
  try {
    const formattedPhone = formatPhoneNumber(to);
    
    const response = await axios.post(
      `${WATI_API_ENDPOINT}/api/v1/sendSessionMessage/${formattedPhone}`,
      {
        messageText: message
      },
      {
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WATI] Text message error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
}

/**
 * Check if WATI is configured
 */
function isConfigured() {
  return !!(WATI_API_ENDPOINT && WATI_ACCESS_TOKEN);
}

/**
 * Get configuration status
 */
function getStatus() {
  return {
    configured: isConfigured(),
    endpoint: WATI_API_ENDPOINT ? WATI_API_ENDPOINT.substring(0, 30) + '...' : null,
    hasAccessToken: !!WATI_ACCESS_TOKEN
  };
}

export {
  sendTemplateMessage,
  sendDicomNotification,
  sendTextMessage,
  isConfigured,
  getStatus,
  formatPhoneNumber
};
```

---

## 🧪 Test WATI Integration

### PowerShell Test Script

Create: `test-wati.ps1`

```powershell
# WATI WhatsApp Test
# Replace with your actual WATI credentials

$WATI_ENDPOINT = "https://live-server-XXXX.wati.io"
$WATI_TOKEN = "your_wati_access_token"

Write-Host "=========================================="
Write-Host "WATI WhatsApp Test"
Write-Host "=========================================="
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $WATI_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    template_name = "doctor_scan_notification"
    broadcast_name = "Test Notification"
    receivers = @(
        @{
            whatsappNumber = "919080408814"
            customParams = @(
                @{ name = "doctor_name"; value = "Dr. Kumar" },
                @{ name = "patient_name"; value = "Test Patient" },
                @{ name = "study_type"; value = "CT Scan - Head" },
                @{ name = "upload_date"; value = "March 4, 2026" },
                @{ name = "case_id"; value = "test-case-123" }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "Sending message to +919080408814..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$WATI_ENDPOINT/api/v1/sendTemplateMessage" -Method Post -Headers $headers -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
    Write-Host ""
}

Write-Host "=========================================="
```

---

## 📋 WATI Template Setup

### In WATI Dashboard:

1. Go to **"Templates"** section
2. Click **"Create Template"**
3. Template Name: `doctor_scan_notification`
4. Category: **Utility**
5. Language: **English**

### Template Content:

**Body:**
```
Hello Dr. {{doctor_name}},

A new scan has been uploaded for your review.

Patient: {{patient_name}}
Study Type: {{study_type}}
Upload Date: {{upload_date}}

View the scan here:
https://nice4-d7886.web.app/viewer/{{case_id}}

Thank you,
Nice4 Diagnostics Team
```

**Variables:**
- `{{doctor_name}}`
- `{{patient_name}}`
- `{{study_type}}`
- `{{upload_date}}`
- `{{case_id}}`

### Submit for Approval

1. Add sample values for each variable
2. Submit template
3. Wait for WhatsApp approval (usually 1-24 hours)

---

## 🔄 Update Backend Routes

### Update `dicom-backend/routes/whatsapp.js`

```javascript
import express from 'express';
import * as watiService from '../services/watiService.js';

const router = express.Router();

// Test endpoint
router.post('/test', async (req, res) => {
  try {
    const { phone, doctorName, patientName, studyType, caseId } = req.body;
    
    const result = await watiService.sendDicomNotification(
      phone,
      doctorName,
      patientName,
      studyType,
      new Date().toLocaleDateString(),
      caseId
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint
router.get('/status', (req, res) => {
  res.json(watiService.getStatus());
});

export default router;
```

---

## 🚀 Deployment Steps

### 1. Update Environment Variables

```bash
# In dicom-backend/.env
WATI_API_ENDPOINT=https://live-server-XXXX.wati.io
WATI_ACCESS_TOKEN=your_wati_token_here
WATI_PHONE_NUMBER=919443365797
```

### 2. Test Locally

```bash
cd dicom-backend
npm install axios  # If not already installed
node -e "import('./services/watiService.js').then(m => console.log(m.getStatus()))"
```

### 3. Deploy to Cloud Run

```bash
cd dicom-backend
gcloud run deploy dicom-backend \
  --source . \
  --region asia-south1 \
  --project nice4-d7886 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars WATI_API_ENDPOINT=https://live-server-XXXX.wati.io,WATI_ACCESS_TOKEN=your_token
```

---

## 📊 WATI vs Direct Meta API

### WATI Advantages:
✅ Simpler setup (no Meta Business Manager)
✅ Built-in team inbox
✅ Better analytics dashboard
✅ Easier template management
✅ Customer support
✅ No complex permissions

### WATI Disadvantages:
❌ Monthly subscription cost
❌ Per-message pricing
❌ Dependent on third-party service
❌ Less control over infrastructure

### Direct Meta API Advantages:
✅ Free (only pay for conversations)
✅ Direct control
✅ No middleman
✅ More features

### Direct Meta API Disadvantages:
❌ Complex setup
❌ Requires Meta Business Manager
❌ Permission management issues
❌ More technical

---

## 💰 WATI Pricing

Check current pricing at: https://www.wati.io/pricing/

Typical pricing:
- **Starter**: $49/month + per-message fees
- **Growth**: $99/month + per-message fees
- **Pro**: $299/month + per-message fees

**Per-message costs:**
- Marketing: ~$0.05-0.10 per message
- Utility: ~$0.02-0.05 per message
- Service: Free (within 24-hour window)

---

## 🎯 Next Steps

1. **Get WATI Credentials:**
   - Login to WATI dashboard
   - Copy API endpoint and access token

2. **Create Template in WATI:**
   - Use the template content above
   - Submit for approval

3. **Update Backend:**
   - Create `watiService.js`
   - Update `.env` with WATI credentials
   - Update routes to use WATI service

4. **Test:**
   - Run PowerShell test script
   - Verify message arrives

5. **Deploy:**
   - Deploy backend with WATI configuration
   - Test from application

---

## 📝 Quick Commands

### Get WATI API Endpoint and Token:
1. Login: https://app.wati.io/
2. Go to: Settings > API Access
3. Copy endpoint and token

### Test WATI API:
```powershell
.\test-wati.ps1
```

### Deploy with WATI:
```bash
cd dicom-backend
gcloud run deploy dicom-backend --source . --region asia-south1 --project nice4-d7886 --allow-unauthenticated --memory 2Gi --cpu 2 --timeout 3600
```

---

*WATI makes WhatsApp integration much simpler than direct Meta API. Perfect for businesses that want ease of use over cost optimization.*

