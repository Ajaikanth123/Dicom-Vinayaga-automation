# WhatsApp API Credentials - Detailed Step-by-Step Guide

This guide shows you EXACTLY where to find each credential with detailed navigation steps.

---

## 🎯 What You Need to Get

You need 3 things:
1. **Phone Number ID** - Identifies your WhatsApp business number
2. **WhatsApp Business Account ID** - Identifies your business account
3. **Access Token** - Allows your backend to send messages

---

## 📍 PART 1: Get Phone Number ID & Business Account ID

### Step 1: Go to Meta for Developers
1. Open your browser
2. Go to: **https://developers.facebook.com/**
3. Click **"My Apps"** in the top right corner
4. You should see your app (e.g., "ANBU Dental DICOM Notifications")

### Step 2: Open Your App
1. Click on your app name
2. You'll see the App Dashboard

### Step 3: Navigate to WhatsApp Section
1. Look at the left sidebar
2. Find **"WhatsApp"** (it has a green WhatsApp icon)
3. Click on **"WhatsApp"**
4. Click on **"API Setup"** (under WhatsApp)

### Step 4: Find Phone Number ID
You'll see a page titled "API Setup"

**Look for a section that says "From"**:
```
From
Phone number ID: 123456789012345
```

**To Copy**:
1. Click the **copy icon** next to the Phone Number ID
2. Paste it somewhere safe (Notepad, etc.)
3. Label it: "Phone Number ID"

**Example**: `123456789012345` (15 digits)

### Step 5: Find Business Account ID
On the same "API Setup" page:

**Scroll down slightly, look for**:
```
WhatsApp Business Account ID: 123456789012345
```

**To Copy**:
1. Click the **copy icon** next to the Business Account ID
2. Paste it somewhere safe
3. Label it: "Business Account ID"

**Example**: `123456789012345` (15 digits)

**✅ Checkpoint**: You now have 2 out of 3 credentials!

---

## 🔑 PART 2: Generate Access Token (Most Important!)

### Step 1: Go to Business Settings
1. Open a new tab
2. Go to: **https://business.facebook.com/**
3. Click the **gear icon** (⚙️) in the top left
4. This opens **"Business Settings"**

### Step 2: Navigate to System Users
1. In the left sidebar, look for **"Users"** section
2. Under "Users", click **"System Users"**
3. You'll see a list of system users (might be empty)

### Step 3: Create a System User (If You Don't Have One)

**If you see "No system users"**:
1. Click the blue **"Add"** button (top right)
2. A popup appears

**Fill in the form**:
- **System User Name**: `DICOM Notification Service`
- **System User Role**: Select **"Admin"**
3. Click **"Create System User"**

**If you already have a system user**:
- Just click on the existing user name

### Step 4: Generate Access Token
1. You should now see the System User details page
2. Look for a button that says **"Generate New Token"**
3. Click **"Generate New Token"**

### Step 5: Configure Token Permissions
A popup appears: "Generate Access Token"

**Step 5a: Select Your App**
1. Under "App", click the dropdown
2. Select your app: `ANBU Dental DICOM Notifications`

**Step 5b: Select Permissions**
Scroll down to find these checkboxes:
- ☑️ **whatsapp_business_messaging** (REQUIRED)
- ☑️ **whatsapp_business_management** (REQUIRED)

**Important**: Make sure BOTH are checked!

**Step 5c: Set Token Expiration**
- Choose **"60 days"** (recommended)
- Or choose **"Never expire"** (less secure but easier)

**Step 5d: Generate**
1. Click the blue **"Generate Token"** button
2. Wait 2-3 seconds

### Step 6: Copy Your Access Token

**CRITICAL STEP - READ CAREFULLY!**

A popup appears with your token:
```
Access Token
EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx... (very long string)
```

**⚠️ WARNING**: You will ONLY see this token ONCE! If you close this popup, you'll need to generate a new token.

**To Copy**:
1. Click the **"Copy"** button
2. Immediately paste it in a safe place:
   - Notepad
   - Password manager
   - Secure note
3. Label it: "WhatsApp Access Token"
4. **DO NOT CLOSE THE POPUP YET!**

**Verify you copied it**:
1. Open your Notepad/note
2. Check the token is there
3. It should start with `EAA` and be very long (200+ characters)
4. Only then click **"OK"** to close the popup

**Example Token** (shortened):
```
EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...xxxxxxxxx...xxxxxxxxx
```

**✅ Checkpoint**: You now have all 3 credentials!

---

## 📝 PART 3: Organize Your Credentials

Create a text file with this format:

```
=== WhatsApp API Credentials ===
Date: [Today's Date]

Phone Number ID:
123456789012345

Business Account ID:
123456789012345

Access Token:
EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...xxxxxxxxx...xxxxxxxxx

=== KEEP THIS SECURE ===
```

