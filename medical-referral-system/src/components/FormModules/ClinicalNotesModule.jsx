import React from 'react';
import { FormSection, TextArea } from '../FormElements';

const NotesIcon = () => (
  <svg viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  </svg>
);

const ClinicalNotesModule = ({ value, onChange, disabled = false }) => {
  return (
    <FormSection title="Clinical Notes" icon={<NotesIcon />}>
      <TextArea
        label="Doctor's Notes"
        name="clinicalNotes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter any additional clinical information, observations, or special instructions for the diagnostic center..."
        rows={5}
        disabled={disabled}
      />
    </FormSection>
  );
};

export default ClinicalNotesModule;
