import React from 'react';
import { FormSection, CheckboxGroup } from '../FormElements';
import './DiagnosticServices.css';

const ReasonIcon = () => (
  <svg viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
    />
  </svg>
);

const reasonLabels = {
  implantPlanning: 'Implant Planning',
  cystTumourMalignancy: 'Cyst / Tumour / Malignancy',
  teethRootBoneFracture: 'Teeth / Root / Bone Fracture',
  rootCanalEndodontic: 'Root Canal / Endodontic Purpose',
  impactedSupernumerary: 'Impacted / Supernumerary Tooth',
  postOperativeImplant: 'Post Operative / Post Implant',
  tmjPainClicking: 'TMJ Pain / Clicking',
  chronicIdiopathicPain: 'Chronic / Idiopathic Pain',
  sinusPathology: 'Sinus Pathology',
  periapicalPeriodontal: 'Periapical / Periodontal Lesion / Bone Loss',
  orthodontic: 'Orthodontic',
  airwayAnalysis: 'Airway Analysis',
};

const ReasonForReferralModule = ({ data, onChange, disabled = false }) => {
  const handleChange = (field) => (e) => {
    onChange({
      ...data,
      [field]: e.target.checked,
    });
  };

  return (
    <FormSection title="Reason for Referral" icon={<ReasonIcon />}>
      <div className="reasons-grid">
        {Object.entries(reasonLabels).map(([key, label]) => (
          <CheckboxGroup
            key={key}
            label={label}
            name={key}
            checked={data[key]}
            onChange={handleChange(key)}
            disabled={disabled}
          />
        ))}
      </div>
    </FormSection>
  );
};

export default ReasonForReferralModule;
