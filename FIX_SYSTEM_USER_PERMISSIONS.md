# Fix: "No permissions available" Error

## Problem
When trying to generate access token, you see:
```
No permissions available
Assign an app role to the system user, or select another app to continue.
```

## Solution: Assign App to System User First

---

## STEP 1: Assign Your App to the System User

### A. Go to System User Page
1. You should already be in: **Business Settings** → **System Users**
2. You should see your system user: `DICOM Notification Service`

### B. Add Assets (Apps)
1. Click on the system user name: `DICOM Notification Service`
2. Look for a section called **"Assets"** or **"Add Assets"**
3. Click **"Add Assets"** button

### C. Select Apps
1. A popup appears with tabs: **Apps**, **Pages**, **Ad Accounts**, etc.
2. Click the **"Apps"** tab
3. You'll see a list of your apps
4. Find your app (e.g., "Medical Referral Notifications" or whatever you named it)
5. **Check the box** next to your app name
6. In the dropdown next to it, select: **"Full Control"** or **"Develop App"**
7. Click **"Save Changes"**

---

## STEP 2: Now Generate Access Token

### A. Generate Token Button
1. You should still be on the system user page
2. Now click **"Generate New Token"** button
3. The popup should now show your app in the dropdown!

### B. Select App and Permissions
1. **App**: Select your app from dropdown (should now appear)
2. **Permissions**: Scroll down and check these boxes:
   - ☑️ `whatsapp_business_messaging`
   - ☑️ `whatsapp_business_management`
3. **Token Expiration**: Choose **60 days** or **Never expire**
4. Click **"Generate Token"**

### C. Copy Your Token
1. A long token appears (starts with `EAA...`)
2. Click **"Copy"** button
3. Save it immediately in a secure place
4. Click **"OK"**

---

## Alternative Method: Assign App During System User Creation

If you haven't created the system user yet, or want to start over:

### 1. Delete Old System User (if needed)
1. Go to **Business Settings** → **System Users**
2. Find your system user
3. Click the **3 dots** (⋮) on the right
4. Click **"Remove"**

### 2. Create New System User with App Assignment
1. Click **"Add"** button
2. Fill in:
   - **Name**: `DICOM Notification Service`
   - **Role**: **Admin**
3. Click **"Create System User"**
4. Immediately after creation, you'll see **"Add Assets"** section
5. Click **"Add Assets"**
6. Go to **"Apps"** tab
7. Check your app
8. Select **"Full Control"**
9. Click **"Save Changes"**
10. Now click **"Generate New Token"**

---

## Visual Guide

### What You Should See:

**Before assigning app:**
```
System User: DICOM Notification Service
Role: Admin

Assets: None

[Generate New Token] ← This won't work yet
```

**After assigning app:**
```
System User: DICOM Notification Service
Role: Admin

Assets:
  Apps (1)
    ✓ Medical Referral Notifications - Full Control

[Generate New Token] ← Now this will work!
```

---

## Troubleshooting

### Problem: Can't find "Add Assets" button
**Solution**: 
- Make sure you clicked ON the system user name (not just hovering)
- Look for tabs or sections: Assets, Assigned Assets, or Add Assets
- Try scrolling down on the system user detail page

### Problem: App doesn't appear in the list
**Solution**:
- Make sure you created the app in Meta for Developers
- Go to developers.facebook.com → My Apps to verify
- The app must be associated with the same business account

### Problem: Only see "Partial Access" option
**Solution**:
- "Full Control" or "Develop App" is what you need
- If you only see "Partial Access", select it and then check all permissions manually

---

## Quick Checklist

- [ ] Created system user
- [ ] Clicked on system user name to open details
- [ ] Clicked "Add Assets"
- [ ] Selected "Apps" tab
- [ ] Checked your app
- [ ] Selected "Full Control" or "Develop App"
- [ ] Saved changes
- [ ] Now "Generate New Token" button works
- [ ] Selected app from dropdown
- [ ] Checked WhatsApp permissions
- [ ] Generated and copied token

---

## Next Steps

Once you have the token:
1. Save it securely with your other credentials
2. Continue with creating message templates
3. Then add all credentials to backend `.env` file

---

**Still stuck?** Take a screenshot of what you see and I can guide you through it!
