# WhatsApp Templates - WITHOUT Emojis (For Approval)

Facebook is flagging your templates as "marketing" because of emojis. Use these versions instead:

---

## TEMPLATE 1: `new_case_complete`

### Template Details:
- **Template Name**: `new_case_complete`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this - NO EMOJIS):
```
Hi Dr. {{1}},

New case for patient {{2}}.

DICOM Scan: {{3}}

Report: {{4}}

Service: {{5}}

- ANBU Dental
```

### Variable Samples:
- {{1}} → `Sharma`
- {{2}} → `John Doe`
- {{3}} → `https://nice4-d7886.web.app/viewer/sample123`
- {{4}} → `https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf`
- {{5}} → `CBCT Full Skull`

---

## TEMPLATE 2: `new_case_dicom_only`

### Template Details:
- **Template Name**: `new_case_dicom_only`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this - NO EMOJIS):
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

## TEMPLATE 3: `report_ready`

### Template Details:
- **Template Name**: `report_ready`
- **Category**: `UTILITY`
- **Language**: `English`

### Body (Copy this - NO EMOJIS):
```
Hi Dr. {{1}},

Report ready for patient {{2}}.

Download report: {{3}}

- ANBU Dental
```

### Variable Samples:
- {{1}} → `Sharma`
- {{2}} → `John Doe`
- {{3}} → `https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf`

---

## What Changed?

### Before (Rejected):
```
📊 DICOM Scan: {{3}}
📄 Report: {{4}}
```

### After (Will Be Approved):
```
DICOM Scan: {{3}}

Report: {{4}}
```

**Why?** WhatsApp's system flags emojis as "marketing content". Removing them makes it clear this is a transactional/utility message.

---

## Steps to Fix:

1. **Click "Cancel"** on the popup
2. **Delete the current template** (if you want to start fresh)
3. **Create new template** with the text above (no emojis)
4. **Submit** - should be approved as UTILITY

---

## Alternative: Keep Current Template

If you already submitted:
1. Click "Submit" on the popup (it will change category to Marketing)
2. Wait for approval
3. Marketing templates work the same way, just different category

**Note**: UTILITY category is better for transactional messages, but MARKETING will also work.

---

## Tips for Approval:

✅ **DO:**
- Keep it professional
- Use clear, simple language
- Focus on information delivery
- Use "UTILITY" category

❌ **DON'T:**
- Use emojis (📊 📄 ✅ ❌)
- Use promotional language ("Buy now", "Limited offer")
- Use excessive punctuation (!!!)
- Use all caps (URGENT)

---

## Quick Copy-Paste (All 3 Templates)

### Template 1 Body:
```
Hi Dr. {{1}},

New case for patient {{2}}.

DICOM Scan: {{3}}

Report: {{4}}

Service: {{5}}

- ANBU Dental
```

### Template 2 Body:
```
Hi Dr. {{1}},

New DICOM scan for patient {{2}}.

View scan: {{3}}

Service: {{4}}

Report will be sent separately once available.

- ANBU Dental
```

### Template 3 Body:
```
Hi Dr. {{1}},

Report ready for patient {{2}}.

Download report: {{3}}

- ANBU Dental
```

---

**Use these versions and they should be approved as UTILITY templates!**
