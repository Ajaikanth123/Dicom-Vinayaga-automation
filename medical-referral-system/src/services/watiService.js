// WATI WhatsApp API Service
// Sends template messages via WATI production endpoint

const WATI_API_ENDPOINT = 'https://live-mt-server.wati.io/10104636';
const WATI_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwibmFtZWlkIjoiM2RhbmJ1ZGVudGFsc2NhbnNyYW1uYWR1MkBnbWFpbC5jb20iLCJlbWFpbCI6IjNkYW5idWRlbnRhbHNjYW5zcmFtbmFkdTJAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDYvMjAyNiAxMjo1OToyMSIsInRlbmFudF9pZCI6IjEwMTA0NjM2IiwiZGJfbmFtZSI6Im10LXByb2QtVGVuYW50cyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFETUlOSVNUUkFUT1IiLCJleHAiOjI1MzQwMjMwMDgwMCwiaXNzIjoiQ2xhcmVfQUkiLCJhdWQiOiJDbGFyZV9BSSJ9.g1FJM4OfWYXzhDzHoEoAKb2WCqjtOj13NcncfXYA1Ws';

// Template names matching WATI dashboard (approved templates)
const TEMPLATES = {
    ONLY_DICOM_UPLOADED: '_only_dicom_uploaded_',                    // When only DICOM is uploaded → send viewer link
    BOTH_DICOM_AND_REPORT_UPLOADED: 'both_dicom_and_report_uploaded', // When both DICOM + report uploaded → send viewer + report links
    ONLY_REPORT_UPLOADED: 'only_report_uploaded',                  // When only report is uploaded/sent → send report link
};

/**
 * Format phone number to include country code (India +91)
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number with country code
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    // If starts with +91, remove the +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        return cleaned; // Already has country code
    }
    // If 10 digits, prepend 91
    if (cleaned.length === 10) {
        return `91${cleaned}`;
    }
    return cleaned;
};

/**
 * Format today's date as readable string
 * @returns {string} e.g. "March 6, 2026"
 */
const formatDate = (date = new Date()) => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Build a comma-separated string of selected 3D Diagnostic Services (CBCT)
 * @param {Object} diagnosticServices - The diagnosticServices object from the form
 * @returns {string} e.g. "CBCT Maxilla, CBCT TMJ (Right)"
 */
export const buildDiagnosticServicesText = (diagnosticServices) => {
    if (!diagnosticServices) return 'N/A';

    const threeDServices = diagnosticServices.threeDServices || diagnosticServices;
    const items = [];

    if (threeDServices.cbctSingleTooth?.selected) {
        const teeth = threeDServices.cbctSingleTooth?.toothNumber || threeDServices.cbctSingleTooth?.selectedTeeth?.join(', ') || '';
        items.push(`CBCT Single Tooth${teeth ? ` (${teeth})` : ''}`);
    }
    if (threeDServices.cbctSegment?.selected) {
        const teeth = threeDServices.cbctSegment?.details || threeDServices.cbctSegment?.selectedTeeth?.join(', ') || '';
        items.push(`CBCT Segment${teeth ? ` (${teeth})` : ''}`);
    }
    if (threeDServices.cbctMaxilla) items.push('CBCT Maxilla');
    if (threeDServices.cbctMandible) items.push('CBCT Mandible');
    if (threeDServices.cbctTMJ?.selected) {
        const side = threeDServices.cbctTMJ?.side || '';
        items.push(`CBCT TMJ${side ? ` (${side})` : ''}`);
    }
    if (threeDServices.cbctMaxillaMandible) items.push('CBCT Maxilla & Mandible');
    if (threeDServices.cbctFullSkull) items.push('CBCT Full Skull View');

    return items.length > 0 ? items.join(', ') : 'N/A';
};

/**
 * Build a comma-separated string of selected Reason for Referral options
 * @param {Object} reasonForReferral - The reasonForReferral object from the form
 * @returns {string} e.g. "Implant Planning, Sinus Pathology"
 */
