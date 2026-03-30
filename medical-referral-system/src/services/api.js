// API Service - connects frontend to backend

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Upload DICOM file using Google Cloud Storage signed URLs (supports large files)
 * @param {File} file - The DICOM file to upload
 * @param {Object} patientData - Patient information
 * @param {Object} doctorData - Doctor information
 * @param {string} branchId - Branch ID
 * @param {string} caseId - Case ID
 * @param {Function} onProgress - Progress callback function (receives percentage 0-100)
 * @param {Object} diagnosticServices - Diagnostic services requested
 * @param {Object} reasonForReferral - Reason for referral
 * @param {string} clinicalNotes - Clinical notes
 * @returns {Promise<Object>} Upload result with viewer URL
 */
export const uploadDicomFile = async (file, patientData, doctorData, branchId, caseId, onProgress = null, diagnosticServices = null, reasonForReferral = null, clinicalNotes = '') => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 [UPLOAD START] uploadDicomFile called');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📁 File Info:', {
    fileName: file?.name,
    fileSize: `${(file?.size / 1024 / 1024).toFixed(2)} MB`,
    fileType: file?.type,
  });
  console.log('👤 Patient:', {
    name: patientData.patientName,
    id: patientData.patientId
  });
  console.log('👨‍⚕️ Doctor:', {
    name: doctorData.doctorName,
    hospital: doctorData.hospital
  });
  console.log('🏢 Branch ID:', branchId);
  console.log('📋 Case ID:', caseId);
  console.log('═══════════════════════════════════════════════════════');

  try {
    // Step 1: Get signed URL from backend
    console.log('\n📍 STEP 1: Requesting signed URL from backend...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    const signedUrlResponse = await fetch(`${API_BASE}/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branchId: branchId || '',
        caseId: caseId || '',
        filename: file.name,
        contentType: file.type || 'application/zip'
      })
    });

    console.log('✅ Step 1 Response Status:', signedUrlResponse.status);

    if (!signedUrlResponse.ok) {
      const error = await signedUrlResponse.text();
      console.error('❌ Step 1 FAILED:', error);
      throw new Error(`Failed to get signed URL: ${error}`);
    }

    const { uploadUrl, destination } = await signedUrlResponse.json();
    console.log('✅ Step 1 COMPLETE - Signed URL received');
    console.log('📦 Destination:', destination);
    console.log('═══════════════════════════════════════════════════════');

    // Step 2: Upload file directly to Google Cloud Storage (0-50% progress)
    console.log('\n📍 STEP 2: Uploading file to Google Cloud Storage...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📊 Progress will be mapped: 0-100% → 0-50% total');

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastLoggedPercent = 0;
      let progressHistory = []; // Track recent progress { time, loaded }

      // Track upload progress (map to 0-50% of total progress)
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const currentTime = Date.now();
          progressHistory.push({ time: currentTime, loaded: e.loaded });

          // Remove old data: keep a sliding window of the last 15 seconds
          while (progressHistory.length > 2 && (currentTime - progressHistory[0].time > 15000)) {
            progressHistory.shift();
          }

          let etaString = '';
          const oldestRecord = progressHistory[0];
          const timeElapsedInWindow = currentTime - oldestRecord.time;

          // Wait until we have at least 5 seconds of stable network data
          if (timeElapsedInWindow >= 5000 && e.loaded > 0) {
            // Calculate speed ONLY within the recent 15-second window
            // This ignores the massive initial browser/OS buffering burst
            const bytesLoadedInWindow = e.loaded - oldestRecord.loaded;
            const windowSpeed = bytesLoadedInWindow / timeElapsedInWindow; // Bytes per ms

            if (windowSpeed > 0) {
              const remainingBytes = e.total - e.loaded;
              const remainingMs = remainingBytes / windowSpeed;

              const remainingSeconds = Math.max(1, Math.round(remainingMs / 1000));

              if (remainingSeconds > 3600) {
                const hours = Math.floor(remainingSeconds / 3600);
                const mins = Math.floor((remainingSeconds % 3600) / 60);
                etaString = `~ ${hours}h ${mins}m left`;
              } else if (remainingSeconds > 60) {
                const mins = Math.floor(remainingSeconds / 60);
                const secs = remainingSeconds % 60;
                etaString = `~ ${mins}m ${secs}s left`;
              } else {
                etaString = `~ ${remainingSeconds}s left`;
              }
            }
          } else {
            etaString = 'Calculating time...';
          }

          const uploadPercent = Math.round((e.loaded / e.total) * 100);
          const totalPercent = Math.round(uploadPercent * 0.5); // 50% of total

          // Log every 10% to avoid spam
          if (uploadPercent % 10 === 0 && uploadPercent !== lastLoggedPercent) {
            console.log(`📤 Upload: ${uploadPercent}% (${(e.loaded / 1024 / 1024).toFixed(2)}MB / ${(e.total / 1024 / 1024).toFixed(2)}MB) → Total: ${totalPercent}%`);
            lastLoggedPercent = uploadPercent;
          }

          // We map to totalPercent but pass the etaString separately
          // The UI uses phaseText to show the ETA
          let phaseText = 'Uploading file...';
          if (etaString) {
            phaseText += ` (${etaString})`;
          }

          if (onProgress) {
            onProgress(totalPercent, phaseText);
          }
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        console.log('📥 XHR Load Event - Status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ Step 2 COMPLETE - GCS upload successful');
          console.log('⏰ Timestamp:', new Date().toISOString());
          if (onProgress) onProgress(50);
          console.log('═══════════════════════════════════════════════════════');
          resolve();
        } else {
          console.error('❌ Step 2 FAILED - GCS upload error');
          console.error('Status:', xhr.status);
          console.error('Response:', xhr.responseText);
          reject(new Error(`GCS upload failed: ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ Step 2 FAILED - Network error during GCS upload');
        console.error('⏰ Timestamp:', new Date().toISOString());
        reject(new Error('Network error during GCS upload'));
      });

      xhr.addEventListener('abort', () => {
        console.error('❌ Step 2 ABORTED - GCS upload was cancelled');
        console.error('⏰ Timestamp:', new Date().toISOString());
        reject(new Error('GCS upload aborted'));
      });

      // Send to GCS
      console.log('🚀 Initiating XHR PUT request to GCS...');
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/zip');
      xhr.send(file);
      console.log('📤 File sent to GCS, waiting for response...');
    });

    // Step 3: Notify backend to process the uploaded file (50-100% progress)
    console.log('\n📍 STEP 3: Backend processing DICOM file...');
    console.log('⏰ Start Timestamp:', new Date().toISOString());
    console.log('🔄 Starting full MPR polling loop! (50% → 100%)');

    console.log('📡 Sending process request to backend...');
    console.log('🔗 Endpoint:', `${API_BASE}/upload/process`);

    // We don't await this immediately so we can handle long generations > 5m
    const processPromise = fetch(`${API_BASE}/upload/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branchId: branchId || '',
        caseId: caseId || '',
        destination,
        patientName: patientData.patientName || '',
        patientId: patientData.patientId || '',
        patientEmail: patientData.emailAddress || '',
        doctorName: doctorData.doctorName || '',
        doctorEmail: doctorData.emailWhatsapp || doctorData.doctorEmail || '',
        doctorPhone: doctorData.doctorPhone || '',
        hospital: doctorData.hospital || '',
        diagnosticServices: diagnosticServices || {},
        reasonForReferral: reasonForReferral || {},
        clinicalNotes: clinicalNotes || ''
      })
    });

    let processResult = null;

    // Create a blocker promise that polls until MPR is fully ready from the async backend task
    await new Promise((resolve, reject) => {
      let processResolved = false;
      let processStartTime = Date.now();

      processPromise.then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          reject(new Error(`Processing failed: ${error}`));
        } else {
          processResult = await res.json();
          processResolved = true;
          processStartTime = Date.now(); // Reset start time when backend actually starts processing
          console.log('📥 Backend initial upload response received, now waiting for full 3D generation...');
        }
      }).catch(reject);

      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/upload/status/${caseId}?branchId=${branchId}`);
          if (res.ok) {
            const statusData = await res.json();

            if (statusData && statusData.mprProgress && statusData.mprProgress.total > 0) {
              const mpr = statusData.mprProgress;
              const mprPercent = (mpr.current / Math.max(1, mpr.total)) * 100;
              const mappedProgress = Math.round(50 + (mprPercent * 0.48)); // maps 50 to 98%

              let etaString = '';
              const currentTime = Date.now();
              const timeElapsedMs = currentTime - processStartTime;

              // Only start calculating after we've processed at least a few slices and some time has passed
              // (Backend might chunk results initially)
              if (mpr.current > 5 && timeElapsedMs > 3000) {
                const currentSpeed = mpr.current / timeElapsedMs; // slices / ms

                if (currentSpeed > 0) {
                  const remainingSlices = mpr.total - mpr.current;
                  const remainingMs = remainingSlices / currentSpeed;
                  const remainingSeconds = Math.max(1, Math.round(remainingMs / 1000));

                  if (remainingSeconds > 3600) {
                    const hours = Math.floor(remainingSeconds / 3600);
                    const mins = Math.floor((remainingSeconds % 3600) / 60);
                    etaString = ` (~ ${hours}h ${mins}m left)`;
                  } else if (remainingSeconds > 60) {
                    const mins = Math.floor(remainingSeconds / 60);
                    const secs = remainingSeconds % 60;
                    etaString = ` (~ ${mins}m ${secs}s left)`;
                  } else {
                    etaString = ` (~ ${remainingSeconds}s left)`;
                  }
                }
              } else if (timeElapsedMs <= 3000) {
                etaString = ' (Calculating time...)';
              }

              const phaseText = `${mpr.phase || 'Generating 3D Volume'}: ${mpr.current} / ${mpr.total}${etaString}`;

              if (onProgress) onProgress(mappedProgress, phaseText);
            } else if (statusData && statusData.mprStatus === 'processing') {
              if (onProgress) onProgress(50, 'Extracting 3D Voxel Memory...');
            }

            // CRITICAL: We only resolve the upload screen when MPR is fully constructed
            if (statusData && statusData.mprStatus === 'ready') {
              clearInterval(pollInterval);
              console.log('✅ 3D Volume generation completed on cloud!');
              if (onProgress) onProgress(100, '3D Volume Generation Complete!');
              resolve();
            } else if (statusData && statusData.mprStatus === 'error') {
              clearInterval(pollInterval);
              reject(new Error('Backend 3D Generation reported an error state'));
            } else if (processResolved && statusData && statusData.status === 'UNKNOWN') {
              // Fallback if the record is malformed but POST resolved
              clearInterval(pollInterval);
              resolve();
            }
          }
        } catch (err) {
          // Silent catch during polling network blips
        }
      }, 2000);
    });

    console.log('✅ Step 3 COMPLETE - Backend processing & MPR successful');
    console.log('📦 Result:', processResult);

    // We override result if necessary, though mprStatus lives on Firebase now.
    return processResult || { success: true };

  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [UPLOAD FAILED] Error occurred during upload');
    console.error('⏰ Error Timestamp:', new Date().toISOString());
    console.error('🔴 Error Type:', error.name);
    console.error('🔴 Error Message:', error.message);
    console.error('🔴 Error Stack:', error.stack);
    console.error('═══════════════════════════════════════════════════════\n');
    throw error;
  }
};

/**
 * Open DICOM files in OHIF viewer
 * @param {string} viewerUrl - The OHIF viewer URL with file parameters
 */
export const openInViewer = (viewerUrl) => {
  if (!viewerUrl) {
    console.error('[API] No viewer URL provided');
    return;
  }

  console.log('[API] Opening OHIF viewer:', viewerUrl);
  window.open(viewerUrl, '_blank');
};

/**
 * Upload multiple DICOM files
 * @param {File[]} files - Array of DICOM files
 * @param {Object} patientData - Patient information
 * @param {Object} doctorData - Doctor information
 * @returns {Promise<Object>} Upload results
 */
export const uploadMultipleDicomFiles = async (files, patientData, doctorData) => {
  const formData = new FormData();

  // Append all files
  files.forEach(file => {
    formData.append('files', file);
  });

  formData.append('patientName', patientData.patientName || '');
  formData.append('patientID', patientData.patientId || '');
  formData.append('patientPhone', patientData.phoneNumber || patientData.patientPhone || '');
  formData.append('doctorName', doctorData.doctorName || '');
  formData.append('hospital', doctorData.hospital || '');
  formData.append('doctorPhone', doctorData.doctorPhone || '');

  try {
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Multiple upload error:', error);
    throw error;
  }
};

/**
 * Check Orthanc server connection status
 */
export const checkOrthancStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/orthanc/status`);
    return await response.json();
  } catch (error) {
    console.error('[API] Orthanc status check failed:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Get all studies from Orthanc
 */
export const getOrthancStudies = async () => {
  try {
    const response = await fetch(`${API_BASE}/orthanc/studies`);
    return await response.json();
  } catch (error) {
    console.error('[API] Failed to get studies:', error);
    return [];
  }
};

/**
 * Get study details from Orthanc
 * @param {string} studyId - Orthanc study ID
 */
export const getStudyDetails = async (studyId) => {
  try {
    const response = await fetch(`${API_BASE}/orthanc/studies/${studyId}`);
    if (!response.ok) {
      throw new Error('Study not found');
    }
    return await response.json();
  } catch (error) {
    console.error('[API] Failed to get study details:', error);
    return null;
  }
};

/**
 * Get OHIF viewer URL for a study
 * @param {string} studyInstanceUID - DICOM StudyInstanceUID
 */
export const getViewerUrl = (studyInstanceUID) => {
  const ohifUrl = import.meta.env.VITE_OHIF_URL || 'http://localhost:3000';
  return `${ohifUrl}/viewer?StudyInstanceUIDs=${studyInstanceUID}`;
};

/**
 * Check backend health
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/`);
    return response.ok;
  } catch (error) {
    console.error('[API] Backend health check failed:', error);
    return false;
  }
};

/**
 * Email Integration Functions
 */

/**
 * Get email settings
 */
export const getEmailSettings = async () => {
  try {
    const response = await fetch(`${API_BASE}/email/settings`);
    return await response.json();
  } catch (error) {
    console.error('[API] Email settings fetch failed:', error);
    return { error: error.message };
  }
};

/**
 * Update email settings
 * @param {Object} settings - Email settings object
 */
export const updateEmailSettings = async (settings) => {
  try {
    const response = await fetch(`${API_BASE}/email/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update email settings');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Email settings update failed:', error);
    throw error;
  }
};

/**
 * Test email configuration
 * @param {string} email - Test email address
 */
export const testEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE}/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Email test failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Email test failed:', error);
    throw error;
  }
};

/**
 * Get email templates
 */
export const getEmailTemplates = async () => {
  try {
    const response = await fetch(`${API_BASE}/email/templates`);
    return await response.json();
  } catch (error) {
    console.error('[API] Email templates fetch failed:', error);
    return {};
  }
};

/**
 * Get specific email template
 * @param {string} templateType - Template type (DOCTOR_DICOM_READY, PATIENT_SCAN_COMPLETE)
 */
export const getEmailTemplate = async (templateType) => {
  try {
    const response = await fetch(`${API_BASE}/email/templates/${templateType}`);
    if (!response.ok) {
      throw new Error('Template not found');
    }
    return await response.json();
  } catch (error) {
    console.error('[API] Email template fetch failed:', error);
    throw error;
  }
};

/**
 * Update email template
 * @param {string} templateType - Template type
 * @param {Object} template - Template object with subject, html, text
 */
export const updateEmailTemplate = async (templateType, template) => {
  try {
    const response = await fetch(`${API_BASE}/email/templates/${templateType}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update template');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Email template update failed:', error);
    throw error;
  }
};

/**
 * Send DICOM ready email notification (patient + doctor)
 * @param {Object} doctorData - Doctor information
 * @param {Object} patientData - Patient information  
 * @param {Object} caseData - Case information with access token
 * @param {string} branchId - Branch ID for branch-specific email settings
 * @param {Object} senderInfo - Currently logged-in user info (email, name)
 */
export const sendEmailNotification = async (doctorData, patientData, caseData, branchId = null, senderInfo = null) => {
  try {
    const response = await fetch(`${API_BASE}/email/send-dicom-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorData,
        patientData,
        caseData,
        branchId,
        senderInfo
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email notification');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Email notification failed:', error);
    throw error;
  }
};

/**
 * Upload logo for email templates
 * @param {File} logoFile - Logo image file
 */
export const uploadLogo = async (logoFile) => {
  try {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await fetch(`${API_BASE}/email/upload-logo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload logo');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Logo upload failed:', error);
    throw error;
  }
};

/**
 * Check WhatsApp configuration status
 */
export const checkWhatsAppStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/whatsapp/status`);
    return await response.json();
  } catch (error) {
    console.error('[API] WhatsApp status check failed:', error);
    return { configured: false, error: error.message };
  }
};

/**
 * Test WhatsApp configuration
 * @param {string} phoneNumber - Test phone number
 */
export const testWhatsApp = async (phoneNumber) => {
  try {
    const response = await fetch(`${API_BASE}/whatsapp/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'WhatsApp test failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] WhatsApp test failed:', error);
    throw error;
  }
};

