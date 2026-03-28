import React from 'react';
import { FormSection, CheckboxGroup, InputField, SelectField } from '../FormElements';
import ToothSelector from '../ToothSelector';
import './DiagnosticServices.css';

const ScanIcon = () => (
  <svg viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1zm0 4c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1zm0 4c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1z"
    />
  </svg>
);

const tmjSideOptions = [
  { value: 'Right', label: 'Right (R)' },
  { value: 'Left', label: 'Left (L)' },
  { value: 'Both', label: 'Both' },
];

const DiagnosticServicesModule = ({ data, onChange, disabled = false }) => {
  const threeDServices = data.threeDServices || {};

  const handle3DChange = (field, value) => {
    onChange({
      ...data,
      threeDServices: {
        ...threeDServices,
        [field]: value,
      },
    });
  };

  const handle3DCheckbox = (field) => (e) => {
    handle3DChange(field, e.target.checked);
  };

  const handle3DObjectChange = (field, subField) => (e) => {
    const currentValue = threeDServices[field] || {};
    if (subField === 'selected') {
      handle3DChange(field, {
        ...currentValue,
        selected: e.target.checked,
        ...(e.target.checked ? {} : { toothNumber: '', details: '', side: '' }),
      });
    } else {
      handle3DChange(field, {
        ...currentValue,
        [subField]: e.target.value,
      });
    }
  };

  return (
    <FormSection title="3D Diagnostic Services (CBCT)" icon={<ScanIcon />}>
      <div className="checkbox-list">
        <CheckboxGroup
          label="CBCT Single Tooth"
          name="cbctSingleTooth"
          checked={threeDServices.cbctSingleTooth?.selected || false}
          onChange={handle3DObjectChange('cbctSingleTooth', 'selected')}
          disabled={disabled}
        >
          {threeDServices.cbctSingleTooth?.selected && (
            <ToothSelector
              selectedTeeth={threeDServices.cbctSingleTooth?.selectedTeeth || []}
              onToothSelect={(teeth) => handle3DChange('cbctSingleTooth', {
                ...threeDServices.cbctSingleTooth,
                selectedTeeth: teeth,
                toothNumber: teeth.join(', ')
              })}
              maxSelection={1}
              disabled={disabled}
              label="Select Single Tooth"
            />
          )}
        </CheckboxGroup>

        <CheckboxGroup
          label="CBCT Segment (Max 4-5 teeth)"
          name="cbctSegment"
          checked={threeDServices.cbctSegment?.selected || false}
          onChange={handle3DObjectChange('cbctSegment', 'selected')}
          disabled={disabled}
        >
          {threeDServices.cbctSegment?.selected && (
            <ToothSelector
              selectedTeeth={threeDServices.cbctSegment?.selectedTeeth || []}
              onToothSelect={(teeth) => handle3DChange('cbctSegment', {
                ...threeDServices.cbctSegment,
                selectedTeeth: teeth,
                details: teeth.length > 0 ? `Teeth: ${teeth.sort((a, b) => a - b).join(', ')}` : ''
              })}
              maxSelection={5}
              disabled={disabled}
              label="Select Segment Teeth (Max 5)"
            />
          )}
        </CheckboxGroup>

        <CheckboxGroup
          label="CBCT Maxilla"
          name="cbctMaxilla"
          checked={threeDServices.cbctMaxilla || false}
          onChange={handle3DCheckbox('cbctMaxilla')}
          disabled={disabled}
        />

        <CheckboxGroup
          label="CBCT Mandible"
          name="cbctMandible"
          checked={threeDServices.cbctMandible || false}
          onChange={handle3DCheckbox('cbctMandible')}
          disabled={disabled}
        />

        <CheckboxGroup
          label="CBCT TMJ"
          name="cbctTMJ"
          checked={threeDServices.cbctTMJ?.selected || false}
          onChange={handle3DObjectChange('cbctTMJ', 'selected')}
          disabled={disabled}
        >
          <SelectField
            label="Side"
            name="tmjSide"
            value={threeDServices.cbctTMJ?.side || ''}
            onChange={handle3DObjectChange('cbctTMJ', 'side')}
            options={tmjSideOptions}
            placeholder="Select side"
            disabled={disabled}
          />
        </CheckboxGroup>

        <CheckboxGroup
          label="CBCT Maxilla & Mandible"
          name="cbctMaxillaMandible"
          checked={threeDServices.cbctMaxillaMandible || false}
          onChange={handle3DCheckbox('cbctMaxillaMandible')}
          disabled={disabled}
        />

        <CheckboxGroup
          label="CBCT Full Skull View"
          name="cbctFullSkull"
          checked={threeDServices.cbctFullSkull || false}
          onChange={handle3DCheckbox('cbctFullSkull')}
          disabled={disabled}
        />
      </div>
    </FormSection>
  );
};

export default DiagnosticServicesModule;
