import express from 'express';
import multer from 'multer';
import {
  extractDicomFromZip,
  parseDicomMetadata,
  generateThumbnail,
  generatePreview,
  dicomToJpeg
} from '../services/dicomProcessor.js';
import {
  uploadDicomZip,
  uploadReport,
  uploadProcessedImage,
  uploadMetadata,
  uploadToStorage
} from '../services/storageService.js';
import { sendNotifications } from '../services/emailService.js';
import { sendReportCompletionEmail } from '../services/reportEmailService.js';
import { sendDicomNotification } from '../services/watiService.js';
import { sendReportNotification } from '../services/whatsappService.js';
import { generateMPR } from '../services/mprService.js';
import admin from 'firebase-admin';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 * 1024 // 5GB default
  }
});

/**
 * POST /upload
 * Upload DICOM ZIP file and optional PDF report
 * Processes files and sends notifications
 */
router.post('/', upload.fields([
  { name: 'files', maxCount: 1 },  // Accept 'files' field name from frontend
  { name: 'dicomZip', maxCount: 1 },
  { name: 'pdfReport', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📤 Upload request received');

    const { branchId, caseId, patientName, patientId, patientEmail, doctorName, doctorEmail, hospital } = req.body;

    if (!branchId || !caseId) {
      return res.status(400).json({ error: 'branchId and caseId are required' });
    }

    const dicomFile = req.files?.dicomZip?.[0] || req.files?.files?.[0];  // Accept both field names
    const pdfFile = req.files?.pdfReport?.[0];

    if (!dicomFile && !pdfFile) {
      return res.status(400).json({ error: 'At least one file (DICOM ZIP or PDF) is required' });
    }

    const result = {
      caseId,
      branchId,
      uploadedAt: new Date().toISOString(),
      dicom: null,
      report: null,
      notifications: null
    };

    // Process DICOM ZIP if provided
    if (dicomFile) {
      console.log(`📦 Processing DICOM ZIP: ${dicomFile.originalname} (${(dicomFile.size / 1024 / 1024).toFixed(2)} MB)`);

      // Upload original ZIP to Firebase Storage
      const zipPath = await uploadDicomZip(dicomFile.buffer, branchId, caseId, {
        originalName: dicomFile.originalname,
        patientName,
        patientId
      });

      // Extract DICOM files from ZIP
      const dicomFiles = await extractDicomFromZip(dicomFile.buffer);

      if (dicomFiles.length === 0) {
        return res.status(400).json({ error: 'No DICOM files found in ZIP' });
      }

      console.log(`📤 Uploading ${dicomFiles.length} DICOM files to storage...`);

      // Upload all DICOM files to storage for browser access
      const dicomUrls = [];
      const panoramicUrls = [];
      const valid3DSlices = [];

      for (let i = 0; i < dicomFiles.length; i++) {
        const dicom = dicomFiles[i];
        
        // Parse metadata early to check for Modality
        const sliceMetadata = parseDicomMetadata(dicom.buffer);
        const modality = sliceMetadata?.modality || '';
        
        // If it's a pre-computed 2D image (Panoramic, Ceph, Scout)
        // Check using includes() on the string to avoid DICOM padding matches (e.g. "DX ")
        if (modality && (modality.includes('DX') || modality.includes('CR') || modality.includes('SC') || modality.includes('PX'))) {
           console.log(`🖼️  Extracted 2D ${modality.trim()} Image: ${dicom.filename}`);
           try {
             const jpegBuffer = await dicomToJpeg(dicom.buffer);
             const filename = `pano_${panoramicUrls.length + 1}.jpg`;
             const destination = `dicom/${branchId}/${caseId}/pano/${filename}`;
             
             const url = await uploadToStorage(jpegBuffer, destination, {
               contentType: 'image/jpeg',
               originalName: dicom.filename
             });
             
             panoramicUrls.push({ url, filename: dicom.filename, modality });
           } catch (err) {
             console.error(`❌ Failed to convert 2D image ${dicom.filename}:`, err);
           }
           // Do NOT add to valid3DSlices so it doesn't break the 3D volume
        } else {
           // It's a standard 3D Axis slice (usually CT)
           valid3DSlices.push({ dicom, sliceMetadata });
        }
      }

      console.log(`✅ Extracted ${panoramicUrls.length} Panoramic/2D images.`);
      console.log(`📤 Uploading ${valid3DSlices.length} 3D Volume Slices...`);

      const BATCH_SIZE = 50;
      for (let batchStart = 0; batchStart < valid3DSlices.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, valid3DSlices.length);
        const batchPromises = [];

        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push((async () => {
            const { dicom, sliceMetadata } = valid3DSlices[i];
            const filename = `slice_${String(i + 1).padStart(4, '0')}.dcm`;
            const destination = `dicom/${branchId}/${caseId}/files/${filename}`;

            const url = await uploadToStorage(dicom.buffer, destination, {
              contentType: 'application/dicom',
              originalName: dicom.filename
            });

            dicomUrls.push({
              slice: i + 1,
              url,
              filename: dicom.filename
            });
          })());
        }

        await Promise.all(batchPromises);
        console.log(`   Uploaded ${batchEnd}/${valid3DSlices.length} 3D slices...`);
      }

      console.log(`✅ All DICOM files uploaded to storage`);

      // Parse metadata from all DICOM files and sort by instance number
      console.log(`📊 Parsing DICOM metadata for proper ordering...`);
      const slicesMetadata = [];

      for (let i = 0; i < valid3DSlices.length; i++) {
        const { sliceMetadata } = valid3DSlices[i];

        slicesMetadata.push({
          index: i + 1,
          filename: `slice_${String(i + 1).padStart(4, '0')}.dcm`,
          instanceNumber: sliceMetadata?.instanceNumber || i + 1,
          sliceLocation: sliceMetadata?.sliceLocation,
          imagePosition: sliceMetadata?.imagePosition
        });
      }

      // Sort by instance number
      slicesMetadata.sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));

      console.log(`✅ Sorted ${slicesMetadata.length} slices by instance number`);

      // Parse metadata from first DICOM file for study info
      // Fallback to the first file in the ZIP if no valid 3D slices are found for some reason
      const firstValidSlice = valid3DSlices[0]?.sliceMetadata || parseDicomMetadata(dicomFiles[0].buffer);

      // Save metadata to Google Cloud Storage
      const metadataObj = {
        caseId,
        branchId,
        patientName,
        patientId,
        totalSlices: valid3DSlices.length,
        panoramicUrls: panoramicUrls,
        dicomBasePath: `dicom/${branchId}/${caseId}/files`,
        bucketName: process.env.GCS_BUCKET_NAME,
        studyMetadata: firstValidSlice,
        slicesMetadata: slicesMetadata,
        uploadedAt: new Date().toISOString()
      };

      const metadataJson = JSON.stringify(metadataObj, null, 2);
      const metadataBuffer = Buffer.from(metadataJson);
      await uploadToStorage(metadataBuffer, `dicom/${branchId}/${caseId}/metadata.json`, {
        contentType: 'application/json'
      });

      console.log(`✅ Metadata saved to storage`);

      // Generate viewer URL
      const viewerUrl = `${process.env.VIEWER_URL || 'http://localhost:5173/viewer'}/${caseId}`;

      result.dicom = {
        originalZipPath: zipPath,
        totalSlices: dicomFiles.length,
        viewerUrl,
        studyMetadata: metadata
      };

      console.log(`✅ DICOM processing complete: ${dicomFiles.length} slices`);
    }

    // Process PDF report if provided
    if (pdfFile) {
      console.log(`📄 Uploading PDF report: ${pdfFile.originalname}`);

      const reportUrl = await uploadReport(pdfFile.buffer, branchId, caseId, {
        originalName: pdfFile.originalname
      });

      result.report = {
        url: reportUrl,
        filename: pdfFile.originalname,
        size: pdfFile.size
      };

      console.log(`✅ PDF report uploaded`);
    }

    // Email notifications have been moved to mprService.js (they will fire after 3D volume is generated)

    // Update Firebase Realtime Database
    const db = admin.database();

    // Remove null/undefined/NaN values from metadata to avoid Firebase errors
    const cleanMetadata = (obj) => {
      if (!obj) return null;
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip null, undefined, and NaN values
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
          continue;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedNested = cleanMetadata(value);
          if (cleanedNested && Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
          }
        } else if (Array.isArray(value)) {
          // Clean arrays too
          const cleanedArray = value.map(item =>
            typeof item === 'object' ? cleanMetadata(item) : item
          ).filter(item => item !== null && item !== undefined && !(typeof item === 'number' && isNaN(item)));
          if (cleanedArray.length > 0) {
            cleaned[key] = cleanedArray;
          }
        } else {
          cleaned[key] = value;
        }
      }
      return Object.keys(cleaned).length > 0 ? cleaned : null;
    };

    const updateData = {
      processedAt: result.uploadedAt,
      caseTracking: {
        caseState: result.dicom ? 'DICOM_UPLOADED' : 'CREATED'
      }
    };

    if (result.dicom) {
      const cleanedDicomData = {
        originalZipPath: result.dicom.originalZipPath,
        totalSlices: result.dicom.totalSlices,
        viewerUrl: result.dicom.viewerUrl,
        // Store base path instead of all URLs to avoid Firebase size limits
        dicomBasePath: `dicom/${branchId}/${caseId}/files`,
        bucketName: process.env.GCS_BUCKET_NAME
      };

      console.log(`📊 DICOM result before saving:`, {
        totalSlices: result.dicom.totalSlices,
        basePath: cleanedDicomData.dicomBasePath
      });

      // Clean study metadata
      const cleanedStudyMetadata = cleanMetadata(result.dicom.studyMetadata);
      if (cleanedStudyMetadata) {
        cleanedDicomData.studyMetadata = cleanedStudyMetadata;
      }

      updateData.dicomData = cleanedDicomData;
    }

    if (result.report) {
      updateData.reportData = result.report;
    }

    if (result.notifications) {
      updateData.notificationsSent = result.notifications;
    }

    await db.ref(`forms/${branchId}/${caseId}`).update(updateData);

    // Verify the data was saved
    const verifySnapshot = await db.ref(`forms/${branchId}/${caseId}`).once('value');
    const savedData = verifySnapshot.val();
    console.log('✅ Verification - dicomData exists:', !!savedData.dicomData);
    console.log('✅ Verification - totalSlices:', savedData.dicomData?.totalSlices);

    console.log('✅ Upload and processing complete');
    console.log('📊 Saved data structure:', JSON.stringify(updateData, null, 2).substring(0, 500));

    res.json({
      success: true,
      ...result
    });

    // Fire-and-forget: Generate pre-rendered MPR views in background
    if (result.dicom) {
      setTimeout(() => {
        console.log('🧠 [MPR] Starting background MPR generation...');
        const notificationData = {
          doctor: { doctorName, doctorEmail, doctorPhone, hospital },
          patient: { patientName, patientId, patientEmail, patientPhone },
          viewerLink: result.dicom.viewerUrl,
          studyDate: result.dicom.studyMetadata?.studyDate,
          diagnosticServices: typeof diagnosticServices === 'string' ? JSON.parse(diagnosticServices) : diagnosticServices
        };
        generateMPR(branchId, caseId, notificationData).catch(err => {
          console.error('🧠 [MPR] Background MPR generation failed:', err.message);
        });
      }, 5000); // 5s delay allows Node.js to garbage collect the 800MB ZIP buffers first
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /upload/status/:caseId
 * Check processing status of a case
 */
router.get('/status/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required' });
    }

    const db = admin.database();
    const snapshot = await db.ref(`forms/${branchId}/${caseId}`).once('value');
    const caseData = snapshot.val();

    if (!caseData) {
      // If the frontend polls before the backend has a chance to initialize the record, return a default processing state
      return res.json({
        caseId,
        status: 'INITIALIZING',
        mprStatus: 'processing',
        mprProgress: { phase: 'Waking up Cloud Engine', current: 0, total: 100 },
        dicomData: null,
        reportData: null,
        processedAt: null
      });
    }

    res.json({
      caseId,
      status: caseData.caseTracking?.caseState || 'UNKNOWN',
      mprStatus: caseData.mprStatus || 'not_started',
      mprProgress: caseData.mprProgress || null,
      dicomData: caseData.dicomData,
      reportData: caseData.reportData,
      processedAt: caseData.processedAt
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


/**
 * POST /upload/process
 * Process a file that was uploaded directly to GCS via signed URL
 */
router.post('/process', async (req, res) => {
  try {
    console.log('📤 Process request received for GCS file');

    const { branchId, caseId, destination, patientName, patientId, patientEmail, doctorName, doctorEmail, doctorPhone, hospital, diagnosticServices, reasonForReferral, clinicalNotes } = req.body;

    if (!branchId || !caseId || !destination) {
      return res.status(400).json({ error: 'branchId, caseId, and destination are required' });
    }

    const { Storage } = await import('@google-cloud/storage');
    const storage = new Storage();
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    const file = bucket.file(destination);

    // Provide early initialization in Firebase to prevent frontend 404 polling errors
    const db = admin.database();
    await db.ref(`forms/${branchId}/${caseId}`).update({
      caseTracking: { caseState: 'DICOM_UPLOADED' },
      mprStatus: 'processing',
      mprProgress: { phase: 'Initializing Cloud Sync', current: 0, total: 100 }
    }).catch(err => console.warn('Early init fallback:', err));

    // Download file from GCS
    console.log(`📥 Downloading ${destination}`);
    const [fileBuffer] = await file.download();
    console.log(`✅ Downloaded ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Upload to permanent location
    const zipPath = await uploadDicomZip(fileBuffer, branchId, caseId, {
      originalName: destination.split('/').pop(),
      patientName,
      patientId
    });

    // Extract and process DICOM files
    const dicomFiles = await extractDicomFromZip(fileBuffer);
    if (dicomFiles.length === 0) {
      return res.status(400).json({ error: 'No DICOM files found' });
    }

    console.log(`📤 Processing ${dicomFiles.length} extracted DICOM files...`);

    const slicesMetadata = [];
    const panoramicUrls = [];
    let sliceIndex = 0;
    let firstValidSliceMetadata = null;
    const UPLOAD_BATCH = 10; // Upload 10 slices in parallel at a time

    // First pass: separate 2D panoramic from 3D slices
    const valid3D = [];
    for (let i = 0; i < dicomFiles.length; i++) {
      const dicom = dicomFiles[i];
      const sliceMetadata = parseDicomMetadata(dicom.buffer);
      const modality = sliceMetadata?.modality || '';
      if (modality && (modality.includes('DX') || modality.includes('CR') || modality.includes('SC') || modality.includes('PX'))) {
        try {
          const jpegBuffer = await dicomToJpeg(dicom.buffer);
          const filename = `pano_${panoramicUrls.length + 1}.jpg`;
          await uploadToStorage(jpegBuffer, `dicom/${branchId}/${caseId}/pano/${filename}`, { contentType: 'image/jpeg' });
          panoramicUrls.push({ url: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/dicom/${branchId}/${caseId}/pano/${filename}`, filename: dicom.filename, modality });
        } catch (err) { console.error(`❌ Pano convert failed:`, err); }
        dicom.buffer = null;
      } else {
        if (!firstValidSliceMetadata) firstValidSliceMetadata = sliceMetadata;
        valid3D.push({ buffer: dicom.buffer, sliceMetadata, filename: dicom.filename });
        dicom.buffer = null; // free original ref
      }
    }

    console.log(`📤 Uploading ${valid3D.length} 3D slices in parallel batches of ${UPLOAD_BATCH}...`);

    // Second pass: upload 3D slices in parallel batches
    for (let batchStart = 0; batchStart < valid3D.length; batchStart += UPLOAD_BATCH) {
      const batchEnd = Math.min(batchStart + UPLOAD_BATCH, valid3D.length);
      const batch = valid3D.slice(batchStart, batchEnd);

      await Promise.all(batch.map(async (item, idx) => {
        const i = batchStart + idx;
        const filename = `slice_${String(i + 1).padStart(4, '0')}.dcm`;
        await uploadToStorage(item.buffer, `dicom/${branchId}/${caseId}/files/${filename}`, { contentType: 'application/dicom' });
        slicesMetadata.push({
          index: i + 1, filename,
          instanceNumber: item.sliceMetadata?.instanceNumber || i + 1,
          sliceLocation: item.sliceMetadata?.sliceLocation,
          imagePosition: item.sliceMetadata?.imagePosition
        });
        item.buffer = null; // free after upload
      }));

      if (batchEnd % 100 === 0 || batchEnd === valid3D.length) {
        console.log(`   ${batchEnd}/${valid3D.length} slices uploaded`);
        await db.ref(`forms/${branchId}/${caseId}`).update({
          mprStatus: 'processing',
          mprProgress: { phase: 'Uploading DICOM Slices', current: batchEnd, total: valid3D.length }
        }).catch(() => {});
      }
    }

    slicesMetadata.sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));
    console.log(`✅ Processed ${slicesMetadata.length} slices, ${panoramicUrls.length} panoramic images`);

    const firstValidSlice = firstValidSliceMetadata;

    await uploadToStorage(Buffer.from(JSON.stringify({
      caseId, branchId,
      totalSlices: slicesMetadata.length,
      panoramicUrls,
      dicomBasePath: `dicom/${branchId}/${caseId}/files`,
      bucketName: process.env.GCS_BUCKET_NAME,
      studyMetadata: firstValidSlice,
      slicesMetadata,
      uploadedAt: new Date().toISOString()
    }, null, 2)), `dicom/${branchId}/${caseId}/metadata.json`, { contentType: 'application/json' });

    const viewerUrl = `${process.env.VIEWER_URL || 'https://cscanskovai-44ebc.web.app/viewer'}/${caseId}`;

    // Fetch patient image URL from Firebase (uploaded in Stage 1)
    let patientImageUrl = null;
    try {
      const db = admin.database();
      const imgSnap = await db.ref(`forms/${branchId}/${caseId}/patient/patientImage/imageUrl`).once('value');
      patientImageUrl = imgSnap.val();
    } catch (e) { /* ignore */ }

    // Send notifications
    let notifications = null;
    if (doctorEmail || patientEmail) {
      notifications = await sendNotifications(
        { doctorName, doctorEmail, hospital },
        { patientName, patientId, patientEmail },
        {
          viewerLink: viewerUrl,
          caseId,
          diagnosticServices: diagnosticServices || {},
          reasonForReferral: reasonForReferral || {},
          clinicalNotes: clinicalNotes || '',
          patientImageUrl  // Stage 2: include patient image
        },
        branchId
      );
    }

    // Send WhatsApp notification if doctor phone is provided
    let whatsappResult = null;
    if (doctorPhone) {
      console.log(`📱 Sending WhatsApp notification to ${doctorPhone}`);

      const studyType = diagnosticServices?.service || 'DICOM Scan';
      const uploadDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      whatsappResult = await sendDicomNotification(
        doctorPhone,
        doctorName || 'Doctor',
        patientName || 'Patient',
        studyType,
        uploadDate,
        caseId  // This will be used in the viewer URL
      );

      if (whatsappResult.success) {
        console.log(`✅ WhatsApp notification sent successfully`);
        console.log(`📱 Viewer link: ${whatsappResult.viewerUrl}`);
      } else {
        console.error(`❌ WhatsApp notification failed:`, whatsappResult.error);
      }
    }

    // Update Firebase
    await db.ref(`forms/${branchId}/${caseId}`).update({
      processedAt: new Date().toISOString(),
      caseTracking: { caseState: 'DICOM_UPLOADED' },
      dicomData: {
        originalZipPath: zipPath,
        totalSlices: slicesMetadata.length,
        viewerUrl,
        dicomBasePath: `dicom/${branchId}/${caseId}/files`,
        bucketName: process.env.GCS_BUCKET_NAME
      }
    });

    // Delete temp file
    await file.delete().catch(() => { });

    console.log('✅ Complete');
    res.json({ success: true, dicom: { totalSlices: slicesMetadata.length, viewerUrl }, notifications });

    // Fire-and-forget: Generate pre-rendered MPR views in background
    setTimeout(() => {
      console.log('🧠 [MPR] Starting background MPR generation...');
      generateMPR(branchId, caseId).catch(err => {
        console.error('🧠 [MPR] Background MPR generation failed:', err.message);
      });
    }, 5000); // 5s delay allows Node.js to garbage collect the 800MB ZIP buffers first

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /patient-image
 * Upload patient image (Stage 1) and send email to doctor with image attached
 */