/**
 * Send DICOM ready notification (patient + doctor)
 * @param {Object} doctorData - Doctor information
 * @param {Object} patientData - Patient information  
 * @param {Object} caseData - Case information with access token
 */
export const sendDicomNotification = async (doctorData, patientData, caseData) => {
  try {
    const response = await fetch(`${API_BASE}/whatsapp/send-dicom-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorData,
        patientData,
        caseData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send DICOM notification');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] DICOM notification failed:', error);
    throw error;
  }
};

/**
 * Send report ready notification (doctor only)
 * @param {Object} doctorData - Doctor information
 * @param {Object} patientData - Patient information
 * @param {Object} caseData - Case information with access token
 */
export const sendReportNotification = async (doctorData, patientData, caseData) => {
  try {
    const response = await fetch(`${API_BASE}/whatsapp/send-report-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctorData,
        patientData,
        caseData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send report notification');
    }

    return await response.json();
  } catch (error) {
    console.error('[API] Report notification failed:', error);
    throw error;
  }
};

export default {
  uploadDicomFile,
  uploadMultipleDicomFiles,
  checkOrthancStatus,
  getOrthancStudies,
  getStudyDetails,
  getViewerUrl,
  checkBackendHealth,
  openInViewer,
  // Email functions
  getEmailSettings,
  updateEmailSettings,
  testEmail,
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  sendEmailNotification,
  uploadLogo,
  // WhatsApp functions
  checkWhatsAppStatus,
  testWhatsApp,
  sendDicomNotification,
  sendReportNotification,
};


