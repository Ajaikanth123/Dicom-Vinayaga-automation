import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormContext } from '../context/FormContext';
import {
  DoctorInfoModule,
  PatientInfoModule,
  DiagnosticServicesModule,
  ReasonForReferralModule,
  ClinicalNotesModule,
} from '../components/FormModules';
import BranchIndicator from '../components/BranchIndicator/BranchIndicator';
import './Pages.css';

const ViewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getFormById } = useFormContext();

  const form = getFormById(id);

  if (!form) {
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
          <p>The referral form you're looking for doesn't exist.</p>
          <button className="btn btn-primary" onClick={() => navigate('/manage')}>
            Back to Manage Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <BranchIndicator showSwitch={false} />
      
      <div className="page-header">
        <div>
          <h1 className="page-title">View Referral Form</h1>
          <p className="page-subtitle">
            Form ID: {form.id.substring(0, 8)}... | Created:{' '}
            {new Date(form.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => navigate('/manage')}>
            Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/edit/${id}`)}>
            Edit Form
          </button>
        </div>
      </div>

      <DoctorInfoModule data={form.doctor} onChange={() => {}} disabled />
      <PatientInfoModule data={form.patient} onChange={() => {}} disabled />
      <DiagnosticServicesModule data={form.diagnosticServices} onChange={() => {}} disabled />
      <ReasonForReferralModule data={form.reasonForReferral} onChange={() => {}} disabled />
      <ClinicalNotesModule value={form.clinicalNotes} onChange={() => {}} disabled />
    </div>
  );
};

export default ViewForm;
