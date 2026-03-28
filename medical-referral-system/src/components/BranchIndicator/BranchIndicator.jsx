import React from 'react';
import { useFormContext } from '../../context/FormContext';
import { useAuth } from '../../context/AuthContext';
import './BranchIndicator.css';

const BranchIndicator = ({ showSwitch = false }) => {
  const { currentBranch, getBranchName } = useFormContext();
  const { userData } = useAuth();

  if (!currentBranch) return null;

  // Get branch name from userData first (more accurate), fallback to getBranchName
  const branchDisplayName = userData?.branchDisplayName || userData?.branchName || getBranchName(currentBranch);

  return (
    <div className="branch-indicator">
      <div className="branch-info">
        <svg viewBox="0 0 24 24" className="branch-pin-icon">
          <path
            fill="currentColor"
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          />
        </svg>
        <span className="branch-label">Active Branch:</span>
        <span className="branch-value">{branchDisplayName}</span>
      </div>
    </div>
  );
};

export default BranchIndicator;