**Save this file as**: `whatsapp-credentials-PRIVATE.txt`

**⚠️ Security**:
- Do NOT share this file
- Do NOT commit to Git
- Do NOT post online
- Store in a secure location

---

## 🔍 PART 4: Verify Your Credentials

### Quick Check:

**Phone Number ID**:
- ✅ Should be 15 digits
- ✅ All numbers (no letters)
- ✅ Example: `123456789012345`

**Business Account ID**:
- ✅ Should be 15 digits
- ✅ All numbers (no letters)
- ✅ Example: `123456789012345`

**Access Token**:
- ✅ Should start with `EAA`
- ✅ Very long (200+ characters)
- ✅ Mix of letters and numbers
- ✅ Example: `EAABsbCS1iHgBO7Gn8ZCZBqVZCxxx...`

---

## 🧪 PART 5: Test Your Credentials (Optional)

You can test if your credentials work using this curl command:

```bash
curl -X POST \
  "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

**Replace**:
- `YOUR_PHONE_NUMBER_ID` → Your Phone Number ID
- `YOUR_ACCESS_TOKEN` → Your Access Token
- `YOUR_PHONE_NUMBER` → Your phone number (with country code, e.g., `+919876543210`)

**If successful**, you'll receive a WhatsApp message!

---

## 🚨 Troubleshooting

### Problem 1: Can't Find "System Users"
**Solution**:
- Make sure you're in **Business Settings** (not App Dashboard)
- Look under "Users" section in left sidebar
- If you don't see it, you might not have admin access

### Problem 2: "Generate Token" Button is Grayed Out
**Solution**:
- Make sure you selected your app from dropdown
- Make sure you checked the required permissions
- Try refreshing the page

### Problem 3: Token Doesn't Work
**Solution**:
- Check you copied the entire token (it's very long)
- Make sure there are no extra spaces
- Token might have expired - generate a new one

### Problem 4: Can't Find Phone Number ID
**Solution**:
- Make sure you've added a phone number to your WhatsApp Business Account
- Go to WhatsApp > API Setup
- If you don't see it, you need to add a phone number first (see main guide Phase 4)

---

## 📸 Visual Reference (What to Look For)

### In Meta for Developers (developers.facebook.com):
```
┌─────────────────────────────────────────┐
│ My Apps                          [User] │
├─────────────────────────────────────────┤
│                                         │
│  📱 ANBU Dental DICOM Notifications    │
│                                         │
│  Left Sidebar:                          │
│  ├─ Dashboard                           │
│  ├─ 📊 Analytics                        │
│  ├─ 💬 WhatsApp                         │
│  │   ├─ Getting Started                 │
│  │   ├─ API Setup  ← YOU ARE HERE      │
│  │   └─ Message Templates               │
│  └─ Settings                            │
│                                         │
│  API Setup Page:                        │
│  ┌───────────────────────────────────┐ │
│  │ From                              │ │
│  │ Phone number ID: 123456789012345  │ │
│  │ [Copy]                            │ │
│  │                                   │ │
│  │ WhatsApp Business Account ID:     │ │
│  │ 123456789012345 [Copy]            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### In Business Settings (business.facebook.com):
```
┌─────────────────────────────────────────┐
│ ⚙️ Business Settings                    │
├─────────────────────────────────────────┤
│                                         │
│  Left Sidebar:                          │
│  ├─ Business Info                       │
│  ├─ Users                               │
│  │   ├─ People                          │
│  │   └─ System Users  ← YOU ARE HERE   │
│  ├─ Accounts                            │
│  └─ Data Sources                        │
│                                         │
│  System Users Page:                     │
│  ┌───────────────────────────────────┐ │
│  │ DICOM Notification Service        │ │
│  │ Role: Admin                       │ │
│  │                                   │ │
│  │ [Generate New Token]  ← CLICK     │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## ✅ Final Checklist

Before moving to the next step:
- [ ] I have my Phone Number ID (15 digits)
- [ ] I have my Business Account ID (15 digits)
- [ ] I have my Access Token (starts with EAA, very long)
- [ ] I saved all credentials in a secure file
- [ ] I verified the credentials look correct
- [ ] I did NOT share these credentials with anyone
- [ ] I did NOT commit them to Git

---

## 🎯 Next Steps

Once you have all 3 credentials:
1. Add them to your `dicom-backend/.env` file
2. I'll create the WhatsApp service code
3. We'll test sending messages
4. Deploy to production

**Ready?** Share with me (in a secure way) that you have the credentials, and I'll help you integrate them!

---

## 📞 Need Help?

If you're stuck:
1. Take a screenshot of where you're stuck
2. Tell me which step you're on
3. I'll guide you through it

**Common places people get stuck**:
- Finding System Users (it's in Business Settings, not App Dashboard)
- Copying the full access token (make sure you get all of it!)
- Selecting the right permissions (both checkboxes must be checked)
