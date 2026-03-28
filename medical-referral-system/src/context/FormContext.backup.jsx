import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uploadDicomFile, sendEmailNotification, openInViewer } from '../services/api';

const FormContext = createContext();

const BRANCHES_STORAGE_KEY = 'anbu_branches';

// Case States - Strict workflow progression
export const CASE_STATES = {
  CREATED: 'CREATED',                    // Initial state - patient record created
  DICOM_UPLOADED: 'DICOM_UPLOADED',      // DICOM file uploaded
  REPORT_UPLOADED: 'REPORT_UPLOADED',    // Report file uploaded
  NOTIFICATION_SENT: 'NOTIFICATION_SENT', // Doctor notified (WhatsApp OR Email)
  CASE_COMPLETE: 'CASE_COMPLETE'         // All steps completed
};

// Channel Status for notifications
export const CHANNEL_STATUS = {
  NOT_SENT: 'NOT_SENT',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

// WhatsApp Message Types
export const MESSAGE_TYPES = {
  INITIAL_SEND: 'INITIAL_SEND',        // Patient + Doctor (DICOM ready)
  REPORT_UPDATE: 'REPORT_UPDATE'       // Doctor only (Report ready)
};

// Notification Status (legacy - kept for compatibility)
export const NOTIFICATION_STATUS = {
  NOT_SENT: 'NOT_SENT',
  INITIAL_SENT: 'INITIAL_SENT',
  REPORT_SENT: 'REPORT_SENT'
};

const DEFAULT_BRANCHES = [
  { id: 'ANBU-SLM-LIC', branchName: 'ANBU – Salem (LIC Colony)', city: 'Salem', address: '', phone: '' },
  { id: 'ANBU-SLM-GUG', branchName: 'ANBU – Salem (Gugai)', city: 'Salem', address: '', phone: '' },
  { id: 'ANBU-RMD', branchName: 'ANBU – Ramanathapuram', city: 'Ramanathapuram', address: '', phone: '' },
  { id: 'ANBU-HSR', branchName: 'ANBU – Hosur', city: 'Hosur', address: '', phone: '' },
];

const getBranchesFromStorage = () => {
  try {
    const stored = localStorage.getItem(BRANCHES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading branches:', error);
  }
  return DEFAULT_BRANCHES;
};

export const BRANCHES = getBranchesFromStorage().map(b => ({
  id: b.id,
  name: b.branchName
}));

const getStorageKey = (branchId) => `manageForms_${branchId}`;

// Generate a secure access token for patient case
const generateSecureAccessToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Generate secure access link (ONE per case, never changes)
const generateSecureAccessLink = (patientId, token) => {
  return `https://dicom.anbu-dental.com/case/${token}`;
};

// Store file metadata only (not the actual file data to avoid quota issues)
const getFileMetadata = (file) => {
  if (!file) return null;
  if (file instanceof File) {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      hasFile: true,
      uploadedAt: new Date().toISOString()
    };
  }
  // Already metadata
  if (file.hasFile || file.name) {
    return file;
  }
  return null;
};

// Helper to check if file data exists
const hasFileData = (fileData) => {
  if (!fileData) return false;
  if (fileData.hasFile) return true;
  if (fileData.name) return true;
  if (fileData.dataURL) return true;
  return false;
};

// Calculate case state based on workflow progression (system-driven)
const calculateCaseState = (form) => {
  const hasDicom = hasFileData(form.patient?.dicomFile);
  const hasReport = hasFileData(form.patient?.diagnosticReport);
  const channelStatus = form.channelStatus || {};
  const whatsappSent = channelStatus.whatsapp === CHANNEL_STATUS.SENT;
  const emailSent = channelStatus.email === CHANNEL_STATUS.SENT;
  const doctorNotified = whatsappSent || emailSent; // At least one channel succeeded

  // Strict workflow progression:
  // CREATED → DICOM_UPLOADED → REPORT_UPLOADED → NOTIFICATION_SENT → CASE_COMPLETE
  
  if (hasDicom && hasReport && doctorNotified) {
    return CASE_STATES.CASE_COMPLETE;
  } else if (hasDicom && hasReport && !doctorNotified) {
    return CASE_STATES.REPORT_UPLOADED;
  } else if (hasDicom && !hasReport) {
    return CASE_STATES.DICOM_UPLOADED;
  }
  return CASE_STATES.CREATED;
};

// Load forms from localStorage
const loadFormsFromStorage = (branchId) => {
  if (!branchId) return [];
  const storageKey = getStorageKey(branchId);
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const forms = JSON.parse(stored);
      console.log(`Loaded ${forms.length} forms from ${storageKey}`);
      return forms;
    }
  } catch (error) {
    console.error('Error loading forms:', error);
  }
  return [];
};

