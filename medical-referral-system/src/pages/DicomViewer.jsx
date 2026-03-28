import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './DicomViewer.css';

const DicomViewer = () => {
  const { caseId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);

  useEffect(() => {
    fetchDicomData();
  }, [caseId]);

  const fetchDicomData = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/viewer/${caseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load DICOM data');
      }

      const data = await response.json();
      setMetadata(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading DICOM data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dicom-viewer-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading DICOM data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dicom-viewer-container">
        <div className="error">
          <h2>Error Loading DICOM Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="dicom-viewer-container">
        <div className="error">
          <h2>No Data Found</h2>
          <p>Case ID: {caseId}</p>
        </div>
      </div>
    );
  }

  const currentPreview = metadata.previews?.[currentSlice];
  const totalSlices = metadata.previews?.length || 0;

  return (
    <div className="dicom-viewer-container">
      <div className="viewer-header">
        <h1>3D Anbu Viewer</h1>
        <div className="patient-info">
          <p><strong>Patient:</strong> {metadata.patientName || 'N/A'}</p>
          <p><strong>Patient ID:</strong> {metadata.patientID || 'N/A'}</p>
          <p><strong>Study Date:</strong> {metadata.studyMetadata?.studyDate || 'N/A'}</p>
          <p><strong>Modality:</strong> {metadata.studyMetadata?.modality || 'N/A'}</p>
        </div>
      </div>

      <div className="viewer-main">
        <div className="image-container">
          {currentPreview ? (
            <img 
              src={currentPreview.url} 
              alt={`Slice ${currentSlice + 1}`}
              className="dicom-image"
            />
          ) : (
            <div className="no-image">
              <p>No preview available for this slice</p>
            </div>
          )}
        </div>

        <div className="viewer-controls">
          <div className="slice-info">
            <p>Slice {currentSlice + 1} of {totalSlices}</p>
            <p>Total Slices in Study: {metadata.totalSlices}</p>
            <p>Processed Slices: {metadata.processedSlices}</p>
          </div>

          <div className="slice-navigation">
            <button 
              onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
              disabled={currentSlice === 0}
              className="nav-button"
            >
              ← Previous
            </button>
            
            <input 
              type="range" 
              min="0" 
              max={totalSlices - 1} 
              value={currentSlice}
              onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
              className="slice-slider"
            />
            
            <button 
              onClick={() => setCurrentSlice(Math.min(totalSlices - 1, currentSlice + 1))}
              disabled={currentSlice === totalSlices - 1}
              className="nav-button"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <div className="thumbnails-container">
        <h3>Thumbnails</h3>
        <div className="thumbnails-grid">
          {metadata.thumbnails?.map((thumb, index) => (
            <div 
              key={index}
              className={`thumbnail ${currentSlice === index ? 'active' : ''}`}
              onClick={() => setCurrentSlice(index)}
            >
              <img src={thumb.url} alt={`Slice ${index + 1}`} />
              <span className="thumbnail-label">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="metadata-section">
        <h3>Study Information</h3>
        <div className="metadata-grid">
          {metadata.studyMetadata && Object.entries(metadata.studyMetadata).map(([key, value]) => (
            <div key={key} className="metadata-item">
              <strong>{key}:</strong> <span>{value?.toString() || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DicomViewer;
