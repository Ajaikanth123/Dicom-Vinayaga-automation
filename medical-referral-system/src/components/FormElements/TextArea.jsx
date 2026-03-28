import React from 'react';
import './FormElements.css';

const TextArea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  rows = 4,
}) => {
  return (
    <div className={`input-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="input-control textarea-control"
        aria-invalid={!!error}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default TextArea;