// Save forms to localStorage
const saveFormsToStorage = (branchId, forms) => {
  if (!branchId) return false;
  const storageKey = getStorageKey(branchId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(forms));
    console.log(`Saved ${forms.length} forms to ${storageKey}`);
    return true;
  } catch (error) {
    console.error('Error saving forms:', error);
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded. Please clear some data.');
    }
    return false;
  }
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
};

export const FormProvider = ({ children }) => {
  const [currentBranch, setCurrentBranch] = useState(() => {
    try {
      return localStorage.getItem('selectedBranch') || null;
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  });

  const [forms, setForms] = useState([]);
  const [branches, setBranches] = useState(() => getBranchesFromStorage());
  const isInitialLoad = useRef(true);

  // Load forms when branch changes
  useEffect(() => {
    if (currentBranch) {
      const loadedForms = loadFormsFromStorage(currentBranch);
      setForms(loadedForms);
      isInitialLoad.current = false;
    } else {
      setForms([]);
    }
  }, [currentBranch]);

  // Refresh branches from storage
  useEffect(() => {
    const handleStorageChange = () => {
      setBranches(getBranchesFromStorage());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const selectBranch = (branchId) => {
    const currentBranches = getBranchesFromStorage();
    const branchExists = currentBranches.some(b => b.id === branchId);
    if (branchExists) {
      setCurrentBranch(branchId);
      try {
        localStorage.setItem('selectedBranch', branchId);
      } catch (error) {
        console.error('Error saving selected branch:', error);
      }
    }
  };

  const getBranchName = (id) => {
    const currentBranches = getBranchesFromStorage();
    const branch = currentBranches.find(b => b.id === id);
    return branch ? branch.branchName : id;
  };

  const refreshBranches = () => {
    setBranches(getBranchesFromStorage());
  };


  const addForm = async (formData, onProgress = null) => {
    console.log('[FormContext] addForm called with formData:', {
      patientName: formData.patient?.patientName,
      patientId: formData.patient?.patientId,
      doctorName: formData.doctor?.doctorName,
      hasDicomFile: !!formData.patient?.dicomFile,
      dicomFileType: typeof formData.patient?.dicomFile,
      dicomFileName: formData.patient?.dicomFile?.name,
      dicomFileSize: formData.patient?.dicomFile?.size,
      hasProgressCallback: !!onProgress
    });
    
    if (!currentBranch) {
      console.error('No branch selected');
      return null;
    }

    // Generate secure access token (ONE per case, never changes)
    const accessToken = generateSecureAccessToken();
    const patientId = formData.patient?.patientId || uuidv4().slice(0, 8).toUpperCase();

    // Upload DICOM file to backend/Orthanc if present
    let orthancData = null;
    const dicomFile = formData.patient?.dicomFile;
    
    console.log('[FormContext] Checking DICOM file:', {
      hasDicomFile: !!dicomFile,
      isFile: dicomFile instanceof File,
      fileName: dicomFile?.name,
      fileSize: dicomFile?.size
    });
    
    if (dicomFile instanceof File) {
      try {
        console.log('[FormContext] Uploading DICOM file to backend:', dicomFile.name);
        const uploadResult = await uploadDicomFile(
          dicomFile,
          { 
            patientName: formData.patient?.patientName,
            patientId: patientId,
            phoneNumber: formData.patient?.phoneNumber
          },
          {
            doctorName: formData.doctor?.doctorName,
            hospital: formData.doctor?.hospital,
            doctorPhone: formData.doctor?.doctorPhone
          },
          onProgress // Pass progress callback to upload function
        );
        console.log('[FormContext] DICOM upload result:', uploadResult);
        
        // Store study data for viewer access
        if (uploadResult.studyId && uploadResult.dicomFileCount > 0) {
          orthancData = {
            studyId: uploadResult.studyId,
            dicomFileCount: uploadResult.dicomFileCount,
            viewerUrl: uploadResult.viewerUrl,
            uploadedAt: new Date().toISOString()
          };
          
          // Automatically open in OHIF viewer if files were uploaded
          if (uploadResult.viewerUrl) {
            console.log('[FormContext] Opening DICOM files in OHIF viewer...');
            setTimeout(() => {
              openInViewer(uploadResult.viewerUrl);
            }, 1000); // Small delay to ensure form is saved first
          }
        }
        
        // Also store Orthanc IDs if available (backward compatibility)
        if (uploadResult.orthancResults && uploadResult.orthancResults.length > 0) {
          const successfulUpload = uploadResult.orthancResults.find(r => r.status === 'Uploaded to Orthanc');
          if (successfulUpload && !orthancData) {
            orthancData = {
              orthancId: successfulUpload.orthancId,
              parentStudy: successfulUpload.parentStudy,
              studyInstanceUID: successfulUpload.studyInstanceUID, // DICOM StudyInstanceUID for OHIF
              uploadedAt: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.error('[FormContext] DICOM upload failed:', error);
        // Continue with form creation even if upload fails
      }
    }

    // Create form with file metadata and case tracking
    const newForm = {
      id: uuidv4(),
      branchId: currentBranch,
      branch: currentBranch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doctor: { ...formData.doctor },
      patient: {
        ...formData.patient,
        diagnosticReport: getFileMetadata(formData.patient?.diagnosticReport),
        dicomFile: getFileMetadata(formData.patient?.dicomFile),
      },
      diagnosticServices: { ...formData.diagnosticServices },
      reasonForReferral: { ...formData.reasonForReferral },
      clinicalNotes: formData.clinicalNotes || '',
      // Orthanc data for viewer access
      orthancData: orthancData,
      // Case tracking
      caseTracking: {
        accessToken: accessToken,
        secureLink: generateSecureAccessLink(patientId, accessToken),
        caseState: CASE_STATES.CREATED,
        stateHistory: [{
          state: CASE_STATES.CREATED,
          timestamp: new Date().toISOString(),
          action: 'Case created'
        }]
      },
      // WhatsApp notifications tracking
      notifications: {
        patient: {
          scanCompleteNotified: false,
          notifiedAt: null
        },
        doctor: {
          dicomNotified: false,
          dicomNotifiedAt: null,
          reportNotified: false,
          reportNotifiedAt: null
        },
        history: []
      }
    };

    // Calculate initial case state
    newForm.caseTracking.caseState = calculateCaseState(newForm);
    
    // Update state history if DICOM was uploaded on creation
    if (newForm.caseTracking.caseState !== CASE_STATES.CREATED) {
      newForm.caseTracking.stateHistory.push({
        state: newForm.caseTracking.caseState,
        timestamp: new Date().toISOString(),
        action: 'Initial file upload'
      });
    }

    // Load current forms, add new one, save back
    const currentForms = loadFormsFromStorage(currentBranch);
    const updatedForms = [...currentForms, newForm];
    
    const saved = saveFormsToStorage(currentBranch, updatedForms);
    if (saved) {
      setForms(updatedForms);
      console.log('Form added successfully:', newForm.id, orthancData ? '(DICOM uploaded to Orthanc)' : '');
      
      // Auto-send email notifications if DICOM was uploaded
      if (orthancData && orthancData.parentStudy) {
        console.log('[FormContext] Auto-sending email notifications...');
        console.log('[FormContext] Form data:', {
          doctorEmail: newForm.doctor?.emailWhatsapp,
          patientEmail: newForm.patient?.emailAddress,
          orthancData: orthancData
        });
        try {
          const result = await sendEmailNotifications(newForm.id, MESSAGE_TYPES.INITIAL_SEND);
          console.log('[FormContext] Auto-notification result:', result);
        } catch (error) {
          console.error('[FormContext] Auto-notification failed:', error);
          // Don't fail form creation if notifications fail
        }
      } else {
        console.log('[FormContext] Skipping auto-notifications - no DICOM data:', {
          hasOrthancData: !!orthancData,
          hasParentStudy: orthancData?.parentStudy
        });
      }
      
      return newForm;
    } else {
      setForms(updatedForms);
      console.error('Form added to state but storage failed');
      return newForm;
    }
  };

  const updateForm = async (id, formData) => {
    const currentForms = loadFormsFromStorage(currentBranch);
    const existingForm = currentForms.find(f => f.id === id);
    
    if (!existingForm) {
      console.error('Form not found:', id);
      return;
    }

    // Preserve the secure access token and link (NEVER regenerate)
    const accessToken = existingForm.caseTracking?.accessToken || generateSecureAccessToken();
    const secureLink = existingForm.caseTracking?.secureLink || 
      generateSecureAccessLink(formData.patient?.patientId, accessToken);

    // Check if there's a new DICOM file to upload
    let orthancData = existingForm.orthancData || null;
    const dicomFile = formData.patient?.dicomFile;
    
    // Only upload if it's a new File object (not existing metadata)
    if (dicomFile instanceof File) {
      try {
        console.log('[FormContext] Uploading new DICOM file to backend:', dicomFile.name);
        const uploadResult = await uploadDicomFile(
          dicomFile,
          { 
            patientName: formData.patient?.patientName,
            patientId: formData.patient?.patientId,
            phoneNumber: formData.patient?.phoneNumber
          },
          {
            doctorName: formData.doctor?.doctorName,
            hospital: formData.doctor?.hospital,
            doctorPhone: formData.doctor?.doctorPhone
          }
        );
        console.log('[FormContext] DICOM upload result:', uploadResult);
        
        // Store Orthanc IDs for viewer access
        if (uploadResult.orthancResults && uploadResult.orthancResults.length > 0) {
          const successfulUpload = uploadResult.orthancResults.find(r => r.status === 'Uploaded to Orthanc');
          if (successfulUpload) {
            orthancData = {
              orthancId: successfulUpload.orthancId,
              parentStudy: successfulUpload.parentStudy,
              studyInstanceUID: successfulUpload.studyInstanceUID, // DICOM StudyInstanceUID for OHIF
              uploadedAt: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.error('[FormContext] DICOM upload failed:', error);
        // Continue with form update even if upload fails
      }
    }

    const updatedForms = currentForms.map((form) => {
      if (form.id !== id) return form;

      const previousState = form.caseTracking?.caseState || CASE_STATES.CREATED;
      
      const updatedForm = {
        ...form,
        ...formData,
        patient: {
          ...formData.patient,
          diagnosticReport: getFileMetadata(formData.patient?.diagnosticReport),
          dicomFile: getFileMetadata(formData.patient?.dicomFile),
        },
        branch: form.branch,
        branchId: form.branchId,
        updatedAt: new Date().toISOString(),
        orthancData: orthancData,
        caseTracking: {
          ...form.caseTracking,
          accessToken: accessToken,
          secureLink: secureLink,
          stateHistory: form.caseTracking?.stateHistory || []
        },
        notifications: form.notifications || {
          patient: { scanCompleteNotified: false, notifiedAt: null },
          doctor: { dicomNotified: false, dicomNotifiedAt: null, reportNotified: false, reportNotifiedAt: null },
          history: []
        }
      };

      // Calculate new case state
      const newState = calculateCaseState(updatedForm);
      updatedForm.caseTracking.caseState = newState;

      // Track state changes
      if (newState !== previousState) {
        let action = 'State updated';
        if (newState === CASE_STATES.DICOM_UPLOADED) {
          action = 'DICOM file uploaded';
        } else if (newState === CASE_STATES.REPORT_UPLOADED || newState === CASE_STATES.CASE_COMPLETE) {
          action = 'Report uploaded';
        }
        
        updatedForm.caseTracking.stateHistory.push({
          state: newState,
          timestamp: new Date().toISOString(),
          action: action,
          previousState: previousState
        });
      }

      return updatedForm;
    });

    saveFormsToStorage(currentBranch, updatedForms);
    setForms(updatedForms);
  };

  const deleteForm = (id) => {
    const currentForms = loadFormsFromStorage(currentBranch);
    const updatedForms = currentForms.filter((form) => form.id !== id);
    saveFormsToStorage(currentBranch, updatedForms);
    setForms(updatedForms);
  };

  const archiveForm = (id) => {
    const currentForms = loadFormsFromStorage(currentBranch);
    const updatedForms = currentForms.map((form) =>
      form.id === id
        ? { ...form, isArchived: true, archivedAt: new Date().toISOString() }
        : form
    );
    saveFormsToStorage(currentBranch, updatedForms);
    setForms(updatedForms);
    console.log('Form archived:', id);
  };

  const restoreForm = (id) => {
    const currentForms = loadFormsFromStorage(currentBranch);
    const updatedForms = currentForms.map((form) =>
      form.id === id
        ? { ...form, isArchived: false, restoredAt: new Date().toISOString() }
        : form
    );
    saveFormsToStorage(currentBranch, updatedForms);
    setForms(updatedForms);
    console.log('Form restored:', id);
  };

  const activeForms = forms.filter((form) => !form.isArchived);
  const archivedForms = forms.filter((form) => form.isArchived);

  const getFormById = (id) => {
    return forms.find((form) => form.id === id);
  };

  const reloadForms = () => {
    if (currentBranch) {
      const loadedForms = loadFormsFromStorage(currentBranch);
      setForms(loadedForms);
    }
  };


  // Record notification sent - updates channelStatus for UI badges
  const recordNotification = (id, messageType, result) => {
    const currentForms = loadFormsFromStorage(currentBranch);
    const updatedForms = currentForms.map((form) => {
      if (form.id !== id) return form;

      const historyEntry = {
        messageType,
        sentAt: result.sentAt,
        status: result.success ? 'sent' : 'failed',
        sentBy: result.sentBy || 'staff',
        recipients: result.recipients || (messageType === MESSAGE_TYPES.INITIAL_SEND ? ['patient', 'doctor'] : ['doctor']),
        channelResults: result.channelStatus
      };

      // Update notification status based on message type (legacy)
      let newNotificationStatus = form.notificationStatus || NOTIFICATION_STATUS.NOT_SENT;
      
      if (result.success) {
        if (messageType === MESSAGE_TYPES.INITIAL_SEND) {
          newNotificationStatus = NOTIFICATION_STATUS.INITIAL_SENT;
        } else if (messageType === MESSAGE_TYPES.REPORT_UPDATE) {
          newNotificationStatus = NOTIFICATION_STATUS.REPORT_SENT;
        }
      }

      // Update channelStatus - this is what the UI badges read from
      // CRITICAL: Never overwrite SENT with FAILED
      const existingChannelStatus = form.channelStatus || { whatsapp: CHANNEL_STATUS.NOT_SENT, email: CHANNEL_STATUS.NOT_SENT };
      const newChannelStatus = { ...existingChannelStatus };
      
      // Update WhatsApp status
      if (result.channelStatus?.whatsapp === CHANNEL_STATUS.SENT) {
        newChannelStatus.whatsapp = CHANNEL_STATUS.SENT;
        newChannelStatus.whatsappSentAt = result.sentAt;
        newChannelStatus.whatsappError = null; // Clear error on success
      } else if (result.channelStatus?.whatsapp === CHANNEL_STATUS.FAILED && existingChannelStatus.whatsapp !== CHANNEL_STATUS.SENT) {
        newChannelStatus.whatsapp = CHANNEL_STATUS.FAILED;
        newChannelStatus.whatsappError = result.channelStatus?.whatsappError || 'Send failed';
      }
      
      // Update Email status
      if (result.channelStatus?.email === CHANNEL_STATUS.SENT) {
        newChannelStatus.email = CHANNEL_STATUS.SENT;
        newChannelStatus.emailSentAt = result.sentAt;
        newChannelStatus.emailError = null; // Clear error on success
      } else if (result.channelStatus?.email === CHANNEL_STATUS.FAILED && existingChannelStatus.email !== CHANNEL_STATUS.SENT) {
        newChannelStatus.email = CHANNEL_STATUS.FAILED;
        newChannelStatus.emailError = result.channelStatus?.emailError || 'Send failed';
      }

      const notificationHistory = form.notificationHistory || [];
      notificationHistory.push(historyEntry);

      // Recalculate case state with new channelStatus
      const updatedForm = {
        ...form,
        channelStatus: newChannelStatus,
        notificationStatus: newNotificationStatus,
        lastNotifiedAt: result.success ? result.sentAt : form.lastNotifiedAt,
        notificationHistory
      };
      
      // Update caseTracking.caseState based on new status
      const newCaseState = calculateCaseState(updatedForm);
      updatedForm.caseTracking = {
        ...updatedForm.caseTracking,
        caseState: newCaseState
      };
      
      // Add to state history if changed
      const previousState = form.caseTracking?.caseState;
      if (newCaseState !== previousState) {
        updatedForm.caseTracking.stateHistory = [
          ...(updatedForm.caseTracking.stateHistory || []),
          {
            state: newCaseState,
            timestamp: new Date().toISOString(),
            action: 'Notification sent',
            previousState
          }
        ];
      }

      console.log('[recordNotification] Updated form:', {
        id: form.id,
        channelStatus: newChannelStatus,
        caseState: newCaseState,
        notificationStatus: newNotificationStatus
      });

      return updatedForm;
    });

    saveFormsToStorage(currentBranch, updatedForms);
    setForms(updatedForms);
    console.log('Notification recorded for form:', id, messageType);
  };

  // Get case state for a form
  const getCaseState = (form) => {
    return form?.caseTracking?.caseState || calculateCaseState(form);
  };

  // Check if patient notification was already sent
  const isPatientNotified = (form) => {
    return form?.notifications?.patient?.scanCompleteNotified || false;
  };

  // Check if doctor DICOM notification was sent
  const isDoctorDicomNotified = (form) => {
    return form?.notifications?.doctor?.dicomNotified || false;
  };

  // Check if doctor report notification was sent
  const isDoctorReportNotified = (form) => {
    return form?.notifications?.doctor?.reportNotified || false;
  };

  // Legacy WhatsApp status update (for backward compatibility)
  const updateWhatsAppStatus = (id, whatsAppData) => {
    // Map to new notification system
    recordNotification(id, MESSAGE_TYPES.DOCTOR_DICOM_READY, whatsAppData);
  };

  // Send email notifications
  const sendEmailNotifications = async (formId, messageType) => {
    console.log('[FormContext] sendEmailNotifications called:', { formId, messageType });
    
    const form = getFormById(formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const doctorData = {
      doctorName: form.doctor?.doctorName,
      hospital: form.doctor?.hospital,
      doctorPhone: form.doctor?.doctorPhone,
      doctorEmail: form.doctor?.emailWhatsapp // Using emailWhatsapp field for email
    };

    const patientData = {
      patientName: form.patient?.patientName,
      patientId: form.patient?.patientId,
      patientPhone: form.patient?.phoneNumber,
      patientEmail: form.patient?.emailAddress // Add email field for patients
    };

    const caseData = {
      accessToken: form.caseTracking?.accessToken,
      studyInstanceUID: form.orthancData?.studyInstanceUID || form.orthancData?.parentStudy,
      caseId: form.id,
      viewerLink: (form.orthancData?.studyInstanceUID || form.orthancData?.parentStudy) ? 
        `${window.location.origin}/viewer?StudyInstanceUIDs=${form.orthancData.studyInstanceUID || form.orthancData.parentStudy}&token=${form.caseTracking?.accessToken}` :
        `${window.location.origin}/case/${form.caseTracking?.accessToken}`
    };

    console.log('[FormContext] Email notification data:', {
      doctorData,
      patientData,
      caseData
    });

    try {
      const result = await sendEmailNotification(doctorData, patientData, caseData);
      console.log('[FormContext] Email notification result:', result);

      // Record the notification result
      recordNotification(formId, messageType, {
        success: result.success,
        sentAt: result.sentAt,
        channelStatus: result.channelStatus,
        sentBy: 'system' // Auto-sent by system
      });

      return result;

    } catch (error) {
      console.error('[FormContext] Email send failed:', error);
      
      // Record the failure
      recordNotification(formId, messageType, {
        success: false,
        sentAt: new Date().toISOString(),
        channelStatus: {
          email: 'FAILED',
          emailError: error.message,
          whatsapp: 'NOT_SENT'
        },
        sentBy: 'system'
      });

      throw error;
    }
  };

  return (
    <FormContext.Provider
      value={{
        forms,
        activeForms,
        archivedForms,
        currentBranch,
        branches: branches.map(b => ({ id: b.id, name: b.branchName })),
        selectBranch,
        addForm,
        updateForm,
        deleteForm,
        archiveForm,
        restoreForm,
        getFormById,
        getBranchName,
        refreshBranches,
        reloadForms,
        updateWhatsAppStatus,
        // New case tracking functions
        recordNotification,
        sendEmailNotifications,
        getCaseState,
        isPatientNotified,
        isDoctorDicomNotified,
        isDoctorReportNotified,
        // Constants
        CASE_STATES,
        MESSAGE_TYPES,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
