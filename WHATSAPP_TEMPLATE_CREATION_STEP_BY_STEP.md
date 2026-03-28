# WhatsApp Message Templates - Step-by-Step Creation Guide
## Visual Guide with Screenshots Instructions

---

## 📋 Your New Credentials

```
WABA ID: 1225949859701511
Phone Number ID: 1054890871033382
Access Token: (same as before - keep it safe)
```

---

## 🎯 Templates to Create

You need to create 2 templates:
1. **doctor_scan_notification** - When a new scan is uploaded
2. **report_ready** - When a report is ready

---

## 🚀 Step-by-Step: Access Template Manager

### Step 1: Go to WhatsApp Manager
1. Open your browser
2. Go to: **https://business.facebook.com/wa/manage/message-templates/**
3. Or navigate: Meta Business Suite → WhatsApp → Message Templates

### Step 2: Select Your WhatsApp Account
- If you have multiple accounts, select the one with WABA ID: `1225949859701511`
- You should see "Message templates" page

---

## 📝 Template 1: Doctor Scan Notification

### Step 1: Click "Create Template"
- Look for the blue "Create template" button (top right)
- Click it

### Step 2: Template Category
- **Category**: Select "UTILITY"
- Why? Because this is a transactional notification, not marketing
- Click "Continue"

### Step 3: Template Name
- **Name**: `doctor_scan_notification`
- Must be lowercase, no spaces
- Use underscores for spaces
- Click "Continue"

### Step 4: Select Languages
- **Languages**: Select "English"
- You can add more languages later if needed
- Click "Continue"

### Step 5: Create Template Content

**Header Section:**
- Toggle: OFF (we don't need a header)

**Body Section:**
- This is where your message goes
- Copy and paste this EXACT text:

```
Hello Dr. {{1}},

A new scan has been uploaded for your review.

Patient: {{2}}
Study Type: {{3}}
Upload Date: {{4}}

Please log in to the portal to view the scan.

Portal: https://nice4-d7886.web.app

Thank you,
Nice4 Diagnostics Team
```

**Important Notes:**
- `{{1}}`, `{{2}}`, `{{3}}`, `{{4}}` are variables (placeholders)
- They will be replaced with actual data when sending
- Keep the exact format with double curly braces

**Footer Section:**
- Toggle: OFF (optional, we don't need it)

**Buttons Section:**
- Toggle: OFF (optional, we don't need buttons for now)

### Step 6: Add Sample Content
WhatsApp requires sample values to review your template.

Click "Add sample content" and fill:
- **Variable 1** (Doctor Name): `Kumar`
- **Variable 2** (Patient Name): `John Doe`
- **Variable 3** (Study Type): `CT Scan - Head`
- **Variable 4** (Upload Date): `March 1, 2026`

### Step 7: Preview
- Check the preview on the right side
- Make sure it looks good
- Verify all variables are showing sample data

### Step 8: Submit
- Click "Submit" button
- You'll see a confirmation message
- Status will be "PENDING"

---

## 📝 Template 2: Report Ready Notification

### Step 1: Click "Create Template" Again
- Go back to Message Templates page
- Click "Create template" button

### Step 2: Template Category
- **Category**: Select "UTILITY"
- Click "Continue"

### Step 3: Template Name
- **Name**: `report_ready`
- Must be lowercase, no spaces
- Click "Continue"

### Step 4: Select Languages
- **Languages**: Select "English"
- Click "Continue"

### Step 5: Create Template Content

**Header Section:**
- Toggle: OFF

**Body Section:**
- Copy and paste this EXACT text:

```
Hello Dr. {{1}},

The report for your patient is now ready.

Patient: {{2}}
Report Type: {{3}}
Date: {{4}}

You can download the report from the portal.

Portal: https://nice4-d7886.web.app

Thank you,
Nice4 Diagnostics Team
```

**Footer Section:**
- Toggle: OFF

**Buttons Section:**
- Toggle: OFF

### Step 6: Add Sample Content
Click "Add sample content" and fill:
- **Variable 1** (Doctor Name): `Kumar`
- **Variable 2** (Patient Name): `Jane Smith`
- **Variable 3** (Report Type): `Radiology Report - CT Scan`
- **Variable 4** (Date): `March 1, 2026`

### Step 7: Preview
- Check the preview
- Verify all variables show sample data

### Step 8: Submit
- Click "Submit" button
- Status will be "PENDING"

---

## ⏳ Wait for Approval

### What Happens Next?
1. Meta reviews your templates
2. Usually takes: **15 minutes to 2 hours**
3. Sometimes: Up to 24 hours
4. You'll get email notification when approved

### Check Status
1. Go to: https://business.facebook.com/wa/manage/message-templates/
2. Look for your templates
3. Status indicators:
   - 🟡 **PENDING** - Under review
   - 🟢 **APPROVED** - Ready to use!
   - 🔴 **REJECTED** - Need to fix and resubmit

---

## ✅ After Approval: Test Your Templates

### Test Template 1: doctor_scan_notification

Open PowerShell or Terminal and run:

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
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
        }
      ]
    }
  }'