export const buildReasonForReferralText = (reasonForReferral) => {
    if (!reasonForReferral) return 'N/A';

    const labelMap = {
        implantPlanning: 'Implant Planning',
        cystTumourMalignancy: 'Cyst / Tumour / Malignancy',
        teethRootBoneFracture: 'Teeth / Root / Bone Fracture',
        rootCanalEndodontic: 'Root Canal / Endodontic Purpose',
        impactedSupernumerary: 'Impacted / Supernumerary Tooth',
        postOperativeImplant: 'Post Operative / Post Implant',
        tmjPainClicking: 'TMJ Pain / Clicking',
        chronicIdiopathicPain: 'Chronic / Idiopathic Pain',
        sinusPathology: 'Sinus Pathology',
        periapicalPeriodontal: 'Periapical / Periodontal Lesion / Bone Loss',
        orthodontic: 'Orthodontic',
        airwayAnalysis: 'Airway Analysis',
    };

    const items = Object.entries(reasonForReferral)
        .filter(([, value]) => value === true)
        .map(([key]) => labelMap[key] || key);

    return items.length > 0 ? items.join(', ') : 'N/A';
};

/**
 * Send a WATI template message
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} templateName - WATI template name
 * @param {Array} parameters - Array of { name, value } parameter objects
 * @returns {Promise<Object>} API response
 */
