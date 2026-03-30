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

const DicomViewerCS3D = () => {
  const { caseId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'mpr'
  const [currentSlice, setCurrentSlice] = useState(0);
  const [imageIds, setImageIds] = useState([]);
  const [initialized, setInitialized] = useState(false);
  
  // Refs for viewports
  const singleViewRef = useRef(null);
  const axialViewRef = useRef(null);
  const sagittalViewRef = useRef(null);
  const coronalViewRef = useRef(null);
  
  // Cornerstone3D IDs
  const renderingEngineId = 'myRenderingEngine';
  const volumeId = 'myVolume';

  useEffect(() => {
    initializeCornerstone();
    fetchDicomData();
  }, [caseId]);

  const initializeCornerstone = async () => {
    try {
      // Initialize Cornerstone3D
      await cornerstone.init();
      await cornerstoneTools.init();
      
      // Configure WADO Image Loader with proper event target
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
      
      // Create a custom event target for the image loader
      const eventTarget = new EventTarget();
      
      cornerstoneWADOImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: {
          convertFloatPixelDataToInt: false
        },
        beforeSend: function(xhr) {
          // Suppress progress events that cause errors
        }
      });
      
      // Register the WADO image loader
      cornerstone.imageLoader.registerImageLoader('wadouri', cornerstoneWADOImageLoader.wadouri.loadImage);

      setInitialized(true);
      console.log('✅ Cornerstone3D initialized');
    } catch (err) {
      console.error('Error initializing Cornerstone3D:', err);
      setError('Failed to initialize viewer');
    }
  };

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
      
      // Construct image IDs from metadata
      if (data.slicesMetadata && data.slicesMetadata.length > 0) {
        const ids = data.slicesMetadata.map(slice => {
          const url = `https://storage.googleapis.com/${data.bucketName}/${data.dicomBasePath}/${slice.filename}`;
          return `wadouri:${url}`;
        });
        setImageIds(ids);
        console.log(`✅ Created ${ids.length} image IDs from sorted metadata`);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading DICOM data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized && imageIds.length > 0 && viewMode === 'single' && singleViewRef.current) {
      setupSingleView();
    }
  }, [initialized, imageIds, viewMode]);

  useEffect(() => {
    if (initialized && imageIds.length > 0 && viewMode === 'mpr') {
      setupMPRView();
    }
  }, [initialized, imageIds, viewMode]);

  const setupSingleView = async () => {
    try {
      const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId) || 
        new cornerstone.RenderingEngine(renderingEngineId);

      const viewportInput = {
        viewportId: 'singleViewport',
        type: cornerstone.Enums.ViewportType.STACK,
        element: singleViewRef.current,
        defaultOptions: {
          background: [0, 0, 0]
        }
      };

      renderingEngine.enableElement(viewportInput);
      
      const viewport = renderingEngine.getViewport('singleViewport');
      await viewport.setStack(imageIds, currentSlice);
      viewport.render();

      console.log('✅ Single view setup complete');
    } catch (err) {
      console.error('Error setting up single view:', err);
    }
  };

  const setupMPRView = async () => {
    try {
      const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId) || 
        new cornerstone.RenderingEngine(renderingEngineId);

      // Create volume using Cornerstone3D's Volume API
      const volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, {
        imageIds: imageIds
      });

      // Load the volume
      await volume.load();

      // Setup three viewports
      const viewportInputs = [
        {
          viewportId: 'axialViewport',
          type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
          element: axialViewRef.current,
          defaultOptions: {
            orientation: cornerstone.Enums.OrientationAxis.AXIAL,
            background: [0, 0, 0]
          }
        },
        {
          viewportId: 'sagittalViewport',
          type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
          element: sagittalViewRef.current,
          defaultOptions: {
            orientation: cornerstone.Enums.OrientationAxis.SAGITTAL,
            background: [0, 0, 0]
          }
        },
        {
          viewportId: 'coronalViewport',
          type: cornerstone.Enums.ViewportType.ORTHOGRAPHIC,
          element: coronalViewRef.current,
          defaultOptions: {
            orientation: cornerstone.Enums.OrientationAxis.CORONAL,
            background: [0, 0, 0]
          }
        }
      ];

      renderingEngine.setViewports(viewportInputs);

      // Set volume on all viewports
      await cornerstone.setVolumesForViewports(
        renderingEngine,
        [{ volumeId }],
        ['axialViewport', 'sagittalViewport', 'coronalViewport']
      );

      renderingEngine.render();

      console.log('✅ MPR view setup complete');
    } catch (err) {
      console.error('Error setting up MPR view:', err);
      setError(`MPR setup failed: ${err.message}`);
    }
  };

  const handleSliceChange = (newSlice) => {
    setCurrentSlice(newSlice);
    if (viewMode === 'single') {
      const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
      if (renderingEngine) {
        const viewport = renderingEngine.getViewport('singleViewport');
        if (viewport) {
          viewport.setImageIdIndex(newSlice);
          viewport.render();
        }
      }
    }
  };

  const handleMouseWheel = (e) => {
    e.preventDefault();
    if (viewMode === 'single') {
      if (e.deltaY < 0) {
        handleSliceChange(Math.max(0, currentSlice - 1));
      } else {
        handleSliceChange(Math.min(imageIds.length - 1, currentSlice + 1));
      }
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
        <h1>C Scans Kovai Viewer - Cornerstone3D</h1>
        <div className="patient-info">
          <p><strong>Patient:</strong> {metadata.patientName || 'N/A'}</p>
          <p><strong>Patient ID:</strong> {metadata.patientID || 'N/A'}</p>
          <p><strong>Study Date:</strong> {metadata.studyMetadata?.studyDate || 'N/A'}</p>
          <p><strong>Modality:</strong> {metadata.studyMetadata?.modality || 'N/A'}</p>
        </div>
        
        <div className="view-mode-toggle">
          <button 
            className={viewMode === 'single' ? 'active' : ''}
            onClick={() => setViewMode('single')}
          >
            Single View
          </button>
          <button 
            className={viewMode === 'mpr' ? 'active' : ''}
            onClick={() => setViewMode('mpr')}
          >
            MPR View
          </button>
        </div>
      </div>

      <div className="viewer-main">
        {viewMode === 'single' ? (
          <>
            <div 
              ref={singleViewRef}
              className="cornerstone-viewport"
              onWheel={handleMouseWheel}
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
                  onClick={() => handleSliceChange(Math.max(0, currentSlice - 1))}
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
                  onChange={(e) => handleSliceChange(parseInt(e.target.value))}
                  className="slice-slider"
                />
                
                <button 
                  onClick={() => handleSliceChange(Math.min(totalSlices - 1, currentSlice + 1))}
                  disabled={currentSlice === totalSlices - 1}
                  className="nav-button"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mpr-grid">
            <div className="mpr-viewport">
              <div className="viewport-label">Axial</div>
              <div 
                ref={axialViewRef}
                className="cornerstone-viewport"
                style={{
                  width: '100%',
                  height: '400px',
                  background: '#000'
                }}
              />
            </div>
            
            <div className="mpr-viewport">
              <div className="viewport-label">Sagittal</div>
              <div 
                ref={sagittalViewRef}
                className="cornerstone-viewport"
                style={{
                  width: '100%',
                  height: '400px',
                  background: '#000'
                }}
              />
            </div>
            
            <div className="mpr-viewport">
              <div className="viewport-label">Coronal</div>
              <div 
                ref={coronalViewRef}
                className="cornerstone-viewport"
                style={{
                  width: '100%',
                  height: '400px',
                  background: '#000'
                }}
              />
            </div>
          </div>
        )}
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

export default DicomViewerCS3D;
