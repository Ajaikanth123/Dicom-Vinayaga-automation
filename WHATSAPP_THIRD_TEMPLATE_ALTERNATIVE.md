# Third Template - Alternative Name

Since `new_case_dicom_only` is having issues, create it with a different name:

---

## TEMPLATE 3: DICOM Only (Alternative Name)

### Template Details:
- **Template Name**: `dicom_scan_notification` (NEW NAME)
- **Category**: `MARKETING` (accept it)
- **Language**: `English`

### Body (Copy this):
```
Hi Dr. {{1}},

New DICOM scan for patient {{2}}.

View scan: {{3}}

Service: {{4}}

Report will be sent separately once available.

- ANBU Dental
```

### Variable Samples:
- {{1}} → `Sharma`
- {{2}} → `John Doe`
- {{3}} → `https://nice4-d7886.web.app/viewer/sample123`
- {{4}} → `CBCT Full Skull`

---

## Summary of Your 3 Templates:

✅ **Template 1**: `new_case_complete` (Both DICOM + Report)
✅ **Template 2**: `report_ready` (Report only)
🔄 **Template 3**: `dicom_scan_notification` (DICOM only - NEW NAME)

---

## After Creating Template 3:

Once all 3 templates are created and show "Pending" or "Approved" status, we'll:

1. ✅ Add credentials to backend `.env`
2. ✅ Deploy backend
3. ✅ Test WhatsApp notifications

---

**Create the third template with the name `dicom_scan_notification` and it should work!**
