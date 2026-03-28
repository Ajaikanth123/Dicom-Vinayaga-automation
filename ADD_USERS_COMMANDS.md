# Add Users to Firebase - Easy Commands

Since you have database rules set to `true`, you can add users directly using these commands.

---

## Option 1: PowerShell Commands (Windows - Easiest!)

Open PowerShell and run these commands one by one:

### Add Ramanathapuram User:
```powershell
$body = @{
    email = "3danbudentalscansramnadu@gmail.com"
    name = "ANBU Ramanathapuram"
    role = "branch-user"
    assignedBranch = "ramanathapuram"
    branchName = "ANBU Ramanathapuram"
    branchDisplayName = "Ramanathapuram"
    createdAt = (Get-Date).ToString("o")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/users/AC2pyfRushhIrWsk4FUQfRIboJc2.json" -Method Put -Body $body -ContentType "application/json"
```

### Add Hosur User:
```powershell
$body = @{
    email = "3danbuscanshosur@gmail.com"
    name = "ANBU Hosur"
    role = "branch-user"
    assignedBranch = "hosur"
    branchName = "ANBU Hosur"
    branchDisplayName = "Hosur"
    createdAt = (Get-Date).ToString("o")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/users/9saCUKmPqNR8bfnFhGGj6htfWoP2.json" -Method Put -Body $body -ContentType "application/json"
```

### Add Admin User (After creating in Authentication):
**IMPORTANT**: First create the admin user in Firebase Console Authentication, then copy the UID and replace `YOUR_ADMIN_UID_HERE`:

```powershell
$body = @{
    email = "anbudentalscans@gmail.com"
    name = "Admin User"
    role = "admin"
    isAdmin = $true
    canSelectBranches = $true
    createdAt = (Get-Date).ToString("o")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/users/YOUR_ADMIN_UID_HERE.json" -Method Put -Body $body -ContentType "application/json"
```

---

## Option 2: Node.js Script

Run this from your project root:

```bash
node add-users-simple.js
```

(Make sure to edit the script and replace `ADMIN_UID` first!)

---

## Option 3: Manual via Firebase Console

1. Go to Firebase Console → Realtime Database
2. Click on root level
3. Click **+** to add `users` node
4. Add each user manually (see FIREBASE_IMPORT_GUIDE.md)

---

## Verification

After running the commands, check Firebase Console:

1. Go to: https://console.firebase.google.com/project/nice4-d7886/database/nice4-d7886-default-rtdb/data
2. You should see a `users` node with 3 children
3. Each user should have all their fields

---

## Quick Test

After adding users, test immediately:

```powershell
# Check if users were added
Invoke-RestMethod -Uri "https://nice4-d7886-default-rtdb.firebaseio.com/users.json" -Method Get
```

This will show all users in the database.

---

## Steps Summary

1. **Create admin user in Firebase Authentication**:
   - Go to Firebase Console → Authentication → Add User
   - Email: `anbudentalscans@gmail.com`
   - Password: Your choice
   - Copy the UID

2. **Run PowerShell commands above** (replace `YOUR_ADMIN_UID_HERE` with actual UID)

3. **Verify in Firebase Console**

4. **Test login** at https://nice4-d7886.web.app

---

## Troubleshooting

### "Access Denied" error:
- Check database rules are set to `true`
- Verify the URL is correct

### Users not showing:
- Check Firebase Console directly
- Verify JSON format is correct
- Check for typos in UIDs

### Can't login:
- Verify user exists in Authentication (for admin)
- Verify user exists in Database
- Check UIDs match exactly
- Hard refresh browser (Ctrl + Shift + R)

---

## Security Note

⚠️ **IMPORTANT**: After adding users, change your database rules back to secure rules:

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

This ensures only authenticated users can access their own data.
