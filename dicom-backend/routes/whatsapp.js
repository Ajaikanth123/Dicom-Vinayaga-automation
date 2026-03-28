import express from 'express';
import * as whatsappService from '../services/whatsappService.js';

const router = express.Router();

/**
 * GET /whatsapp/status
 * Check WhatsApp configuration status
 */
router.get('/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('[WhatsApp Route] Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /whatsapp/test
 * Test WhatsApp connection by sending a test message
 * Body: { phoneNumber: string }
 */
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    console.log(`[WhatsApp Route] Testing with phone: ${phoneNumber}`);

    // Send test message using DICOM template
    const result = await whatsappService.sendTemplateMessage(
      phoneNumber,
      'dicom_scan_notification',
      ['Test Doctor', 'Test Patient', 'https://cscanskovai-44ebc.web.app/viewer/test', 'Test Service']
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Test message sent successfully',
        messageId: result.messageId,
        phone: result.phone
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('[WhatsApp Route] Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /whatsapp/send-dicom-notification
 * Send DICOM notification to doctor
 * Body: { doctorData, patientData, caseData }
 */
router.post('/send-dicom-notification', async (req, res) => {
  try {
    const { doctorData, patientData, caseData } = req.body;
    
    // Validate required fields
    if (!doctorData || !doctorData.phone) {
      return res.status(400).json({ error: 'Doctor phone number is required' });
    }
    if (!patientData || !patientData.name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }
    if (!caseData || !caseData.dicomUrl) {
      return res.status(400).json({ error: 'DICOM URL is required' });
    }

    console.log('[WhatsApp Route] Sending DICOM notification');

    const result = await whatsappService.sendDicomNotification(
      doctorData.phone,
      doctorData.name || 'Doctor',
      patientData.name,
      caseData.dicomUrl,
      caseData.reportUrl || null,
      caseData.service || 'DICOM Scan'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'DICOM notification sent successfully',
        messageId: result.messageId,
        phone: result.phone
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('[WhatsApp Route] DICOM notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /whatsapp/send-report-notification
 * Send report notification to doctor
 * Body: { doctorData, patientData, caseData }
 */
router.post('/send-report-notification', async (req, res) => {
  try {
    const { doctorData, patientData, caseData } = req.body;
    
    // Validate required fields
    if (!doctorData || !doctorData.phone) {
      return res.status(400).json({ error: 'Doctor phone number is required' });
    }
    if (!patientData || !patientData.name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }
    if (!caseData || !caseData.reportUrl) {
      return res.status(400).json({ error: 'Report URL is required' });
    }

    console.log('[WhatsApp Route] Sending report notification');

    const result = await whatsappService.sendReportNotification(
      doctorData.phone,
      doctorData.name || 'Doctor',
      patientData.name,
      caseData.reportUrl
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Report notification sent successfully',
        messageId: result.messageId,
        phone: result.phone
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('[WhatsApp Route] Report notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
