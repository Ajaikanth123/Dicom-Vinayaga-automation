# Branch-Specific Email Configuration Complete

## Overview
Implemented branch-specific email configurations so each branch sends emails from their own Gmail account.

## Branch Email Configurations

### Ramanathapuram Branch
- **Email**: 3danbudentalscansramnadu2@gmail.com
- **App Password**: jvrpwdhdumxcazvm (spaces removed)
- **Phone**: +919360421853

### Hosur Branch
- **Email**: 3danbuscanshosur2@gmail.com
- **App Password**: hjlqhysbjuetikeq (spaces removed)
- **Phone**: +919345845378

### Salem Branches (Gugai & LIC)
- Use default/global email settings

## Changes Made

### 1. Backend - Email Service (`dicom-backend/services/emailService.js`)
- Updated `createTransporter()` to accept `branchId` parameter
- Loads branch-specific SMTP settings from Firebase: `emailSettings/branches/{branchId}/smtp`
- Falls back to global settings if branch-specific not found
- Updated `getOrganizationSettings()` to support branch-specific organization details
- All email functions now accept optional `branchId` parameter

### 2. Backend - Email Routes (`dicom-backend/routes/email.js`)
- Added `/email/send-dicom-notification` endpoint
- Accepts `branchId` in request body
- Passes `branchId` to email service functions

### 3. Frontend - API Service (`medical-referral-system/src/services/api.js`)
- Updated `sendEmailNotification()` to accept `branchId` parameter
- Passes `branchId` to backend API

### 4. Frontend - Form Context (`medical-referral-system/src/context/FormContext.jsx`)
- Updated `sendEmailNotifications()` to pass `form.branchId` to API
- Ensures emails are sent using branch-specific credentials

### 5. Firebase Database Setup
- Created script: `dicom-backend/setup-branch-emails.js`
- Initialized branch-specific email settings in Firebase
- Database structure:
  ```
  emailSettings/
    ├── branches/
    │   ├── ramanathapuram/
    │   │   ├── smtp/
    │   │   │   ├── host: "smtp.gmail.com"
    │   │   │   ├── port: 587
    │   │   │   ├── secure: false
    │   │   │   └── auth/
    │   │   │       ├── user: "3danbudentalscansramnadu2@gmail.com"
    │   │   │       └── pass: "jvrpwdhdumxcazvm"
    │   │   └── organization/
    │   │       ├── name: "3D Anbu Dental Diagnostics LLP - Ramanathapuram"
    │   │       ├── email: "3danbudentalscansramnadu2@gmail.com"
    │   │       └── phone: "+919360421853"
    │   └── hosur/
    │       ├── smtp/
    │       │   └── auth/
    │       │       ├── user: "3danbuscanshosur2@gmail.com"
    │       │       └── pass: "hjlqhysbjuetikeq"
    │       └── organization/
    │           ├── name: "3D Anbu Dental Diagnostics LLP - Hosur"
    │           └── email: "3danbuscanshosur2@gmail.com"
    └── smtp/ (global default for Salem branches)
  ```

## How It Works

1. User logs into Ramanathapuram branch
2. Creates a form/case
3. Sends email notification
4. Backend receives request with `branchId: "ramanathapuram"`
5. Email service loads Ramanathapuram-specific SMTP credentials from Firebase
6. Email is sent FROM `3danbudentalscansramnadu2@gmail.com`
7. Same process for Hosur branch with their email
8. Salem branches use global/default email settings

## Testing

To test branch-specific emails:

1. Login as Ramanathapuram user (`3danbudentalscansramnadu@gmail.com`)
2. Create a case and send notification
3. Check that email is sent from `3danbudentalscansramnadu2@gmail.com`

4. Login as Hosur user (`3danbuscanshosur@gmail.com`)
5. Create a case and send notification
6. Check that email is sent from `3danbuscanshosur2@gmail.com`

## Deployment Steps

### Backend Deployment (Required)
```bash
cd dicom-backend
gcloud builds submit --config cloudbuild.yaml
```

### Frontend Deployment (Already done)
```bash
cd medical-referral-system
npm run build
firebase deploy --only hosting
```

## Security Notes

- App passwords are stored in Firebase Realtime Database
- Passwords are masked when fetched via API (shown as `***`)
- Only backend has access to actual passwords
- Each branch's credentials are isolated

## Maintenance

To update branch email credentials:
1. Edit `dicom-backend/setup-branch-emails.js`
2. Run: `node setup-branch-emails.js` from dicom-backend folder
3. Or update directly in Firebase Console

## Next Steps

1. Deploy backend to Google Cloud Run
2. Test email sending from each branch
3. Verify correct email addresses are used
4. Monitor email delivery logs
