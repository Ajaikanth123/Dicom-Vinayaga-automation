import React, { useMemo } from 'react';
import './UploadProgress.css';

const UploadProgress = ({ isVisible, progress, currentFile, totalFiles, status, phaseText }) => {
  if (!isVisible) return null;

  // Dynamic messages based on progress percentage
  const getProgressMessage = useMemo(() => {
    const progressNum = Math.round(progress);

    // Phase 1: Uploading to Cloud (0-50%)
    if (progressNum < 10) {
      return {
        title: 'Initiating Upload',
        message: 'Preparing secure connection to cloud storage...',
        icon: '🚀'
      };
    } else if (progressNum < 20) {
      return {
        title: 'Uploading DICOM Files',
        message: 'Securely transferring your files to cloud storage...',
        icon: '☁️'
      };
    } else if (progressNum < 35) {
      return {
        title: 'Upload in Progress',
        message: 'Encrypting and uploading medical imaging data...',
        icon: '🔐'
      };
    } else if (progressNum < 50) {
      return {
        title: 'Almost There',
        message: 'Finalizing secure file transfer to cloud...',
        icon: '📤'
      };
    }
    // Phase 2: Backend Processing (50-80%)
    else if (progressNum < 58) {
      return {
        title: 'Processing DICOM Files',
        message: 'Extracting medical imaging metadata and patient information...',
        icon: '🔍'
      };
    } else if (progressNum < 66) {
      return {
        title: 'Validating Images',
        message: 'Verifying DICOM file integrity and image quality...',
        icon: '✔️'
      };
    } else if (progressNum < 74) {
      return {
        title: 'Analyzing Images',
        message: 'Generating 3D reconstructions and multi-planar views...',
        icon: '🧠'
      };
    } else if (progressNum < 80) {
      return {
        title: 'Optimizing Display',
        message: 'Preparing high-quality image rendering for viewer...',
        icon: '🎨'
      };
    }
    // Phase 3: Finalizing (80-100%)
    else if (progressNum < 87) {
      return {
        title: 'Creating Viewer',
        message: 'Building interactive DICOM viewer for doctor access...',
        icon: '🖥️'
      };
    } else if (progressNum < 93) {
      return {
        title: 'Saving Records',
        message: 'Storing case data and generating secure access links...',
        icon: '💾'
      };
    } else if (progressNum < 98) {
      return {
        title: 'Finalizing',
        message: 'Completing upload and preparing case for review...',
        icon: '✨'
      };
    } else if (progressNum < 100) {
      return {
        title: 'Almost Done',
        message: 'Performing final checks and updating database...',
        icon: '⚡'
      };
    } else {
      return {
        title: 'Upload Complete!',
        message: 'Your DICOM files are ready for viewing',
        icon: '✅'
      };
    }
  }, [progress]);

  return (
    <div className="upload-progress-overlay">
      <div className="upload-progress-modal">
        <div className="upload-progress-content">
          {/* Spinner */}
          <div className="upload-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>

          {/* Dynamic Icon */}
          <div className="progress-icon">{getProgressMessage.icon}</div>

          {/* Status Text */}
          <h2 className="upload-title">
            {getProgressMessage.title}
          </h2>

          {/* Progress Bar */}
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            >
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Phase Text from Server Polling */}
          {phaseText && (
            <p className="upload-phase-text" style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '8px', fontSize: '1.1rem', textAlign: 'center' }}>
              {phaseText}
            </p>
          )}

          {/* File Info */}
          {currentFile && (
            <div className="upload-file-info">
              <p className="current-file">
                <span className="file-icon">📄</span>
                {currentFile}
              </p>
              {totalFiles > 0 && (
                <p className="file-count">
                  File {Math.min(Math.ceil((progress / 100) * totalFiles), totalFiles)} of {totalFiles}
                </p>
              )}
            </div>
          )}

          {/* Dynamic Status Message */}
          <p className="upload-status-message">
            {getProgressMessage.message}
          </p>

          {/* Helpful tip for long uploads */}
          {progress > 50 && progress < 95 && (
            <p className="upload-tip">
              💡 Large DICOM files may take a few minutes to process
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
