import { createTransport } from 'nodemailer';
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

/**
 * Report Email Service
 * Sends beautiful report completion notifications
 * Completely separate from DICOM notifications
 */

// Create transporter for report emails
async function createReportTransporter(branchId = null) {
  try {
    const db = admin.database();
    
    // Try branch-specific settings
    if (branchId) {
      const branchSettingsRef = db.ref(`emailSettings/branches/${branchId}`);
      const branchSnapshot = await branchSettingsRef.once('value');
      const branchSettings = branchSnapshot.val();
      
      if (branchSettings && branchSettings.smtp && branchSettings.smtp.host && 
          branchSettings.smtp.auth && branchSettings.smtp.auth.user && branchSettings.smtp.auth.pass) {
        return createTransport({
          host: branchSettings.smtp.host,
          port: branchSettings.smtp.port || 587,
          secure: branchSettings.smtp.secure || false,
          auth: {
            user: branchSettings.smtp.auth.user,
            pass: branchSettings.smtp.auth.pass
          }
        });
      }
    }
    
    // Fallback to global settings
    const settingsRef = db.ref('emailSettings/smtp');
    const snapshot = await settingsRef.once('value');
    const smtpSettings = snapshot.val();

    if (smtpSettings && smtpSettings.host && smtpSettings.auth) {
      return createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port || 587,
        secure: smtpSettings.secure || false,
        auth: {
          user: smtpSettings.auth.user,
          pass: smtpSettings.auth.pass
        }
      });
    }
  } catch (error) {
    console.warn('[Report Email] Could not load Firebase settings:', error.message);
  }

  // Fallback to environment variables
  return createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
    }
  });
}

// Get organization settings
async function getOrgSettings(branchId = null) {
  try {
    const db = admin.database();
    
    if (branchId) {
      const branchOrgRef = db.ref(`emailSettings/branches/${branchId}/organization`);
      const branchOrgSnapshot = await branchOrgRef.once('value');
      const branchOrgSettings = branchOrgSnapshot.val();
      
      if (branchOrgSettings && branchOrgSettings.name) {
        return branchOrgSettings;
      }
    }
    
    const orgRef = db.ref('emailSettings/organization');
    const snapshot = await orgRef.once('value');
    const orgSettings = snapshot.val();
    
    if (orgSettings) {
      return orgSettings;
    }
  } catch (error) {
    console.warn('[Report Email] Could not load organization settings:', error.message);
  }

  return {
    name: '3D Anbu Dental Diagnostics LLP',
    email: process.env.EMAIL_USER || '',
    phone: '',
    address: '',
    logoUrl: ''
  };
}

