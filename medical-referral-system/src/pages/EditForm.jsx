import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormContext } from '../context/FormContext';
import {
  DoctorInfoModule,
  PatientInfoModule,
  DiagnosticServicesModule,
  ReasonForReferralModule,
  ClinicalNotesModule,
} from '../components/FormModules';
import Modal from '../components/Modal/Modal';
import BranchIndicator from '../components/BranchIndicator/BranchIndicator';
import { validateForm } from '../utils/formUtils';
import './Pages.css';

const EditForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getFormById, updateForm } = useFormContext();

  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Doctor Info', component: 'doctor' },
    { title: 'Patient Info', component: 'patient' },
    { title: 'Diagnostic Services', component: 'services' },
    { title: 'Referral Reason', component: 'reason' },
    { title: 'Clinical Notes', component: 'notes' },
  ];

  useEffect(() => {
    const form = getFormById(id);
    if (form) {
      setFormData(form);
    }
  }, [id, getFormById]);

  if (!formData) {
    return (
      <div className="page-container">
        <div className="not-found">
          <svg viewBox="0 0 24 24" className="not-found-icon">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          <h2>Form Not Found</h2>
          <p>The referral form you're trying to edit doesn't exist.</p>
          <button className="btn btn-primary" onClick={() => navigate('/manage')}>
            Back to Manage Forms
          </button>
        </div>
      </div>
    );
  }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.doctor) setCurrentStep(0);
      else if (validationErrors.patient) setCurrentStep(1);
      return;
    }

    updateForm(id, formData);
    setShowSuccess(true);
  };

  const handleCancel = () => {
    navigate('/manage');
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/manage');
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
      <BranchIndicator showSwitch={false} />
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Referral Form</h1>
          <p className="page-subtitle">
            Editing form for patient: {formData.patient.patientName}
          </p>
        </div>
      </div>

      <div className="stepper">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
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
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div className="action-right">
            {currentStep > 0 && (
              <button type="button" className="btn btn-outline" onClick={prevStep}>
                Previous
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-success">
                Save Changes
              </button>
            )}
          </div>
        </div>
      </form>

      <Modal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Changes Saved"
        actions={
          <button className="btn btn-primary" onClick={handleSuccessClose}>
            Back to Forms
          </button>
        }
      >
        <div className="success-message">
          <svg viewBox="0 0 24 24" className="success-icon">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
          <p>The referral form has been updated successfully.</p>
        </div>
      </Modal>
    </div>
  );
};

export default EditForm;
