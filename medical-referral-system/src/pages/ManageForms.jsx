import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormContext } from '../context/FormContext';
import TableView from '../components/TableView/TableView';
import Modal from '../components/Modal/Modal';
import BranchIndicator from '../components/BranchIndicator/BranchIndicator';
import { CaseStateBadge } from '../components/WhatsAppPreview';
import { NotificationModal, NotificationStatusBadge, MESSAGE_TYPES, CHANNEL_STATUS } from '../components/NotificationModal';
import { formatDate } from '../utils/formUtils';
import { uploadReport } from '../services/api';
import { sendOnlyReportNotification, buildDiagnosticServicesText, buildReasonForReferralText } from '../services/watiService';
import './Pages.css';

const ManageForms = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeForms, archivedForms, forms, archiveForm, restoreForm, reloadForms, getBranchName, currentBranch, recordNotification, updateForm, deleteForm } = useFormContext();
  const [archiveModal, setArchiveModal] = useState({ open: false, form: null });
  const [restoreModal, setRestoreModal] = useState({ open: false, form: null });
  const [showArchived, setShowArchived] = useState(searchParams.get('archived') === 'true');
  const [notificationModal, setNotificationModal] = useState({ open: false, form: null, messageType: MESSAGE_TYPES.INITIAL_SEND, retryChannel: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Report Upload Modal State
  const [reportUploadModal, setReportUploadModal] = useState({
    open: false,
    form: null,
    step: 'upload', // 'upload' | 'notify'
    isUploading: false,
    uploadedFile: null,
    isReplacing: false // Track if we're replacing an existing report
  });
  const fileInputRef = useRef(null);

  // Search and filter state - Initialize from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest'); // 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'recent-update'
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL'); // 'ALL' | 'WAITING_DICOM' | 'DICOM_ONLY' | 'REPORT_READY'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const formsPerPage = 25;

  // Sync state changes to URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (showArchived) params.set('archived', 'true');

    setSearchParams(params, { replace: true });
  }, [searchQuery, dateFrom, dateTo, sortBy, statusFilter, currentPage, showArchived, setSearchParams]);

  // Reset pagination when filters, sorts or view type changes (only if it wasn't just read from URL on mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo, showArchived, sortBy, statusFilter]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showArchived]);

  // Reload forms from storage when component mounts
  useEffect(() => {
    reloadForms();
  }, []);

  // Get the current list based on view mode
  const currentForms = showArchived ? archivedForms : activeForms;

  // Helper to check if file data exists (Used by filters and actions)
  const hasFileData = (fileData) => {
    if (!fileData) return false;
    if (fileData.hasFile) return true;
    if (fileData.name) return true;
    if (fileData.dataURL) return true;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) return true;
    return false;
  };

  // Filter forms based on search, date and status
  const filteredForms = currentForms.filter((form) => {
    const patientId = (form.patient?.patientId || '').toLowerCase();
    const patientName = (form.patient?.patientName || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = !query ||
      patientId.includes(query) ||
      patientName.includes(query);

    const formDate = form.createdAt ? new Date(form.createdAt) : null;
    let matchesDate = true;

    if (dateFrom && formDate) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && formDate >= fromDate;
    }

    if (dateTo && formDate) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && formDate <= toDate;
    }

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      const hasDicom = hasFileData(form.patient?.dicomFile);
      const hasReport = hasFileData(form.patient?.diagnosticReport);

      if (statusFilter === 'WAITING_DICOM') {
        matchesStatus = !hasDicom;
      } else if (statusFilter === 'DICOM_ONLY') {
        matchesStatus = hasDicom && !hasReport;
      } else if (statusFilter === 'REPORT_READY') {
        matchesStatus = hasDicom && hasReport;
      }
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  // Sort the filtered forms
  const sortedForms = [...filteredForms].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    } else if (sortBy === 'name-asc') {
      return (a.patient?.patientName || '').localeCompare(b.patient?.patientName || '');
    } else if (sortBy === 'name-desc') {
      return (b.patient?.patientName || '').localeCompare(a.patient?.patientName || '');
    } else if (sortBy === 'recent-update') {
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    }
    return 0;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
    setStatusFilter('ALL');
  };

  // Retry handlers for failed notifications
  const handleRetryWhatsApp = (form) => {
    setNotificationModal({
      open: true,
      form,
      messageType: MESSAGE_TYPES.INITIAL_SEND,
      retryChannel: 'whatsapp'
    });
  };

  const handleRetryEmail = (form) => {
    setNotificationModal({
      open: true,
      form,
      messageType: MESSAGE_TYPES.INITIAL_SEND,
      retryChannel: 'email'
    });
  };

  // Report Upload Handlers
  const handleOpenReportUpload = (form, isReplacing = false) => {
    setReportUploadModal({
      open: true,
      form,
      step: 'upload',
      isUploading: false,
      uploadedFile: null,
      isReplacing
    });
  };

  const handleCloseReportUpload = () => {
    setReportUploadModal({
      open: false,
      form: null,
      step: 'upload',
      isUploading: false,
      uploadedFile: null,
      isReplacing: false
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate PDF
      if (file.type !== 'application/pdf') {
        setToast({ show: true, message: 'Please select a PDF file only.', type: 'error' });
        return;
      }
      // Validate size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setToast({ show: true, message: 'File size must be less than 50MB.', type: 'error' });
        return;
      }
      setReportUploadModal(prev => ({ ...prev, uploadedFile: file }));
    }
  };

  const handleReportUploadConfirm = async () => {
    if (!reportUploadModal.uploadedFile || !reportUploadModal.form) return;

    setReportUploadModal(prev => ({ ...prev, isUploading: true }));

    try {
      const file = reportUploadModal.uploadedFile;
      const form = reportUploadModal.form;
      const isReplacing = reportUploadModal.isReplacing;

      // Actually upload to backend (not just metadata)
      console.log('[ManageForms] Uploading report to backend...', {
        formId: form.id,
        fileName: file.name,
        isReplacing
      });

      const result = await uploadReport(form.id, file, form, currentBranch, isReplacing);

      console.log('[ManageForms] Report upload result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update form with report URL from backend
      const updatedFormData = {
        ...form,
        patient: {
          ...form.patient,
          diagnosticReport: {
            name: file.name,
            type: file.type,
            size: file.size,
            hasFile: true,
            uploadedAt: new Date().toISOString(),
            reportUrl: result.reportUrl // URL from cloud storage
          }
        }
      };

      // Save to local storage
      updateForm(form.id, updatedFormData);
      reloadForms();

      setToast({
        show: true,
        message: isReplacing ? 'Report replaced and email sent!' : 'Report uploaded and email sent!',
        type: 'success'
      });

      // Auto-send WhatsApp notification via WATI for report upload
      if (form.doctor?.doctorPhone) {
        try {
          console.log('[ManageForms] Auto-sending WhatsApp report notification via WATI...');
          const diagnosticServices = form.diagnosticServices || form.patient?.diagnosticServices || {};
          const studyType = Object.entries(diagnosticServices)
            .filter(([, v]) => v)
            .map(([k]) => k.replace(/([A-Z])/g, ' $1').trim())
            .join(', ') || 'DICOM Scan';

          // Build text for diagnostic services and reason for referral
          const diagnosticServicesText = buildDiagnosticServicesText(form.diagnosticServices || form.patient?.diagnosticServices);
          const reasonForReferralText = buildReasonForReferralText(form.reasonForReferral || form.patient?.reasonForReferral);

          // Get report URL from the upload result
          const reportUrl = result.reportUrl || `https://nice4-d7886.web.app/viewer/${form.id}`;

          const watiResult = await sendOnlyReportNotification({
            doctorName: form.doctor?.doctorName || 'Doctor',
            doctorPhone: form.doctor?.doctorPhone,
            patientName: form.patient?.patientName || 'Patient',
            patientId: form.patient?.patientId || '-',
            studyType: studyType,
            diagnosticServicesText: diagnosticServicesText,
            reasonForReferralText: reasonForReferralText,
            reportUrl: reportUrl,
          });
          console.log('[ManageForms] WATI only_report_uploaded result:', watiResult);

          // Persist WhatsApp send result to Firebase for analytics tracking
          const now = new Date().toISOString();
          const whatsappStatus = watiResult.success ? 'SENT' : 'FAILED';
          recordNotification(form.id, MESSAGE_TYPES.REPORT_UPDATE, {
            success: watiResult.success,
            sentAt: now,
            sentBy: 'auto',
            channelStatus: {
              whatsapp: whatsappStatus,
              whatsappError: watiResult.success ? null : (watiResult.error || 'Send failed'),
            }
          });
          console.log('[ManageForms] WhatsApp result persisted to Firebase:', whatsappStatus);
        } catch (error) {
          console.error('[ManageForms] Auto WhatsApp report notification failed:', error);
        }
      }

      // Close modal - email already sent by backend
      handleCloseReportUpload();

    } catch (error) {
      console.error('Report upload error:', error);
      setToast({ show: true, message: 'Failed to upload report. Please try again.', type: 'error' });
      setReportUploadModal(prev => ({ ...prev, isUploading: false }));
    }
  };

  const handleViewReport = (form) => {
    const reportData = form.patient?.diagnosticReport;

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
      setToast({
        show: true,
        message: `Report: ${reportData.name || 'Unknown'} - File metadata stored but URL not available`,
        type: 'warning'
      });
    }
    // No report at all
    else {
      setToast({ show: true, message: 'No report file available.', type: 'error' });
    }
  };

  const handleView = (form) => {
    navigate(`/view/${form.id}`);
  };

  const handleEdit = (form) => {
    navigate(`/edit/${form.id}`);
  };

  const handleArchiveClick = (form) => {
    setArchiveModal({ open: true, form });
  };

  const handleArchiveConfirm = () => {
    if (archiveModal.form) {
      archiveForm(archiveModal.form.id);
    }
    setArchiveModal({ open: false, form: null });
  };

  const handleRestoreClick = (form) => {
    setRestoreModal({ open: true, form });
  };

  const handleRestoreConfirm = () => {
    if (restoreModal.form) {
      restoreForm(restoreModal.form.id);
    }
    setRestoreModal({ open: false, form: null });
  };

  // Determine notification action based on status and actual file uploads
  const getNotificationAction = (row) => {
    // Check actual file data
    const hasDicom = hasFileData(row.patient?.dicomFile);
    const hasReport = hasFileData(row.patient?.diagnosticReport);

    // Determine action based solely on file presence, since user wants to share multiple times
    if (!hasDicom) {
      return {
        type: null,
        label: 'Upload DICOM',
        icon: 'none',
        enabled: false,
        reason: 'NO_DICOM'
      };
    }

    if (hasReport) {
      return {
        type: MESSAGE_TYPES.REPORT_UPDATE,
        label: 'Send Notification',
        icon: 'notify',
        enabled: true
      };
    }

    return {
      type: MESSAGE_TYPES.INITIAL_SEND,
      label: 'Send Notification',
      icon: 'notify',
      enabled: true
    };
  };

  const handleNotificationClick = (form) => {
    console.log('[Notification] Click handler triggered', { formId: form?.id });

    // Validate required data - use doctor.doctorPhone and doctor.emailWhatsapp as single source of truth
    const missingFields = [];
    if (!form?.patient?.patientId) missingFields.push('Patient ID');
    if (!form?.patient?.patientName) missingFields.push('Patient Name');
    if (!form?.patient?.phoneNumber) missingFields.push('Patient Phone');

    // Doctor contact validation - these are the single source of truth
    const doctorPhone = form?.doctor?.doctorPhone;
    const doctorEmail = form?.doctor?.emailWhatsapp;
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

    const action = getNotificationAction(form);

    if (!action.enabled) {
      if (action.reason === 'NO_DICOM') {
        setToast({
          show: true,
          message: 'Please upload DICOM file before sending notifications.',
          type: 'error'
        });
      }
      return;
    }

    if (action.type) {
      setNotificationModal({ open: true, form, messageType: action.type });
    }
  };

  const handleNotificationSend = (result) => {
    if (notificationModal.form) {
      // Record the notification with channel status
      recordNotification(notificationModal.form.id, result.messageType, {
        ...result,
        channelStatus: result.channelStatus
      });
      reloadForms();

      if (result.allSuccess) {
        setToast({
          show: true,
          message: result.messageType === MESSAGE_TYPES.INITIAL_SEND
            ? 'Notifications sent to patient & doctor'
            : result.messageType === MESSAGE_TYPES.REPORT_REPLACED
              ? 'Updated report notification sent to doctor'
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
        setToast({
          show: true,
          message: 'Notification sending failed. Please retry.',
          type: 'error'
        });
      }
    }
  };

  const handleNotificationModalClose = () => {
    setNotificationModal({ open: false, form: null, messageType: MESSAGE_TYPES.INITIAL_SEND, retryChannel: null });
  };

  const renderActions = (row) => {
    const notificationAction = getNotificationAction(row);

    return (
      <div className="action-buttons">
        <button
          className={`action-btn notify ${!notificationAction.enabled ? 'disabled' : ''}`}
          onClick={() => handleNotificationClick(row)}
          title="Send Notification"
          aria-label="Send Notification"
          disabled={!notificationAction.enabled}
          style={{ color: notificationAction.enabled ? '#0284c7' : '#9ca3af' }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
        </button>
        <button
          className="action-btn view"
          onClick={() => handleView(row)}
          title="View"
          aria-label="View form"
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        </button>
        {!showArchived && (
          <button
            className="action-btn edit"
            onClick={() => handleEdit(row)}
            title="Edit"
            aria-label="Edit form"
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
        )}
        {showArchived ? (
          <button
            className="action-btn restore"
            onClick={() => handleRestoreClick(row)}
            title="Restore"
            aria-label="Restore form"
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
            </svg>
          </button>
        ) : (
          <button
            className="action-btn delete"
            onClick={() => handleArchiveClick(row)}
            title="Archive"
            aria-label="Archive form"
          >
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  const indexOfLastForm = currentPage * formsPerPage;
  const indexOfFirstForm = indexOfLastForm - formsPerPage;
  const currentFormsForPage = sortedForms.slice(indexOfFirstForm, indexOfLastForm);
  const totalPages = Math.ceil(sortedForms.length / formsPerPage);

  const pageIds = currentFormsForPage.map((f) => f.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const ids = currentFormsForPage.map((f) => f.id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  };

  const columns = [
    {
      key: '_select',
      label: (
        <input
          type="checkbox"
          className="table-row-select-all"
          aria-label="Select all on this page"
          checked={allOnPageSelected}
          onChange={toggleSelectAllOnPage}
          disabled={pageIds.length === 0}
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          className="table-row-select"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select case ${row.patient?.patientName || row.id}`}
        />
      ),
    },
    {
      key: 'serialNo',
      label: 'S.No',
      render: (_, row, index) => (currentPage - 1) * formsPerPage + index + 1,
    },
    {
      key: 'patientId',
      label: 'Patient ID',
      render: (_, row) => row.patient?.patientId || '-',
    },
    {
      key: 'patientName',
      label: 'Patient Name',
      render: (_, row) => row.patient?.patientName || '-',
    },
    {
      key: 'caseStatus',
      label: 'Case Status',
      render: (_, row) => <CaseStateBadge caseState={row.caseTracking?.caseState} channelStatus={row.channelStatus} />,
    },
    {
      key: 'report',
      label: 'Report',
      render: (_, row) => {
        const hasReport = hasFileData(row.patient?.diagnosticReport);
        return hasReport ? (
          <div className="report-actions-group">
            <button
              className="file-action-btn view-report"
              onClick={(e) => { e.stopPropagation(); handleViewReport(row); }}
              title="View Report"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              View
            </button>
            <button
              className="file-action-btn edit-report"
              onClick={(e) => { e.stopPropagation(); handleOpenReportUpload(row, true); }}
              title="Replace Report"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Edit
            </button>
          </div>
        ) : (
          <button
            className="file-action-btn upload-report"
            onClick={(e) => { e.stopPropagation(); handleOpenReportUpload(row, false); }}
            title="Upload Report"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
            </svg>
            Upload
          </button>
        );
      },
    },
    {
      key: 'doctorName',
      label: 'Doctor',
      render: (_, row) => row.doctor?.doctorName || '-',
    },
    {
      key: 'date',
      label: 'Date',
      render: (_, row) => formatDate(row.patient?.date),
    },
  ];

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setDeletingBulk(true);
    let failed = 0;
    for (const id of ids) {
      try {
        await deleteForm(id);
      } catch {
        failed += 1;
      }
    }
    setDeletingBulk(false);
    setDeleteModalOpen(false);
    setSelectedIds([]);
    setToast({
      show: true,
      message: failed
        ? `Deleted ${ids.length - failed} case(s). ${failed} failed (permission or network).`
        : `Permanently deleted ${ids.length} case(s).`,
      type: failed ? 'warning' : 'success',
    });
  };

  return (
    <div className="page-container">
      <BranchIndicator />

      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Forms</h1>
          <p className="page-subtitle">
            {showArchived ? 'Viewing archived forms' : 'View, edit, or archive submitted referral forms'}
          </p>
        </div>
        <div className="header-actions">
          <button
            className={`btn ${showArchived ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowArchived(!showArchived)}
          >
            <svg viewBox="0 0 24 24" className="btn-icon">
              <path fill="currentColor" d={showArchived
                ? "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                : "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"
              } />
            </svg>
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          {!showArchived && (
            <button className="btn btn-primary" onClick={() => navigate('/create')}>
              <svg viewBox="0 0 24 24" className="btn-icon">
                <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z" />
              </svg>
              New Form
            </button>
          )}
        </div>
      </div>

      <div className="forms-summary">
        <div className="summary-card">
          <span className="summary-number">{activeForms.length}</span>
          <span className="summary-label">Active Forms</span>
        </div>
        <div className="summary-card archived-card">
          <span className="summary-number">{archivedForms.length}</span>
          <span className="summary-label">Archived</span>
        </div>
        <div className="summary-card total-card">
          <span className="summary-number">{forms.length}</span>
          <span className="summary-label">Total</span>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <svg viewBox="0 0 24 24" className="search-icon">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Patient ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="date-filters">
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Cases</option>
              <option value="WAITING_DICOM">Waiting for DICOM</option>
              <option value="DICOM_ONLY">DICOM Only (No Report)</option>
              <option value="REPORT_READY">Report Ready</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Patient Name (A-Z)</option>
              <option value="name-desc">Patient Name (Z-A)</option>
              <option value="recent-update">Recently Updated</option>
            </select>
          </div>
          <div className="date-filter-group">
            <label>From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-filter-group">
            <label>To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="date-input"
            />
          </div>
          {(searchQuery || dateFrom || dateTo || sortBy !== 'newest' || statusFilter !== 'ALL') && (
            <button className="btn-reset" onClick={handleResetFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {sortedForms.length !== forms.length && (
        <div className="filter-results-info">
          Showing {sortedForms.length} of {forms.length} records
        </div>
      )}

      {sortedForms.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-selection-count">
            {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select cases to delete'}
          </span>
          <div className="bulk-actions-buttons">
            {selectedIds.length > 0 && (
              <button type="button" className="btn btn-outline bulk-clear-btn" onClick={() => setSelectedIds([])}>
                Clear selection
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger"
              disabled={selectedIds.length === 0}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete selected
            </button>
          </div>
        </div>
      )}

      <div className="manage-forms-table-wrap">
        <TableView
          columns={columns}
          data={currentFormsForPage}
          actions={renderActions}
          emptyMessage={searchQuery || dateFrom || dateTo
            ? "No matching records found. Try adjusting your search or filters."
            : "No referral forms yet. Create your first form to get started."}
        />
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          {currentPage > 1 ? (
            <button
              className="btn btn-outline pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
          ) : (
            <div className="pagination-spacer" style={{ width: '100px' }}></div>
          )}

          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <button
              className="btn btn-outline pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          ) : (
            <div className="pagination-spacer" style={{ width: '100px' }}></div>
          )}
        </div>
      )}

      {/* Permanent delete (bulk) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deletingBulk && setDeleteModalOpen(false)}
        title="Delete cases permanently"
        actions={
          <>
            <button type="button" className="btn btn-outline" disabled={deletingBulk} onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" disabled={deletingBulk} onClick={handleBulkDeleteConfirm}>
              {deletingBulk ? 'Deleting…' : 'Delete permanently'}
            </button>
          </>
        }
      >
        <div className="delete-warning">
          <p>This removes the selected referral(s) from the database. This cannot be undone.</p>
          <p className="delete-detail">
            <strong>{selectedIds.length}</strong> case(s) selected.
          </p>
          {selectedIds.length > 0 && (
            <ul className="bulk-delete-preview">
              {selectedIds.slice(0, 8).map((id) => {
                const f = forms.find((x) => x.id === id);
                return (
                  <li key={id}>
                    {f?.patient?.patientName || id}
                    {f?.patient?.patientId ? ` — ${f.patient.patientId}` : ''}
                  </li>
                );
              })}
              {selectedIds.length > 8 && <li>…and {selectedIds.length - 8} more</li>}
            </ul>
          )}
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={archiveModal.open}
        onClose={() => setArchiveModal({ open: false, form: null })}
        title="Archive Form"
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setArchiveModal({ open: false, form: null })}
            >
              Cancel
            </button>
            <button className="btn btn-warning" onClick={handleArchiveConfirm}>
              Archive
            </button>
          </>
        }
      >
        <div className="archive-warning">
          <svg viewBox="0 0 24 24" className="warning-icon">
            <path
              fill="currentColor"
              d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"
            />
          </svg>
          <p>Are you sure you want to archive this referral form?</p>
          {archiveModal.form && (
            <p className="delete-detail">
              Patient: <strong>{archiveModal.form.patient.patientName}</strong>
              <br />
              Doctor: <strong>{archiveModal.form.doctor.doctorName}</strong>
            </p>
          )}
          <p className="archive-note">You can restore this form later from the archived view.</p>
        </div>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={restoreModal.open}
        onClose={() => setRestoreModal({ open: false, form: null })}
        title="Restore Form"
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setRestoreModal({ open: false, form: null })}
            >
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleRestoreConfirm}>
              Restore
            </button>
          </>
        }
      >
        <div className="restore-info">
          <svg viewBox="0 0 24 24" className="success-icon">
            <path
              fill="currentColor"
              d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"
            />
          </svg>
          <p>Restore this form to active records?</p>
          {restoreModal.form && (
            <p className="delete-detail">
              Patient: <strong>{restoreModal.form.patient.patientName}</strong>
              <br />
              Doctor: <strong>{restoreModal.form.doctor.doctorName}</strong>
            </p>
          )}
        </div>
      </Modal>

      {/* Unified Notification Modal */}
      <NotificationModal
        isOpen={notificationModal.open}
        onClose={handleNotificationModalClose}
        patient={notificationModal.form}
        branchName={getBranchName(currentBranch)}
        onSend={handleNotificationSend}
        messageType={notificationModal.messageType}
        notificationStatus={notificationModal.form?.channelStatus}
        retryChannel={notificationModal.retryChannel}
        hasReportFile={hasFileData(notificationModal.form?.patient?.diagnosticReport)}
      />

      {/* Report Upload Modal */}
      <Modal
        isOpen={reportUploadModal.open}
        onClose={handleCloseReportUpload}
        title={reportUploadModal.isReplacing ? 'Replace Diagnostic Report' : 'Upload Diagnostic Report'}
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={handleCloseReportUpload}
              disabled={reportUploadModal.isUploading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleReportUploadConfirm}
              disabled={!reportUploadModal.uploadedFile || reportUploadModal.isUploading}
            >
              {reportUploadModal.isUploading ? (
                <>
                  <span className="btn-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '6px' }}>
                    <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                  </svg>
                  {reportUploadModal.isReplacing ? 'Replace & Send Email' : 'Upload & Send Email'}
                </>
              )}
            </button>
          </>
        }
      >
        <div className="report-upload-content">
          {reportUploadModal.form && (
            <div className="upload-patient-info">
              <div className="patient-badge">
                <span className="patient-id">{reportUploadModal.form.patient?.patientId}</span>
                <span className="patient-name">{reportUploadModal.form.patient?.patientName}</span>
              </div>
              <div className="doctor-info">
                <span>Referring Doctor: Dr. {reportUploadModal.form.doctor?.doctorName}</span>
              </div>
            </div>
          )}

          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleReportFileSelect}
              className="file-input-hidden"
              id="report-file-input"
            />
            <label htmlFor="report-file-input" className="upload-dropzone">
              {reportUploadModal.uploadedFile ? (
                <div className="file-selected">
                  <svg viewBox="0 0 24 24" width="40" height="40">
                    <path fill="#4CAF50" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <span className="file-name" title={reportUploadModal.uploadedFile.name}>
                    {reportUploadModal.uploadedFile.name}
                  </span>
                  <span className="file-size">
                    {(reportUploadModal.uploadedFile.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <svg viewBox="0 0 24 24" width="48" height="48">
                    <path fill="#9e9e9e" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z" />
                  </svg>
                  <span className="upload-text">Click to select PDF file</span>
                  <span className="upload-hint">Diagnostic report (PDF only, max 50MB)</span>
                </div>
              )}
            </label>
          </div>

          <div className="note" style={{ marginTop: '20px', background: '#e3f2fd', borderLeft: '4px solid #2196f3', padding: '15px', borderRadius: '8px' }}>
            <strong>📧 Note:</strong> The doctor will automatically receive an email notification with the PDF report attached once you upload it.
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ManageForms;
