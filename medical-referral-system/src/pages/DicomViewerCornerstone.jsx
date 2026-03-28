import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import './DicomViewer.css';

// Initialize cornerstone WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneWADOImageLoader.configure({
  useWebWorkers: true,
  decodeConfig: {
    convertFloatPixelDataToInt: false
  }
});

const DicomViewerCornerstone = () => {
  const { caseId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [imageIds, setImageIds] = useState([]);
  const viewerRef = useRef(null);
  const [isViewerEnabled, setIsViewerEnabled] = useState(false);

  useEffect(() => {
    fetchDicomData();
  }, [caseId]);

  useEffect(() => {
    if (viewerRef.current && !isViewerEnabled) {
      try {
        cornerstone.enable(viewerRef.current);
        setIsViewerEnabled(true);
      } catch (err) {
        console.error('Error enabling cornerstone:', err);
      }
    }
  }, [viewerRef.current]);

  useEffect(() => {
    if (isViewerEnabled && imageIds.length > 0 && currentSlice >= 0) {
      loadAndDisplayImage(currentSlice);
    }
  }, [currentSlice, imageIds, isViewerEnabled]);

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
      
      // Construct image IDs from base path
      if (data.totalSlices && data.dicomBasePath && data.bucketName) {
        const ids = [];
        for (let i = 1; i <= data.totalSlices; i++) {
          const filename = `slice_${String(i).padStart(4, '0')}.dcm`;
          const url = `https://storage.googleapis.com/${data.bucketName}/${data.dicomBasePath}/${filename}`;
          ids.push(`wadouri:${url}`);
        }
        setImageIds(ids);
        console.log(`✅ Created ${ids.length} image IDs`);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading DICOM data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadAndDisplayImage = async (sliceIndex) => {
    if (!viewerRef.current || !imageIds[sliceIndex]) return;

    try {
      const imageId = imageIds[sliceIndex];
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(viewerRef.current, image);
      
      // Enable mouse wheel scrolling
      viewerRef.current.addEventListener('wheel', handleMouseWheel);
    } catch (err) {
      console.error('Error loading image:', err);
    }
  };

  const handleMouseWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Scroll up - previous slice
      setCurrentSlice(prev => Math.max(0, prev - 1));
    } else {
      // Scroll down - next slice
      setCurrentSlice(prev => Math.min(imageIds.length - 1, prev + 1));
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

  const totalSlices = imageIds.length;

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
        <div 
          ref={viewerRef}
          className="cornerstone-viewport"
          style={{
            width: '100%',
            height: '600px',
            background: '#000'
          }}
        />

        <div className="viewer-controls">
          <div className="slice-info">
            <p>Slice {currentSlice + 1} of {totalSlices}</p>
            <p>Use mouse wheel to scroll through slices</p>
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

export default DicomViewerCornerstone;
