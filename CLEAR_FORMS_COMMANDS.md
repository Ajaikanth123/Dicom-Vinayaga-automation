# Clear All Forms from Firebase

## Option 1: PowerShell Script (Recommended)

Run this script which includes a confirmation prompt:

```powershell
.\clear-all-forms.ps1
```

It will ask you to type "YES" to confirm before deleting.

---

## Option 2: Direct PowerShell Command

If you want to delete immediately without confirmation:

```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms.json" -Method Delete
Write-Host "✅ All forms deleted!" -ForegroundColor Green
```

---

## Option 3: Clear Specific Branch Only

### Clear only ANBU-HSR forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/ANBU-HSR.json" -Method Delete
Write-Host "✅ ANBU-HSR forms deleted!" -ForegroundColor Green
```

### Clear only ANBU-SLM-GUG forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/ANBU-SLM-GUG.json" -Method Delete
Write-Host "✅ ANBU-SLM-GUG forms deleted!" -ForegroundColor Green
```

### Clear only salem-gugai forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/salem-gugai.json" -Method Delete
Write-Host "✅ salem-gugai forms deleted!" -ForegroundColor Green
```

### Clear only salem-lic forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/salem-lic.json" -Method Delete
Write-Host "✅ salem-lic forms deleted!" -ForegroundColor Green
```

### Clear only ramanathapuram forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/ramanathapuram.json" -Method Delete
Write-Host "✅ ramanathapuram forms deleted!" -ForegroundColor Green
```

### Clear only hosur forms:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/hosur.json" -Method Delete
Write-Host "✅ hosur forms deleted!" -ForegroundColor Green
```

---

## Option 4: Via Firebase Console (Manual)

1. Go to: https://console.firebase.google.com/project/nice4-d7886/database
2. Find the `forms` node
3. Click the **⋮** (three dots) next to `forms`
4. Click **Delete**
5. Confirm deletion

---

## What Gets Deleted

When you delete the `forms` node:
- ✅ All forms from all branches
- ✅ All case data
- ✅ All DICOM file references
- ✅ All notification history

**What stays intact:**
- ✅ Users data
- ✅ Authentication accounts
- ✅ Actual DICOM files in Google Cloud Storage (if any)

---

## Verify Deletion

After running the command, verify in Firebase Console:

```powershell
# Check if forms still exist
$forms = Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms.json" -Method Get
if ($null -eq $forms) {
    Write-Host "✅ Forms successfully deleted!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Forms still exist" -ForegroundColor Yellow
}
```

---

## Restore from Backup

If you want to restore later, you can import your backup:

1. Go to Firebase Console → Realtime Database
2. Click **⋮** (three dots) → Import JSON
3. Select your backup file: `nice4-d7886-default-rtdb-export.json`

---

## Security Note

⚠️ **IMPORTANT**: This only works because your database rules are set to `true`. 

After clearing forms, consider updating your rules to:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "forms": {
      "$branchId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

This ensures only authenticated users can access data.

---

## Quick Reference

**Delete all forms**: `.\clear-all-forms.ps1`

**Delete specific branch**: Replace `BRANCH_ID` with actual branch ID:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms/BRANCH_ID.json" -Method Delete
```

**Verify deletion**:
```powershell
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/forms.json" -Method Get
```
