import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uploadDicomFile, sendEmailNotification, openInViewer } from '../services/api';
import { 
  saveFormToFirebase, 
  getFormsFromFirebase, 
  updateFormInFirebase, 
  deleteFormFromFirebase,
  subscribeToForms 
} from '../services/firebaseService';
import { useAuth } from './AuthContext';

const FormContext = createContext();

// Case States - Strict workflow progression
export const CASE_STATES = {
  CREATED: 'CREATED',
  DICOM_UPLOADED: 'DICOM_UPLOADED',
  REPORT_UPLOADED: 'REPORT_UPLOADED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  CASE_COMPLETE: 'CASE_COMPLETE'
};

// Channel Status for notifications
export const CHANNEL_STATUS = {
  NOT_SENT: 'NOT_SENT',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

// WhatsApp Message Types
export const MESSAGE_TYPES = {
  INITIAL_SEND: 'INITIAL_SEND',
  REPORT_UPDATE: 'REPORT_UPDATE'
};

// Notification Status (legacy)
export const NOTIFICATION_STATUS = {
  NOT_SENT: 'NOT_SENT',
  INITIAL_SENT: 'INITIAL_SENT',
  REPORT_SENT: 'REPORT_SENT'
};

const DEFAULT_BRANCHES = [
  { id: 'ANBU-SLM-LIC', branchName: 'ANBU – Salem (LIC Colony)', city: 'Salem' },
  { id: 'ANBU-SLM-GUG', branchName: 'ANBU – Salem (Gugai)', city: 'Salem' },
  { id: 'ANBU-RMD', branchName: 'ANBU – Ramanathapuram', city: 'Ramanathapuram' },
  { id: 'ANBU-HSR', branchName: 'ANBU – Hosur', city: 'Hosur' },
];

export const BRANCHES = DEFAULT_BRANCHES.map(b => ({
  id: b.id,
  name: b.branchName
}));


// Helper functions
const generateSecureAccessToken = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const generateSecureAccessLink = (patientId, token) => {
  return `https://dicom.anbu-dental.com/case/${token}`;
};

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
  if (file.hasFile || file.name) {
    return file;
  }
  return null;
};

const hasFileData = (fileData) => {
  if (!fileData) return false;
  if (fileData.hasFile) return true;
  if (fileData.name) return true;
  if (fileData.dataURL) return true;
  return false;
};

const calculateCaseState = (form) => {
  const hasDicom = hasFileData(form.patient?.dicomFile);
  const hasReport = hasFileData(form.patient?.diagnosticReport);
  const channelStatus = form.channelStatus || {};
  const whatsappSent = channelStatus.whatsapp === CHANNEL_STATUS.SENT;
  const emailSent = channelStatus.email === CHANNEL_STATUS.SENT;
  const doctorNotified = whatsappSent || emailSent;

  if (hasDicom && hasReport && doctorNotified) {
    return CASE_STATES.CASE_COMPLETE;
  } else if (hasDicom && hasReport && !doctorNotified) {
    return CASE_STATES.REPORT_UPLOADED;
  } else if (hasDicom && !hasReport) {
    return CASE_STATES.DICOM_UPLOADED;
  }
  return CASE_STATES.CREATED;
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return context;
};


