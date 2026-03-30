import React from 'react';
import { FormSection, InputField, SelectField, FileUpload } from '../FormElements';

const PatientIcon = () => (
  <svg viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  </svg>
);

const sexOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const PatientInfoModule = ({ data, onChange, errors = {}, disabled = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleFileChange = (fieldName) => (file) => {
    onChange({ ...data, [fieldName]: file });
  };

  return (
    <FormSection title="Patient Information" icon={<PatientIcon />}>
      <div className="form-row">
        <InputField
          label="Patient ID"
          name="patientId"
          value={data.patientId || ''}
          onChange={handleChange}
          placeholder="e.g., PT-2024-001"
          required
          error={errors.patientId}
          disabled={disabled}
        />
        <InputField
          label="Patient Name"
          name="patientName"
          value={data.patientName}
          onChange={handleChange}
          placeholder="Enter patient's full name"
          required
          error={errors.patientName}
          disabled={disabled}
        />
      </div>
      <div className="form-row">
        <InputField
          label="Age"
          name="age"
          type="number"
          value={data.age}
          onChange={handleChange}
          placeholder="Age in years"
          error={errors.age}
          disabled={disabled}
        />
        <SelectField
          label="Gender"
          name="sex"
          value={data.sex}
          onChange={handleChange}
          options={sexOptions}
          error={errors.sex}
          disabled={disabled}
          placeholder="Select gender"
        />
      </div>
      <div className="form-row">
        <InputField
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          value={data.phoneNumber}
          onChange={handleChange}
          placeholder="10-digit phone number"
          required
          error={errors.phoneNumber}
          disabled={disabled}
          maxLength={10}
        />
        <InputField
          label="Scan Date"
          name="date"
          type="date"
          value={data.date}
          onChange={handleChange}
          error={errors.date}
          disabled={disabled}
        />
      </div>
      <div className="form-row">
        <InputField
          label="Referring Doctor"
          name="referringDoctor"
          value={data.referringDoctor || ''}
          onChange={handleChange}
          placeholder="Name of referring doctor"
          error={errors.referringDoctor}
          disabled={disabled}
        />
      </div>

      {/* File Uploads — both optional */}
      <div className="file-uploads-row">
        <FileUpload
          title="Upload Patient Image"
          accept=".jpg,.jpeg,.png,.webp"
          icon="document"
          file={data.patientImage}
          onChange={handleFileChange('patientImage')}
          error={errors.patientImage}
          disabled={disabled}
          helpText="Optional — X-ray or photo (JPG, PNG)"
        />
        <FileUpload
          title="Upload DICOM File"
          accept=".dcm,.zip"
          icon="scan"
          file={data.dicomFile}
          onChange={handleFileChange('dicomFile')}
          error={errors.dicomFile}
          disabled={disabled}
          helpText="Optional — DCM or ZIP file"
        />
      </div>
    </FormSection>
  );
};

export default PatientInfoModule;
