import axios from 'axios';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Format phone number to WhatsApp format
 * Removes spaces, ensures + prefix
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all spaces and special characters except +
  let formatted = phone.replace(/[\s\-\(\)]/g, '');
  
  // Ensure + prefix
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}

/**
 * Send a template message via WhatsApp
 */
async function sendTemplateMessage(to, templateName, parameters) {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      throw new Error('WhatsApp credentials not configured');
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    console.log(`[WhatsApp] Sending template "${templateName}" to ${formattedPhone}`);

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: parameters.map(value => ({
                type: 'text',
                text: String(value)
              }))
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Message sent successfully. ID: ${response.data.messages[0].id}`);
    
    return { 
      success: true, 
      messageId: response.data.messages[0].id,
      phone: formattedPhone
    };
  } catch (error) {
    console.error('[WhatsApp] Send error:', error.response?.data || error.message);
    
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    };
  }
}

/**
 * Send DICOM notification to doctor with direct viewer link
 * Uses template with button that links to specific case
 */
async function sendDicomNotification(doctorPhone, doctorName, patientName, studyType, uploadDate, caseId) {
  try {
    console.log('[WhatsApp] Preparing DICOM notification with viewer link');
    console.log(`  Doctor: ${doctorName} (${doctorPhone})`);
    console.log(`  Patient: ${patientName}`);
    console.log(`  Study Type: ${studyType}`);
    console.log(`  Upload Date: ${uploadDate}`);
    console.log(`  Case ID: ${caseId}`);

    const formattedPhone = formatPhoneNumber(doctorPhone);
    if (!formattedPhone) {
      throw new Error('Invalid phone number');
    }

    // Send template with button parameter for viewer link
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: 'doctor_scan_notification',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: String(doctorName) },
                { type: 'text', text: String(patientName) },
                { type: 'text', text: String(studyType) },
                { type: 'text', text: String(uploadDate) }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                { type: 'text', text: String(caseId) }  // This replaces {{5}} in URL
              ]
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[WhatsApp] Message sent successfully. ID: ${response.data.messages[0].id}`);
    console.log(`[WhatsApp] Viewer link: https://cscanskovai-44ebc.web.app/viewer/${caseId}`);
    
    return { 
      success: true, 
      messageId: response.data.messages[0].id,
      phone: formattedPhone,
      viewerUrl: `https://cscanskovai-44ebc.web.app/viewer/${caseId}`
    };
  } catch (error) {
    console.error('[WhatsApp] DICOM notification error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    };
  }
}

/**
 * Send report notification to doctor
 * Used when report is uploaded separately after DICOM
 */
async function sendReportNotification(doctorPhone, doctorName, patientName, reportUrl) {
  try {
    console.log('[WhatsApp] Preparing report notification');
    console.log(`  Doctor: ${doctorName} (${doctorPhone})`);
    console.log(`  Patient: ${patientName}`);
    console.log(`  Report URL: ${reportUrl}`);

    return await sendTemplateMessage(
      doctorPhone,
      'report_ready',
      [doctorName, patientName, reportUrl]
    );
  } catch (error) {
    console.error('[WhatsApp] Report notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if WhatsApp is configured
 */
function isConfigured() {
  return !!(PHONE_NUMBER_ID && ACCESS_TOKEN);
}

/**
 * Get configuration status
 */
function getStatus() {
  return {
    configured: isConfigured(),
    phoneNumberId: PHONE_NUMBER_ID ? PHONE_NUMBER_ID.substring(0, 4) + '...' : null,
    hasAccessToken: !!ACCESS_TOKEN
  };
}

export {
  sendTemplateMessage,
  sendDicomNotification,
  sendReportNotification,
  isConfigured,
  getStatus,
  formatPhoneNumber
};
