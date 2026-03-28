# Admin User Setup Guide

## New Branch Routing System ✅

### How It Works Now:

1. **Admin User** (`anbudentalscans@gmail.com`)
   - Sees branch selector with 2 options:
     - ANBU Salem Gugai
     - ANBU Salem LIC
   - Must manually select which branch to work in
   - Can switch between Salem branches

2. **Ramanathapuram User** (`3danbudentalscansramnadu@gmail.com`)
   - Automatically routed to Ramanathapuram branch
   - No branch selector shown
   - Cannot access other branches

3. **Hosur User** (`3danbuscanshosur@gmail.com`)
   - Automatically routed to Hosur branch
   - No branch selector shown
   - Cannot access other branches

---

## Firebase Setup Required

You need to add the admin user to Firebase Authentication and Database.

### Step 1: Add Admin User to Firebase Authentication

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `nice4-d7886`
3. Click **Authentication** in left menu
4. Click **Users** tab
5. Click **Add User** button
6. Enter:
   - **Email**: `anbudentalscans@gmail.com`
   - **Password**: Choose a secure password (e.g., `Anbu@Salem2024`)
7. Click **Add User**

### Step 2: Add Admin User to Realtime Database

1. In Firebase Console, click **Realtime Database** in left menu
2. Click on the **Data** tab
3. Find the `users` node (or create it if it doesn't exist)
4. Click the **+** icon next to `users`
5. Add a new child with:
   - **Name**: The UID from Authentication (copy from Users tab)
   - **Value**: Click **+** to add fields:

```json
{
  "email": "anbudentalscans@gmail.com",
  "name": "Admin User",
  "role": "admin",
  "isAdmin": true,
  "canSelectBranches": true,
  "createdAt": "2024-02-09T00:00:00.000Z"
}
```

---

## Testing

### Test Admin User:
1. Go to https://nice4-d7886.web.app
2. Click logout if already logged in
3. Log in with: `anbudentalscans@gmail.com`
4. Password: (the one you set)
5. **Expected**: You should see branch selector with Salem Gugai and Salem LIC
6. Select one branch
7. You should be taken to the dashboard

### Test Ramanathapuram User:
1. Logout
2. Log in with: `3danbudentalscansramnadu@gmail.com`
3. Password: `Anbu@9360421853`
4. **Expected**: Automatically taken to Ramanathapuram branch (no selector)

### Test Hosur User:
1. Logout
2. Log in with: `3danbuscanshosur@gmail.com`
3. Password: `Anbu@9345845378`
4. **Expected**: Automatically taken to Hosur branch (no selector)

---

## Branch IDs

For reference, the branch IDs are:
- **salem-gugai** - ANBU Salem Gugai
- **salem-lic** - ANBU Salem LIC
- **ramanathapuram** - ANBU Ramanathapuram
- **hosur** - ANBU Hosur

---

## What Changed

### Files Modified:
1. `src/config/branchConfig.js` - Added Salem branches and admin user config
2. `src/context/AuthContext.jsx` - Added admin user detection
3. `src/context/FormContext.jsx` - Added logic to show different branches for admin

### New Behavior:
- Admin users see branch selector with Salem branches only
- Non-admin users with assigned branches are auto-routed (no selector)
- Each user can only access their assigned branch(es)

---

## Deployed

- **Frontend**: https://nice4-d7886.web.app
- **Status**: ✅ Live
- **Version**: v1.0.1

---

## Need Help?

If the admin user doesn't work:
1. Verify the email is exactly `anbudentalscans@gmail.com` in Firebase Auth
2. Verify the user exists in Realtime Database under `users/{uid}`
3. Check browser console for errors (F12)
4. Try hard refresh (Ctrl + Shift + R)
5. Try incognito window