// Generate completion email HTML
function generateCompletionEmailHTML(doctorName, patientName, currentDate, currentTime, fileName, orgSettings) {
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #2c3e50;
              background: #f5f7fa;
            }
            .email-container { 
              max-width: 650px; 
              margin: 40px auto; 
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
              color: white; 
              padding: 50px 40px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
              background-size: cover;
              opacity: 0.3;
            }
            .logo { 
              max-width: 180px; 
              margin-bottom: 20px;
              position: relative;
              z-index: 1;
            }
            .header-icon {
              font-size: 72px;
              margin: 20px 0;
              animation: bounce 2s infinite;
              position: relative;
              z-index: 1;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 15px 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              position: relative;
              z-index: 1;
            }
            .header p {
              font-size: 16px;
              opacity: 0.95;
              position: relative;
              z-index: 1;
            }
            .content { 
              padding: 50px 40px;
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #2c3e50;
              margin-bottom: 25px;
            }
            .message-box {
              background: linear-gradient(135deg, #e8f8f5 0%, #d5f4e6 100%);
              border-left: 5px solid #27ae60;
              padding: 30px;
              margin: 30px 0;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(39, 174, 96, 0.1);
            }
            .message-box h2 {
              color: #27ae60;
              font-size: 24px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .message-box p {
              font-size: 16px;
              color: #2c3e50;
              line-height: 1.8;
            }
            .info-card {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              border: 1px solid #e9ecef;
            }
            .info-row {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #27ae60;
              min-width: 140px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .info-value {
              color: #2c3e50;
              flex: 1;
            }
            .attachment-box {
              background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
              border-left: 5px solid #ffc107;
              padding: 25px;
              margin: 30px 0;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
            }
            .attachment-box h3 {
              color: #856404;
              font-size: 18px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .attachment-box p {
              font-size: 15px;
              color: #856404;
              line-height: 1.6;
            }
            .note {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
              font-size: 14px;
              color: #0d47a1;
            }
            .footer {
              background: #2c3e50;
              color: #ecf0f1;
              padding: 40px;
              text-align: center;
            }
            .footer-content {
              margin-bottom: 20px;
            }
            .footer-content p {
              margin: 8px 0;
              font-size: 14px;
            }
            .footer-divider {
              height: 1px;
              background: rgba(255,255,255,0.2);
              margin: 25px 0;
            }
            .footer-note {
              font-size: 12px;
              color: #95a5a6;
              line-height: 1.6;
            }
            .icon {
              display: inline-block;
              margin-right: 5px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              ${orgSettings.logoUrl ? `<img src="${orgSettings.logoUrl}" alt="${orgSettings.name}" class="logo">` : ''}
              <div class="header-icon">✅</div>
              <h1>Report Complete!</h1>
              <p>${orgSettings.name}</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Dear Dr. ${doctorName},
              </div>

              <!-- Main Message -->
              <div class="message-box">
                <h2>
                  <span class="icon">📄</span>
                  The report is completely generated
                </h2>
                <p>
                  We are pleased to inform you that the diagnostic report for your patient 
                  <strong>${patientName}</strong> has been successfully completed and is now ready for your review.
                </p>
              </div>

              <!-- Patient Information -->
              <div class="info-card">
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">👤</span>
                    Patient Name
                  </div>
                  <div class="info-value">${patientName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">📅</span>
                    Report Date
                  </div>
                  <div class="info-value">${currentDate}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">🕐</span>
                    Generated At
                  </div>
                  <div class="info-value">${currentTime}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">📋</span>
                    Document Type
                  </div>
                  <div class="info-value">Diagnostic Report (PDF)</div>
                </div>
              </div>

              <!-- Attachment Notice -->
              <div class="attachment-box">
                <h3>
                  <span class="icon">📎</span>
                  PDF Report Attached
                </h3>
                <p>
                  The diagnostic report PDF is attached to this email. You can download it directly from your email client 
                  or view it in your browser. The file is named: <strong>${fileName}</strong>
                </p>
              </div>

              <!-- Note -->
              <div class="note">
                <strong>📌 Note:</strong> The PDF report is attached to this email for your convenience. 
                You can save it to your device or print it for your records. If you have any trouble accessing the attachment, 
                please contact us immediately.
              </div>

              <p style="margin-top: 30px; font-size: 15px; color: #7f8c8d;">
                Thank you for choosing ${orgSettings.name} for your diagnostic imaging needs. 
                If you have any questions or require additional information, please don't hesitate to contact us.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <p style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">${orgSettings.name}</p>
                ${orgSettings.address ? `<p>📍 ${orgSettings.address}</p>` : ''}
                ${orgSettings.phone ? `<p>📞 ${orgSettings.phone}</p>` : ''}
                ${orgSettings.email ? `<p>📧 ${orgSettings.email}</p>` : ''}
              </div>
              
              <div class="footer-divider"></div>
              
              <div class="footer-note">
                <p>This email contains confidential medical information intended only for the recipient.</p>
                <p>If you received this email in error, please delete it immediately and notify the sender.</p>
                <p style="margin-top: 15px;">© ${new Date().getFullYear()} ${orgSettings.name}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
}

// Generate replacement email HTML
function generateReplacementEmailHTML(doctorName, patientName, currentDate, currentTime, fileName, orgSettings) {
  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #2c3e50;
              background: #f5f7fa;
            }
            .email-container { 
              max-width: 650px; 
              margin: 40px auto; 
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
              color: white; 
              padding: 50px 40px;
              text-align: center;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="rgba(255,255,255,0.1)" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,106.7C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>') no-repeat bottom;
              background-size: cover;
              opacity: 0.3;
            }
            .logo { 
              max-width: 180px; 
              margin-bottom: 20px;
              position: relative;
              z-index: 1;
            }
            .header-icon {
              font-size: 72px;
              margin: 20px 0;
              animation: pulse 2s infinite;
              position: relative;
              z-index: 1;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 15px 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              position: relative;
              z-index: 1;
            }
            .header p {
              font-size: 16px;
              opacity: 0.95;
              position: relative;
              z-index: 1;
            }
            .content { 
              padding: 50px 40px;
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #2c3e50;
              margin-bottom: 25px;
            }
            .message-box {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              border-left: 5px solid #3498db;
              padding: 30px;
              margin: 30px 0;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(52, 152, 219, 0.1);
            }
            .message-box h2 {
              color: #2980b9;
              font-size: 24px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .message-box p {
              font-size: 16px;
              color: #2c3e50;
              line-height: 1.8;
            }
            .update-badge {
              display: inline-block;
              background: #ff9800;
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin: 15px 0;
            }
            .info-card {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              border: 1px solid #e9ecef;
            }
            .info-row {
              display: flex;
              padding: 12px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #3498db;
              min-width: 140px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .info-value {
              color: #2c3e50;
              flex: 1;
            }
            .attachment-box {
              background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
              border-left: 5px solid #ffc107;
              padding: 25px;
              margin: 30px 0;
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
            }
            .attachment-box h3 {
              color: #856404;
              font-size: 18px;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .attachment-box p {
              font-size: 15px;
              color: #856404;
              line-height: 1.6;
            }
            .note {
              background: #fff3e0;
              border-left: 4px solid #ff9800;
              padding: 20px;
              margin: 25px 0;
              border-radius: 8px;
              font-size: 14px;
              color: #e65100;
            }
            .footer {
              background: #2c3e50;
              color: #ecf0f1;
              padding: 40px;
              text-align: center;
            }
            .footer-content {
              margin-bottom: 20px;
            }
            .footer-content p {
              margin: 8px 0;
              font-size: 14px;
            }
            .footer-divider {
              height: 1px;
              background: rgba(255,255,255,0.2);
              margin: 25px 0;
            }
            .footer-note {
              font-size: 12px;
              color: #95a5a6;
              line-height: 1.6;
            }
            .icon {
              display: inline-block;
              margin-right: 5px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              ${orgSettings.logoUrl ? `<img src="${orgSettings.logoUrl}" alt="${orgSettings.name}" class="logo">` : ''}
              <div class="header-icon">🔄</div>
              <h1>Report Updated!</h1>
              <p>${orgSettings.name}</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">
                Dear Dr. ${doctorName},
              </div>

              <!-- Main Message -->
              <div class="message-box">
                <h2>
                  <span class="icon">📄</span>
                  Updated Report Available
                </h2>
                <div class="update-badge">🔄 NEW VERSION</div>
                <p>
                  We are writing to inform you that the diagnostic report for your patient 
                  <strong>${patientName}</strong> has been UPDATED with a new version. 
                  The revised report is now ready for your review.
                </p>
              </div>

              <!-- Patient Information -->
              <div class="info-card">
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">👤</span>
                    Patient Name
                  </div>
                  <div class="info-value">${patientName}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">🔄</span>
                    Updated On
                  </div>
                  <div class="info-value">${currentDate}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">🕐</span>
                    Updated At
                  </div>
                  <div class="info-value">${currentTime}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">
                    <span class="icon">📋</span>
                    Document Type
                  </div>
                  <div class="info-value">Diagnostic Report (PDF) - UPDATED</div>
                </div>
              </div>

              <!-- Attachment Notice -->
              <div class="attachment-box">
                <h3>
                  <span class="icon">📎</span>
                  Updated PDF Report Attached
                </h3>
                <p>
                  The UPDATED diagnostic report PDF is attached to this email. This replaces the previous version. 
                  You can download it directly from your email client or view it in your browser. 
                  The file is named: <strong>${fileName}</strong>
                </p>
              </div>

              <!-- Note -->
              <div class="note">
                <strong>⚠️ Important:</strong> This is an UPDATED version of the report. Please use this new version 
                for your review and discard any previous versions. If you have any questions about the changes, 
                please contact us immediately.
              </div>

              <p style="margin-top: 30px; font-size: 15px; color: #7f8c8d;">
                Thank you for choosing ${orgSettings.name} for your diagnostic imaging needs. 
                If you have any questions or require additional information about the updated report, 
                please don't hesitate to contact us.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-content">
                <p style="font-size: 18px; font-weight: 600; margin-bottom: 15px;">${orgSettings.name}</p>
                ${orgSettings.address ? `<p>📍 ${orgSettings.address}</p>` : ''}
                ${orgSettings.phone ? `<p>📞 ${orgSettings.phone}</p>` : ''}
                ${orgSettings.email ? `<p>📧 ${orgSettings.email}</p>` : ''}
              </div>
              
              <div class="footer-divider"></div>
              
              <div class="footer-note">
                <p>This email contains confidential medical information intended only for the recipient.</p>
                <p>If you received this email in error, please delete it immediately and notify the sender.</p>
                <p style="margin-top: 15px;">© ${new Date().getFullYear()} ${orgSettings.name}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
}

// Generate completion email text
function generateCompletionEmailText(doctorName, patientName, currentDate, currentTime, fileName, orgSettings) {
  return `
Dear Dr. ${doctorName},

THE REPORT IS COMPLETELY GENERATED

We are pleased to inform you that the diagnostic report for your patient ${patientName} has been successfully completed and is now ready for your review.

Patient Information:
- Patient Name: ${patientName}
- Report Date: ${currentDate}
- Generated At: ${currentTime}
- Document Type: Diagnostic Report (PDF)

PDF REPORT ATTACHED:
The diagnostic report PDF is attached to this email (${fileName}). You can download it directly from your email client.

Thank you for choosing ${orgSettings.name} for your diagnostic imaging needs.

${orgSettings.name}
${orgSettings.address || ''}
${orgSettings.phone ? `Phone: ${orgSettings.phone}` : ''}
${orgSettings.email ? `Email: ${orgSettings.email}` : ''}

This email contains confidential medical information. If you received this in error, please delete it immediately.
      `;
}

// Generate replacement email text
function generateReplacementEmailText(doctorName, patientName, currentDate, currentTime, fileName, orgSettings) {
  return `
Dear Dr. ${doctorName},

REPORT UPDATED - NEW VERSION AVAILABLE

We are writing to inform you that the diagnostic report for your patient ${patientName} has been UPDATED with a new version. The revised report is now ready for your review.

Patient Information:
- Patient Name: ${patientName}
- Updated On: ${currentDate}
- Updated At: ${currentTime}
- Document Type: Diagnostic Report (PDF) - UPDATED

UPDATED PDF REPORT ATTACHED:
The UPDATED diagnostic report PDF is attached to this email (${fileName}). This replaces the previous version. Please use this new version for your review and discard any previous versions.

IMPORTANT: This is an UPDATED version of the report. If you have any questions about the changes, please contact us immediately.

Thank you for choosing ${orgSettings.name} for your diagnostic imaging needs.

${orgSettings.name}
${orgSettings.address || ''}
${orgSettings.phone ? `Phone: ${orgSettings.phone}` : ''}
${orgSettings.email ? `Email: ${orgSettings.email}` : ''}

This email contains confidential medical information. If you received this in error, please delete it immediately.
      `;
}

/**
 * Send fantastic report completion email with PDF attachment
 * @param {Object} data - Report data
 * @returns {Promise<Object>} - Send result
 */
export async function sendReportCompletionEmail(data) {
  try {
    const { doctorEmail, doctorName, patientName, reportUrl, branchId, patientId, isReplacement = false } = data;
    
    console.log('[Report Email] Sending report completion notification with PDF attachment...');
    
    const transporter = await createReportTransporter(branchId);
    const orgSettings = await getOrgSettings(branchId);

    if (!doctorEmail) {
      throw new Error('Doctor email is required');
    }

    if (!reportUrl) {
      throw new Error('Report URL is required');
    }

    // Extract bucket and file path from reportUrl
    // URL format: https://storage.googleapis.com/bucket-name/path/to/file.pdf
    const urlParts = reportUrl.replace('https://storage.googleapis.com/', '').split('/');
    const bucketName = urlParts[0];
    const filePath = urlParts.slice(1).join('/');
    
    console.log(`[Report Email] Downloading PDF from bucket: ${bucketName}, path: ${filePath}`);
    
    // Download PDF from Google Cloud Storage
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);
    
    const [fileBuffer] = await file.download();
    const [metadata] = await file.getMetadata();
    
    console.log(`[Report Email] PDF downloaded, size: ${fileBuffer.length} bytes`);

    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate filename for attachment
    const fileName = `Report_${patientName.replace(/\s+/g, '_')}_${patientId || Date.now()}.pdf`;

    const mailOptions = {
      from: `"${orgSettings.name}" <${orgSettings.email || process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: isReplacement ? `🔄 Report Updated - ${patientName}` : `✅ Report Complete - ${patientName}`,
      attachments: [
        {
          filename: fileName,
          content: fileBuffer,
          contentType: 'application/pdf'
        }
      ],
      html: isReplacement ? generateReplacementEmailHTML(doctorName, patientName, currentDate, currentTime, fileName, orgSettings) : generateCompletionEmailHTML(doctorName, patientName, currentDate, currentTime, fileName, orgSettings),
      text: isReplacement ? generateReplacementEmailText(doctorName, patientName, currentDate, currentTime, fileName, orgSettings) : generateCompletionEmailText(doctorName, patientName, currentDate, currentTime, fileName, orgSettings)
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Report completion email with PDF attachment sent to: ${doctorEmail}`);
    console.log(`   Attachment: ${fileName} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
    
    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      recipient: doctorEmail,
      attachmentSize: fileBuffer.length
    };
  } catch (error) {
    console.error('❌ Report email failed:', error);
    return {
      success: false,
      error: error.message,
      sentAt: new Date().toISOString()
    };
  }
}
