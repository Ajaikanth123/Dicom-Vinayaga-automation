# Firebase Import Instructions

## Step 1: Create Admin User in Firebase Authentication

**IMPORTANT**: Do this FIRST before importing!

1. Go to Firebase Console: https://console.firebase.google.com/project/nice4-d7886/authentication/users
2. Click **Add User**
3. Enter:
   - Email: `anbudentalscans@gmail.com`
   - Password: `Anbu@Salem2024` (or your choice)
4. Click **Add User**
5. **COPY THE UID** that appears (looks like: `xYz123AbC456...`)
6. Keep this UID - you'll need it in Step 3

---

## Step 2: Add Admin User to JSON File

1. Open the file: `firebase-import-clean.json`
2. Add the admin user section with the UID you copied

**Replace `YOUR_ADMIN_UID_HERE` with the actual UID:**

```json
{
  "users": {
    "AC2pyfRushhIrWsk4FUQfRIboJc2": {
      "email": "3danbudentalscansramnadu@gmail.com",
      "name": "ANBU Ramanathapuram",
      "role": "branch-user",
      "assignedBranch": "ramanathapuram",
      "branchName": "ANBU Ramanathapuram",
      "branchDisplayName": "Ramanathapuram",
      "createdAt": "2026-02-09T00:00:00.000Z"
    },
    "9saCUKmPqNR8bfnFhGGj6htfWoP2": {
      "email": "3danbuscanshosur@gmail.com",
      "name": "ANBU Hosur",
      "role": "branch-user",
      "assignedBranch": "hosur",
      "branchName": "ANBU Hosur",
      "branchDisplayName": "Hosur",
      "createdAt": "2026-02-09T00:00:00.000Z"
    },
    "YOUR_ADMIN_UID_HERE": {
      "email": "anbudentalscans@gmail.com",
      "name": "Admin User",
      "role": "admin",
      "isAdmin": true,
      "canSelectBranches": true,
      "createdAt": "2026-02-09T00:00:00.000Z"
    }
  }
}
```

3. Save the file

---

## Step 3: Import to Firebase

1. Go to Firebase Console: https://console.firebase.google.com/project/nice4-d7886/database/nice4-d7886-default-rtdb/data
2. Click the **⋮** (three dots) at the top right
3. Click **Import JSON**
4. Select the file: `firebase-import-clean.json` (the one you just edited)
5. Click **Import**

---

## Step 4: Verify

After import, you should see in Firebase Console:

```
nice4-d7886-default-rtdb
└── users
    ├── AC2pyfRushhIrWsk4FUQfRIboJc2 (Ramanathapuram)
    ├── 9saCUKmPqNR8bfnFhGGj6htfWoP2 (Hosur)
    └── [Your Admin UID] (Admin)
```

---

## Step 5: Test Login

### Test Admin User:
1. Go to https://nice4-d7886.web.app
2. Login with: `anbudentalscans@gmail.com`
3. Password: (what you set in Step 1)
4. **Expected**: Branch selector with Salem Gugai and Salem LIC

### Test Ramanathapuram:
1. Logout
2. Login with: `3danbudentalscansramnadu@gmail.com`
3. Password: `Anbu@9360421853`
4. **Expected**: Auto-routed to Ramanathapuram

### Test Hosur:
1. Logout
2. Login with: `3danbuscanshosur@gmail.com`
3. Password: `Anbu@9345845378`
4. **Expected**: Auto-routed to Hosur

---

## Alternative: Use PowerShell Commands

If you prefer commands instead of import:

```powershell
# Add Ramanathapuram user
$body1 = @{email="3danbudentalscansramnadu@gmail.com";name="ANBU Ramanathapuram";role="branch-user";assignedBranch="ramanathapuram";branchName="ANBU Ramanathapuram";branchDisplayName="Ramanathapuram";createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/AC2pyfRushhIrWsk4FUQfRIboJc2.json" -Method Put -Body $body1 -ContentType "application/json"

# Add Hosur user
$body2 = @{email="3danbuscanshosur@gmail.com";name="ANBU Hosur";role="branch-user";assignedBranch="hosur";branchName="ANBU Hosur";branchDisplayName="Hosur";createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/9saCUKmPqNR8bfnFhGGj6htfWoP2.json" -Method Put -Body $body2 -ContentType "application/json"

# Add Admin user (replace YOUR_ADMIN_UID with actual UID)
$body3 = @{email="anbudentalscans@gmail.com";name="Admin User";role="admin";isAdmin=$true;canSelectBranches=$true;createdAt=(Get-Date).ToString("o")} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app/users/YOUR_ADMIN_UID.json" -Method Put -Body $body3 -ContentType "application/json"
```

---

## Troubleshooting

### Import fails:
- Make sure the JSON is valid (no syntax errors)
- Make sure you replaced `YOUR_ADMIN_UID_HERE` with actual UID
- Try importing to root level (not inside any node)

### Can't login:
- Verify user exists in Authentication
- Verify user exists in Database with correct UID
- Hard refresh browser (Ctrl + Shift + R)
- Try incognito window

### Admin sees no branches:
- Check `isAdmin` is boolean `true`, not string "true"
- Check `canSelectBranches` is boolean `true`
- Verify UID matches exactly between Authentication and Database

---

## Quick Summary

1. ✅ Create admin in Firebase Authentication
2. ✅ Copy admin UID
3. ✅ Edit `firebase-import-clean.json` with admin UID
4. ✅ Import JSON to Firebase
5. ✅ Test all 3 logins

**File to import**: `firebase-import-clean.json` (after editing with admin UID)
