import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseStateBadge } from '../components/WhatsAppPreview';
import { NotificationModal, NotificationStatusBadge, MESSAGE_TYPES, CHANNEL_STATUS } from '../components/NotificationModal';
import { getFormsFromFirebase, updateFormInFirebase } from '../services/firebaseService';
import { BRANCHES } from '../config/branchConfig';
import './Pages.css';

const DEFAULT_BRANCHES = [
  { id: 'salem-gugai', branchName: 'ANBU – Salem (Gugai)', city: 'Salem' },
  { id: 'salem-lic', branchName: 'ANBU – Salem (LIC Colony)', city: 'Salem' },
  { id: 'ramanathapuram', branchName: 'ANBU – Ramanathapuram', city: 'Ramanathapuram' },
  { id: 'hosur', branchName: 'ANBU – Hosur', city: 'Hosur' },
];

const getBranches = () => {
  return DEFAULT_BRANCHES;
};

const getPatientsByBranch = async (branchId) => {
  try {
    const forms = await getFormsFromFirebase(branchId);
    return forms;
  } catch (error) {
    console.error('[BranchPatients] Error loading patients:', error);
    return [];
  }
};

const savePatientsToBranch = async (branchId, patients) => {
  // No longer needed - updates are done individually via updateFormInFirebase
  console.log('[BranchPatients] Batch save not needed - using individual updates');
};

const hasFileData = (fileData) => {
  if (!fileData) return false;
  if (fileData.hasFile) return true;
  if (fileData.dataURL) return true;
  if (fileData.name) return true;
  if (typeof fileData === 'string' && fileData.startsWith('data:')) return true;
  return false;
};