router.post('/patient-image', upload.single('patientImage'), async (req, res) => {
  try {
    const { formId, branchId, patientName, patientId, doctorEmail, doctorName, hospital, clinicalNotes } = req.body;
    const imageFile = req.file;

    if (!imageFile) return res.status(400).json({ error: 'No image file provided' });
    if (!formId || !branchId) return res.status(400).json({ error: 'formId and branchId are required' });

    // Upload image to GCS
    const ext = imageFile.originalname.split('.').pop();
    const imagePath = `patients/${branchId}/${formId}/patient_image.${ext}`;
    const imageUrl = await uploadToStorage(imageFile.buffer, imagePath, { contentType: imageFile.mimetype });

    // Save imageUrl to Firebase
    const db = admin.database();
    await db.ref(`forms/${branchId}/${formId}/patient/patientImage`).set({
      imageUrl,
      uploadedAt: new Date().toISOString()
    });

    // Send Stage 1 email to doctor with image attached
    if (doctorEmail) {
      const { sendDoctorNotification } = await import('../services/emailService.js');
      await sendDoctorNotification(
        { doctorName, doctorEmail, hospital },
        { patientName, patientId },
        {
          viewerLink: null,
          caseId: formId,
          clinicalNotes: clinicalNotes || '',
          patientImageUrl: imageUrl,
          isStage1: true
        },
        branchId
      );
      console.log(`✅ Stage 1 email sent to doctor: ${doctorEmail}`);
    }

    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error('❌ Patient image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /upload-report
 * Upload PDF report and send notification email
 */
router.post('/upload-report', upload.single('reportFile'), async (req, res) => {
  try {
    console.log('📄 Report upload request received');

    const { branchId, formId, patientName, patientId, doctorEmail, doctorName, doctorPhone, isReplacement } = req.body;
    const reportFile = req.file;
    const isReplacementBool = isReplacement === 'true';

    if (!branchId || !formId) {
      return res.status(400).json({ error: 'branchId and formId are required' });
    }

    if (!reportFile) {
      return res.status(400).json({ error: 'Report file is required' });
    }

    // Validate PDF file
    if (reportFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    console.log(`📄 Uploading report for form: ${formId} (replacement: ${isReplacementBool})`);

    // Upload PDF to Google Cloud Storage
    const reportUrl = await uploadReport(
      reportFile.buffer,
      branchId,
      formId,
      reportFile.originalname
    );

    console.log(`✅ Report uploaded: ${reportUrl}`);

    // Update form in Firebase with report URL and status
    const db = admin.database();
    const formRef = db.ref(`forms/${branchId}/${formId}`);
    await formRef.update({
      reportUrl: reportUrl,
      reportUploadedAt: new Date().toISOString(),
      reportStatus: 'sent'
    });

    // Send report notification email using the new fantastic template with PDF attachment
    if (doctorEmail) {
      // Fetch patient image and viewer link from Firebase for Stage 3 email
      let patientImageUrl = null;
      let viewerLink = null;
      try {
        const snap = await db.ref(`forms/${branchId}/${formId}`).once('value');
        const formData = snap.val();
        patientImageUrl = formData?.patient?.patientImage?.imageUrl || null;
        viewerLink = formData?.dicomData?.viewerUrl || `${process.env.VIEWER_URL || 'https://cscanskovai-44ebc.web.app/viewer'}/${formId}`;
      } catch (e) { /* ignore */ }

      await sendReportCompletionEmail({
        doctorEmail,
        doctorName,
        patientName,
        patientId,
        reportUrl,
        branchId,
        isReplacement: isReplacementBool,
        patientImageUrl,
        viewerLink
      });
      console.log(`📧 Report ${isReplacementBool ? 'replacement' : 'completion'} email with PDF attachment sent to: ${doctorEmail}`);
    }

    // Send WhatsApp notification if doctor phone is provided
    if (doctorPhone) {
      console.log(`📱 Sending WhatsApp report notification to ${doctorPhone}`);
      const whatsappResult = await sendReportNotification(
        doctorPhone,
        doctorName || 'Doctor',
        patientName || 'Patient',
        reportUrl
      );

      if (whatsappResult.success) {
        console.log(`✅ WhatsApp report notification sent successfully`);
      } else {
        console.error(`❌ WhatsApp report notification failed:`, whatsappResult.error);
      }
    }

    res.json({
      success: true,
      reportUrl,
      message: `Report ${isReplacementBool ? 'replaced' : 'uploaded'} and notification sent successfully`
    });

  } catch (error) {
    console.error('❌ Report upload error:', error);
    res.status(500).json({
      error: 'Failed to upload report',
      details: error.message
    });
  }
});
