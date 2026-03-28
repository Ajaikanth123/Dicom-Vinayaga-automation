# Get Phone Number ID - Quick Guide

You have:
✅ Business Account ID: `908777428672260`
✅ Access Token: `EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD`

Still need:
❌ Phone Number ID

---

## How to Get Phone Number ID

### Method 1: From Meta for Developers (Easiest)

1. Go to: **https://developers.facebook.com/**
2. Click **"My Apps"** (top right)
3. Click on your app name
4. In left sidebar, click **WhatsApp**
5. Click **"API Setup"** (under WhatsApp)
6. You'll see a page with:

```
From
Phone number ID: 123456789012345  [Copy]
```

7. Click the **Copy** button
8. That's your Phone Number ID!

---

### Method 2: From WhatsApp Manager

1. Go to: **https://business.facebook.com/wa/manage/home/**
2. Select your WhatsApp Business Account
3. Click **"Phone Numbers"** in left menu
4. You'll see your phone number listed
5. Click on the phone number
6. Look for **"Phone Number ID"**
7. Copy it

---

### Method 3: Using API (If above don't work)

You can use your Business Account ID to get the Phone Number ID:

1. Open this URL in your browser (replace YOUR_TOKEN with your actual token):

```
https://graph.facebook.com/v18.0/908777428672260/phone_numbers?access_token=YOUR_TOKEN
```

Full URL:
```
https://graph.facebook.com/v18.0/908777428672260/phone_numbers?access_token=EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD
```

2. You'll see JSON response like:
```json
{
  "data": [
    {
      "verified_name": "Your Business Name",
      "display_phone_number": "+91 98765 43210",
      "id": "123456789012345",
      "quality_rating": "GREEN"
    }
  ]
}
```

3. The **"id"** field is your Phone Number ID!

---

## What It Looks Like

Phone Number ID format:
- 15 digits
- All numbers (no letters)
- Example: `123456789012345`

---

## Once You Have It

You'll have all 3 credentials:
1. ✅ Phone Number ID: `[paste here]`
2. ✅ Business Account ID: `908777428672260`
3. ✅ Access Token: `EAARCyGNCBnYBQ72SZAJFcy6K9xCvUqSZA5VmRrD03ezrNJZBtfki29hCFmRoEsFuVNaHPiSxtOLYPPhTWjJGg6XAABK6aBeV4He25Vo2S9DysTZAfVvYVn1ZBSTht1iKZANbBzR5F9diekc9Sgcn5dc2clkHq3YfYA8ZCIqtnmZCyDo2zcyTWczA14F3S92dYwZDZD`

Then we'll:
1. Create message templates
2. Add credentials to backend
3. Deploy
4. Test!

---

**Let me know once you have the Phone Number ID!**
