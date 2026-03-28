# Redeployment Complete - February 26, 2026

## Deployment Summary

Both backend and frontend have been successfully redeployed to Google Cloud Platform.

---

## Backend Deployment

**Service**: dicom-backend  
**Revision**: dicom-backend-00041-nwr  
**Region**: asia-south1 (Mumbai)  
**URL**: https://dicom-backend-59642964164.asia-south1.run.app  
**Status**: ✅ Deployed and serving 100% traffic

**Configuration**:
- Memory: 2Gi
- CPU: 2 cores
- Timeout: 3600 seconds
- Concurrency: 80 requests per instance
- Authentication: Unauthenticated (public API)

**Features Active**:
- DICOM file upload and processing
- Signed URL generation for large files
- WhatsApp notifications (doctor_scan_notification, report_ready)
- Email notifications with branch-specific SMTP
- Report upload and sharing
- DICOM viewer metadata API

---

## Frontend Deployment

**Service**: Firebase Hosting  
**Project**: nice4-d7886  
**URL**: https://nice4-d7886.web.app  
**Status**: ✅ Deployed successfully

**Build Stats**:
- Build time: 22.34 seconds
- Files deployed: 4 files
- Bundle size: 2.33 MB (732 KB gzipped)
- CSS size: 112 KB (19 KB gzipped)

**Features Active**:
- Patient referral forms
- DICOM file upload with progress tracking
- Multi-Planar Reconstruction (MPR) viewer
- Doctor management
- B