/**
 * Upload PDF report and send notification
 * @param {string} formId - Form ID
 * @param {File} reportFile - PDF file
 * @param {Object} formData - Form data with patient and doctor info
 * @param {string} branchId - Branch ID
 * @returns {Promise<Object>} Upload result
 */
export const uploadReport = async (formId, reportFile, formData, branchId, isReplacement = false) => {
  try {
    console.log('[API] uploadReport called:', { formId, fileName: reportFile.name, branchId, isReplacement });

    const formDataObj = new FormData();
    formDataObj.append('reportFile', reportFile);
    formDataObj.append('formId', formId);
    formDataObj.append('branchId', branchId);
    formDataObj.append('patientName', formData.patient?.patientName || '');
    formDataObj.append('patientId', formData.patient?.patientId || '');
    formDataObj.append('doctorEmail', formData.doctor?.emailWhatsapp || '');
    formDataObj.append('doctorName', formData.doctor?.doctorName || '');
    formDataObj.append('isReplacement', isReplacement.toString());

    const response = await fetch(`${API_BASE}/upload/upload-report`, {
      method: 'POST',
      body: formDataObj
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Report upload failed');
    }

    const result = await response.json();
    console.log('[API] Report upload successful:', result);

    return result;
  } catch (error) {
    console.error('[API] Report upload error:', error);
    throw error;
  }
};

/**
 * Upload patient image (Stage 1) and send email to doctor
 * @param {string} formId - Case/Form ID
 * @param {File} imageFile - Image file (jpg/png)
 * @param {Object} formData - Full form data
 * @param {string} branchId - Branch ID
 * @returns {Promise<Object>} Upload result with imageUrl
 */
export const uploadPatientImage = async (formId, imageFile, formData, branchId) => {
  try {
    console.log('[API] uploadPatientImage called:', { formId, fileName: imageFile.name, branchId });

    const fd = new FormData();
    fd.append('patientImage', imageFile);
    fd.append('formId', formId);
    fd.append('branchId', branchId);
    fd.append('patientName', formData.patient?.patientName || '');
    fd.append('patientId', formData.patient?.patientId || '');
    fd.append('doctorEmail', formData.doctor?.emailWhatsapp || '');
    fd.append('doctorName', formData.doctor?.doctorName || '');
    fd.append('hospital', formData.doctor?.hospital || '');
    fd.append('clinicalNotes', formData.clinicalNotes || '');

    const response = await fetch(`${API_BASE}/upload/patient-image`, {
      method: 'POST',
      body: fd
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Patient image upload failed');
    }

    const result = await response.json();
    console.log('[API] Patient image upload successful:', result);
    return result;
  } catch (error) {
    console.error('[API] Patient image upload error:', error);
    throw error;
  }
};