const sendTemplateMessage = async (phoneNumber, templateName, parameters) => {
    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!formattedPhone) {
        throw new Error('Invalid phone number');
    }

    console.log(`[WATI] Sending template "${templateName}" to ${formattedPhone}`);
    console.log('[WATI] Parameters:', parameters);

    try {
        const response = await fetch(
            `${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage?whatsappNumber=${formattedPhone}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_name: templateName,
                    broadcast_name: `${templateName}_${Date.now()}`,
                    parameters: parameters,
                }),
            }
        );

        const data = await response.json();

        if (data.result === true) {
            console.log(`[WATI] ✅ Message sent successfully to ${formattedPhone}`);
            console.log(`[WATI] Message ID: ${data.local_message_id}`);
            return {
                success: true,
                messageId: data.local_message_id,
                validWhatsApp: data.validWhatsAppNumber,
                phoneNumber: formattedPhone,
            };
        } else {
            console.error(`[WATI] ❌ Message failed:`, data.info || data);
            console.error(`[WATI] ❌ Full response:`, JSON.stringify(data, null, 2));
            if (data.items) {
                console.error(`[WATI] ❌ Error items:`, JSON.stringify(data.items, null, 2));
            }
            const errorMsg = data.info || (data.items && data.items.length > 0 ? JSON.stringify(data.items[0]) : 'Failed to send template message');
            return {
                success: false,
                error: errorMsg,
                phoneNumber: formattedPhone,
            };
        }
    } catch (error) {
        console.error(`[WATI] ❌ Network error:`, error);
        return {
            success: false,
            error: error.message,
            phoneNumber: formattedPhone,
        };
    }
};

/**
 * Template 1: Send "Only DICOM Uploaded" notification to doctor
 * Uses the "only_dicom_uploaded" template (8 variables)
 * 
 * Also used when clicking the notification bell in Manage Forms (DICOM exists, no report)
 * 
 * @param {Object} options
 * @param {string} options.doctorName - Doctor's name
 * @param {string} options.doctorPhone - Doctor's phone number
 * @param {string} options.patientName - Patient name
 * @param {string} options.patientId - Patient ID
 * @param {string} options.studyType - Type of scan
 * @param {string} options.diagnosticServicesText - Comma-separated CBCT services
 * @param {string} options.reasonForReferralText - Comma-separated referral reasons
 * @param {string} options.viewerUrl - DICOM viewer URL
 * @param {string} [options.uploadDate] - Upload date (defaults to today)
 * @returns {Promise<Object>} Send result
 */
export const sendScanUploadedNotification = async ({
    doctorName,
    doctorPhone,
    patientName,
    patientId,
    studyType = 'DICOM Scan',
    diagnosticServicesText = 'N/A',
    reasonForReferralText = 'N/A',
    viewerUrl,
    uploadDate,
}) => {
    const parameters = [
        { name: '1', value: doctorName || 'Doctor' },
        { name: '2', value: patientName || 'Patient' },
        { name: '3', value: patientId || '-' },
        { name: '4', value: studyType },
        { name: '5', value: uploadDate || formatDate() },
        { name: '6', value: diagnosticServicesText },
        { name: '7', value: reasonForReferralText },
        { name: '8', value: viewerUrl || '' },
    ];

    return sendTemplateMessage(doctorPhone, TEMPLATES.ONLY_DICOM_UPLOADED, parameters);
};

/**
 * Template 2: Send "Both DICOM and Report Uploaded" notification to doctor
 * Uses the "both_dicom_and_report_uploaded" template (9 variables)
 * 
 * @param {Object} options
 * @param {string} options.doctorName - Doctor's name
 * @param {string} options.doctorPhone - Doctor's phone number
 * @param {string} options.patientName - Patient name
 * @param {string} options.patientId - Patient ID
 * @param {string} options.studyType - Type of scan
 * @param {string} options.diagnosticServicesText - Comma-separated CBCT services
 * @param {string} options.reasonForReferralText - Comma-separated referral reasons
 * @param {string} options.viewerUrl - DICOM viewer URL
 * @param {string} options.reportUrl - Report download URL
 * @param {string} [options.uploadDate] - Upload date (defaults to today)
 * @returns {Promise<Object>} Send result
 */
export const sendBothUploadedNotification = async ({
    doctorName,
    doctorPhone,
    patientName,
    patientId,
    studyType = 'DICOM Scan',
    diagnosticServicesText = 'N/A',
    reasonForReferralText = 'N/A',
    viewerUrl,
    reportUrl,
    uploadDate,
}) => {
    const parameters = [
        { name: '1', value: doctorName || 'Doctor' },
        { name: '2', value: patientName || 'Patient' },
        { name: '3', value: patientId || '-' },
        { name: '4', value: studyType },
        { name: '5', value: uploadDate || formatDate() },
        { name: '6', value: diagnosticServicesText },
        { name: '7', value: reasonForReferralText },
        { name: '8', value: viewerUrl || '' },
        { name: '9', value: reportUrl || '' },
    ];

    return sendTemplateMessage(doctorPhone, TEMPLATES.BOTH_DICOM_AND_REPORT_UPLOADED, parameters);
};

/**
 * Template 3: Send "Only Report Uploaded" notification to doctor
 * Uses the "only_report_uploaded" template (8 variables)
 * 
 * Used when report is uploaded via Manage Forms "Send Report" button
 * 
 * @param {Object} options
 * @param {string} options.doctorName - Doctor's name
 * @param {string} options.doctorPhone - Doctor's phone number
 * @param {string} options.patientName - Patient name
 * @param {string} options.patientId - Patient ID
 * @param {string} options.studyType - Type of scan
 * @param {string} options.diagnosticServicesText - Comma-separated CBCT services
 * @param {string} options.reasonForReferralText - Comma-separated referral reasons
 * @param {string} options.reportUrl - Report download URL
 * @param {string} [options.uploadDate] - Upload date (defaults to today)
 * @returns {Promise<Object>} Send result
 */
export const sendOnlyReportNotification = async ({
    doctorName,
    doctorPhone,
    patientName,
    patientId,
    studyType = 'DICOM Scan',
    diagnosticServicesText = 'N/A',
    reasonForReferralText = 'N/A',
    reportUrl,
    uploadDate,
}) => {
    const parameters = [
        { name: '1', value: doctorName || 'Doctor' },
        { name: '2', value: patientName || 'Patient' },
        { name: '3', value: patientId || '-' },
        { name: '4', value: studyType },
        { name: '5', value: uploadDate || formatDate() },
        { name: '6', value: diagnosticServicesText },
        { name: '7', value: reasonForReferralText },
        { name: '8', value: reportUrl || '' },
    ];

    return sendTemplateMessage(doctorPhone, TEMPLATES.ONLY_REPORT_UPLOADED, parameters);
};

export default {
    sendScanUploadedNotification,
    sendBothUploadedNotification,
    sendOnlyReportNotification,
    sendTemplateMessage,
    buildDiagnosticServicesText,
    buildReasonForReferralText,
    TEMPLATES,
};
