import React from 'react';
import './FormElements.css';

const InputField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  maxLength,
}) => {
  return (
    <div className={`input-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className="input-control"
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="error-message">
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
