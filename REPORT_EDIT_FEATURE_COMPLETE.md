# Report Edit & Replace Feature - Implementation Complete

## Overview
Users can now edit/replace existing reports from the Manage Forms page and send notifications with a new email template specifically for report replacements.

## What Was Implemented

### 1. Frontend Changes (ManageForms.jsx)

#### Report Column Enhancement
- **Before**: Report column showed only "View" or "Upload" button
- **After**: Report column shows:
  - **View** + **Edit** buttons when report exists
  - **Upload** button when no report exists

#### New State Management
- Added `isReplacing` flag to track if user is replacing an existing report
- Modal title changes based on context:
  - "Upload Diagnostic Report" (new upload)
  - "Replace Diagnostic Report" (replacing existing)

#### Notification Flow
- When replacing a report, uses `MESSAGE_TYPES.REPORT_REPLACED` instead of `REPORT_UPDATE`
- Different notification message for replacements vs. initial uploads

### 2. Notification Modal Updates (NotificationModal.jsx)

#### New Message Type
```javascript
export const MESSAGE_TYPES = {
  INITIAL_SEND: 'INITIAL_SEND',
  REPORT_UPDATE: 'REPORT_UPDATE',
  REPORT_REPLACED: 'REPORT_REPLACED'  // NEW
};
```

#### Message Templates
- Added `getDoctorReportReplacedMessage()` function
- Message emphasizes "UPDATED" status
- Uses different wording to indicate replacement

#### Validation
- Updated validation to check for report file on both `REPORT_UPDATE` and `REPORT_REPLACED`
- API function selection includes `REPORT_REPLACED` type

### 3. Backend Email Service (reportEmailService.js)

#### New Email Template
- Created `generateReplacementEmailHTML()` function
- Created `generateReplacementEmailText()` function
- Different visual design:
  - Blue gradient header (vs. green for completion)
  - 🔄 icon instead of ✅
  - "Report Updated!" title
  - "NEW VERSION" badge
  - Emphasis on updated content

#### Email Subject
- **Completion**: `✅ Report Complete - ${patientName}`
- **Replacement**: `🔄 Report Updated - ${patientName}`

#### Template Features
- Highlights that this is an UPDATED version
- Warns to discard previous versions
- Shows "Updated On" instead of "Report Date"
- Different color scheme (blue theme)

### 4. Context Updates (FormContext.jsx)

#### Notification Status Handling
```javascript
if (messageType === MESSAGE_TYPES.REPORT_UPDATE || messageType === MESSAGE_TYPES.REPORT_REPLACED) {
  newNotificationStatus = NOTIFICATION_STATUS.REPORT_SENT;
}
```

### 5. CSS Styling (Pages.css)

#### New Button Styles
```css
.file-action-btn.edit-report {
  background: #f3e5f5;
  color: #6a1b9a;
}

.file-action-btn.edit-report:hover {
  background: #6a1b9a;
  color: white;
}

.report-actions-group {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}
```

## User Flow

### Replacing an Existing Report

1. User navigates to Manage Forms page
2. Finds a form with an existing report
3. Clicks the **Edit** button (purple) next to **View** button
4. Modal opens with title "Replace Diagnostic Report"
5. User selects new PDF file
6. Clicks "Upload Report"
7. Success message: "Report replaced successfully!"
8. Modal shows notification step with updated message
9. User clicks "Send Notification"
10. Doctor receives email with subject "🔄 Report Updated - [Patient Name]"
11. Email template emphasizes this is an UPDATED version

### Email Template Comparison

#### Initial Report Email
- ✅ Green theme
- "Report Complete!"
- "The report is completely generated"
- Standard completion message

#### Replacement Report Email
- 🔄 Blue theme
- "Report Updated!"
- "🔄 NEW VERSION" badge
- "UPDATED with a new version"
- Warning to discard previous versions
- "Updated On" timestamp

## Technical Details

### Message Type Flow
```
User clicks Edit → isReplacing = true
↓
Upload modal opens with "Replace" title
↓
File uploaded → reportMetadata saved
↓
Notification step → MESSAGE_TYPES.REPORT_REPLACED
↓
NotificationModal → getDoctorReportReplacedMessage()
↓
Backend → sendReportCompletionEmail({ isReplacement: true })
↓
Email sent with replacement template
```

### Files Modified
1. `medical-referral-system/src/pages/ManageForms.jsx`
2. `medical-referral-system/src/components/NotificationModal/NotificationModal.jsx`
3. `medical-referral-system/src/context/FormContext.jsx`
4. `medical-referral-system/src/pages/Pages.css`
5. `dicom-backend/services/reportEmailService.js`

## Testing Checklist

- [ ] View button works for existing reports
- [ ] Edit button appears next to View button
- [ ] Edit button opens modal with "Replace" title
- [ ] File upload validation works (PDF only, max 10MB)
- [ ] Upload shows "Report replaced successfully!" message
- [ ] Notification step shows updated message
- [ ] Email sent with "🔄 Report Updated" subject
- [ ] Email template shows blue theme and NEW VERSION badge
- [ ] Toast notification shows "Updated report notification sent"

## Benefits

1. **Clear Visual Distinction**: Different colors and icons for View vs. Edit
2. **User Awareness**: Modal title clearly indicates replacement action
3. **Doctor Notification**: Separate email template emphasizes update
4. **Professional Communication**: Email warns to discard old versions
5. **Audit Trail**: System tracks replacement vs. initial upload

## Future Enhancements

1. Version history tracking
2. Comparison view between old and new reports
3. Reason for replacement field
4. Automatic archival of old report versions
5. Notification to patient about updated report

---

**Status**: ✅ Complete and ready for testing
**Date**: February 16, 2026
