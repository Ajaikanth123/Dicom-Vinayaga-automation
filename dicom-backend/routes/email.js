import express from 'express';
import admin from 'firebase-admin';
import { testEmailConfig } from '../services/emailService.js';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Google Cloud Storage
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;

// Get email settings from Firebase
router.get('/settings', async (req, res) => {
  try {
    const db = admin.database();
    const settingsRef = db.ref('emailSettings');
    const snapshot = await settingsRef.once('value');
    
    let settings = snapshot.val() || {
      smtp: {
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: ''
        }
      },
      organization: {
        name: '3D Anbu Dental Diagnostics LLP',
        email: '',
        phone: '',
        address: '',
        supportEmail: '',
        supportPhone: '',
        logoUrl: ''
      }
    };

    // Mask password for security
    if (settings.smtp && settings.smtp.auth && settings.smtp.auth.pass) {
      settings.smtp.auth.pass = '***';
    }

    res.json(settings);
  } catch (error) {
    console.error('[Email Settings] Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
});

// Update email settings in Firebase
router.post('/settings', async (req, res) => {
  try {
    const db = admin.database();
    const settingsRef = db.ref('emailSettings');
    
    // Get current settings
    const snapshot = await settingsRef.once('value');
    const currentSettings = snapshot.val() || {};
    
    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...req.body
    };

    // If password is masked, keep the existing password
    if (req.body.smtp && req.body.smtp.auth && req.body.smtp.auth.pass === '***') {
      if (currentSettings.smtp && currentSettings.smtp.auth && currentSettings.smtp.auth.pass) {
        updatedSettings.smtp.auth.pass = currentSettings.smtp.auth.pass;
      }
    }

    // Save to Firebase
    await settingsRef.set(updatedSettings);

    // Update environment variables for immediate use
    if (req.body.smtp) {
      if (req.body.smtp.host) process.env.EMAIL_HOST = req.body.smtp.host;
      if (req.body.smtp.port) process.env.EMAIL_PORT = req.body.smtp.port.toString();
      if (req.body.smtp.auth && req.body.smtp.auth.user) process.env.EMAIL_USER = req.body.smtp.auth.user;
      if (req.body.smtp.auth && req.body.smtp.auth.pass && req.body.smtp.auth.pass !== '***') {
        process.env.EMAIL_PASS = req.body.smtp.auth.pass;
      }
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('[Email Settings] Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Test the email configuration
    const result = await testEmailConfig(email);
    
    res.json(result);
  } catch (error) {
    console.error('[Email Test] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send test email' 
    });
  }
});

// Get email templates from Firebase
router.get('/templates', async (req, res) => {
  try {
    const db = admin.database();
    const templatesRef = db.ref('emailTemplates');
    const snapshot = await templatesRef.once('value');
    
    let templates = snapshot.val() || {
      DOCTOR_DICOM_READY: {
        subject: 'Patient Scan Ready for Review - {{patientName}}',
        text: `Dear Dr. {{doctorName}},

The DICOM scan for your patient {{patientName}} (ID: {{patientId}}) is now ready for review.

Scan Date: {{scanDate}}

You can view the scan images using the link below:
{{viewerLink}}

If you have any questions, please contact us.

Best regards,
{{organizationName}}`,
        html: ''
      },
      PATIENT_SCAN_COMPLETE: {
        subject: 'Your Scan is Complete - {{patientName}}',
        text: `Dear {{patientName}},

Your scan at {{organizationName}} has been completed successfully.

Patient ID: {{patientId}}
Scan Date: {{scanDate}}

Your referring doctor will review the results and contact you with the findings.

If you have any questions, please contact us.

Best regards,
{{organizationName}}`,
        html: ''
      }
    };

    res.json(templates);
  } catch (error) {
    console.error('[Email Templates] Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch email templates' });
  }
});

// Get a specific email template
router.get('/templates/:templateType', async (req, res) => {
  try {
    const { templateType } = req.params;
    const db = admin.database();
    const templateRef = db.ref(`emailTemplates/${templateType}`);
    const snapshot = await templateRef.once('value');
    
    const template = snapshot.val();
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('[Email Template] Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch email template' });
  }
});

// Update email template in Firebase
router.put('/templates/:templateType', async (req, res) => {
  try {
    const { templateType } = req.params;
    const templateData = req.body;
    
    const db = admin.database();
    const templateRef = db.ref(`emailTemplates/${templateType}`);
    
    await templateRef.set(templateData);

    res.json({ success: true, message: 'Template updated successfully' });
  } catch (error) {
    console.error('[Email Template] Error updating template:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

// Upload organization logo
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const timestamp = Date.now();
    const fileName = `logos/organization-logo-${timestamp}.${file.originalname.split('.').pop()}`;
    
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(fileName);
    
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          uploadedAt: new Date().toISOString()
        }
      }
    });

    blobStream.on('error', (error) => {
      console.error('[Logo Upload] Error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
    });

    blobStream.on('finish', async () => {
      // Make the file publicly accessible
      await blob.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      
      res.json({
        success: true,
        logoUrl: publicUrl,
        message: 'Logo uploaded successfully'
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error('[Logo Upload] Error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Send DICOM notification email (with branch-specific support)
router.post('/send-dicom-notification', async (req, res) => {
  try {
    const { doctorData, patientData, caseData, branchId, senderInfo } = req.body;
    
    console.log('[Email Notification] Sending with branchId:', branchId);
    console.log('[Email Notification] Sender info:', senderInfo);
    
    // Import email service functions
    const { sendNotifications } = await import('../services/emailService.js');
    
    // Send notifications with branch-specific settings and sender info
    const result = await sendNotifications(doctorData, patientData, caseData, branchId, senderInfo);
    
    res.json({
      success: result.success,
      allSuccess: result.allSuccess,
      sentAt: new Date().toISOString(),
      channelStatus: {
        email: result.success ? 'SENT' : 'FAILED',
        emailError: result.success ? null : 'Email send failed'
      },
      details: result
    });
  } catch (error) {
    console.error('[Email Notification] Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      channelStatus: {
        email: 'FAILED',
        emailError: error.message
      }
    });
  }
});

export default router;
