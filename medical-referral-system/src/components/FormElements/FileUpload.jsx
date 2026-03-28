import React, { useRef, useState } from 'react';
import './FormElements.css';

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48">
    <path
      fill="currentColor"
      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
    />
  </svg>
);

const ScanIcon = () => (
  <svg viewBox="0 0 24 24" width="48" height="48">
    <path
      fill="currentColor"
      d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1zm0 4c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1zm0 4c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1zm10-8c0 .55-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1zm0 4c0 .55-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1zm0 4c0 .55-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1z"
    />
  </svg>
);

const FileUpload = ({
  title,
  accept,
  icon = 'document',
  file,
  onChange,
  error,
  disabled = false,
  helpText = '',
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onChange(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files?.[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`file-upload-container ${error ? 'has-error' : ''}`}>
      <label className="file-upload-label">{title}</label>
      <div
        className={`file-upload-box ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div className="file-selected">
            <div className="file-icon-small">
              {icon === 'document' ? <DocumentIcon /> : <ScanIcon />}
            </div>
            <div className="file-info">
              <span className="file-name" title={file.name}>{file.name}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
            </div>
            <button
              type="button"
              className="file-remove-btn"
              onClick={handleRemove}
              disabled={disabled}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="file-placeholder">
            <div className="file-icon">
              {icon === 'document' ? <DocumentIcon /> : <ScanIcon />}
            </div>
            <p className="file-instruction">
              Drag and drop your file here
            </p>
            <p className="file-or">or</p>
            <span className="file-browse-btn">Browse Files</span>
            {helpText && <p className="file-help">{helpText}</p>}
          </div>
        )}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default FileUpload;
