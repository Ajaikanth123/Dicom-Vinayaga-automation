import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormContext } from '../context/FormContext';
import {
  DoctorInfoModule,
  useDoctorSave,
  PatientInfoModule,
  DiagnosticServicesModule,
  ReasonForReferralModule,
  ClinicalNotesModule,
} from '../components/FormModules';
import Modal from '../components/Modal/Modal';
import BranchIndicator from '../components/BranchIndicator/BranchIndicator';
import UploadProgress from '../components/UploadProgress/UploadProgress';
import { getInitialFormState, validateForm } from '../utils/formUtils';
import './Pages.css';

const CreateForm = () => {
  const navigate = useNavigate();
  const { addForm } = useFormContext();
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [viewerUrl, setViewerUrl] = useState(null);

  // Doctor save functionality
  const { handleManualSave, saving, saveSuccess, canSave, doctorExists, showButton, isProcessing } = useDoctorSave(formData.doctor);

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState({
    isVisible: false,
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    status: 'preparing'
  });

  const steps = [
    { title: 'Doctor Info', component: 'doctor' },
    { title: 'Patient Info', component: 'patient' },
    { title: 'Diagnostic Services', component: 'services' },
    { title: 'Referral Reason', component: 'reason' },
    { title: 'Clinical Notes', component: 'notes' },
  ];

  const handleDoctorChange = (data) => {
    setFormData((prev) => ({ ...prev, doctor: data }));
    if (errors.doctor) {
      setErrors((prev) => ({ ...prev, doctor: {} }));
    }
  };

  const handlePatientChange = (data) => {
    setFormData((prev) => ({ ...prev, patient: data }));
    if (errors.patient) {
      setErrors((prev) => ({ ...prev, patient: {} }));
    }
  };

  const handleServicesChange = (data) => {
    setFormData((prev) => ({ ...prev, diagnosticServices: data }));
  };

  const handleReasonChange = (data) => {
    setFormData((prev) => ({ ...prev, reasonForReferral: data }));
  };

  const handleNotesChange = (value) => {
    setFormData((prev) => ({ ...prev, clinicalNotes: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Navigate to first step with errors
      if (validationErrors.doctor) setCurrentStep(0);
      else if (validationErrors.patient) setCurrentStep(1);
      return;
    }

    // Check if there's a DICOM file to upload
    const hasDicomFile = formData.patient?.dicomFile instanceof File;

    if (hasDicomFile) {
      // Show upload progress overlay
      setUploadProgress({
        isVisible: true,
        progress: 0,
        currentFile: formData.patient.dicomFile.name,
        totalFiles: 1,
        status: 'preparing'
      });

      try {
        // Use the upload function with progress callback
        const result = await addForm(formData, (progress, phaseText) => {
          if (progress <= 100) {
            setUploadProgress(prev => ({
              ...prev,
              progress: progress,
              ...(phaseText && { phaseText }),
              status: progress < 50 ? 'uploading' : 'processing'
            }));
          }
        });

        if (result && result.id && result.branchId) {
          setUploadProgress(prev => ({
            ...prev,
            progress: 100,
            status: 'complete',
            phaseText: 'Upload Complete'
          }));
        } else {
          // Fallback if no result object returned
          setUploadProgress(prev => ({ ...prev, progress: 100, status: 'complete', phaseText: 'Complete' }));
        }

        // Wait a moment to show 100% before hiding
        setTimeout(() => {
          setUploadProgress({ isVisible: false, progress: 0, currentFile: '', totalFiles: 0, status: 'preparing' });
          if (result) {
            // Store viewer URL if available
            if (result.orthancData?.viewerUrl) {
              setViewerUrl(result.orthancData.viewerUrl);
              // Automatically open the viewer in a new tab
              window.open(result.orthancData.viewerUrl, '_blank');
            }
            setShowSuccess(true);
          } else {
            alert('Error saving form. Please try again.');
          }
        }, 1000);

      } catch (error) {
        setUploadProgress({ isVisible: false, progress: 0, currentFile: '', totalFiles: 0, status: 'preparing' });
        alert('Error uploading DICOM file. Please try again.');
        console.error('Upload error:', error);
      }
    } else {
      // No DICOM file, just save the form
      const result = await addForm(formData);
      if (result) {
        setShowSuccess(true);
      } else {
        alert('Error saving form. Please try again.');
      }
    }
  };

  const handleReset = () => {
    setFormData(getInitialFormState());
    setErrors({});
    setCurrentStep(0);
    setViewerUrl(null); // Clear viewer URL
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    handleReset();
    navigate('/manage');
  };

  const handleViewDicom = () => {
    // Open the viewer URL in a new tab
    if (viewerUrl) {
      window.open(viewerUrl, '_blank');
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <DoctorInfoModule
            data={formData.doctor}
            onChange={handleDoctorChange}
            errors={errors.doctor || {}}
          />
        );
      case 1:
        return (
          <PatientInfoModule
            data={formData.patient}
            onChange={handlePatientChange}
            errors={errors.patient || {}}
          />
        );
      case 2:
        return (
          <DiagnosticServicesModule
            data={formData.diagnosticServices}
            onChange={handleServicesChange}
          />
        );
      case 3:
        return (
          <ReasonForReferralModule
            data={formData.reasonForReferral}
            onChange={handleReasonChange}
          />
        );
      case 4:
        return (
          <ClinicalNotesModule
            value={formData.clinicalNotes}
            onChange={handleNotesChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <BranchIndicator />

      <div className="page-header">
        <h1 className="page-title">Create Referral Form</h1>
        <p className="page-subtitle">Fill in the diagnostic referral details</p>
      </div>

      <div className="stepper">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''
              }`}
            onClick={() => setCurrentStep(index)}
          >
            <div className="step-number">{index + 1}</div>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {renderStepContent()}

        <div className="form-actions">
          <div className="action-left">
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset Form
            </button>
          </div>
          <div className="action-right">
            {currentStep > 0 && (
              <button type="button" className="btn btn-outline" onClick={prevStep}>
                Previous
              </button>
            )}
            {currentStep === 0 && showButton && formData.doctor.doctorName && (
              <button
                type="button"
                className={`btn btn-doctor-save ${saveSuccess ? 'success' : ''}`}
                onClick={handleManualSave}
                disabled={!canSave || saving || isProcessing}
              >
                {saving ? (
                  <>
                    <svg className="spinner-icon" viewBox="0 0 24 24" width="16" height="16">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                    </svg>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    Added!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add to Manage Doctors
                  </>
                )}
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-success">
                Submit Form
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Upload Progress Overlay */}
      <UploadProgress
        isVisible={uploadProgress.isVisible}
        progress={uploadProgress.progress}
        currentFile={uploadProgress.currentFile}
        totalFiles={uploadProgress.totalFiles}
        status={uploadProgress.status}
        phaseText={uploadProgress.phaseText}
      />

      <Modal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Form Submitted Successfully"
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            {viewerUrl && (
              <button className="btn btn-success" onClick={handleViewDicom}>
                View DICOM Images
              </button>
            )}
            <button className="btn btn-primary" onClick={handleSuccessClose}>
              View All Forms
            </button>
          </div>
        }
      >
        <div className="success-message">
          <svg viewBox="0 0 24 24" className="success-icon">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          <p>The referral form has been saved successfully.</p>
          <p className="success-detail">
            Patient: <strong>{formData.patient.patientName}</strong>
          </p>
          {viewerUrl && (
            <p className="success-detail" style={{ marginTop: '10px', color: '#10b981' }}>
              ✓ 3D Anbu Viewer opened in new tab
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CreateForm;
