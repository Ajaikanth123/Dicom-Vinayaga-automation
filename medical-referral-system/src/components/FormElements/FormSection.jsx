import React from 'react';
import './FormElements.css';

const FormSection = ({ title, icon, children, className = '' }) => {
  return (
    <section className={`form-section ${className}`}>
      <div className="section-header">
        {icon && <span className="section-icon">{icon}</span>}
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="section-content">{children}</div>
    </section>
  );
};

export default FormSection;
