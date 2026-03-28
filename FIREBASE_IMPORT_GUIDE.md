# Firebase Database Import Guide

## Quick Setup for Admin User

Since your database already has forms data, we'll just add the `users` section.

---

## Option 1: Manual Add (Recommended - Preserves Existing Data)

### Step 1: Add Admin User to Firebase Authentication

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `nice4-d7886`
3. Click **Authentication** → **Users**
4. Click **Add User**
5. Enter:
   - Email: `anbudentalscans@gmail.com`
   - Password: `Anbu@Salem2024` (or your choice)
6. Click **Add User**
7. **COPY THE UID** that appears (looks like: `xYz123AbC456...`)

### Step 2: Add Users to Realtime Database

1. In Firebase Console, click **Realtime Database**
2. Click the **Data** tab
3. Look for the root level (where you see `forms`)
4. Click the **+** icon at the root level
5. Enter key: `users`
6. Click **+** to add children

#### Add Ramanathapuram User:
1. Click **+** next to `users`
2. Key: `AC2pyfRushhIrWsk4FUQfRIboJc2`
3. Click **+** to add fields:
   - `email`: `3danbudentalscansramnadu@gmail.com`
   - `name`: `ANBU Ramanathapuram`
   - `role`: `branch-user`
   - `assignedBranch`: `ramanathapuram`
   - `branchName`: `ANBU Ramanathapuram`
   - `branchDisplayName`: `Ramanathapuram`
   - `createdAt`: `2026-02-09T00:00:00.000Z`

#### Add Hosur User:
1. Click **+** next to `users` again
2. Key: `9saCUKmPqNR8bfnFhGGj6htfWoP2`
3. Click **+** to add fields:
   - `email`: `3danbuscanshosur@gmail.com`
   - `name`: `ANBU Hosur`
   - `role`: `branch-user`
   - `assignedBranch`: `hosur`
   - `branchName`: `ANBU Hosur`
   - `branchDisplayName`: `Hosur`
   - `createdAt`: `2026-02-09T00:00:00.000Z`

#### Add Admin User:
1. Click **+** next to `users` again
2. Key: **PASTE THE UID YOU COPIED FROM STEP 1**
3. Click **+** to add fields:
   - `email`: `anbudentalscans@gmail.com`
   - `name`: `Admin User`
   - `role`: `admin`
   - `isAdmin`: `true` (boolean)
   - `canSelectBranches`: `true` (boolean)
   - `createdAt`: `2026-02-09T00:00:00.000Z`

---

## Option 2: JSON Import (If You Want to Start Fresh)

⚠️ **WARNING**: This will replace your entire database!

### If You Want to Keep Your Forms:

1. Export current database:
   - Firebase Console → Realtime Database → ⋮ (three dots) → Export JSON
   - Save as backup

2. Open the exported JSON file

3. Add this `users` section at the root level (same level as `forms`):

```json
{
  "forms": {
    ... your existing forms data ...
  },
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
    "REPLACE_WITH_ADMIN_UID": {
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

4. Replace `REPLACE_WITH_ADMIN_UID` with the actual UID from Firebase Authentication

5. Import back:
   - Firebase Console → Realtime Database → ⋮ → Import JSON
   - Select your modified file

---

## Verification

After adding users, verify in Firebase Console:

### Check Authentication:
- Go to Authentication → Users
- You should see 3 users:
  - `anbudentalscans@gmail.com`
  - `3danbudentalscansramnadu@gmail.com`
  - `3danbuscanshosur@gmail.com`

### Check Database:
- Go to Realtime Database → Data
- You should see:
  - `forms` (your existing data)
  - `users` (newly added)
    - 3 user entries with their UIDs

---

## Testing

### Test Admin User:
1. Go to https://nice4-d7886.web.app
2. Logout if logged in
3. Login with: `anbudentalscans@gmail.com`
4. Password: (what you set)
5. **Expected**: Branch selector with Salem Gugai and Salem LIC

### Test Ramanathapuram:
1. Logout
2. Login with: `3danbudentalscansramnadu@gmail.com`
3. **Expected**: Auto-routed to Ramanathapuram (no selector)

### Test Hosur:
1. Logout
2. Login with: `3danbuscanshosur@gmail.com`
3. **Expected**: Auto-routed to Hosur (no selector)

---

## Troubleshooting

### Admin user sees no branches:
- Check UID matches in Authentication and Database
- Check `isAdmin` is boolean `true`, not string "true"
- Hard refresh browser (Ctrl + Shift + R)

### Branch users see selector:
- Check `assignedBranch` field exists
- Check UID matches exactly
- Check email matches exactly (case-sensitive)

### Can't login:
- Verify user exists in Authentication
- Verify password is correct
- Check browser console for errors (F12)

---

## Quick Copy-Paste Values

**Ramanathapuram UID**: `AC2pyfRushhIrWsk4FUQfRIboJc2`
**Hosur UID**: `9saCUKmPqNR8bfnFhGGj6htfWoP2`

**Branch IDs**:
- Salem Gugai: `salem-gugai`
- Salem LIC: `salem-lic`
- Ramanathapuram: `ramanathapuram`
- Hosur: `hosur`

---

## Need Help?

If you get stuck:
1. Take a screenshot of where you are
2. Check Firebase Console for error messages
3. Check browser console (F12) for errors
4. Verify all UIDs match exactly

**Recommended**: Use Option 1 (Manual Add) to preserve your existing forms data!
