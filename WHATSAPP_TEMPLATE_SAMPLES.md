# WhatsApp Template Variable Samples

Facebook requires sample values for each {{variable}} to review your template.

**Important**: Use generic examples, NOT real customer data!

---

## TEMPLATE 1: `new_case_complete`

### Variable Samples to Enter:

**{{1}}** - Doctor name
```
Sharma
```

**{{2}}** - Patient name
```
John Doe
```

**{{3}}** - DICOM viewer link
```
https://nice4-d7886.web.app/viewer/sample123
```

**{{4}}** - Report PDF link
```
https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf
```

**{{5}}** - Service type
```
CBCT Full Skull
```

### How It Will Look:
```
Hi Dr. Sharma,

New case for patient John Doe.

📊 DICOM Scan: https://nice4-d7886.web.app/viewer/sample123
📄 Report: https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf

Service: CBCT Full Skull

- ANBU Dental
```

---

## TEMPLATE 2: `new_case_dicom_only`

### Variable Samples to Enter:

**{{1}}** - Doctor name
```
Sharma
```

**{{2}}** - Patient name
```
John Doe
```

**{{3}}** - DICOM viewer link
```
https://nice4-d7886.web.app/viewer/sample123
```

**{{4}}** - Service type
```
CBCT Full Skull
```

### How It Will Look:
```
Hi Dr. Sharma,

New DICOM scan for patient John Doe.

📊 View scan: https://nice4-d7886.web.app/viewer/sample123

Service: CBCT Full Skull

Report will be sent separately once available.

- ANBU Dental
```

---

## TEMPLATE 3: `report_ready`

### Variable Samples to Enter:

**{{1}}** - Doctor name
```
Sharma
```

**{{2}}** - Patient name
```
John Doe
```

**{{3}}** - Report PDF link
```
https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf
```

### How It Will Look:
```
Hi Dr. Sharma,

Report ready for patient John Doe.

📄 Download report: https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf

- ANBU Dental
```

---

## Quick Copy-Paste Reference

### For Template 1 (5 variables):
1. `Sharma`
2. `John Doe`
3. `https://nice4-d7886.web.app/viewer/sample123`
4. `https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf`
5. `CBCT Full Skull`

### For Template 2 (4 variables):
1. `Sharma`
2. `John Doe`
3. `https://nice4-d7886.web.app/viewer/sample123`
4. `CBCT Full Skull`

### For Template 3 (3 variables):
1. `Sharma`
2. `John Doe`
3. `https://storage.googleapis.com/nice4-dicom-storage/reports/sample.pdf`

---

## Important Notes

### Why These Samples?
- **Generic names**: "Sharma" and "John Doe" are common examples
- **Real URLs**: Use your actual domain so Meta can verify
- **Professional**: Shows the business use case clearly

### What NOT to Use:
- ❌ Real patient names
- ❌ Real doctor names
- ❌ Real phone numbers
- ❌ Real medical data
- ❌ Placeholder text like "name here" or "link here"

### Tips for Approval:
- ✅ Use realistic but generic examples
- ✅ Make sure URLs look professional
- ✅ Keep it professional and medical-focused
- ✅ Show clear business purpose

---

## Step-by-Step: How to Enter Samples

1. After entering your template body, scroll down
2. You'll see "Variable samples" section
3. For each {{1}}, {{2}}, {{3}} etc., there's a text box
4. Click "Add sample text" or the text box
5. Enter the sample value from above
6. Repeat for all variables
7. Click "Submit"

---

## Visual Guide

### What You'll See:
```
Variable samples
Include samples of all variables...

Body
Enter content for {{1}}
[Text box] ← Type: Sharma

Enter content for {{2}}
[Text box] ← Type: John Doe

Enter content for {{3}}
[Text box] ← Type: https://nice4-d7886.web.app/viewer/sample123

... and so on
```

---

## After Entering Samples

1. Review the preview on the right side
2. Make sure it looks professional
3. Check all links are complete
4. Click "Submit"
5. Wait for approval (1-2 hours)

---

**Ready?** Use the samples above for each template!
