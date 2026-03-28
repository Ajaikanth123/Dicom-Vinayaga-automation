import React from 'react';
import './FormElements.css';

const CheckboxGroup = ({ label, name, checked, onChange, children, disabled = false }) => {
  return (
    <div className="checkbox-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="checkbox-input"
        />
        <span className="checkbox-custom"></span>
        <span className="checkbox-text">{label}</span>
      </label>
      {children && checked && <div className="checkbox-children">{children}</div>}
    </div>
  );
};

export default CheckboxGroup;
