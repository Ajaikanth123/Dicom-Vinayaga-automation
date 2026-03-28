import { useState, useEffect, useRef } from 'react';
import './NotificationModal.css';
import { sendEmailNotification, sendDicomNotification, sendReportNotification } from '../../services/api';
import { sendScanUploadedNotification, sendBothUploadedNotification, sendOnlyReportNotification, buildDiagnosticServicesText, buildReasonForReferralText } from '../../services/watiService';
import { useAuth } from '../../context/AuthContext';

// Channel Types
export const CHANNELS = {
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL'
};

// Message Types
export const MESSAGE_TYPES = {
  INITIAL_SEND: 'INITIAL_SEND',
  REPORT_UPDATE: 'REPORT_UPDATE',
  REPORT_REPLACED: 'REPORT_REPLACED'
};

// Status Types
export const CHANNEL_STATUS = {
  NOT_SENT: 'NOT_SENT',
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

// Mask phone/email for privacy
const maskPhone = (phone) => {
  if (!phone) return '••••••••••';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '••••••••••';
  return '••••••' + cleaned.slice(-4);
};

const maskEmail = (email) => {
  if (!email) return '••••@••••.com';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '••••@••••.com';
  const maskedLocal = local.length > 2 ? local[0] + '•••' + local.slice(-1) : '••';
  return `${maskedLocal}@${domain}`;
};

const maskSecureLink = (link) => {
  if (!link) return 'http://localhost:3000/viewer?StudyInstanceUIDs=••••••••';

  // Handle local OHIF viewer URLs
  if (link.includes('localhost:3000/viewer')) {
    const parts = link.split('StudyInstanceUIDs=');
    if (parts.length > 1) {
      const uid = parts[1];
      if (uid.length > 10) {
        return `http://localhost:3000/viewer?StudyInstanceUIDs=${uid.slice(0, 6)}••••${uid.slice(-4)}`;
      }
    }
    return link;
  }

  // Handle production secure case URLs
  const parts = link.split('/');
  const token = parts[parts.length - 1];
  if (token.length > 6) {
    return link.replace(token, token.slice(0, 4) + '••••' + token.slice(-2));
  }
  return link;
};

const NotificationModal = ({
  isOpen,
  onClose,
  patient,
  branchName,
  onSend,
  messageType = MESSAGE_TYPES.INITIAL_SEND,
  notificationStatus = {},
  retryChannel = null,
  hasReportFile = false
}) => {
  const { currentUser, userData } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [channelResults, setChannelResults] = useState({
    whatsapp: { status: null, error: null },
    email: { status: null, error: null }
  });
  const [enabledChannels, setEnabledChannels] = useState({
    whatsapp: true,
    email: true
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState('error'); // 'error', 'warning', 'success'
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const isRetryMode = !!retryChannel;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSending(false);
      setChannelResults({
        whatsapp: { status: null, error: null },
        email: { status: null, error: null }
      });
      setAlertMessage(null);
      setAlertType('error');
      setIsComplete(false);

      if (retryChannel) {
        setEnabledChannels({
          whatsapp: retryChannel === 'whatsapp',
          email: retryChannel === 'email'
        });
      } else {
        // ALWAYS enable channels by default if the doctor information is available
        // User requested ability to share multiple times without restriction
        setEnabledChannels({
          whatsapp: true,
          email: true
        });
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen, retryChannel, messageType, notificationStatus?.whatsapp, notificationStatus?.email]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Auto-close after full success
  useEffect(() => {
    if (isComplete && alertType === 'success') {
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && onCloseRef.current) {
          onCloseRef.current();
        }
      }, 2000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isComplete, alertType]);

  if (!isOpen || !patient) return null;

  // Patient info
  const patientName = patient.patient?.patientName || 'Unknown';
  const patientId = patient.patient?.patientId || 'N/A';
  const patientPhone = patient.patient?.phoneNumber || '';
  const patientEmail = patient.patient?.email || '';

  // Doctor info - SINGLE SOURCE OF TRUTH
  const doctorName = patient.doctor?.doctorName || 'Doctor';
  const doctorPhone = patient.doctor?.doctorPhone || '';
  const doctorEmail = patient.doctor?.emailWhatsapp || '';

  const scanDate = patient.patient?.date || new Date().toLocaleDateString('en-IN');

  // Generate viewer link - use local OHIF viewer with StudyInstanceUID
  const studyInstanceUID = patient.orthancData?.studyInstanceUID || patient.orthancData?.parentStudy;
  const secureLink = studyInstanceUID
    ? `http://localhost:3000/viewer?StudyInstanceUIDs=${studyInstanceUID}`
    : patient.caseTracking?.secureLink ||
    `https://dicom.anbu-dental.com/case/${patient.id?.slice(0, 8) || 'xxxxxxxx'}`;

  const isInitialSend = messageType === MESSAGE_TYPES.INITIAL_SEND;
  const isReportUpdate = messageType === MESSAGE_TYPES.REPORT_UPDATE;
  const isReportReplaced = messageType === MESSAGE_TYPES.REPORT_REPLACED;

  // Check if report notification was already sent
  const reportNotificationSent = patient?.notificationStatus === 'REPORT_SENT';

  const hasDoctorPhone = doctorPhone && /^\d{10}$/.test(doctorPhone);
  const hasDoctorEmail = doctorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorEmail);

  const handleClose = () => {
    if (isSending) return;
    onClose();
  };

  const toggleChannel = (channel) => {
    if (isSending || isComplete) return;
    setEnabledChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  };

  const clearAlert = () => {
    setAlertMessage(null);
  };

  // Generate messages
  const getPatientMessage = () => `Dear ${patientName},

Your scan has been completed at ${branchName}.

Your DICOM images are ready. A secure viewing link has been sent to your referring doctor, Dr. ${doctorName}.

The doctor will contact you soon.

Thank you for choosing Vinayaga Automation.`;

  const getDoctorDicomMessage = () => `Dear Dr. ${doctorName},

New patient scan available.

Patient: ${patientName}
Patient ID: ${patientId}
Branch: ${branchName}
Date: ${scanDate}

View DICOM images: ${secureLink}

Report will be uploaded separately.

- Vinayaga Automation`;

  const getDoctorReportMessage = () => `Dear Dr. ${doctorName},

The diagnostic report for your referred patient has been added.

Patient: ${patientName}
Patient ID: ${patientId}
Date: ${new Date().toLocaleDateString('en-IN')}

Please access the report and DICOM images using the same secure link below:
${secureLink}

- Vinayaga Automation`;

  const getDoctorReportReplacedMessage = () => `Dear Dr. ${doctorName},

The diagnostic report for your referred patient has been UPDATED with a new version.

Patient: ${patientName}
Patient ID: ${patientId}
Updated: ${new Date().toLocaleDateString('en-IN')}

Please access the updated report and DICOM images using the same secure link below:
${secureLink}

- Vinayaga Automation`;


  // Build channel-specific error message
  const buildErrorMessage = (whatsappFailed, emailFailed, whatsappError, emailError) => {
    if (whatsappFailed && emailFailed) {
      return {
        message: 'WhatsApp and Email notifications failed. You can retry individually.',
        details: [
          whatsappError && `WhatsApp: ${whatsappError}`,
          emailError && `Email: ${emailError}`
        ].filter(Boolean)
      };
    } else if (whatsappFailed) {
      return {
        message: 'WhatsApp notification failed. You can retry WhatsApp.',
        details: whatsappError ? [`WhatsApp: ${whatsappError}`] : []
      };
    } else if (emailFailed) {
      return {
        message: 'Email notification failed. You can retry Email.',
        details: emailError ? [`Email: ${emailError}`] : []
      };
    }
    return null;
  };

  const handleSend = async () => {
    if (isSending || isComplete) return;

    // DEBUG: Log validation state
    console.log('[NotificationModal] handleSend called', {
      isReportUpdate,
      hasReportFile,
      secureLink,
      doctorPhone,
      doctorEmail,
      hasDoctorPhone,
      hasDoctorEmail,
      enabledChannels
    });

    // VALIDATION 1: Report file check (for REPORT_UPDATE and REPORT_REPLACED only)
    if ((isReportUpdate || isReportReplaced) && !hasReportFile) {
      console.log('[NotificationModal] VALIDATION FAILED: Report file missing');
      setAlertMessage({
        message: 'Cannot send report update: Report file not uploaded.',
        details: ['Please upload the diagnostic report first.']
      });
      setAlertType('error');
      return;
    }

    // VALIDATION 2: Secure link check
    if (!secureLink) {
      console.log('[NotificationModal] VALIDATION FAILED: Secure link missing');
      setAlertMessage({
        message: 'Cannot send notification: Secure case link is missing.',
        details: ['Please contact support - case link generation failed.']
      });
      setAlertType('error');
      return;
    }

    // VALIDATION 3: At least one channel enabled
    if (!enabledChannels.whatsapp && !enabledChannels.email) {
      console.log('[NotificationModal] VALIDATION FAILED: No channels enabled');
      setAlertMessage({ message: 'Please enable at least one notification channel.', details: [] });
      setAlertType('error');
      return;
    }

    // VALIDATION 4: Check if enabled channels have valid contact info
    const canSendWhatsApp = enabledChannels.whatsapp && hasDoctorPhone;
    const canSendEmail = enabledChannels.email && hasDoctorEmail;

    if (enabledChannels.whatsapp && !hasDoctorPhone) {
      console.log('[NotificationModal] VALIDATION FAILED: WhatsApp enabled but no valid phone');
      setAlertMessage({
        message: 'Cannot send WhatsApp: Doctor phone number is missing or invalid.',
        details: ['Phone must be 10 digits. Please edit the referral form.']
      });
      setAlertType('error');
      return;
    }

    if (enabledChannels.email && !hasDoctorEmail) {
      console.log('[NotificationModal] VALIDATION FAILED: Email enabled but no valid email');
      setAlertMessage({
        message: 'Cannot send Email: Doctor email is missing or invalid.',
        details: ['Please edit the referral form to add a valid email.']
      });
      setAlertType('error');
      return;
    }

    // All validations passed - start sending
    console.log('[NotificationModal] All validations passed, starting send', { canSendWhatsApp, canSendEmail });

    setIsSending(true);
    setAlertMessage(null);
    setChannelResults({
      whatsapp: { status: canSendWhatsApp ? 'pending' : null, error: null },
      email: { status: canSendEmail ? 'pending' : null, error: null }
    });

    const results = {
      whatsapp: { status: CHANNEL_STATUS.NOT_SENT, error: null },
      email: { status: CHANNEL_STATUS.NOT_SENT, error: null }
    };
    const auditLog = [];

    // Build array of send promises
    const sendPromises = [];

    // Prepare data for API calls
    const doctorData = {
      doctorName: doctorName,
      doctorEmail: doctorEmail,
      doctorPhone: doctorPhone,
      hospital: patient.doctor?.hospital || branchName
    };

    const patientData = {
      patientName: patientName,
      patientId: patientId,
      patientEmail: patientEmail,
      patientPhone: patientPhone
    };

    const caseData = {
      viewerLink: secureLink,
      scanDate: scanDate,
      caseId: patient.id
    };

    // WhatsApp send promise - WATI Direct API Call
    if (canSendWhatsApp) {
      setChannelResults(prev => ({ ...prev, whatsapp: { status: 'sending', error: null } }));

      const whatsappPromise = (async () => {
        try {
          console.log('[NotificationModal] Sending WhatsApp notification via WATI API');

          // Build viewer URL from patient form ID
          const viewerUrl = `https://nice4-d7886.web.app/viewer/${patient.id}`;

          // Determine study type from diagnostic services
          const diagnosticServices = patient.diagnosticServices || patient.patient?.diagnosticServices || {};
          const studyType = Object.entries(diagnosticServices)
            .filter(([, v]) => v)
            .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim())
            .join(', ') || 'DICOM Scan';

          // Build diagnostic services and reason for referral text
          const diagnosticServicesText = buildDiagnosticServicesText(patient.diagnosticServices || patient.patient?.diagnosticServices);
          const reasonForReferralText = buildReasonForReferralText(patient.reasonForReferral || patient.patient?.reasonForReferral);

          // Get report URL if available
          const reportUrl = patient.patient?.diagnosticReport?.reportUrl || '';

          const watiParams = {
            doctorName: doctorName,
            doctorPhone: doctorPhone,
            patientName: patientName,
            patientId: patientId,
            studyType: studyType,
            diagnosticServicesText: diagnosticServicesText,
            reasonForReferralText: reasonForReferralText,
            viewerUrl: viewerUrl,
          };

          let result;
          if (isReportUpdate || isReportReplaced) {
            // Both DICOM + Report exist → use both_dicom_and_report_uploaded template
            result = await sendBothUploadedNotification({ ...watiParams, reportUrl });
          } else {
            // Only DICOM uploaded → use only_dicom_uploaded template
            result = await sendScanUploadedNotification(watiParams);
          }

          console.log('[NotificationModal] WATI API result:', result);

          if (result.success) {
            return { channel: 'whatsapp', status: 'sent', result };
          } else {
            throw new Error(result.error || 'WhatsApp send failed');
          }
        } catch (error) {
          console.error('[NotificationModal] WATI API error:', error);
          throw { channel: 'whatsapp', error: error.message || 'WhatsApp API unavailable' };
        }
      })();

      sendPromises.push({ channel: 'whatsapp', promise: whatsappPromise });
    }

    // Email send promise - REAL API CALL
    if (canSendEmail) {
      setChannelResults(prev => ({ ...prev, email: { status: 'sending', error: null } }));

      const emailPromise = (async () => {
        try {
          console.log('[NotificationModal] Sending Email notification via API');

          // Prepare sender info from currently logged-in user
          const senderInfo = currentUser ? {
            email: currentUser.email,
            name: userData?.name || currentUser.email?.split('@')[0] || 'Staff'
          } : null;

          const result = await sendEmailNotification(doctorData, patientData, caseData, patient.branchId, senderInfo);

          console.log('[NotificationModal] Email API result:', result);

          if (result.success || result.doctorResult?.success) {
            return { channel: 'email', status: 'sent', result };
          } else {
            throw new Error(result.error || result.doctorResult?.error || 'Email send failed');
          }
        } catch (error) {
          console.error('[NotificationModal] Email API error:', error);
          throw { channel: 'email', error: error.message || 'Email service unavailable' };
        }
      })();

      sendPromises.push({ channel: 'email', promise: emailPromise });
    }

    // Use Promise.allSettled to handle all channels independently
    const settledResults = await Promise.allSettled(sendPromises.map(p => p.promise));

    console.log('[NotificationModal] Promise.allSettled results:', settledResults);

    // Process results for each channel
    settledResults.forEach((result, index) => {
      const channelInfo = sendPromises[index];
      const channel = channelInfo.channel;

      if (result.status === 'fulfilled') {
        // Channel succeeded
        results[channel].status = CHANNEL_STATUS.SENT;
        results[channel].error = null;

        auditLog.push({
          channel: channel.toUpperCase(),
          recipient: 'doctor',
          recipientName: doctorName,
          ...(channel === 'whatsapp' ? { phone: doctorPhone } : { email: doctorEmail }),
          timestamp: new Date().toISOString(),
          status: 'SENT'
        });

        if (isMountedRef.current) {
          setChannelResults(prev => ({
            ...prev,
            [channel]: { status: 'sent', error: null }
          }));
        }
      } else {
        // Channel failed
        const errorMsg = result.reason?.error || 'Send failed';
        results[channel].status = CHANNEL_STATUS.FAILED;
        results[channel].error = errorMsg;

        auditLog.push({
          channel: channel.toUpperCase(),
          recipient: 'doctor',
          recipientName: doctorName,
          ...(channel === 'whatsapp' ? { phone: doctorPhone } : { email: doctorEmail }),
          timestamp: new Date().toISOString(),
          status: 'FAILED',
          error: errorMsg
        });

        if (isMountedRef.current) {
          setChannelResults(prev => ({
            ...prev,
            [channel]: { status: 'failed', error: errorMsg }
          }));
        }
      }
    });

    // Determine overall success state
    const whatsappOk = !canSendWhatsApp || results.whatsapp.status === CHANNEL_STATUS.SENT;
    const emailOk = !canSendEmail || results.email.status === CHANNEL_STATUS.SENT;
    const anySuccess = results.whatsapp.status === CHANNEL_STATUS.SENT || results.email.status === CHANNEL_STATUS.SENT;
    const allSuccess = whatsappOk && emailOk;
    const allFailed = (canSendWhatsApp && results.whatsapp.status === CHANNEL_STATUS.FAILED) &&
      (canSendEmail && results.email.status === CHANNEL_STATUS.FAILED);

    console.log('[NotificationModal] Final status:', {
      whatsappOk, emailOk, anySuccess, allSuccess, allFailed,
      whatsappStatus: results.whatsapp.status,
      emailStatus: results.email.status
    });

    if (isMountedRef.current) {
      // CRITICAL: Stop loading immediately
      setIsSending(false);
      setIsComplete(true);

      if (allSuccess) {
        setAlertType('success');
        setAlertMessage({
          message: isRetryMode
            ? `${retryChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} notification sent successfully!`
            : (isReportUpdate
              ? 'Report update sent successfully to doctor!'
              : 'All notifications sent successfully!'),
          details: []
        });
      } else if (anySuccess) {
        // Partial success - show warning with details
        const whatsappFailed = canSendWhatsApp && results.whatsapp.status === CHANNEL_STATUS.FAILED;
        const emailFailed = canSendEmail && results.email.status === CHANNEL_STATUS.FAILED;

        const errorInfo = buildErrorMessage(
          whatsappFailed,
          emailFailed,
          results.whatsapp.error,
          results.email.error
        );

        setAlertType('warning');
        setAlertMessage({
          message: errorInfo?.message || 'Some notifications sent successfully.',
          details: errorInfo?.details || []
        });
      } else {
        // All failed
        const whatsappFailed = canSendWhatsApp && results.whatsapp.status === CHANNEL_STATUS.FAILED;
        const emailFailed = canSendEmail && results.email.status === CHANNEL_STATUS.FAILED;

        const errorInfo = buildErrorMessage(
          whatsappFailed,
          emailFailed,
          results.whatsapp.error,
          results.email.error
        );

        setAlertType('error');
        setAlertMessage(errorInfo || {
          message: 'All notification channels failed. Please retry.',
          details: []
        });
      }

      // ALWAYS call onSend to persist results (even on failure)
      console.log('[NotificationModal] Calling onSend with results');
      onSend({
        success: anySuccess,
        allSuccess,
        sentAt: new Date().toISOString(),
        patientId: patient.id,
        messageType,
        results,
        auditLog,
        channelStatus: {
          whatsapp: results.whatsapp.status,
          whatsappError: results.whatsapp.error,
          email: results.email.status,
          emailError: results.email.error
        }
      });
    }
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <span className="status-icon success">✓</span>;
      case 'failed': return <span className="status-icon failed">✕</span>;
      case 'sending':
      case 'pending': return <span className="status-icon sending">⟳</span>;
      default: return <span className="status-icon pending">○</span>;
    }
  };

  // Check if we can retry (has failures and not currently sending)
  const canRetry = isComplete && !isSending && alertType !== 'success';

  return (
    <div className="notification-modal-overlay" onClick={handleClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`notification-modal-header ${isRetryMode ? 'retry-mode' : ''}`}>
          <div className="header-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              {isRetryMode ? (
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              ) : (
                <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              )}
            </svg>
          </div>
          <div className="header-text">
            <h2>
              {isRetryMode
                ? `Retry ${retryChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}`
                : (isInitialSend ? 'Send DICOM Notification' : 'Send Report Update')
              }
            </h2>
            <p>
              {isRetryMode
                ? `Re-sending failed ${retryChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} notification`
                : (isInitialSend
                  ? 'Notify Patient & Doctor'
                  : 'Notify doctor that the report has been added to the existing case link')
              }
            </p>
          </div>
          <button className="close-btn" onClick={handleClose} disabled={isSending}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Already Sent Badge for Report Update */}
        {isReportUpdate && reportNotificationSent && !isRetryMode && (
          <div className="inline-alert alert-success">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div className="alert-content">
              <span className="alert-message">Report notification already sent to doctor</span>
            </div>
          </div>
        )}

        {/* Report File Missing Warning */}
        {isReportUpdate && !hasReportFile && !reportNotificationSent && (
          <div className="inline-alert alert-warning">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </div>
            <div className="alert-content">
              <span className="alert-message">Report file not uploaded. Please upload the report first.</span>
            </div>
          </div>
        )}

        {/* Inline Alert - Stays visible until resolved */}
        {alertMessage && (
          <div className={`inline-alert alert-${alertType}`}>
            <div className="alert-icon">
              {alertType === 'success' ? (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : alertType === 'warning' ? (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              )}
            </div>
            <div className="alert-content">
              <span className="alert-message">{alertMessage.message}</span>
              {alertMessage.details && alertMessage.details.length > 0 && (
                <ul className="alert-details">
                  {alertMessage.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
            {alertType !== 'success' && (
              <button className="alert-dismiss" onClick={clearAlert} title="Dismiss">×</button>
            )}
          </div>
        )}

        {/* Channel Toggles */}
        {!isRetryMode && !isComplete && (
          <div className="channel-toggles">
            <label className={`channel-toggle ${enabledChannels.whatsapp ? 'active' : ''} ${!hasDoctorPhone ? 'invalid' : ''}`}>
              <input
                type="checkbox"
                checked={enabledChannels.whatsapp}
                onChange={() => toggleChannel('whatsapp')}
                disabled={isSending || (!isReportUpdate && notificationStatus?.whatsapp === CHANNEL_STATUS.SENT) || !hasDoctorPhone}
              />
              <span className="toggle-icon whatsapp">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <span className="toggle-label">WhatsApp</span>
              {!isReportUpdate && notificationStatus?.whatsapp === CHANNEL_STATUS.SENT ? (
                <span className="already-sent">✓ Sent</span>
              ) : !hasDoctorPhone ? (
                <span className="missing-info">No phone</span>
              ) : null}
            </label>

            <label className={`channel-toggle ${enabledChannels.email ? 'active' : ''} ${!hasDoctorEmail ? 'invalid' : ''}`}>
              <input
                type="checkbox"
                checked={enabledChannels.email}
                onChange={() => toggleChannel('email')}
                disabled={isSending || (!isReportUpdate && notificationStatus?.email === CHANNEL_STATUS.SENT) || !hasDoctorEmail}
              />
              <span className="toggle-icon email">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </span>
              <span className="toggle-label">Email</span>
              {!isReportUpdate && notificationStatus?.email === CHANNEL_STATUS.SENT ? (
                <span className="already-sent">✓ Sent</span>
              ) : !hasDoctorEmail ? (
                <span className="missing-info">No email</span>
              ) : null}
            </label>
          </div>
        )}

        {/* Retry Mode Info Banner */}
        {isRetryMode && !isComplete && (
          <div className="retry-info-banner">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            <span>Retrying {retryChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} only. Other channels unaffected.</span>
          </div>
        )}


        <div className="notification-modal-body">
          <div className={`preview-grid ${isInitialSend && !isRetryMode ? 'dual' : 'single'}`}>
            {/* Doctor Only for Report Update - WhatsApp Preview */}
            {enabledChannels.whatsapp && (
              <div className={`preview-section whatsapp-section ${channelResults.whatsapp.status === 'failed' ? 'has-error' : ''}`}>
                <div className="section-header">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  <span>WhatsApp</span>
                  {channelResults.whatsapp.status && getStatusIcon(channelResults.whatsapp.status)}
                </div>

                <div className="recipient-card">
                  <div className="recipient-header">
                    <span className="recipient-type">👨‍⚕️ Doctor</span>
                  </div>
                  <div className="recipient-info">
                    <span className="recipient-name">Dr. {doctorName}</span>
                    <span className="recipient-contact">{maskPhone(doctorPhone)}</span>
                  </div>
                  <div className="message-preview">
                    <pre>{isInitialSend ? getDoctorDicomMessage() : (isReportReplaced ? getDoctorReportReplacedMessage() : getDoctorReportMessage())}</pre>
                  </div>
                </div>

                {channelResults.whatsapp.error && (
                  <div className="channel-error">
                    <span>⚠️ {channelResults.whatsapp.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Email Preview */}
            {enabledChannels.email && (
              <div className={`preview-section email-section ${channelResults.email.status === 'failed' ? 'has-error' : ''}`}>
                <div className="section-header">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span>Email</span>
                  {channelResults.email.status && getStatusIcon(channelResults.email.status)}
                </div>

                <div className="recipient-card">
                  <div className="recipient-header">
                    <span className="recipient-type">👨‍⚕️ Doctor</span>
                  </div>
                  <div className="recipient-info">
                    <span className="recipient-name">Dr. {doctorName}</span>
                    <span className="recipient-contact">{maskEmail(doctorEmail)}</span>
                  </div>
                  <div className="email-subject">
                    <strong>Subject:</strong> {isInitialSend
                      ? `New Patient Scan - ${patientName} (${patientId})`
                      : `Report Added - ${patientName} (${patientId})`}
                  </div>
                </div>

                {channelResults.email.error && (
                  <div className="channel-error">
                    <span>⚠️ {channelResults.email.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Secure Link Info */}
          <div className="secure-link-info">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <span>Secure Link: <code>{maskSecureLink(secureLink)}</code></span>
          </div>
        </div>

        {/* Footer */}
        <div className="notification-modal-footer">
          <button className="cancel-btn" onClick={handleClose} disabled={isSending}>
            {isComplete && alertType === 'success' ? 'Close' : 'Cancel'}
          </button>

          {/* Already Sent State for Report Update */}
          {isReportUpdate && reportNotificationSent && !isRetryMode ? (
            <button className="send-btn success" disabled>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Already Sent
            </button>
          ) : !isComplete ? (
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={isSending || (!enabledChannels.whatsapp && !enabledChannels.email) || (isReportUpdate && !hasReportFile)}
            >
              {isSending ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    {isRetryMode ? (
                      <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    ) : (
                      <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    )}
                  </svg>
                  {isRetryMode ? 'Retry Send' : 'Send Notifications'}
                </>
              )}
            </button>
          ) : alertType === 'success' ? (
            <button className="send-btn success" disabled>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Sent ✓
            </button>
          ) : (
            <button className="send-btn retry" onClick={handleSend} disabled={isSending}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
              Retry Failed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
