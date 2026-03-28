# 🚀 Quick Start - Authentication System

## ⚡ 3-Minute Setup

### Step 1: Get Firebase Database URL (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click **dicom-connect** project
3. Click **Realtime Database** in left menu
4. If you see "Create Database" → Click it and choose your region
5. Copy the URL at the top (looks like: `https://dicom-connect-default-rtdb.firebaseio.com`)

### Step 2: Update Config (30 seconds)

Open `medical-referral-system/firebase.js` and add line 7:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAljTqHLcNCb39NGrhLGE8PQqtMdmoGfvE",
  authDomain: "dicom-connect.firebaseapp.com",
  databaseURL: "PASTE_YOUR_URL_HERE", // ← ADD THIS
  projectId: "dicom-connect",
  storageBucket: "dicom-connect.firebasestorage.app",
  messagingSenderId: "688351923049",
  appId: "1:688351923049:web:7b265ab44f5c9b6fce4bf8"
};
```

### Step 3: Set Database Rules (30 seconds)

In Firebase Console → Realtime Database → Rules tab:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": false
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

Click **Publish**.

### Step 4: Add User Data (1 minute per user)

For EACH admin you created in Authentication:

1. Go to **Authentication** → **Users** tab
2. Copy the **UID** (long string like `abc123xyz...`)
3. Go to **Realtime Database** → **Data** tab
4. Click **+** next to root
5. Name: `users`
6. Click **+** next to `users`
7. Name: Paste the UID
8. Add these fields:

```
uid: "SAME_UID_YOU_COPIED"
email: "salem.lic@anbu.com"
displayName: "Salem LIC Admin"
assignedBranch: "ANBU-SLM-LIC"
canViewBranches: ["ANBU-SLM-LIC", "ANBU-SLM-GUG", "ANBU-RMD", "ANBU-HSR"]
role: "admin"
createdAt: 1738000000000
```

**Branch IDs (use exactly as shown):**
- Salem LIC: `ANBU-SLM-LIC`
- Salem Gugai: `ANBU-SLM-GUG`
- Ramanathapuram: `ANBU-RMD`
- Hosur: `ANBU-HSR`

Repeat for all 4 admins.

---

## ✅ Test It!

```bash
cd medical-referral-system
npm run dev
```

1. Go to http://localhost:5173
2. Should redirect to `/login`
3. Login with admin email
4. Should see dashboard with assigned branch selected
5. Create a form
6. Check Firebase Console → Realtime Database → forms → {branchId}
7. Your form should be there! 🎉

---

## 🆘 Need Help?

**Can't find database URL?**
→ Read `GET_FIREBASE_DATABASE_URL.md`

**Login works but no branch?**
→ Check `assignedBranch` matches exactly: `ANBU-SLM-LIC` (not "Salem LIC")

**Forms not saving?**
→ Check database rules are published
→ Check `databaseURL` in firebase.js

**"User profile not found"?**
→ Check UID in database matches UID in Authentication

---

## 📚 Full Documentation

- `AUTHENTICATION_COMPLETE_READY_TO_TEST.md` - Complete guide
- `FIREBASE_SETUP_GUIDE.md` - Detailed Firebase setup
- `GET_FIREBASE_DATABASE_URL.md` - How to find database URL

---

**That's it! You're ready to go! 🚀**
