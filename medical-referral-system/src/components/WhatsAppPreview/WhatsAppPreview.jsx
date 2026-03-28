import { useState, useEffect, useRef } from 'react';
import './WhatsAppPreview.css';

// Message Types
export const MESSAGE_TYPES = {
  INITIAL_SEND: 'INITIAL_SEND',        // Patient + Doctor (DICOM ready)
  REPORT_UPDATE: 'REPORT_UPDATE'       // Doctor only (Report ready)
};

// Notification Status
export const NOTIFICATION_STATUS = {
  NOT_SENT: 'NOT_SENT',
  INITIAL_SENT: 'INITIAL_SENT',
  REPORT_SENT: 'REPORT_SENT'
};

// Send States
const SEND_STATES = {
  IDLE: 'IDLE',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

// API Timeout (10 seconds)
const API_TIMEOUT = 10000;

// Mask phone number for privacy
const maskPhone = (phone) => {
  if (!phone) return '••••••••••';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '••••••••••';
  return '••••••' + cleaned.slice(-4);
};

// Mask secure link for display
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

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const WhatsAppPreview = ({
  isOpen,
  onClose,
  patient,
  branchName,
  onSend,
  messageType = MESSAGE_TYPES.INITIAL_SEND,
  lastSentAt = null
}) => {
  const [sendState, setSendState] = useState(SEND_STATES.IDLE);
  const [sendStatus, setSendStatus] = useState({ patient: null, doctor: null });
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSendState(SEND_STATES.IDLE);
      setSendStatus({ patient: null, doctor: null });
      setError(null);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Auto-close after success
  useEffect(() => {
    if (sendState === SEND_STATES.SUCCESS) {
      timeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onClose();
        }
      }, 2000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sendState, onClose]);

  if (!isOpen || !patient) return null;

  const patientName = patient.patient?.patientName || 'Unknown';
  const patientId = patient.patient?.patientId || 'N/A';
  const patientPhone = patient.patient?.phoneNumber || '';
  const doctorName = patient.doctor?.doctorName || 'Doctor';
  const doctorPhone = patient.doctor?.doctorPhone || '';
  const scanDate = patient.patient?.date || new Date().toLocaleDateString('en-IN');

  // Generate viewer link - use local OHIF viewer with StudyInstanceUID
  const studyInstanceUID = patient.orthancData?.parentStudy;
  const secureLink = studyInstanceUID
    ? `http://localhost:3000/viewer?StudyInstanceUIDs=${studyInstanceUID}`
    : patient.caseTracking?.secureLink ||
    `https://dicom.anbu-dental.com/case/${patient.id?.slice(0, 8) || 'xxxxxxxx'}`;

  const isInitialSend = messageType === MESSAGE_TYPES.INITIAL_SEND;
  const isReportUpdate = messageType === MESSAGE_TYPES.REPORT_UPDATE;

  // Prevent close while sending
  const handleClose = () => {
    if (sendState === SEND_STATES.SENDING) return;
    setSendState(SEND_STATES.IDLE);
    setSendStatus({ patient: null, doctor: null });
    setError(null);
    onClose();
  };

  // Generate Patient Message (Initial Send only)
  const getPatientMessage = () => {
    return `Dear ${patientName},

Your scan has been completed at ${branchName}.

Your DICOM images are ready.

A secure viewing link has been sent to your referring doctor, Dr. ${doctorName}.

The doctor will contact you soon.

For any queries, please contact our clinic.

Thank you for choosing Vinayaga Automation.`;
  };

  // Generate Doctor Message (Initial Send - DICOM Ready)
  const getDoctorDicomMessage = () => {
    return `Dear Dr. ${doctorName},

New patient scan available.

📋 Patient Details:
• Name: ${patientName}
• Patient ID: ${patientId}
• Branch: ${branchName}
• Date: ${scanDate}

🔗 View DICOM images using the link below:
${secureLink}

Report will be uploaded separately and will be available at the same link.

- Vinayaga Automation`;
  };

  // Generate Doctor Message (Report Update)
  const getDoctorReportMessage = () => {
    return `Dear Dr. ${doctorName},

📄 The patient report has been added.

📋 Patient Details:
• Name: ${patientName}
• Patient ID: ${patientId}
• Date: ${new Date().toLocaleDateString('en-IN')}

🔗 Please use the same link to view the report:
${secureLink}

Both DICOM images and report are now available.

- Vinayaga Automation`;
  };

  const handleSend = async () => {
    if (sendState === SEND_STATES.SENDING) return;

    setSendState(SEND_STATES.SENDING);
    setError(null);
    setSendStatus({ patient: null, doctor: null });

    const timeoutPromise = new Promise((_, reject) => {
      timeoutRef.current = setTimeout(() => {
        reject(new Error('Request timed out. Please check your connection and try again.'));
      }, API_TIMEOUT);
    });

    // Simulate API calls
    const sendMessages = async () => {
      // Simulate sending to patient (only for initial send)
      if (isInitialSend) {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (!isMountedRef.current) return;
        setSendStatus(prev => ({ ...prev, patient: 'sent' }));
      }

      // Simulate sending to doctor
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!isMountedRef.current) return;

      // Simulate 95% success rate
      if (Math.random() > 0.05) {
        setSendStatus(prev => ({ ...prev, doctor: 'sent' }));
        return { success: true };
      } else {
        throw new Error('Failed to send message to doctor. Please try again.');
      }
    };

    try {
      await Promise.race([sendMessages(), timeoutPromise]);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!isMountedRef.current) return;

      setSendState(SEND_STATES.SUCCESS);

      onSend({
        success: true,
        sentAt: new Date().toISOString(),
        patientId: patient.id,
        messageType: messageType,
        notificationStatus: isInitialSend ? NOTIFICATION_STATUS.INITIAL_SENT : NOTIFICATION_STATUS.REPORT_SENT,
        sentBy: 'staff',
        recipients: isInitialSend ? ['patient', 'doctor'] : ['doctor']
      });

    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!isMountedRef.current) return;

      setSendState(SEND_STATES.ERROR);
      setError(err.message || 'Failed to send WhatsApp messages');

      onSend({
        success: false,
        sentAt: new Date().toISOString(),
        patientId: patient.id,
        messageType: messageType,
        sentBy: 'staff',
        error: err.message
      });
    }
  };

  const isSending = sendState === SEND_STATES.SENDING;
  const isSuccess = sendState === SEND_STATES.SUCCESS;
  const isError = sendState === SEND_STATES.ERROR;

  return (
    <div className="whatsapp-modal-overlay" onClick={handleClose}>
      <div
        className={`whatsapp-modal ${isInitialSend ? 'whatsapp-modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`whatsapp-modal-header ${isReportUpdate ? 'header-report' : ''}`}>
          <div className="whatsapp-header-icon">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="whatsapp-header-text">
            <h2>{isInitialSend ? 'Send DICOM Notification' : 'Send Report Update'}</h2>
            <p>{isInitialSend ? 'To: Patient & Doctor' : 'To: Doctor Only'}</p>
          </div>
          <button
            className="whatsapp-close-btn"
            onClick={handleClose}
            aria-label="Close"
            disabled={isSending}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="whatsapp-modal-body">
          {/* Success Banner */}
          {isSuccess && (
            <div className="whatsapp-success-banner">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span>Messages sent successfully!</span>
            </div>
          )}

          {/* Last Sent Info */}
          {lastSentAt && (
            <div className="whatsapp-resend-info">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              <span>Last sent: {formatTimestamp(lastSentAt)}</span>
            </div>
          )}

          {/* Dual Card Layout for Initial Send */}
          {isInitialSend ? (
            <div className="dual-preview-container">
              {/* Patient Message Card */}
              <div className="preview-card patient-card">
                <div className="preview-card-header patient-header">
                  <span className="card-icon">👤</span>
                  <span className="card-title">Patient Message</span>
                  {sendStatus.patient === 'sent' && (
                    <span className="sent-badge">✓ Sent</span>
                  )}
                </div>
                <div className="preview-card-info">
                  <div className="info-row">
                    <span className="label">To:</span>
                    <span className="value">{patientName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value mono">{maskPhone(patientPhone)}</span>
                  </div>
                </div>
                <div className="preview-card-message">
                  <pre>{getPatientMessage()}</pre>
                </div>
                <div className="preview-card-note patient-note">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <span>No DICOM link or report sent to patient</span>
                </div>
              </div>

              {/* Doctor Message Card */}
              <div className="preview-card doctor-card">
                <div className="preview-card-header doctor-header">
                  <span className="card-icon">👨‍⚕️</span>
                  <span className="card-title">Doctor Message</span>
                  {sendStatus.doctor === 'sent' && (
                    <span className="sent-badge">✓ Sent</span>
                  )}
                </div>
                <div className="preview-card-info">
                  <div className="info-row">
                    <span className="label">To:</span>
                    <span className="value">Dr. {doctorName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value mono">{maskPhone(doctorPhone)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Patient:</span>
                    <span className="value">{patientName} ({patientId})</span>
                  </div>
                </div>
                <div className="preview-card-message">
                  <pre>{getDoctorDicomMessage()}</pre>
                </div>
                <div className="preview-card-link">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                  </svg>
                  <code>{maskSecureLink(secureLink)}</code>
                </div>
              </div>
            </div>
          ) : (
            /* Single Card for Report Update (Doctor Only) */
            <div className="single-preview-container">
              <div className="preview-card doctor-card full-width">
                <div className="preview-card-header doctor-header report-header">
                  <span className="card-icon">📄</span>
                  <span className="card-title">Report Update - Doctor Only</span>
                  {sendStatus.doctor === 'sent' && (
                    <span className="sent-badge">✓ Sent</span>
                  )}
                </div>
                <div className="preview-card-info">
                  <div className="info-row">
                    <span className="label">To:</span>
                    <span className="value">Dr. {doctorName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value mono">{maskPhone(doctorPhone)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Patient:</span>
                    <span className="value">{patientName} ({patientId})</span>
                  </div>
                </div>
                <div className="preview-card-message">
                  <pre>{getDoctorReportMessage()}</pre>
                </div>
                <div className="preview-card-link">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                  </svg>
                  <code>{maskSecureLink(secureLink)}</code>
                  <span className="same-link-badge">Same Link</span>
                </div>
                <div className="preview-card-note report-note">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <span>Patient will NOT receive this message</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {isError && error && (
            <div className="whatsapp-error">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="whatsapp-modal-footer">
          <button
            className="whatsapp-cancel-btn"
            onClick={handleClose}
            disabled={isSending}
          >
            {isSuccess ? 'Close' : 'Cancel'}
          </button>
          <button
            className={`whatsapp-send-btn ${isSuccess ? 'success' : ''} ${isReportUpdate ? 'report-btn' : ''}`}
            onClick={handleSend}
            disabled={isSending || isSuccess}
          >
            {isSending ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : isSuccess ? (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Sent ✓
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                {isInitialSend ? 'Send to Both' : 'Send Report Update'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPreview;
