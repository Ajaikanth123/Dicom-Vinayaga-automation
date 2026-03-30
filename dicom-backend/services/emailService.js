import { createTransport } from 'nodemailer';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

/**
 * Email Service
 * Sends email notifications to doctors and patients
 * Settings are loaded from Firebase Realtime Database
 * Supports branch-specific email configurations
 */

// Create transporter dynamically based on Firebase settings and branch
async function createTransporter(branchId = null) {
  try {
    const db = admin.database();
    
    // Try to load branch-specific settings first
    if (branchId) {
      const branchSettingsRef = db.ref(`emailSettings/branches/${branchId}`);
      const branchSnapshot = await branchSettingsRef.once('value');
      const branchSettings = branchSnapshot.val();
      
      if (branchSettings && branchSettings.smtp && branchSettings.smtp.host && 
          branchSettings.smtp.auth && branchSettings.smtp.auth.user && branchSettings.smtp.auth.pass) {
        console.log(`[Email Service] Using branch-specific SMTP settings for: ${branchId}`);
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

    if (smtpSettings && smtpSettings.host && smtpSettings.auth && smtpSettings.auth.user && smtpSettings.auth.pass) {
      console.log('[Email Service] Using global SMTP settings');
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
    console.warn('[Email Service] Could not load Firebase settings, using environment variables:', error.message);
  }

  // Fallback to environment variables
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // Default SMTP configuration
    return createTransport({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      }
    });
  }
}

// Get organization settings from Firebase (branch-specific or global)
async function getOrganizationSettings(branchId = null) {
  try {
    const db = admin.database();
    
    // Try branch-specific organization settings first
    if (branchId) {
      const branchOrgRef = db.ref(`emailSettings/branches/${branchId}/organization`);
      const branchOrgSnapshot = await branchOrgRef.once('value');
      const branchOrgSettings = branchOrgSnapshot.val();
      
      if (branchOrgSettings && branchOrgSettings.name) {
        console.log(`[Email Service] Using branch-specific organization settings for: ${branchId}`);
        return branchOrgSettings;
      }
    }
    
    // Fallback to global organization settings
    const orgRef = db.ref('emailSettings/organization');
    const snapshot = await orgRef.once('value');
    const orgSettings = snapshot.val();
    
    if (orgSettings) {
      return orgSettings;
    }
  } catch (error) {
    console.warn('[Email Service] Could not load organization settings:', error.message);
  }

  // Fallback to default
  return {
    name: 'C Scans Kovai',
    email: process.env.EMAIL_USER || '',
    phone: '',
    address: '',
    logoUrl: ''
  };
}

/**
 * Send email to doctor with DICOM viewer link
 * @param {object} doctorData - Doctor information
 * @param {object} patientData - Patient information
 * @param {object} caseData - Case information with viewer link
 * @param {string} branchId - Branch ID for branch-specific email settings
 * @param {object} senderInfo - Currently logged-in user info (email, name)
 * @returns {Promise<object>} - Send result
 */
export async function sendDoctorNotification(doctorData, patientData, caseData, branchId = null, senderInfo = null) {
  try {
    const transporter = await createTransporter(branchId);
    const orgSettings = await getOrganizationSettings(branchId);
    
    const { doctorName, doctorEmail, hospital } = doctorData;
    const { patientName, patientId } = patientData;
    const { viewerLink, caseId, studyDate, diagnosticServices, reasonForReferral, clinicalNotes, patientImageUrl, isStage1 } = caseData;

    if (!doctorEmail) {
      throw new Error('Doctor email is required');
    }

    // For Stage 1 (image only), send a simpler email
    if (isStage1) {
      const transporter = await createTransporter(branchId);
      const orgSettings = await getOrganizationSettings(branchId);
      const mailOptions = {
        from: `"${orgSettings.name}" <${orgSettings.email || process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: `🦷 New Patient Referral - ${patientName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#80A84D,#5e7d38);color:white;padding:30px;border-radius:10px 10px 0 0;text-align:center">
              <h1 style="margin:0">🦷 New Patient Referral</h1>
              <p style="margin:8px 0 0;opacity:.9">${orgSettings.name}</p>
            </div>
            <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px">
              <p>Dear Dr. ${doctorName},</p>
              <p>A new patient has been referred. Please review the image and advise if a DICOM scan is required.</p>
              <div style="background:white;padding:20px;border-left:4px solid #80A84D;border-radius:5px;margin:20px 0">
                <p><strong style="color:#80A84D">👤 Patient:</strong> ${patientName}</p>
                <p><strong style="color:#80A84D">🆔 ID:</strong> ${patientId}</p>
                ${clinicalNotes ? `<p><strong style="color:#80A84D">📝 Notes:</strong> ${clinicalNotes}</p>` : ''}
              </div>
              ${patientImageUrl ? `<div style="margin:20px 0"><h3 style="color:#80A84D">🖼️ Patient Image</h3><img src="${patientImageUrl}" style="max-width:100%;border-radius:8px;border:2px solid #80A84D" alt="Patient Image"/></div>` : ''}
              <p style="color:#666;font-size:13px;margin-top:20px">Stage 1 of 3 — Image only. DICOM scan and report will follow.</p>
            </div>
          </div>`,
        text: `Dear Dr. ${doctorName},\n\nNew patient referral: ${patientName} (${patientId})\n${clinicalNotes ? `Notes: ${clinicalNotes}\n` : ''}\nPatient image: ${patientImageUrl || 'N/A'}\n\n${orgSettings.name}`
      };
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, sentAt: new Date().toISOString(), recipient: doctorEmail };
    }

    // Prepare sender information for display
    let senderNote = '';
    if (senderInfo && senderInfo.name) {
      senderNote = `
        <div style="background: #f0f7ff; padding: 12px; margin: 15px 0; border-left: 4px solid #2196F3; border-radius: 5px;">
          <p style="margin: 0; font-size: 13px; color: #666;">
            📧 <strong>Sent by:</strong> ${senderInfo.name} (${senderInfo.email})
          </p>
        </div>
      `;
    }

    // Format diagnostic services
    let diagnosticServicesHtml = '';
    if (diagnosticServices && diagnosticServices.threeDServices) {
      const services = [];
      const threeDServices = diagnosticServices.threeDServices;
      
      if (threeDServices.cbctSingleTooth?.selected) {
        services.push('CBCT Single Tooth');
        if (threeDServices.cbctSingleTooth.selectedTeeth && threeDServices.cbctSingleTooth.selectedTeeth.length > 0) {
          services.push(`  → Tooth: ${threeDServices.cbctSingleTooth.selectedTeeth.join(', ')}`);
        }
      }
      
      if (threeDServices.cbctSegment?.selected) {
        services.push('CBCT Segment (Max 4-5 teeth)');
        if (threeDServices.cbctSegment.selectedTeeth && threeDServices.cbctSegment.selectedTeeth.length > 0) {
          services.push(`  → Selected Teeth: ${threeDServices.cbctSegment.selectedTeeth.join(', ')}`);
        }
      }
      
      if (threeDServices.cbctMaxilla) services.push('CBCT Maxilla');
      if (threeDServices.cbctMandible) services.push('CBCT Mandible');
      
      if (threeDServices.cbctTMJ?.selected) {
        let tmjText = 'CBCT TMJ';
        if (threeDServices.cbctTMJ.side) {
          tmjText += ` (${threeDServices.cbctTMJ.side})`;
        }
        services.push(tmjText);
      }
      
      if (threeDServices.cbctMaxillaMandible) services.push('CBCT Maxilla & Mandible');
      if (threeDServices.cbctFullSkull) services.push('CBCT Full Skull View');
      
      if (diagnosticServices.isChild) services.push('⚠️ Patient is a child');
      
      if (services.length > 0) {
        diagnosticServicesHtml = `
          <div class="info-box" style="background: #e8f4fd; border-left-color: #2196F3;">
            <h3 style="margin-top: 0; color: #2196F3;">📋 Diagnostic Services Requested</h3>
            ${services.map(s => `<div class="info-row">• ${s}</div>`).join('')}
          </div>
        `;
      }
    }

    // Format reason for referral
    let reasonForReferralHtml = '';
    if (reasonForReferral) {
      const reasons = [];
      if (reasonForReferral.implantPlanning) reasons.push('Implant Planning');
      if (reasonForReferral.teethRootBoneFracture) reasons.push('Teeth / Root / Bone Fracture');
      if (reasonForReferral.impactedSupernumeraryTooth) reasons.push('Impacted / Supernumerary Tooth');
      if (reasonForReferral.tmjPainClicking) reasons.push('TMJ Pain / Clicking');
      if (reasonForReferral.sinusPathology) reasons.push('Sinus Pathology');
      if (reasonForReferral.orthodontic) reasons.push('Orthodontic');
      if (reasonForReferral.cystTumourMalignancy) reasons.push('Cyst / Tumour / Malignancy');
      if (reasonForReferral.rootCanalEndodonticPurpose) reasons.push('Root Canal / Endodontic Purpose');
      if (reasonForReferral.postOperativePostImplant) reasons.push('Post Operative / Post Implant');
      if (reasonForReferral.chronicIdiopathicPain) reasons.push('Chronic / Idiopathic Pain');
      if (reasonForReferral.periapicalPeriodontalLesionBoneLoss) reasons.push('Periapical / Periodontal Lesion / Bone Loss');
      if (reasonForReferral.airwayAnalysis) reasons.push('Airway Analysis');
      
      if (reasons.length > 0) {
        reasonForReferralHtml = `
          <div class="info-box" style="background: #fff3e0; border-left-color: #ff9800;">
            <h3 style="margin-top: 0; color: #ff9800;">🎯 Reason for Referral</h3>
            ${reasons.map(r => `<div class="info-row">• ${r}</div>`).join('')}
          </div>
        `;
      }
    }

    // Format clinical notes
    let clinicalNotesHtml = '';
    if (clinicalNotes && clinicalNotes.trim()) {
      clinicalNotesHtml = `
        <div class="info-box" style="background: #f3e5f5; border-left-color: #9c27b0;">
          <h3 style="margin-top: 0; color: #9c27b0;">📝 Clinical Notes</h3>
          <p style="margin: 0; white-space: pre-wrap;">${clinicalNotes}</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"${orgSettings.name}" <${orgSettings.email || process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: `New DICOM Scan Ready - Patient: ${patientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #80A84D 0%, #5e7d38 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #80A84D; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #80A84D; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #80A84D 0%, #5e7d38 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { opacity: 0.9; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .icon { font-size: 24px; margin-right: 10px; }
            .logo { max-width: 200px; margin-bottom: 15px; }
            h3 { margin-bottom: 15px; }
            .patient-img { max-width: 100%; border-radius: 8px; margin: 15px 0; border: 2px solid #80A84D; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${orgSettings.logoUrl ? `<img src="${orgSettings.logoUrl}" alt="${orgSettings.name}" class="logo">` : ''}
              <h1>🦷 New DICOM Scan Ready</h1>
              <p>${orgSettings.name}</p>
            </div>
            <div class="content">
              <p>Dear Dr. ${doctorName},</p>
              
              ${senderNote}
              
              <p>A new DICOM scan is ready for your review:</p>
              
              ${patientImageUrl ? `
              <div class="info-box">
                <h3 style="color:#80A84D;margin-top:0">🖼️ Patient Image</h3>
                <img src="${patientImageUrl}" alt="Patient Image" class="patient-img" />
              </div>` : ''}
              
              <div class="info-box">
                <div class="info-row">
                  <span class="label">👤 Patient Name:</span> ${patientName}
                </div>
                <div class="info-row">
                  <span class="label">🆔 Patient ID:</span> ${patientId}
                </div>
                <div class="info-row">
                  <span class="label">🏥 Hospital:</span> ${hospital || 'N/A'}
                </div>
                <div class="info-row">
                  <span class="label">📅 Scan Date:</span> ${studyDate || new Date().toLocaleDateString()}
                </div>
                <div class="info-row">
                  <span class="label">📋 Case ID:</span> ${caseId}
                </div>
              </div>

              ${diagnosticServicesHtml}
              ${reasonForReferralHtml}
              ${clinicalNotesHtml}

              <p>Click the button below to view the DICOM images in our secure viewer:</p>
              
              <div style="text-align: center;">
                <a href="${viewerLink}" class="button">🔍 View DICOM Scan</a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This link provides secure access to the patient's DICOM images. 
                The images can be viewed in any modern web browser with our advanced medical imaging viewer.
              </p>
            </div>
            <div class="footer">
              <p>${orgSettings.name}<br>
              ${orgSettings.address || ''}<br>
              ${orgSettings.phone ? `Phone: ${orgSettings.phone}<br>` : ''}
              ${orgSettings.email ? `Email: ${orgSettings.email}` : ''}</p>
              <p style="margin-top: 15px; font-size: 11px; color: #999;">
                This email contains confidential medical information. If you received this in error, please delete it immediately.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear Dr. ${doctorName},

A new DICOM scan is ready for your review:

Patient Name: ${patientName}
Patient ID: ${patientId}
Hospital: ${hospital || 'N/A'}
Scan Date: ${studyDate || new Date().toLocaleDateString()}
Case ID: ${caseId}

View the scan here: ${viewerLink}

${orgSettings.name}
${orgSettings.address || ''}
${orgSettings.phone ? `Phone: ${orgSettings.phone}` : ''}
${orgSettings.email ? `Email: ${orgSettings.email}` : ''}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent to doctor: ${doctorEmail}`);
    
    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      recipient: doctorEmail
    };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return {
      success: false,
      error: error.message,
      sentAt: new Date().toISOString()
    };
  }
}

/**
 * Send email to patient
 * @param {object} patientData - Patient information
 * @param {object} caseData - Case information
 * @param {string} branchId - Branch ID for branch-specific email settings
 * @returns {Promise<object>} - Send result
 */
export async function sendPatientNotification(patientData, caseData, branchId = null) {
  try {
    const transporter = await createTransporter(branchId);
    const orgSettings = await getOrganizationSettings(branchId);
    
    const { patientName, patientId, patientEmail } = patientData;
    const { caseId, studyDate } = caseData;

    if (!patientEmail) {
      throw new Error('Patient email is required');
    }

    const mailOptions = {
      from: `"${orgSettings.name}" <${orgSettings.email || process.env.EMAIL_USER}>`,
      to: patientEmail,
      subject: `Your Dental Scan is Complete - ${patientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #27ae60; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .logo { max-width: 200px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${orgSettings.logoUrl ? `<img src="${orgSettings.logoUrl}" alt="${orgSettings.name}" class="logo">` : ''}
              <h1>✅ Your Scan is Complete</h1>
              <p>${orgSettings.name}</p>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              
              <p>Your dental scan has been completed successfully.</p>
              
              <div class="info-box">
                <p><strong>Patient ID:</strong> ${patientId}</p>
                <p><strong>Scan Date:</strong> ${studyDate || new Date().toLocaleDateString()}</p>
                <p><strong>Case ID:</strong> ${caseId}</p>
              </div>

              <p>Your doctor will review the scan and contact you soon to schedule an appointment.</p>

              <p>Thank you for choosing ${orgSettings.name}.</p>
            </div>
            <div class="footer">
              <p>${orgSettings.name}<br>
              ${orgSettings.address || ''}<br>
              ${orgSettings.phone ? `Phone: ${orgSettings.phone}<br>` : ''}
              ${orgSettings.email ? `Email: ${orgSettings.email}` : ''}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${patientName},

Your dental scan has been completed successfully.

Patient ID: ${patientId}
Scan Date: ${studyDate || new Date().toLocaleDateString()}
Case ID: ${caseId}

Your doctor will review the scan and contact you soon to schedule an appointment.

Thank you for choosing ${orgSettings.name}.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent to patient: ${patientEmail}`);
    
    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      recipient: patientEmail
    };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return {
      success: false,
      error: error.message,
      sentAt: new Date().toISOString()
    };
  }
}

/**
 * Send both doctor and patient notifications
 * @param {object} doctorData - Doctor information
 * @param {object} patientData - Patient information
 * @param {object} caseData - Case information
 * @param {string} branchId - Branch ID for branch-specific email settings
 * @param {object} senderInfo - Currently logged-in user info (email, name)
 * @returns {Promise<object>} - Combined send result
 */
export async function sendNotifications(doctorData, patientData, caseData, branchId = null, senderInfo = null) {
  // Check if this is a report notification (single object with type)
  if (doctorData && doctorData.type === 'report') {
    return await sendReportNotification(doctorData);
  }
  
  // Otherwise, it's a DICOM notification (original behavior)
  const results = {
    doctor: null,
    patient: null,
    success: false,
    allSuccess: false
  };

  // Send to doctor
  if (doctorData && doctorData.doctorEmail) {
    results.doctor = await sendDoctorNotification(doctorData, patientData, caseData, branchId, senderInfo);
  }

  // Send to patient
  if (patientData && patientData.patientEmail) {
    results.patient = await sendPatientNotification(patientData, caseData, branchId);
  }

  // Determine overall success
  results.success = (results.doctor && results.doctor.success) || (results.patient && results.patient.success);
  results.allSuccess = (!results.doctor || results.doctor.success) && (!results.patient || results.patient.success);

  return results;
}

/**
 * Test email configuration
 * @param {string} testEmail - Email address to send test to
 * @param {string} branchId - Branch ID for branch-specific email settings
 * @returns {Promise<object>} - Test result
 */
export async function testEmailConfig(testEmail, branchId = null) {
  try {
    const transporter = await createTransporter(branchId);
    const orgSettings = await getOrganizationSettings(branchId);
    
    const mailOptions = {
      from: `"${orgSettings.name}" <${orgSettings.email || process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Test Email - Email Configuration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 48px; margin: 20px 0; }
            .info-box { background: #f0f7ff; padding: 15px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .logo { max-width: 200px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${orgSettings.logoUrl ? `<img src="${orgSettings.logoUrl}" alt="${orgSettings.name}" class="logo">` : ''}
              <h1>✅ Email Configuration Test</h1>
              <p>${orgSettings.name}</p>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <h2>Success!</h2>
              <p>If you're reading this, your email configuration is working correctly!</p>
              
              <div class="info-box">
                <p><strong>Test Details:</strong></p>
                <p>📧 Sent to: ${testEmail}</p>
                <p>🕐 Timestamp: ${new Date().toLocaleString()}</p>
                <p>🏥 Organization: ${orgSettings.name}</p>
                ${branchId ? `<p>🏢 Branch: ${branchId}</p>` : ''}
              </div>
              
              <p>Your email notifications are now ready to use. Patients and doctors will receive professional emails when scans are ready.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Email Configuration Test Successful!\n\nSent to: ${testEmail}\nTimestamp: ${new Date().toISOString()}\nOrganization: ${orgSettings.name}${branchId ? `\nBranch: ${branchId}` : ''}`
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    console.error('[Email Test] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  sendDoctorNotification,
  sendPatientNotification,
  sendNotifications,
  testEmailConfig
};


/**
 * Send report ready notification email to doctor
 * @param {object} data - Report notification data
 * @returns {Promise<object>} - Send result
 */
export async function sendReportNotification(data) {
  try {
    const { doctorEmail, doctorName, patientName, reportUrl, branchId, patientImageUrl, viewerLink } = data;
    
    const transporter = await createTransporter(branchId);
    const orgSettings = await getOrganizationSettings(branchId);

    if (!doctorEmail) throw new Error('Doctor email is required');
    if (!reportUrl) throw new Error('Report URL is required');

    const mailOptions = {
      from: `"${orgSettings.name}" <${orgSettings.email || process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject: `📄 Diagnostic Report Ready - Patient: ${patientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #80A84D 0%, #5e7d38 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #80A84D; border-radius: 5px; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #80A84D; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #80A84D 0%, #5e7d38 100%); color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .icon { font-size: 48px; margin-bottom: 15px; }
            .logo { max-width: 200px; margin-bottom: 15px; }
            .highlight { background: #f4f8ee; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .patient-img { max-width: 100%; border-radius: 8px; margin: 15px 0; border: 2px solid #80A84D; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${orgSettings.logoUrl ? `<img src="${orgSettings.logoUrl}" alt="${orgSettings.name}" class="logo">` : ''}
              <div class="icon">✅</div>
              <h1>Report Ready!</h1>
              <p>${orgSettings.name}</p>
            </div>
            <div class="content">
              <p>Dear Dr. ${doctorName},</p>
              <div class="highlight"><h2 style="margin:0;color:#80A84D">📄 Diagnostic report for ${patientName} is ready</h2></div>
              ${patientImageUrl ? `<div class="info-box"><h3 style="color:#80A84D;margin-top:0">🖼️ Patient Image</h3><img src="${patientImageUrl}" alt="Patient Image" class="patient-img" /></div>` : ''}
              <div style="text-align:center">
                ${viewerLink ? `<a href="${viewerLink}" class="button">🔍 View DICOM Scan</a>` : ''}
                <a href="${reportUrl}" class="button">📄 View Report</a>
              </div>
              <p style="margin-top:20px;font-size:13px;color:#666">This email contains all 3 stages: patient image, DICOM scan link, and diagnostic report.</p>
            </div>
            <div class="footer">
              <p>${orgSettings.name}${orgSettings.phone ? `<br>Phone: ${orgSettings.phone}` : ''}${orgSettings.email ? `<br>Email: ${orgSettings.email}` : ''}</p>
            </div>
          </div>
        </body>
        </html>`,
      text: `Dear Dr. ${doctorName},\n\nThe diagnostic report for ${patientName} is ready.\n\n${viewerLink ? `DICOM Viewer: ${viewerLink}\n` : ''}Report: ${reportUrl}\n\n${orgSettings.name}`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Report notification sent to doctor: ${doctorEmail}`);
    
    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      recipient: doctorEmail
    };
  } catch (error) {
    console.error('❌ Report notification failed:', error);
    return {
      success: false,
      error: error.message,
      sentAt: new Date().toISOString()
    };
  }
}
