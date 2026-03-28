# Top 10 Tasks to Implement
## Priority Features for Medical DICOM System

**Date:** March 6, 2026  
**Status:** Pending Implementation

---

## 1. Update Upload Route to Use New WhatsApp Template
Replace `sendDicomNotification()` with `sendScanUploadedNotification()` in upload.js to include Patient ID in WhatsApp notifications.

## 2. Create Report Upload WhatsApp Templates
Build two WATI templates: `scan_report_uploaded` (scan + report) and `report_ready` (report only) for complete notification coverage.

## 3. Add Window/Level Controls to MPR Viewer
Implement adjustable brightness/contrast presets (bone, soft tissue, lung) for better diagnostic viewing in the DICOM viewer.

## 4. Implement User Activity Logging
Track all user actions (uploads, views, downloads) in Firebase for audit trails and compliance requirements.

## 5. Add Measurement Tools to Viewer
Enable distance, angle, and area measurements directly in the MPR viewer for radiologist annotations and analysis.

## 6. Create Patient Portal Access
Build a separate patient-facing interface where patients can view their own scans and reports using secure access codes.

## 7. Implement Report Generation System
Add structured report templates with auto-fill from DICOM metadata and AI findings for faster radiologist workflow.

## 8. Add Multi-Language Support
Implement i18n for Tamil, Hindi, and English to support diverse patient and doctor populations across branches.

## 9. Create Mobile-Optimized Viewer
Build responsive touch-friendly MPR controls and gestures for tablet/mobile viewing by doctors on-the-go.

## 10. Implement Automated Backup System
Set up daily automated backups of Firebase database and GCS bucket to separate storage for disaster recovery.

---

**Priority Order:** 1 → 2 → 3 → 6 → 7 → 4 → 5 → 8 → 9 → 10

**Estimated Timeline:** 3-6 months for all tasks
