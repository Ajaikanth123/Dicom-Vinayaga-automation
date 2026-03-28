# WhatsApp Message Templates - Copy & Paste Ready

Create these 3 templates in Facebook for different scenarios:

---

## TEMPLATE 1: New Case with DICOM and Report
**Use when**: Doctor receives a new case with both DICOM scan AND report PDF

### Template Details:
- **Template Name**: `new_case_complete`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this exactly):
```
Hi Dr. {{1}},

New case for patient {{2}}.

📊 DICOM Scan: {{3}}
📄 Report: {{4}}

Service: {{5}}

- ANBU Dental
```

### Variables Explanation:
- {{1}} = Doctor name
- {{2}} = Patient name
- {{3}} = DICOM viewer link
- {{4}} = Report PDF link
- {{5}} = Service type (e.g., "CBCT Scan")

---

## TEMPLATE 2: New Case with DICOM Only
**Use when**: Doctor receives a new case with DICOM scan but NO report yet

### Template Details:
- **Template Name**: `new_case_dicom_only`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this exactly):
```
Hi Dr. {{1}},

New DICOM scan for patient {{2}}.

📊 View scan: {{3}}

Service: {{4}}

Report will be sent separately once available.

- ANBU Dental
```

### Variables Explanation:
- {{1}} = Doctor name
- {{2}} = Patient name
- {{3}} = DICOM viewer link
- {{4}} = Service type

---

## TEMPLATE 3: Report Added Later
**Use when**: Report PDF is uploaded after the initial case was created

### Template Details:
- **Template Name**: `report_ready`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this exactly):
```
Hi Dr. {{1}},

Report ready for patient {{2}}.

📄 Download report: {{3}}

- ANBU Dental
```

### Variables Explanation:
- {{1}} = Doctor name
- {{2}} = Patient name
- {{3}} = Report PDF link

---

## TEMPLATE 4: Case Update (Optional)
**Use when**: Any update to an existing case

### Template Details:
- **Template Name**: `case_updated`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this exactly):
```
Hi Dr. {{1}},

Case updated for patient {{2}}.

View details: {{3}}

- ANBU Dental
```

### Variables Explanation:
- {{1}} = Doctor name
- {{2}} = Patient name
- {{3}} = Case link

---

## How to Create These Templates

### For Each Template:

1. Go to: **https://developers.facebook.com/**
2. Click **My Apps** → Your App
3. Click **WhatsApp** → **Message Templates**
4. Click **"Create Template"**
5. Fill in:
   - **Template Name**: (use exact name from above)
   - **Category**: Select **UTILITY**
   - **Language**: Select **English**
   - **Header**: Leave empty
   - **Body**: Copy and paste the exact text from above
   - **Footer**: (optional) `Reply STOP to unsubscribe`
   - **Buttons**: Leave empty
6. Click **"Submit"**
7. Repeat for all templates

---

## Template Approval

After submitting:
- **Status**: Will show "Pending"
- **Timeline**: 1-2 hours (up to 24 hours)
- **Check**: Go back to Message Templates page
- **Approved**: Status changes to "Approved" (green)
- **Email**: You'll receive notification

---

## Which Template Gets Used When?

The system will automatically choose the right template:

| Scenario | Template Used | Contains |
|----------|---------------|----------|
| New case with DICOM + Report | `new_case_complete` | Both links |
| New case with DICOM only | `new_case_dicom_only` | DICOM link only |
| Report uploaded later | `report_ready` | Report link only |
| Case edited/updated | `case_updated` | Case link |

---

## Visual Example

### Template 1 (Complete):
```
Hi Dr. Sharma,

New case for patient John Doe.

📊 DICOM Scan: https://nice4-d7886.web.app/viewer/abc123
📄 Report: https://storage.googleapis.com/report.pdf

Service: CBCT Full Skull

- ANBU Dental
```

### Template 2 (DICOM Only):
```
Hi Dr. Sharma,

New DICOM scan for patient John Doe.

📊 View scan: https://nice4-d7886.web.app/viewer/abc123

Service: CBCT Full Skull

Report will be sent separately once available.

- ANBU Dental
```

### Template 3 (Report Ready):
```
Hi Dr. Sharma,

Report ready for patient John Doe.

📄 Download report: https://storage.googleapis.com/report.pdf

- ANBU Dental
```

---

## Important Notes

### Template Names Must Match Exactly
The system looks for these exact names:
- `new_case_complete`
- `new_case_dicom_only`
- `report_ready`
- `case_updated`

**Don't change the names!** The backend code uses these exact names.

### Variable Format
- Use `{{1}}`, `{{2}}`, `{{3}}` etc.
- Don't use `{1}` or `{{variable_name}}`
- WhatsApp requires this exact format

### Category Must Be UTILITY
- Don't use MARKETING or AUTHENTICATION
- UTILITY is for transactional messages
- Higher approval rate

---

## Checklist

Create these templates in order:
- [ ] `new_case_complete` - For cases with both DICOM and report
- [ ] `new_case_dicom_only` - For cases with only DICOM
- [ ] `report_ready` - For when report is added later
- [ ] `case_updated` - (Optional) For case updates

Wait for all to be approved before testing!

---

## After Templates Are Approved

Once all templates show "Approved" status:
1. Add credentials to backend `.env` file
2. Deploy backend
3. Test by creating a case
4. Check WhatsApp for message

---

**Ready to create?** Start with Template 1 and work through all 3 (or 4) templates!