export const FormProvider = ({ children }) => {
  const { userData, canCreateInBranch, canViewBranch } = useAuth();
  const [currentBranch, setCurrentBranch] = useState(() => {
    return localStorage.getItem('selectedBranch') || null;
  });
  const [forms, setForms] = useState([]);
  const [branches] = useState(DEFAULT_BRANCHES);
  const [loading, setLoading] = useState(false);
  const unsubscribeRef = useRef(null);

  // Auto-select assigned branch when user logs in
  useEffect(() => {
    if (userData && !currentBranch) {
      const assignedBranch = userData.assignedBranch;
      if (assignedBranch) {
        setCurrentBranch(assignedBranch);
        localStorage.setItem('selectedBranch', assignedBranch);
      }
    }
  }, [userData, currentBranch]);

  // Load forms from Firebase when branch changes
  useEffect(() => {
    if (!currentBranch) {
      setForms([]);
      return;
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToForms(currentBranch, (updatedForms) => {
      setForms(updatedForms);
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup subscription on unmount or branch change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentBranch]);

  const selectBranch = (branchId) => {
    // Check if user can view this branch
    if (userData && !canViewBranch(branchId)) {
      console.error('User cannot view this branch:', branchId);
      return;
    }

    const branchExists = branches.some(b => b.id === branchId);
    if (branchExists) {
      setCurrentBranch(branchId);
      localStorage.setItem('selectedBranch', branchId);
    }
  };

  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id);
    return branch ? branch.branchName : id;
  };

  const refreshBranches = () => {
    // Branches are static, no need to refresh
  };


  const addForm = async (formData, onProgress = null) => {
    console.log('[FormContext] addForm called');
    
    if (!currentBranch) {
      console.error('No branch selected');
      return null;
    }

    // Check permission
    if (userData && !canCreateInBranch(currentBranch)) {
      console.error('User cannot create forms in this branch');
      throw new Error('You can only create forms in your assigned branch');
    }

    const accessToken = generateSecureAccessToken();
    const patientId = formData.patient?.patientId || uuidv4().slice(0, 8).toUpperCase();

    // Upload DICOM file if present
    let orthancData = null;
    const dicomFile = formData.patient?.dicomFile;
    
    if (dicomFile instanceof File) {
      try {
        console.log('[FormContext] Uploading DICOM file:', dicomFile.name);
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
          onProgress
        );
        
        if (uploadResult.studyId && uploadResult.dicomFileCount > 0) {
          orthancData = {
            studyId: uploadResult.studyId,
            dicomFileCount: uploadResult.dicomFileCount,
            viewerUrl: uploadResult.viewerUrl,
            uploadedAt: new Date().toISOString()
          };
          
          if (uploadResult.viewerUrl) {
            setTimeout(() => openInViewer(uploadResult.viewerUrl), 1000);
          }
        }
      } catch (error) {
        console.error('[FormContext] DICOM upload failed:', error);
      }
    }

    // Create form object
    const formId = uuidv4();
    const newForm = {
      id: formId,
      branchId: currentBranch,
      branch: currentBranch,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userData?.email || 'unknown',
      doctor: { ...formData.doctor },
      patient: {
        ...formData.patient,
        diagnosticReport: getFileMetadata(formData.patient?.diagnosticReport),
        dicomFile: getFileMetadata(formData.patient?.dicomFile),
      },
      diagnosticServices: { ...formData.diagnosticServices },
      reasonForReferral: { ...formData.reasonForReferral },
      clinicalNotes: formData.clinicalNotes || '',
      orthancData: orthancData,
      caseTracking: {
        accessToken: accessToken,
        secureLink: generateSecureAccessLink(patientId, accessToken),
        caseState: CASE_STATES.CREATED,
        stateHistory: [{
          state: CASE_STATES.CREATED,
          timestamp: Date.now(),
          action: 'Case created'
        }]
      },
      notifications: {
        patient: { scanCompleteNotified: false, notifiedAt: null },
        doctor: { dicomNotified: false, dicomNotifiedAt: null, reportNotified: false, reportNotifiedAt: null },
        history: []
      }
    };

    newForm.caseTracking.caseState = calculateCaseState(newForm);
    
    if (newForm.caseTracking.caseState !== CASE_STATES.CREATED) {
      newForm.caseTracking.stateHistory.push({
        state: newForm.caseTracking.caseState,
        timestamp: Date.now(),
        action: 'Initial file upload'
      });
    }

    // Save to Firebase
    try {
      await saveFormToFirebase(currentBranch, formId, newForm);
      console.log('[FormContext] Form saved to Firebase:', formId);
      
      // Auto-send notifications if DICOM uploaded
      if (orthancData && orthancData.parentStudy) {
        try {
          await sendEmailNotifications(formId, MESSAGE_TYPES.INITIAL_SEND);
        } catch (error) {
          console.error('[FormContext] Auto-notification failed:', error);
        }
      }
      
      return newForm;
    } catch (error) {
      console.error('[FormContext] Failed to save form:', error);
      throw error;
    }
  };


  const updateForm = async (id, formData) => {
    const existingForm = forms.find(f => f.id === id);
    
    if (!existingForm) {
      console.error('Form not found:', id);
      return;
    }

    // Check permission
    if (userData && !canCreateInBranch(existingForm.branchId)) {
      console.error('User cannot edit forms in this branch');
      throw new Error('You can only edit forms in your assigned branch');
    }

    const accessToken = existingForm.caseTracking?.accessToken || generateSecureAccessToken();
    const secureLink = existingForm.caseTracking?.secureLink || 
      generateSecureAccessLink(formData.patient?.patientId, accessToken);

    // Check for new DICOM file
    let orthancData = existingForm.orthancData || null;
    const dicomFile = formData.patient?.dicomFile;
    
    if (dicomFile instanceof File) {
      try {
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
        
        if (uploadResult.orthancResults && uploadResult.orthancResults.length > 0) {
          const successfulUpload = uploadResult.orthancResults.find(r => r.status === 'Uploaded to Orthanc');
          if (successfulUpload) {
            orthancData = {
              orthancId: successfulUpload.orthancId,
              parentStudy: successfulUpload.parentStudy,
              studyInstanceUID: successfulUpload.studyInstanceUID,
              uploadedAt: new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.error('[FormContext] DICOM upload failed:', error);
      }
    }

    const previousState = existingForm.caseTracking?.caseState || CASE_STATES.CREATED;
    
    const updatedForm = {
      ...existingForm,
      ...formData,
      patient: {
        ...formData.patient,
        diagnosticReport: getFileMetadata(formData.patient?.diagnosticReport),
        dicomFile: getFileMetadata(formData.patient?.dicomFile),
      },
      updatedAt: Date.now(),
      updatedBy: userData?.email || 'unknown',
      orthancData: orthancData,
      caseTracking: {
        ...existingForm.caseTracking,
        accessToken: accessToken,
        secureLink: secureLink,
        stateHistory: existingForm.caseTracking?.stateHistory || []
      }
    };

    const newState = calculateCaseState(updatedForm);
    updatedForm.caseTracking.caseState = newState;

    if (newState !== previousState) {
      let action = 'State updated';
      if (newState === CASE_STATES.DICOM_UPLOADED) {
        action = 'DICOM file uploaded';
      } else if (newState === CASE_STATES.REPORT_UPLOADED || newState === CASE_STATES.CASE_COMPLETE) {
        action = 'Report uploaded';
      }
      
      updatedForm.caseTracking.stateHistory.push({
        state: newState,
        timestamp: Date.now(),
        action: action,
        previousState: previousState
      });
    }

    // Update in Firebase
    try {
      await updateFormInFirebase(existingForm.branchId, id, updatedForm);
      console.log('[FormContext] Form updated in Firebase:', id);
    } catch (error) {
      console.error('[FormContext] Failed to update form:', error);
      throw error;
    }
  };

  const deleteForm = async (id) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;

    // Check permission
    if (userData && !canCreateInBranch(form.branchId)) {
      console.error('User cannot delete forms in this branch');
      throw new Error('You can only delete forms in your assigned branch');
    }

    try {
      await deleteFormFromFirebase(form.branchId, id);
      console.log('[FormContext] Form deleted from Firebase:', id);
    } catch (error) {
      console.error('[FormContext] Failed to delete form:', error);
      throw error;
    }
  };

  const archiveForm = async (id) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;

    // Check permission
    if (userData && !canCreateInBranch(form.branchId)) {
      throw new Error('You can only archive forms in your assigned branch');
    }

    try {
      await updateFormInFirebase(form.branchId, id, {
        isArchived: true,
        archivedAt: Date.now(),
        archivedBy: userData?.email || 'unknown'
      });
    } catch (error) {
      console.error('[FormContext] Failed to archive form:', error);
      throw error;
    }
  };

  const restoreForm = async (id) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;

    // Check permission
    if (userData && !canCreateInBranch(form.branchId)) {
      throw new Error('You can only restore forms in your assigned branch');
    }

    try {
      await updateFormInFirebase(form.branchId, id, {
        isArchived: false,
        restoredAt: Date.now(),
        restoredBy: userData?.email || 'unknown'
      });
    } catch (error) {
      console.error('[FormContext] Failed to restore form:', error);
      throw error;
    }
  };

  const activeForms = forms.filter((form) => !form.isArchived);
  const archivedForms = forms.filter((form) => form.isArchived);

  const getFormById = (id) => {
    return forms.find((form) => form.id === id);
  };

  const reloadForms = async () => {
    if (currentBranch) {
      setLoading(true);
      const loadedForms = await getFormsFromFirebase(currentBranch);
      setForms(loadedForms);
      setLoading(false);
    }
  };


  const recordNotification = async (id, messageType, result) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;

    const historyEntry = {
      messageType,
      sentAt: result.sentAt,
      status: result.success ? 'sent' : 'failed',
      sentBy: result.sentBy || 'staff',
      recipients: result.recipients || (messageType === MESSAGE_TYPES.INITIAL_SEND ? ['patient', 'doctor'] : ['doctor']),
      channelResults: result.channelStatus
    };

    let newNotificationStatus = form.notificationStatus || NOTIFICATION_STATUS.NOT_SENT;
    
    if (result.success) {
      if (messageType === MESSAGE_TYPES.INITIAL_SEND) {
        newNotificationStatus = NOTIFICATION_STATUS.INITIAL_SENT;
      } else if (messageType === MESSAGE_TYPES.REPORT_UPDATE) {
        newNotificationStatus = NOTIFICATION_STATUS.REPORT_SENT;
      }
    }

    const existingChannelStatus = form.channelStatus || { whatsapp: CHANNEL_STATUS.NOT_SENT, email: CHANNEL_STATUS.NOT_SENT };
    const newChannelStatus = { ...existingChannelStatus };
    
    if (result.channelStatus?.whatsapp === CHANNEL_STATUS.SENT) {
      newChannelStatus.whatsapp = CHANNEL_STATUS.SENT;
      newChannelStatus.whatsappSentAt = result.sentAt;
      newChannelStatus.whatsappError = null;
    } else if (result.channelStatus?.whatsapp === CHANNEL_STATUS.FAILED && existingChannelStatus.whatsapp !== CHANNEL_STATUS.SENT) {
      newChannelStatus.whatsapp = CHANNEL_STATUS.FAILED;
      newChannelStatus.whatsappError = result.channelStatus?.whatsappError || 'Send failed';
    }
    
    if (result.channelStatus?.email === CHANNEL_STATUS.SENT) {
      newChannelStatus.email = CHANNEL_STATUS.SENT;
      newChannelStatus.emailSentAt = result.sentAt;
      newChannelStatus.emailError = null;
    } else if (result.channelStatus?.email === CHANNEL_STATUS.FAILED && existingChannelStatus.email !== CHANNEL_STATUS.SENT) {
      newChannelStatus.email = CHANNEL_STATUS.FAILED;
      newChannelStatus.emailError = result.channelStatus?.emailError || 'Send failed';
    }

    const notificationHistory = form.notificationHistory || [];
    notificationHistory.push(historyEntry);

    const updatedFormData = {
      channelStatus: newChannelStatus,
      notificationStatus: newNotificationStatus,
      lastNotifiedAt: result.success ? result.sentAt : form.lastNotifiedAt,
      notificationHistory
    };
    
    const newCaseState = calculateCaseState({ ...form, ...updatedFormData });
    updatedFormData.caseTracking = {
      ...form.caseTracking,
      caseState: newCaseState
    };
    
    const previousState = form.caseTracking?.caseState;
    if (newCaseState !== previousState) {
      updatedFormData.caseTracking.stateHistory = [
        ...(form.caseTracking.stateHistory || []),
        {
          state: newCaseState,
          timestamp: Date.now(),
          action: 'Notification sent',
          previousState
        }
      ];
    }

    try {
      await updateFormInFirebase(form.branchId, id, updatedFormData);
      console.log('[FormContext] Notification recorded in Firebase:', id);
    } catch (error) {
      console.error('[FormContext] Failed to record notification:', error);
    }
  };

  const getCaseState = (form) => {
    return form?.caseTracking?.caseState || calculateCaseState(form);
  };

  const isPatientNotified = (form) => {
    return form?.notifications?.patient?.scanCompleteNotified || false;
  };

  const isDoctorDicomNotified = (form) => {
    return form?.notifications?.doctor?.dicomNotified || false;
  };

  const isDoctorReportNotified = (form) => {
    return form?.notifications?.doctor?.reportNotified || false;
  };

  const updateWhatsAppStatus = (id, whatsAppData) => {
    recordNotification(id, MESSAGE_TYPES.DOCTOR_DICOM_READY, whatsAppData);
  };

  const sendEmailNotifications = async (formId, messageType) => {
    const form = getFormById(formId);
    if (!form) {
      throw new Error('Form not found');
    }

    const doctorData = {
      doctorName: form.doctor?.doctorName,
      hospital: form.doctor?.hospital,
      doctorPhone: form.doctor?.doctorPhone,
      doctorEmail: form.doctor?.emailWhatsapp
    };

    const patientData = {
      patientName: form.patient?.patientName,
      patientId: form.patient?.patientId,
      patientPhone: form.patient?.phoneNumber,
      patientEmail: form.patient?.emailAddress
    };

    const caseData = {
      accessToken: form.caseTracking?.accessToken,
      studyInstanceUID: form.orthancData?.studyInstanceUID || form.orthancData?.parentStudy,
      caseId: form.id,
      viewerLink: (form.orthancData?.studyInstanceUID || form.orthancData?.parentStudy) ? 
        `${window.location.origin}/viewer?StudyInstanceUIDs=${form.orthancData.studyInstanceUID || form.orthancData.parentStudy}&token=${form.caseTracking?.accessToken}` :
        `${window.location.origin}/case/${form.caseTracking?.accessToken}`
    };

    try {
      const result = await sendEmailNotification(doctorData, patientData, caseData);
      await recordNotification(formId, messageType, {
        success: result.success,
        sentAt: result.sentAt,
        channelStatus: result.channelStatus,
        sentBy: 'system'
      });
      return result;
    } catch (error) {
      console.error('[FormContext] Email send failed:', error);
      await recordNotification(formId, messageType, {
        success: false,
        sentAt: Date.now(),
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
        loading,
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
        recordNotification,
        sendEmailNotifications,
        getCaseState,
        isPatientNotified,
        isDoctorDicomNotified,
        isDoctorReportNotified,
        CASE_STATES,
        MESSAGE_TYPES,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
