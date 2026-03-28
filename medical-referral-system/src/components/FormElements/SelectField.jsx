import React from 'react';
import './FormElements.css';

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  disabled = false,
  placeholder = 'Select an option',
}) => {
  return (
    <div className={`input-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="input-control select-control"
        aria-invalid={!!error}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default SelectField;