```

**Replace:**
- `YOUR_ACCESS_TOKEN_HERE` with your actual token
- `919080408814` with your test phone number

### Test Template 2: report_ready

```bash
curl -X POST \
  'https://graph.facebook.com/v18.0/1054890871033382/messages' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN_HERE' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919080408814",
    "type": "template",
    "template": {
      "name": "report_ready",
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
              "text": "Jane Smith"
            },
            {
              "type": "text",
              "text": "Radiology Report - CT Scan"
            },
            {
              "type": "text",
              "text": "March 1, 2026"
            }
          ]
        }
      ]
    }
  }'
```

---

## 🎨 Template Design Best Practices

### ✅ DO:
- Use clear, professional language
- Include business name
- State the purpose clearly
- Use variables for personalization
- Keep it concise (under 1024 characters)
- Use UTILITY category for transactional messages

### ❌ DON'T:
- Use emojis in template text (can add when sending)
- Use promotional language
- Include prices or offers
- Use ALL CAPS
- Add external links (except your own domain)
- Use special characters excessively

---

## 🔍 Troubleshooting Template Rejection

### Common Rejection Reasons:

**1. "Template contains promotional content"**
- **Fix**: Remove any marketing language
- Use UTILITY category, not MARKETING
- Focus on transactional information

**2. "Template quality is low"**
- **Fix**: Add more context
- Make the purpose clear
- Include business name
- Use proper grammar

**3. "Template contains policy violations"**
- **Fix**: Remove any:
  - Misleading information
  - Sensitive content
  - External links (except your domain)

### How to Edit Rejected Template:
1. Go to Message Templates
2. Find the rejected template
3. Click "Edit"
4. Make changes
5. Submit again

---

## 📊 Template Status Dashboard

### Where to Check:
**URL**: https://business.facebook.com/wa/manage/message-templates/

### What You'll See:

```
Template Name                    Status      Language    Category
─────────────────────────────────────────────────────────────────
doctor_scan_notification         APPROVED    English     UTILITY
report_ready                     APPROVED    English     UTILITY
```

---

## 🎯 Quick Reference: Template Variables

### Template 1: doctor_scan_notification
| Variable | Description | Example |
|----------|-------------|---------|
| {{1}} | Doctor Name | "Dr. Kumar" |
| {{2}} | Patient Name | "John Doe" |
| {{3}} | Study Type | "CT Scan - Head" |
| {{4}} | Upload Date | "March 1, 2026" |

### Template 2: report_ready
| Variable | Description | Example |
|----------|-------------|---------|
| {{1}} | Doctor Name | "Dr. Kumar" |
| {{2}} | Patient Name | "Jane Smith" |
| {{3}} | Report Type | "Radiology Report" |
| {{4}} | Date | "March 1, 2026" |

---

## 📱 Expected Message Preview

### Template 1 Preview:
```
Hello Dr. Kumar,

A new scan has been uploaded for your review.

Patient: John Doe
Study Type: CT Scan - Head
Upload Date: March 1, 2026

Please log in to the portal to view the scan.

Portal: https://nice4-d7886.web.app

Thank you,
Nice4 Diagnostics Team
```

### Template 2 Preview:
```
Hello Dr. Kumar,

The report for your patient is now ready.

Patient: Jane Smith
Report Type: Radiology Report - CT Scan
Date: March 1, 2026

You can download the report from the portal.

Portal: https://nice4-d7886.web.app

Thank you,
Nice4 Diagnostics Team
```

---

## ⚡ Quick Actions After Approval

### 1. Note Down Template Names
```
✅ doctor_scan_notification
✅ report_ready
```

### 2. Test Both Templates
- Use the curl commands above
- Check your WhatsApp: +919080408814
- Verify messages arrive correctly

### 3. Confirm with Me
Once both templates are approved and tested, let me know and I'll:
- Update the backend .env file
- Redeploy the backend
- Test the full integration

---

## 📞 Need Help?

### Template Not Showing Up?
- Wait 5 minutes and refresh
- Check you're in the correct WhatsApp account
- Verify WABA ID: 1225949859701511

### Template Rejected?
- Read the rejection reason carefully
- Edit and resubmit
- Usually approved on second try

### Can't Find Template Manager?
- Go directly to: https://business.facebook.com/wa/manage/message-templates/
- Make sure you're logged into Meta Business Suite
- Select correct business account

---

## ✅ Checklist

Before moving to next step:

- [ ] Created `doctor_scan_notification` template
- [ ] Created `report_ready` template
- [ ] Both templates submitted
- [ ] Waiting for approval (or already approved)
- [ ] Tested both templates with curl commands
- [ ] Messages received on WhatsApp
- [ ] Ready to update backend configuration

---

## 🎉 Next Steps

Once both templates are **APPROVED**:

1. **Tell me**: "Both templates are approved"
2. **I'll update**: Backend .env file with new credentials
3. **I'll redeploy**: Backend to apply changes
4. **We'll test**: Full integration from your application

---

**Estimated Time:**
- Template creation: 10 minutes
- Approval wait: 15 minutes to 24 hours
- Testing: 5 minutes

**Total: 30 minutes to 24 hours** (depending on approval speed)

---

Good luck! Let me know once your templates are approved and we'll proceed with updating the backend configuration.
