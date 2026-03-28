import React from 'react';
import { useFormContext } from '../../context/FormContext';
import './BranchSelector.css';

const BranchSelector = () => {
  const { branches, selectBranch } = useFormContext();

  return (
    <div className="branch-selector-overlay">
      <div className="branch-selector-modal">
        <div className="branch-selector-header">
          <svg viewBox="0 0 24 24" className="branch-icon">
            <path
              fill="currentColor"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
          <h2>Select Branch</h2>
          <p>Please select a branch to continue</p>
        </div>
        <div className="branch-options">
          {branches.map((branch) => (
            <button
              key={branch.id}
              className="branch-option"
              onClick={() => {
                console.log('Branch selected:', branch.id);
                selectBranch(branch.id);
              }}
            >
              <span className="branch-name">{branch.name}</span>
              <svg viewBox="0 0 24 24" className="arrow-icon">
                <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BranchSelector;
