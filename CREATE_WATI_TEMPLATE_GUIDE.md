# How to Create a New WhatsApp Template in WATI
## Step-by-Step Guide

**Date:** March 6, 2026  
**WATI Account:** 3danbudentalscansramnadu2@gmail.com  
**WATI Dashboard:** https://app.wati.io/

---

## Prerequisites

- Access to WATI dashboard (https://app.wati.io/)
- Login credentials for your WATI account
- Template content prepared (text, variables, buttons)

---

## Step 1: Login to WATI Dashboard

1. Go to https://app.wati.io/
2. Login with your credentials:
   - Email: `3danbudentalscansramnadu2@gmail.com`
   - Password: [Your password]

---

## Step 2: Navigate to Templates Section

1. Once logged in, look at the left sidebar
2. Click on **"Templates"** or **"Message Templates"**
3. You'll see a list of your existing templates (including `doctor_notify`)

---

## Step 3: Create New Template

1. Click the **"+ Create Template"** or **"New Template"** button
2. You'll be taken to the template creation form

---

## Step 4: Fill Template Details

### Basic Information

**Template Name:**
- Use lowercase letters, numbers, and underscores only
- No spaces allowed
- Example: `patient_report_ready`, `appointment_reminder`, `scan_completed`

**Template Category:**
Choose the appropriate category:
- **UTILITY** - For transactional messages (order updates, notifications)
- **MARKETING** - For promotional messages
- **AUTHENTICATION** - For OTP and verification codes

**Recommended:** Use **UTILITY** for medical notifications

**Language:**
- Select **English** (or your preferred language)

---

## Step 5: Create Template Content

### Header (Optional)
You can add one of these:
- **Text Header** - Bold text at the top
- **Media Header** - Image, video, or document
- **None** - No header

**Example Text Header:**
```
3D Anbu Dental Scans
```

### Body (Required)
This is the main message content. You can use variables with double curly braces.

**Example Template 1: DICOM Upload Notification**
```
Hello {{1}},

A new scan has been uploaded for your review.

Patient Name: {{2}}
Study Type: {{3}}
Upload Date: {{4}}

View the scan here:
{{5}}

Thank you,
3D Anbu Dental Scans Team
```

**Example Template 2: Report Ready Notification**
```
Dear Dr. {{1}},

The radiology report for patient {{2}} is now ready.

Study: {{3}}
Report Date: {{4}}

View report: {{5}}

Best regards,
3D Anbu Dental Scans
```

**Example Template 3: Appointment Reminder**
```
Hello {{1}},

This is a reminder for your appointment:

Date: {{2}}
Time: {{3}}
Location: {{4}}

Please arrive 15 minutes early.

Contact us: {{5}}
```

### Footer (Optional)
Small text at the bottom (max 60 characters)

**Example:**
```
3D Anbu Scans - Quality Imaging
```

### Buttons (Optional)
You can add up to 3 buttons:

**Button Types:**
1. **Call to Action (URL)** - Opens a website
   - Button text: "View Scan" (max 25 characters)
   - URL type: Dynamic or Static
   - URL: `https://nice4-d7886.web.app/viewer/{{1}}`

2. **Call to Action (Phone)** - Makes a phone call
   - Button text: "Call Us"
   - Phone number: +919488060278

3. **Quick Reply** - Sends a predefined response
   - Button text: "Confirm", "Cancel", "More Info"

**Recommended for DICOM notifications:**
- Button 1: "View Scan" (URL) → `https://nice4-d7886.web.app/viewer/{{1}}`
- Button 2: "Call Support" (Phone) → +919488060278

---

## Step 6: Variable Mapping

When you use `{{1}}`, `{{2}}`, etc., you need to know what each represents:

**For DICOM Upload Template:**
- `{{1}}` = Doctor Name
- `{{2}}` = Patient Name
- `{{3}}` = Study Type (CT Scan, MRI, X-Ray)
- `{{4}}` = Upload Date
- `{{5}}` = Viewer URL

**Important:** Variables must be used in order ({{1}}, {{2}}, {{3}}, etc.)

---

## Step 7: Preview Template

1. WATI will show a preview on the right side
2. Check how it looks on mobile
3. Verify all variables are in the correct positions
4. Check button placement and text

---

## Step 8: Submit for Approval

1. Click **"Submit"** or **"Create Template"**
2. Your template will be sent to WhatsApp for approval
3. Status will show as **"PENDING"**

**Approval Time:** Usually 1-24 hours (can take up to 48 hours)

---

## Step 9: Check Approval Status

1. Go back to Templates section
2. Look for your template in the list
3. Check the status:
   - **PENDING** - Waiting for approval
   - **APPROVED** ✅ - Ready to use
   - **REJECTED** ❌ - Not approved (check reason)

---

## Step 10: Use the Template in Code

Once approved, update your code to use the new template:

**In `dicom-backend/services/watiService.js`:**

```javascript
// Example: Using new template
async function sendReportReadyNotification(doctorPhone, doctorName, patientName, studyType, reportDate, reportUrl) {
  const parameters = [
    { name: '1', value: String(doctorName) },
    { name: '2', value: String(patientName) },
    { name: '3', value: String(studyType) },
    { name: '4', value: String(reportDate) },
    { name: '5', value: String(reportUrl) }
  ];

  const result = await sendTemplateMessage(
    doctorPhone,
    'report_ready',  // Your new template name
    parameters
  );

  return result;
}
```

---

## Common Template Examples

### Template 1: Scan Upload Notification (Current)
**Name:** `doctor_notify`  
**Category:** UTILITY  
**Status:** APPROVED ✅

```
Hello {{1}},

A new scan has been uploaded for your review.

Patient: {{2}}
Study Type: {{3}}
Upload Date: {{4}}

View scan: {{5}}

Thank you,
3D Anbu Scans Team
```

---

### Template 2: Report Ready
**Name:** `report_ready`  
**Category:** UTILITY

```
Dear Dr. {{1}},

The radiology report for patient {{2}} is now ready for review.

Study: {{3}}
Report Date: {{4}}

Access report: {{5}}

Best regards,
3D Anbu Dental Scans
```

---

### Template 3: Urgent Finding Alert
**Name:** `urgent_finding`  
**Category:** UTILITY

```
URGENT: Dr. {{1}}

Critical finding detected for patient {{2}}.

Study: {{3}}
Finding: {{4}}

Immediate review required: {{5}}

3D Anbu Scans - Emergency Alert
```

---

### Template 4: Appointment Reminder
**Name:** `appointment_reminder`  
**Category:** UTILITY

```
Hello {{1}},

Appointment Reminder:

Date: {{2}}
Time: {{3}}
Location: 3D Anbu Dental Scans, {{4}}

Please arrive 15 minutes early.

Contact: {{5}}
```

---

### Template 5: Study Completed
**Name:** `study_completed`  
**Category:** UTILITY

```
Hello {{1}},

Your imaging study has been completed.

Patient: {{2}}
Study: {{3}}
Completion Time: {{4}}

Images are being processed and will be available shortly.

Thank you for choosing 3D Anbu Scans.
```

---

## Template Best Practices

### Do's ✅
- Keep messages clear and concise
- Use professional language
- Include all necessary information
- Use variables for personalization
- Add a clear call-to-action
- Include your business name
- Test with sample data before approval

### Don'ts ❌
- Don't use emojis (WhatsApp may reject)
- Don't use promotional language in UTILITY templates
- Don't include sensitive medical information
- Don't use ALL CAPS excessively
- Don't make messages too long (keep under 1024 characters)
- Don't use special characters that may not render properly

---

## Troubleshooting

### Template Rejected
**Common Reasons:**
1. Contains promotional content in UTILITY category
2. Uses emojis or special characters
3. Violates WhatsApp policies
4. Contains sensitive information
5. Poor formatting or unclear message

**Solution:**
- Review WhatsApp's template guidelines
- Simplify the message
- Remove emojis and special characters
- Change category if needed
- Resubmit with corrections

### Template Not Sending
**Possible Issues:**
1. Template not approved yet (check status)
2. Wrong template name in code
3. Missing or incorrect parameters
4. Recipient not in contacts
5. WATI API credentials incorrect

**Solution:**
- Verify template is APPROVED
- Check template name matches exactly
- Verify parameter count and order
- Add recipient to WATI contacts
- Check WATI_ACCESS_TOKEN in environment variables

---

## Testing Your Template

### Method 1: WATI Dashboard Test
1. Go to Templates section
2. Find your approved template
3. Click "Send Test Message"
4. Enter your phone number
5. Fill in sample variable values
6. Click Send

### Method 2: API Test (PowerShell)
```powershell
$templateName = "your_template_name"
$phone = "919487823299"  # Your test number

$json = @{
    template_name = $templateName
    broadcast_name = "Test Message"
    parameters = @(
        @{ name = "1"; value = "Dr. Kumar" }
        @{ name = "2"; value = "Test Patient" }
        @{ name = "3"; value = "CT Scan" }
        @{ name = "4"; value = "March 6, 2026" }
        @{ name = "5"; value = "https://nice4-d7886.web.app/viewer/test-123" }
    )
} | ConvertTo-Json -Depth 10

$headers = @{
    "Authorization" = "Bearer YOUR_WATI_ACCESS_TOKEN"
    "Content-Type" = "application/json"
}

$url = "https://live-mt-server.wati.io/10104636/api/v1/sendTemplateMessage?whatsappNumber=$phone"

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $json
```

---

## Current System Integration

Your current code uses the `doctor_notify` template. To add a new template:

1. Create the template in WATI dashboard
2. Wait for approval
3. Add a new function in `watiService.js`:

```javascript
async function sendNewTemplateNotification(phone, param1, param2, param3) {
  const parameters = [
    { name: '1', value: String(param1) },
    { name: '2', value: String(param2) },
    { name: '3', value: String(param3) }
  ];

  return await sendTemplateMessage(
    phone,
    'your_new_template_name',
    parameters
  );
}

export { sendNewTemplateNotification };
```

4. Call it from your upload route or other endpoints

---

## Quick Reference

**WATI Dashboard:** https://app.wati.io/  
**API Endpoint:** https://live-mt-server.wati.io/10104636  
**Current Template:** `doctor_notify` (APPROVED)  
**Phone Number:** +919488060278  

**Template Naming Convention:**
- Use: `lowercase_with_underscores`
- Examples: `doctor_notify`, `report_ready`, `appointment_reminder`

**Variable Format:**
- Use: `{{1}}`, `{{2}}`, `{{3}}`, etc.
- Must be sequential (no skipping numbers)

---

## Next Steps

1. Login to WATI dashboard
2. Click "Templates" in sidebar
3. Click "Create Template"
4. Fill in the details using examples above
5. Submit for approval
6. Wait for approval (check status)
7. Update code to use new template
8. Test with your phone number
9. Deploy to production

---

**Need Help?**
- WATI Support: https://support.wati.io/
- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp/
- Template Guidelines: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines

---

**Document Status:** Complete  
**Last Updated:** March 6, 2026  
**Version:** 1.0
