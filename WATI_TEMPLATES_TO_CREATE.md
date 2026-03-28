# WATI WhatsApp Templates - Ready to Create
## Three Templates for Different Notifications

**Date:** March 6, 2026  
**WATI Dashboard:** https://app.wati.io/  
**Account:** 3danbudentalscansramnadu2@gmail.com

---

## Template 1: DICOM Upload Notification
### When scan is uploaded (no report yet)

**Template Name:** `scan_uploaded`  
**Category:** UTILITY  
**Language:** English

---

### Header (Text)
```
Nice4 Diagnostics
```

---

### Body
```
Hello Dr. {{1}},

A new scan has been uploaded and is ready for your review.

Patient Name: {{2}}
Patient ID: {{3}}
Study Type: {{4}}
Upload Date: {{5}}

View the scan here:
{{6}}

The scan is now available in the MPR viewer for detailed analysis.

Thank you,
Nice4 Diagnostics Team
```

---

### Footer
```
Nice4 - Quality Imaging
```

---

### Buttons
**Button 1 (URL):**
- Type: Call to Action (URL)
- Button Text: `View Scan`
- URL Type: Dynamic
- URL: `{{1}}`

**Button 2 (Phone):**
- Type: Call to Action (Phone)
- Button Text: `Call Support`
- Phone Number: `+919488060278`

---

### Variable Mapping for `scan_uploaded`
- `{{1}}` = Doctor Name (e.g., "Dr. Kumar")
- `{{2}}` = Patient Name (e.g., "John Doe")
- `{{3}}` = Patient ID (e.g., "P12345")
- `{{4}}` = Study Type (e.g., "CT Scan - Head")
- `{{5}}` = Upload Date (e.g., "March 6, 2026")
- `{{6}}` = Viewer URL (e.g., "https://nice4-d7886.web.app/viewer/abc123")

---

### Sample Content for Preview
```
Doctor Name: Dr. Visweswaran
Patient Name: Rajesh Kumar
Patient ID: P40708
Study Type: CT Scan - Dental
Upload Date: March 6, 2026
Viewer URL: https://nice4-d7886.web.app/viewer/test-123
```

---

## Template 2: Report Uploaded Notification
### When both scan AND report are uploaded

**Template Name:** `report_uploaded`  
**Category:** UTILITY  
**Language:** English

---

### Header (Text)
```
Nice4 Diagnostics
```

---

### Body
```
Hello Dr. {{1}},

A new scan with radiology report has been uploaded for patient {{2}}.

Patient ID: {{3}}
Study Type: {{4}}
Upload Date: {{5}}

View scan and report:
{{6}}

The complete study including images and diagnostic report is now available for your review.

Thank you,
Nice4 Diagnostics Team
```

---

### Footer
```
Nice4 - Complete Diagnostics
```

---

### Buttons
**Button 1 (URL):**
- Type: Call to Action (URL)
- Button Text: `View Report`
- URL Type: Dynamic
- URL: `{{1}}`

**Button 2 (Phone):**
- Type: Call to Action (Phone)
- Button Text: `Contact Us`
- Phone Number: `+919488060278`

---

### Variable Mapping for `report_uploaded`
- `{{1}}` = Doctor Name (e.g., "Dr. Kumar")
- `{{2}}` = Patient Name (e.g., "John Doe")
- `{{3}}` = Patient ID (e.g., "P12345")
- `{{4}}` = Study Type (e.g., "CT Scan - Head")
- `{{5}}` = Upload Date (e.g., "March 6, 2026")
- `{{6}}` = Viewer URL (e.g., "https://nice4-d7886.web.app/viewer/abc123")

---

### Sample Content for Preview
```
Doctor Name: Dr. Visweswaran
Patient Name: Rajesh Kumar
Patient ID: P40708
Study Type: CT Scan - Dental
Upload Date: March 6, 2026
Viewer URL: https://nice4-d7886.web.app/viewer/test-123
```

---

## Template 3: Report Only Notification
### When only report is uploaded (scan already exists)

**Template Name:** `report_ready`  
**Category:** UTILITY  
**Language:** English

---

### Header (Text)
```
Nice4 Diagnostics
```

---

### Body
```
Dear Dr. {{1}},

The radiology report for patient {{2}} is now ready for your review.

Patient ID: {{3}}
Study Type: {{4}}
Report Date: {{5}}

Access the report here:
{{6}}

The diagnostic report has been completed and is available in the system.

Best regards,
Nice4 Diagnostics Team
```

---

### Footer
```
Nice4 - Expert Reporting
```

---

### Buttons
**Button 1 (URL):**
- Type: Call to Action (URL)
- Button Text: `View Report`
- URL Type: Dynamic
- URL: `{{1}}`

**Button 2 (Phone):**
- Type: Call to Action (Phone)
- Button Text: `Call Us`
- Phone Number: `+919488060278`

---

### Variable Mapping for `report_ready`
- `{{1}}` = Doctor Name (e.g., "Dr. Kumar")
- `{{2}}` = Patient Name (e.g., "John Doe")
- `{{3}}` = Patient ID (e.g., "P12345")
- `{{4}}` = Study Type (e.g., "CT Scan - Head")
- `{{5}}` = Report Date (e.g., "March 6, 2026")
- `{{6}}` = Report URL (e.g., "https://nice4-d7886.web.app/viewer/abc123")

---

### Sample Content for Preview
```
Doctor Name: Dr. Visweswaran
Patient Name: Rajesh Kumar
Patient ID: P40708
Study Type: CT Scan - Dental
Report Date: March 6, 2026
Report URL: https://nice4-d7886.web.app/viewer/test-123
```

---

## Step-by-Step Creation Process

### For Each Template:

1. **Login to WATI**
   - Go to https://app.wati.io/
   - Login with: 3danbudentalscansramnadu2@gmail.com

2. **Navigate to Templates**
   - Click "Templates" in left sidebar
   - Click "Create Template" or "+ New Template"

3. **Fill Basic Information**
   - Template Name: (use exact names above)
   - Category: Select "UTILITY"
   - Langua