import axios from 'axios';

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN;

/**
 * Format phone number for WATI (no + prefix, just digits with country code)
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  let formatted = phone.replace(/\D/g, '');
  
  // Ensure it starts with country code (91 for India)
  if (!formatted.startsWith('91') && formatted.length === 10) {
    formatted = '91' + formatted;
  }
  
  return formatted;
}

/**
 * Send template message via WATI
 * Phone number goes in URL query parameter, not in body
 */
async function sendTemplateMessage(to, templateName, parameters) {
  try {
    if (!WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) {
      throw new Error('WATI credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    console.log(`[WATI] Sending template "${templateName}" to ${formattedPhone}`);

    // WATI API: Phone number goes in URL query parameter
    const url = `${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage?whatsappNumber=${formattedPhone}`;

    const response = await axios.post(
      url,
      {
        template_name: templateName,
        broadcast_name: 'DICOM Upload Notification',
        parameters: parameters  // Direct array, no receivers wrapper
      },
      {
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WATI] Message sent successfully`);
    console.log(`[WATI] Response:`, response.data);
    
    return { 
      success: true, 
      data: response.data,
      phone: formattedPhone
    };
  } catch (error) {
    console.error('[WATI] Send error:', error.response?.data || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    };
  }
}

/**
 * Send DICOM notification to doctor with viewer link
 */
async function sendDicomNotification(doctorPhone, doctorName, patientName, studyType, uploadDate, caseId) {
  try {
    console.log('[WATI] Preparing DICOM notification');
    console.log(`  Doctor: ${doctorName} (${doctorPhone})`);
    console.log(`  Patient: ${patientName}`);
    console.log(`  Study Type: ${studyType}`);
    console.log(`  Upload Date: ${uploadDate}`);
    console.log(`  Case ID: ${caseId}`);

    // WATI template parameters - numbered {{1}}, {{2}}, etc.
    // Include header if template has one
    const parameters = [
      { name: 'header', value: '3D Anbu Scans' },  // Header text
      { name: '1', value: String(doctorName) },
      { name: '2', value: String(patientName) },
      { name: '3', value: String(studyType) },
      { name: '4', value: String(uploadDate) },
      { name: '5', value: `https://cscanskovai-44ebc.web.app/viewer/${caseId}` }
    ];

    const result = await sendTemplateMessage(
      doctorPhone,
      'doctor_notify',
      parameters
    );

    if (result.success) {
      result.viewerUrl = `https://cscanskovai-44ebc.web.app/viewer/${caseId}`;
      console.log(`[WATI] Viewer link: ${result.viewerUrl}`);
    }

    return result;
  } catch (error) {
    console.error('[WATI] DICOM notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send simple text message (for active conversations within 24-hour window)
 */
async function sendTextMessage(to, message) {
  try {
    if (!WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) {
      throw new Error('WATI credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    console.log(`[WATI] Sending text message to ${formattedPhone}`);
    
    const response = await axios.post(
      `${WATI_API_ENDPOINT}/api/v1/sendSessionMessage/${formattedPhone}`,
      {
        messageText: message
      },
      {
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WATI] Text message sent successfully`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[WATI] Text message error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    };
  }
}

/**
 * Send scan uploaded notification (using scan_uploaded_d template)
 * This is the new template with detailed patient information
 */
async function sendScanUploadedNotification(doctorPhone, doctorName, patientName, patientId, studyType, uploadDate, caseId) {
  try {
    console.log('[WATI] Sending scan uploaded notification (scan_uploaded_d)');
    console.log(`  Doctor: ${doctorName} (${doctorPhone})`);
    console.log(`  Patient: ${patientName} (${patientId})`);
    console.log(`  Study Type: ${studyType}`);
    console.log(`  Upload Date: ${uploadDate}`);
    console.log(`  Case ID: ${caseId}`);

    const viewerUrl = `https://cscanskovai-44ebc.web.app/viewer/${caseId}`;

    // Template: scan_uploaded_d
    // Variables: {{1}} Doctor Name, {{2}} Patient Name, {{3}} Patient ID, 
    //            {{4}} Study Type, {{5}} Upload Date, {{6}} Viewer URL
    const parameters = [
      { name: '1', value: String(doctorName) },
      { name: '2', value: String(patientName) },
      { name: '3', value: String(patientId) },
      { name: '4', value: String(studyType) },
      { name: '5', value: String(uploadDate) },
      { name: '6', value: viewerUrl }
    ];

    const result = await sendTemplateMessage(
      doctorPhone,
      'scan_uploaded_d',
      parameters
    );

    if (result.success) {
      result.viewerUrl = viewerUrl;
      console.log(`[WATI] Scan uploaded notification sent successfully`);
      console.log(`[WATI] Viewer link: ${viewerUrl}`);
    }

    return result;
  } catch (error) {
    console.error('[WATI] Scan uploaded notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if WATI is configured
 */
function isConfigured() {
  return !!(WATI_API_ENDPOINT && WATI_ACCESS_TOKEN);
}

/**
 * Get configuration status
 */
function getStatus() {
  return {
    configured: isConfigured(),
    endpoint: WATI_API_ENDPOINT ? WATI_API_ENDPOINT.substring(0, 40) + '...' : null,
    hasAccessToken: !!WATI_ACCESS_TOKEN
  };
}

export {
  sendTemplateMessage,
  sendDicomNotification,
  sendScanUploadedNotification,  // New function
  sendTextMessage,
  isConfigured,
  getStatus,
  formatPhoneNumber
};