const BranchPatients = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientCounts, setPatientCounts] = useState({});
  const [showArchived, setShowArchived] = useState(false);
  const [notificationModal, setNotificationModal] = useState({ open: false, patient: null, messageType: MESSAGE_TYPES.INITIAL_SEND, retryChannel: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const loadBranchData = async () => {
    const branchList = getBranches();
    setBranches(branchList);
    const counts = {};
    
    // Load patient counts from Firebase for each branch
    for (const branch of branchList) {
      const branchPatients = await getPatientsByBranch(branch.id);
      counts[branch.id] = branchPatients.filter(p => !p.isArchived).length;
    }
    
    setPatientCounts(counts);
  };

  useEffect(() => { loadBranchData(); }, []);

  const activePatients = patients.filter(p => !p.isArchived);
  const archivedPatients = patients.filter(p => p.isArchived);
  const currentPatients = showArchived ? archivedPatients : activePatients;

  const filteredPatients = currentPatients.filter((patient) => {
    const patientId = (patient.patient?.patientId || '').toLowerCase();
    const patientName = (patient.patient?.patientName || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || patientId.includes(query) || patientName.includes(query);
    const patientDate = patient.createdAt ? new Date(patient.createdAt) : null;
    let matchesDate = true;
    if (dateFrom && patientDate) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && patientDate >= fromDate;
    }
    if (dateTo && patientDate) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && patientDate <= toDate;
    }
    return matchesSearch && matchesDate;
  });

  const handleResetFilters = () => { setSearchQuery(''); setDateFrom(''); setDateTo(''); };
  const handleBranchSelect = async (branch) => { 
    setSelectedBranch(branch); 
    const branchPatients = await getPatientsByBranch(branch.id);
    setPatients(branchPatients); 
  };
  const handleBack = () => { setSelectedBranch(null); setPatients([]); setShowArchived(false); handleResetFilters(); loadBranchData(); };


  const handleArchivePatient = async (patientId) => {
    if (window.confirm('Archive this patient record? You can restore it later.')) {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      
      try {
        await updateFormInFirebase(selectedBranch.id, patientId, {
          isArchived: true,
          archivedAt: new Date().toISOString()
        });
        
        const updated = patients.map(p => p.id === patientId ? { ...p, isArchived: true, archivedAt: new Date().toISOString() } : p);
        setPatients(updated);
        setPatientCounts(prev => ({ ...prev, [selectedBranch.id]: updated.filter(p => !p.isArchived).length }));
      } catch (error) {
        console.error('[BranchPatients] Error archiving patient:', error);
        alert('Failed to archive patient. Please try again.');
      }
    }
  };

  const handleRestorePatient = async (patientId) => {
    if (window.confirm('Restore this patient record to active?')) {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      
      try {
        await updateFormInFirebase(selectedBranch.id, patientId, {
          isArchived: false,
          restoredAt: new Date().toISOString()
        });
        
        const updated = patients.map(p => p.id === patientId ? { ...p, isArchived: false, restoredAt: new Date().toISOString() } : p);
        setPatients(updated);
        setPatientCounts(prev => ({ ...prev, [selectedBranch.id]: updated.filter(p => !p.isArchived).length }));
      } catch (error) {
        console.error('[BranchPatients] Error restoring patient:', error);
        alert('Failed to restore patient. Please try again.');
      }
    }
  };

  const handleViewReport = (patient) => {
    const reportData = patient.patient?.diagnosticReport;
    
    // Check for reportUrl (cloud storage URL) first
    if (reportData?.reportUrl) {
      window.open(reportData.reportUrl, '_blank');
    }
    // Fallback to dataURL (base64 data)
    else if (reportData?.dataURL) {
      window.open(reportData.dataURL, '_blank');
    }
    // If file exists but no URL
    else if (reportData?.hasFile || reportData?.name) {
      alert(`Report file: ${reportData.name || 'Unknown'}\nFile was uploaded but URL not available.`);
    }
    // No report at all
    else {
      alert('No report file available for this patient.');
    }
  };

  const handleViewDicom = (patient) => {
    const dicomData = patient.patient?.dicomFile;
    
    // Check if DICOM file exists and has been uploaded
    if (dicomData?.hasFile || dicomData?.dataURL) {
      // Navigate to DICOM viewer with the patient's form ID
      navigate(`/viewer/${patient.id}`);
    } 
    // No DICOM file available
    else {
      alert('No DICOM file available for this patient.');
    }
  };

  // Retry handlers for failed notifications
  const handleRetryWhatsApp = (patient) => {
    setNotificationModal({ 
      open: true, 
      patient, 
      messageType: MESSAGE_TYPES.INITIAL_SEND, 
      retryChannel: 'whatsapp' 
    });
  };

  const handleRetryEmail = (patient) => {
    setNotificationModal({ 
      open: true, 
      patient, 
      messageType: MESSAGE_TYPES.INITIAL_SEND, 
      retryChannel: 'email' 
    });
  };

  // Determine notification action based on status and actual file uploads
  const getNotificationAction = (patient) => {
    const hasDicom = hasFileData(patient.patient?.dicomFile);
    const hasReport = hasFileData(patient.patient?.diagnosticReport);
    
    const initialSent = patient.notificationStatus === 'INITIAL_SENT' || patient.notificationStatus === 'REPORT_SENT';
    const reportSent = patient.notificationStatus === 'REPORT_SENT';

    // Stage 1: DICOM uploaded, initial notification not sent yet
    if (!initialSent && hasDicom) {
      return { 
        type: MESSAGE_TYPES.INITIAL_SEND, 
        label: 'Send Notification', 
        icon: 'notify',
        enabled: true 
      };
    } 
    // Stage 2: Initial sent, report now available - send report update
    else if (initialSent && !reportSent && hasReport) {
      return { 
        type: MESSAGE_TYPES.REPORT_UPDATE, 
        label: 'Send Report', 
        icon: 'report',
        enabled: true 
      };
    } 
    // All done - report sent
    else if (reportSent) {
      return { 
        type: null, 
        label: 'All Sent', 
        icon: 'done',
        enabled: false 
      };
    } 
    // Initial sent but no report yet
    else if (initialSent && !hasReport) {
      return { 
        type: null, 
        label: 'Notified', 
        icon: 'done',
        enabled: false 
      };
    }
    // No DICOM uploaded yet
    return { 
      type: null, 
      label: 'Upload DICOM', 
      icon: 'none', 
      enabled: false,
      reason: 'NO_DICOM'
    };
  };

  const handleNotificationClick = (patient) => {
    // Validate required data - use doctor.doctorPhone and doctor.emailWhatsapp as single source of truth
    const missingFields = [];
    if (!patient?.patient?.patientId) missingFields.push('Patient ID');
    if (!patient?.patient?.patientName) missingFields.push('Patient Name');
    if (!patient?.patient?.phoneNumber) missingFields.push('Patient Phone');
    
    // Doctor contact validation - these are the single source of truth
    const doctorPhone = patient?.doctor?.doctorPhone;
    const doctorEmail = patient?.doctor?.emailWhatsapp;
    const hasDoctorPhone = doctorPhone && /^\d{10}$/.test(doctorPhone);
    const hasDoctorEmail = doctorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctorEmail);
    
    if (!hasDoctorPhone && !hasDoctorEmail) {
      setToast({
        show: true,
        message: 'Cannot send notification. Doctor phone and email are missing. Please edit the referral form.',
        type: 'error'
      });
      return;
    }
    
    if (missingFields.length > 0) {
      setToast({
        show: true,
        message: `Cannot send notification. Missing: ${missingFields.join(', ')}`,
        type: 'error'
      });
      return;
    }

    const action = getNotificationAction(patient);

    if (!action.enabled) {
      if (action.reason === 'NO_DICOM') {
        setToast({
          show: true,
          message: 'Please upload DICOM file before sending notifications.',
          type: 'error'
        });
      } else if (action.label === 'Notified') {
        setToast({
          show: true,
          message: 'Initial notification sent. Upload report to send update.',
          type: 'error'
        });
      } else if (action.label === 'All Sent') {
        setToast({
          show: true,
          message: 'All notifications already sent for this case.',
          type: 'error'
        });
      }
      return;
    }

    if (action.type) {
      setNotificationModal({ open: true, patient, messageType: action.type });
    }
  };

  const handleNotificationSend = async (result) => {
    if (notificationModal.patient) {
      const patient = notificationModal.patient;
      
      // Update channelStatus
      const existingChannelStatus = patient.channelStatus || { whatsapp: 'NOT_SENT', email: 'NOT_SENT' };
      const newChannelStatus = { ...existingChannelStatus };
      
      if (result.channelStatus?.whatsapp === 'SENT') {
        newChannelStatus.whatsapp = 'SENT';
        newChannelStatus.whatsappSentAt = result.sentAt;
      }
      if (result.channelStatus?.email === 'SENT') {
        newChannelStatus.email = 'SENT';
        newChannelStatus.emailSentAt = result.sentAt;
      }
      
      // Calculate new case state
      const hasDicom = hasFileData(patient.patient?.dicomFile);
      const hasReport = hasFileData(patient.patient?.diagnosticReport);
      const doctorNotified = newChannelStatus.whatsapp === 'SENT' || newChannelStatus.email === 'SENT';
      
      let newCaseState = patient.caseTracking?.caseState || 'CREATED';
      if (hasDicom && hasReport && doctorNotified) {
        newCaseState = 'CASE_COMPLETE';
      } else if (hasDicom && hasReport && !doctorNotified) {
        newCaseState = 'REPORT_UPLOADED';
      } else if (hasDicom && !hasReport) {
        newCaseState = 'DICOM_UPLOADED';
      }
      
      // Update in Firebase
      try {
        await updateFormInFirebase(selectedBranch.id, patient.id, {
          notificationStatus: result.success 
            ? (result.messageType === MESSAGE_TYPES.INITIAL_SEND ? 'INITIAL_SENT' : 'REPORT_SENT')
            : patient.notificationStatus,
          channelStatus: newChannelStatus,
          lastNotifiedAt: result.sentAt,
          caseTracking: {
            ...patient.caseTracking,
            caseState: newCaseState
          }
        });
        
        // Update local state
        const updated = patients.map(p => {
          if (p.id !== patient.id) return p;
          return { 
            ...p, 
            notificationStatus: result.success 
              ? (result.messageType === MESSAGE_TYPES.INITIAL_SEND ? 'INITIAL_SENT' : 'REPORT_SENT')
              : p.notificationStatus,
            channelStatus: newChannelStatus,
            lastNotifiedAt: result.sentAt,
            caseTracking: {
              ...p.caseTracking,
              caseState: newCaseState
            }
          };
        });
        setPatients(updated);
        
        if (result.allSuccess) {
          setToast({
            show: true,
            message: result.messageType === MESSAGE_TYPES.INITIAL_SEND 
              ? 'Notifications sent to patient & doctor' 
              : 'Report update sent to doctor',
            type: 'success'
          });
        } else if (result.success) {
          setToast({
            show: true,
            message: 'Some notifications sent. Check status for details.',
            type: 'success'
          });
        } else {
          setToast({ show: true, message: 'Notification sending failed. Please retry.', type: 'error' });
        }
      } catch (error) {
        console.error('[BranchPatients] Error updating notification status:', error);
        setToast({ show: true, message: 'Failed to update notification status.', type: 'error' });
      }
    }
  };

  const handleNotificationModalClose = () => {
    setNotificationModal({ open: false, patient: null, messageType: MESSAGE_TYPES.INITIAL_SEND, retryChannel: null });
  };

  // Branch Selection View
  if (!selectedBranch) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Branch Patients</h1>
          <p className="page-subtitle">Select a branch to view patients</p>
        </div>
        <div className="branch-cards">
          {branches.map((branch) => (
            <div key={branch.id} className="branch-card" onClick={() => handleBranchSelect(branch)}>
              <div className="branch-card-icon">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div className="branch-card-info">
                <h3 className="branch-card-name">{branch.branchName}</h3>
                <p className="branch-card-city">{branch.city}</p>
              </div>
              <div className="branch-card-count">
                <span className="count-number">{patientCounts[branch.id] || 0}</span>
                <span className="count-label">Active</span>
              </div>
              <div className="branch-card-arrow">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  // Patient List View
  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back to Branches
        </button>
        <h1 className="page-title">{selectedBranch.branchName}</h1>
        <p className="page-subtitle">{selectedBranch.city}</p>
      </div>

      <div className="forms-summary">
        <div className="summary-card">
          <span className="summary-number">{activePatients.length}</span>
          <span className="summary-label">Active</span>
        </div>
        <div className="summary-card archived-card">
          <span className="summary-number">{archivedPatients.length}</span>
          <span className="summary-label">Archived</span>
        </div>
        <button className={`btn ${showArchived ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShowArchived(!showArchived)} style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {showArchived ? 'View Active' : 'View Archived'}
        </button>
      </div>

      {showArchived && (
        <div className="archived-indicator">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
          </svg>
          Viewing archived records - these can be restored to active
        </div>
      )}

      <div className="search-filter-section">
        <div className="search-box">
          <svg viewBox="0 0 24 24" className="search-icon">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input type="text" placeholder="Search by Patient ID or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
        </div>
        <div className="date-filters">
          <div className="date-filter-group">
            <label>From:</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="date-input" />
          </div>
          <div className="date-filter-group">
            <label>To:</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="date-input" />
          </div>
          {(searchQuery || dateFrom || dateTo) && <button className="btn-reset" onClick={handleResetFilters}>Clear Filters</button>}
        </div>
      </div>

      {filteredPatients.length !== currentPatients.length && (
        <div className="filter-results-info">Showing {filteredPatients.length} of {currentPatients.length} {showArchived ? 'archived' : 'active'} records</div>
      )}


      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path fill="#ccc" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <h3>{searchQuery || dateFrom || dateTo ? 'No Matching Records' : (showArchived ? 'No Archived Patients' : 'No Active Patients')}</h3>
          <p>{searchQuery || dateFrom || dateTo ? 'No records match your search criteria.' : (showArchived ? 'No archived patient records.' : 'No active patient records.')}</p>
        </div>
      ) : (
        <>
          <div className="patients-table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Case Status</th>
                  <th>Notifications</th>
                  <th>Report</th>
                  <th>DICOM</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => {
                  const notificationAction = getNotificationAction(patient);
                  return (
                    <tr key={patient.id}>
                      <td className="patient-id">{patient.patient?.patientId || '-'}</td>
                      <td className="patient-name">{patient.patient?.patientName || '-'}</td>
                      <td><CaseStateBadge caseState={patient.caseTracking?.caseState} channelStatus={patient.channelStatus} /></td>
                      <td>
                        <NotificationStatusBadge 
                          whatsappStatus={patient.channelStatus?.whatsapp || CHANNEL_STATUS.NOT_SENT}
                          emailStatus={patient.channelStatus?.email || CHANNEL_STATUS.NOT_SENT}
                          whatsappError={patient.channelStatus?.whatsappError}
                          emailError={patient.channelStatus?.emailError}
                          onRetryWhatsApp={patient.channelStatus?.whatsapp === CHANNEL_STATUS.FAILED ? () => handleRetryWhatsApp(patient) : null}
                          onRetryEmail={patient.channelStatus?.email === CHANNEL_STATUS.FAILED ? () => handleRetryEmail(patient) : null}
                        />
                      </td>
                      <td>
                        <button className={`file-btn report-btn ${!hasFileData(patient.patient?.diagnosticReport) ? 'disabled' : ''}`} onClick={() => handleViewReport(patient)} disabled={!hasFileData(patient.patient?.diagnosticReport)} title="View Report">
                          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                          Report
                        </button>
                      </td>
                      <td>
                        <button className={`file-btn dicom-btn ${!hasFileData(patient.patient?.dicomFile) ? 'disabled' : ''}`} onClick={() => handleViewDicom(patient)} disabled={!hasFileData(patient.patient?.dicomFile)} title="View DICOM">
                          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" /></svg>
                          DICOM
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {!showArchived && (
                            <button
                              className={`action-btn ${notificationAction.icon === 'report' ? 'report-notify' : 'notify'} ${!notificationAction.enabled ? 'sent' : ''}`}
                              onClick={() => handleNotificationClick(patient)}
                              title={notificationAction.label}
                            >
                              {notificationAction.icon === 'report' ? (
                                <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                              ) : notificationAction.icon === 'done' ? (
                                <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
                              )}
                            </button>
                          )}
                          {showArchived ? (
                            <button className="action-btn restore" onClick={() => handleRestorePatient(patient.id)} title="Restore">
                              <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" /></svg>
                            </button>
                          ) : (
                            <button className="action-btn delete" onClick={() => handleArchivePatient(patient.id)} title="Archive">
                              <svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" /></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


          {/* Mobile Cards */}
          <div className="patients-mobile">
            {filteredPatients.map((patient) => {
              const notificationAction = getNotificationAction(patient);
              return (
                <div key={patient.id} className="patient-card-mobile">
                  <div className="patient-card-header">
                    <span className="patient-id-mobile">{patient.patient?.patientId || '-'}</span>
                    <div className="patient-card-header-actions">
                      {!showArchived && (
                        <button
                          className={`action-btn ${notificationAction.icon === 'report' ? 'report-notify' : 'notify'} ${!notificationAction.enabled ? 'sent' : ''}`}
                          onClick={() => handleNotificationClick(patient)}
                          title={notificationAction.label}
                        >
                          {notificationAction.icon === 'done' ? (
                            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
                          )}
                        </button>
                      )}
                      {showArchived ? (
                        <button className="action-btn restore" onClick={() => handleRestorePatient(patient.id)} title="Restore">
                          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" /></svg>
                        </button>
                      ) : (
                        <button className="action-btn delete" onClick={() => handleArchivePatient(patient.id)} title="Archive">
                          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 className="patient-name-mobile">{patient.patient?.patientName || '-'}</h4>
                  <div className="patient-status-mobile">
                    <CaseStateBadge caseState={patient.caseTracking?.caseState} channelStatus={patient.channelStatus} />
                    <NotificationStatusBadge 
                      whatsappStatus={patient.channelStatus?.whatsapp || CHANNEL_STATUS.NOT_SENT}
                      emailStatus={patient.channelStatus?.email || CHANNEL_STATUS.NOT_SENT}
                      whatsappError={patient.channelStatus?.whatsappError}
                      emailError={patient.channelStatus?.emailError}
                      compact
                    />
                  </div>
                  <div className="patient-card-actions">
                    <button className={`file-btn report-btn ${!hasFileData(patient.patient?.diagnosticReport) ? 'disabled' : ''}`} onClick={() => handleViewReport(patient)} disabled={!hasFileData(patient.patient?.diagnosticReport)}>
                      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                      Report
                    </button>
                    <button className={`file-btn dicom-btn ${!hasFileData(patient.patient?.dicomFile) ? 'disabled' : ''}`} onClick={() => handleViewDicom(patient)} disabled={!hasFileData(patient.patient?.dicomFile)}>
                      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" /></svg>
                      DICOM
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <NotificationModal
        isOpen={notificationModal.open}
        onClose={handleNotificationModalClose}
        patient={notificationModal.patient}
        branchName={selectedBranch?.branchName || ''}
        onSend={handleNotificationSend}
        messageType={notificationModal.messageType}
        notificationStatus={notificationModal.patient?.channelStatus}
        retryChannel={notificationModal.retryChannel}
        hasReportFile={hasFileData(notificationModal.patient?.patient?.diagnosticReport)}
      />

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default BranchPatients;
