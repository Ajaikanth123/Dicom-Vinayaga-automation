import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as cornerstoneTools from 'cornerstone-tools';
import Hammer from 'hammerjs';
import dicomParser from 'dicom-parser';
import './DicomViewerMPR.css';

// Initialize cornerstone
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;

cornerstoneWADOImageLoader.configure({
  useWebWorkers: true,
  decodeConfig: {
    convertFloatPixelDataToInt: false
  }
});

const DicomViewerMPR = () => {
  const { caseId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlice, setCurrentSlice] = useState(0);
  const [sagittalSlice, setSagittalSlice] = useState(0);
  const [coronalSlice, setCoronalSlice] = useState(0);
  const [imageIds, setImageIds] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'mpr'
  
  const axialRef = useRef(null);
  const sagittalRef = useRef(null);
  const coronalRef = useRef(null);
  
  const viewersEnabledRef = useRef({
    axial: false,
    sagittal: false,
    coronal: false
  });
  
  const [viewersEnabled, setViewersEnabled] = useState({
    axial: false,
    sagittal: false,
    coronal: false
  });
  
  const [mprInitialized, setMprInitialized] = useState(false);

  useEffect(() => {
    fetchDicomData();
  }, [caseId]);

  // Enable viewports based on view mode
  useEffect(() => {
    const enableViewports = async () => {
      if (viewMode === 'single') {
        // Single view mode - only enable axial
        if (axialRef.current && !viewersEnabledRef.current.axial) {
          try {
            cornerstone.enable(axialRef.current);
            viewersEnabledRef.current.axial = true;
            setViewersEnabled(prev => ({ ...prev, axial: true }));
            console.log('✅ Axial viewport enabled (single mode)');
          } catch (err) {
            console.error('Error enabling axial viewer:', err);
          }
        }
      } else if (viewMode === 'mpr') {
        // MPR mode - enable all three viewports sequentially
        setMprInitialized(false);
        
        // Wait for refs to be available
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          if (axialRef.current && !viewersEnabledRef.current.axial) {
            cornerstone.enable(axialRef.current);
            viewersEnabledRef.current.axial = true;
            console.log('✅ Axial viewport enabled (MPR mode)');
          }
          
          if (sagittalRef.current && !viewersEnabledRef.current.sagittal) {
            cornerstone.enable(sagittalRef.current);
            viewersEnabledRef.current.sagittal = true;
            console.log('✅ Sagittal viewport enabled');
          }
          
          if (coronalRef.current && !viewersEnabledRef.current.coronal) {
            cornerstone.enable(coronalRef.current);
            viewersEnabledRef.current.coronal = true;
            console.log('✅ Coronal viewport enabled');
          }
          
          // Wait a bit more to ensure cornerstone has fully initialized the elements
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setViewersEnabled({
            axial: true,
            sagittal: true,
            coronal: true
          });
          
          setMprInitialized(true);
          console.log('✅ All MPR viewports initialized and ready');
        } catch (err) {
          console.error('Error enabling MPR viewers:', err);
        }
      }
    };
    
    enableViewports();
  }, [viewMode]);

  // Load and display single slice in single view mode
  useEffect(() => {
    if (viewMode === 'single' && viewersEnabled.axial && imageIds.length > 0 && currentSlice >= 0) {
      loadAndDisplayImage(currentSlice);
    }
  }, [currentSlice, imageIds, viewersEnabled.axial, viewMode]);

  // Load all images when switching to MPR mode
  useEffect(() => {
    if (viewMode === 'mpr' && mprInitialized && imageIds.length > 0 && loadedImages.length === 0) {
      console.log('🚀 Starting to load all images for MPR...');
      loadAllImages();
    }
  }, [viewMode, mprInitialized, imageIds]);

  // Update MPR views when slices change (only after initial load)
  useEffect(() => {
    if (viewMode === 'mpr' && mprInitialized && loadedImages.length > 0) {
      // Add a small delay to ensure elements stay enabled
      const timer = setTimeout(() => {
        updateMPRViews();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentSlice, sagittalSlice, coronalSlice, viewMode, mprInitialized]);

  const loadAllImages = async () => {
    console.log('📥 Loading all images for MPR...');
    const images = [];
    
    for (let i = 0; i < imageIds.length; i++) {
      try {
        const image = await cornerstone.loadImage(imageIds[i]);
        images.push(image);
        
        if ((i + 1) % 50 === 0) {
          console.log(`Loaded ${i + 1}/${imageIds.length} images...`);
        }
      } catch (err) {
        console.error(`Failed to load image ${i}:`, err);
      }
    }
    
    setLoadedImages(images);
    console.log(`✅ Loaded ${images.length} images for MPR`);
    
    // Trigger initial display after a longer delay to ensure elements are fully ready
    setTimeout(() => {
      if (images.length > 0) {
        console.log('🎨 Triggering initial MPR display...');
        updateMPRViewsManual(images, currentSlice, sagittalSlice, coronalSlice);
      }
    }, 1000);
  };

  const updateMPRViewsManual = (images, axialIdx, sagittalIdx, coronalIdx) => {
    console.log('🔄 Attempting to display MPR views...');
    
    let successCount = 0;
    
    try {
      // Update axial view
      if (axialRef.current && images[axialIdx]) {
        try {
          cornerstone.getEnabledElement(axialRef.current);
          cornerstone.displayImage(axialRef.current, images[axialIdx]);
          console.log('✅ Axial image displayed');
          successCount++;
        } catch (err) {
          console.warn('⚠️ Axial not ready, will retry...', err.message);
        }
      }

      // Update sagittal view
      if (sagittalRef.current && images.length > 0) {
        try {
          cornerstone.getEnabledElement(sagittalRef.current);
          reconstructSagittalManual(sagittalIdx, images);
          console.log('✅ Sagittal image displayed');
          successCount++;
        } catch (err) {
          console.warn('⚠️ Sagittal not ready, will retry...', err.message);
        }
      }

      // Update coronal view
      if (coronalRef.current && images.length > 0) {
        try {
          cornerstone.getEnabledElement(coronalRef.current);
          reconstructCoronalManual(coronalIdx, images);
          console.log('✅ Coronal image displayed');
          successCount++;
        } catch (err) {
          console.warn('⚠️ Coronal not ready, will retry...', err.message);
        }
      }
      
      // If not all views succeeded, retry after a delay
      if (successCount < 3) {
        console.log(`⏳ Only ${successCount}/3 views displayed, retrying in 1 second...`);
        setTimeout(() => {
          updateMPRViewsManual(images, axialIdx, sagittalIdx, coronalIdx);
        }, 1000);
      } else {
        console.log('🎉 All MPR views successfully displayed!');
      }
    } catch (err) {
      console.error('Error in manual MPR update:', err);
    }
  };

  const reconstructSagittalManual = (sliceIndex, images) => {
    const element = sagittalRef.current;
    if (!element || images.length === 0) return;

    const firstImage = images[0];
    const width = images.length;
    const height = firstImage.rows;
    const columns = firstImage.columns;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);

    const x = Math.floor((sliceIndex / columns) * columns);
    
    for (let z = 0; z < width && z < images.length; z++) {
      const image = images[z];
      const pixelData = image.getPixelData();
      
      for (let y = 0; y < height; y++) {
        const axialIndex = y * image.columns + x;
        const pixelValue = pixelData[axialIndex];
        const normalized = Math.min(255, Math.max(0, (pixelValue / 4096) * 255));
        
        const sagittalIndex = (y * width + z) * 4;
        imageData.data[sagittalIndex] = normalized;
        imageData.data[sagittalIndex + 1] = normalized;
        imageData.data[sagittalIndex + 2] = normalized;
        imageData.data[sagittalIndex + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    cornerstone.displayImage(element, {
      imageId: 'sagittal',
      minPixelValue: 0,
      maxPixelValue: 255,
      slope: 1,
      intercept: 0,
      windowCenter: 128,
      windowWidth: 256,
      render: cornerstone.renderWebImage,
      getPixelData: () => imageData.data,
      rows: height,
      columns: width,
      height: height,
      width: width,
      color: false,
      columnPixelSpacing: 1,
      rowPixelSpacing: 1,
      sizeInBytes: width * height
    });
  };

  const reconstructCoronalManual = (sliceIndex, images) => {
    const element = coronalRef.current;
    if (!element || images.length === 0) return;

    const firstImage = images[0];
    const width = firstImage.columns;
    const height = images.length;
    const rows = firstImage.rows;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);

    const y = Math.floor((sliceIndex / rows) * rows);
    
    for (let z = 0; z < height && z < images.length; z++) {
      const image = images[z];
      const pixelData = image.getPixelData();
      
      for (let x = 0; x < width; x++) {
        const axialIndex = y * image.columns + x;
        const pixelValue = pixelData[axialIndex];
        const normalized = Math.min(255, Math.max(0, (pixelValue / 4096) * 255));
        
        const coronalIndex = (z * width + x) * 4;
        imageData.data[coronalIndex] = normalized;
        imageData.data[coronalIndex + 1] = normalized;
        imageData.data[coronalIndex + 2] = normalized;
        imageData.data[coronalIndex + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    cornerstone.displayImage(element, {
      imageId: 'coronal',
      minPixelValue: 0,
      maxPixelValue: 255,
      slope: 1,
      intercept: 0,
      windowCenter: 128,
      windowWidth: 256,
      render: cornerstone.renderWebImage,
      getPixelData: () => imageData.data,
      rows: height,
      columns: width,
      height: height,
      width: width,
      color: false,
      columnPixelSpacing: 1,
      rowPixelSpacing: 1,
      sizeInBytes: width * height
    });
  };

  const updateMPRViews = () => {
    try {
      // Update axial view
      if (viewersEnabled.axial && axialRef.current && loadedImages[currentSlice]) {
        try {
          const element = axialRef.current;
          cornerstone.getEnabledElement(element); // This throws if not enabled
          cornerstone.displayImage(element, loadedImages[currentSlice]);
        } catch (err) {
          console.warn('Axial element not ready:', err.message);
        }
      }

      // Update sagittal view (reconstruct from axial slices)
      if (viewersEnabled.sagittal && sagittalRef.current && loadedImages.length > 0) {
        try {
          const element = sagittalRef.current;
          cornerstone.getEnabledElement(element); // This throws if not enabled
          reconstructSagittal(sagittalSlice);
        } catch (err) {
          console.warn('Sagittal element not ready:', err.message);
        }
      }

      // Update coronal view (reconstruct from axial slices)
      if (viewersEnabled.coronal && coronalRef.current && loadedImages.length > 0) {
        try {
          const element = coronalRef.current;
          cornerstone.getEnabledElement(element); // This throws if not enabled
          reconstructCoronal(coronalSlice);
        } catch (err) {
          console.warn('Coronal element not ready:', err.message);
        }
      }
    } catch (err) {
      console.error('Error updating MPR views:', err);
    }
  };

  const reconstructSagittal = (sliceIndex) => {
    const element = sagittalRef.current;
    if (!element || loadedImages.length === 0) return;

    try {
      // Check if element is enabled (throws if not)
      cornerstone.getEnabledElement(element);

      const firstImage = loadedImages[0];
      const width = loadedImages.length;
      const height = firstImage.rows;
      const columns = firstImage.columns;

      // Create canvas for sagittal reconstruction
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(width, height);

      // Extract sagittal slice from all axial images
      const x = Math.floor((sliceIndex / columns) * columns);
      
      for (let z = 0; z < width && z < loadedImages.length; z++) {
        const image = loadedImages[z];
        const pixelData = image.getPixelData();
        
        for (let y = 0; y < height; y++) {
          const axialIndex = y * image.columns + x;
          const pixelValue = pixelData[axialIndex];
          
          // Normalize to 0-255
          const normalized = Math.min(255, Math.max(0, (pixelValue / 4096) * 255));
          
          const sagittalIndex = (y * width + z) * 4;
          imageData.data[sagittalIndex] = normalized;
          imageData.data[sagittalIndex + 1] = normalized;
          imageData.data[sagittalIndex + 2] = normalized;
          imageData.data[sagittalIndex + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Display on cornerstone viewport
      cornerstone.displayImage(element, {
        imageId: 'sagittal',
        minPixelValue: 0,
        maxPixelValue: 255,
        slope: 1,
        intercept: 0,
        windowCenter: 128,
        windowWidth: 256,
        render: cornerstone.renderWebImage,
        getPixelData: () => imageData.data,
        rows: height,
        columns: width,
        height: height,
        width: width,
        color: false,
        columnPixelSpacing: 1,
        rowPixelSpacing: 1,
        sizeInBytes: width * height
      });
    } catch (err) {
      // Don't log if it's just "element not enabled" - that's expected during initialization
      if (!err.message.includes('element not enabled')) {
        console.error('Error reconstructing sagittal:', err);
      }
    }
  };

  const reconstructCoronal = (sliceIndex) => {
    const element = coronalRef.current;
    if (!element || loadedImages.length === 0) return;

    try {
      // Check if element is enabled (throws if not)
      cornerstone.getEnabledElement(element);

      const firstImage = loadedImages[0];
      const width = firstImage.columns;
      const height = loadedImages.length;
      const rows = firstImage.rows;

      // Create canvas for coronal reconstruction
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(width, height);

      // Extract coronal slice from all axial images
      const y = Math.floor((sliceIndex / rows) * rows);
      
      for (let z = 0; z < height && z < loadedImages.length; z++) {
        const image = loadedImages[z];
        const pixelData = image.getPixelData();
        
        for (let x = 0; x < width; x++) {
          const axialIndex = y * image.columns + x;
          const pixelValue = pixelData[axialIndex];
          
          // Normalize to 0-255
          const normalized = Math.min(255, Math.max(0, (pixelValue / 4096) * 255));
          
          const coronalIndex = (z * width + x) * 4;
          imageData.data[coronalIndex] = normalized;
          imageData.data[coronalIndex + 1] = normalized;
          imageData.data[coronalIndex + 2] = normalized;
          imageData.data[coronalIndex + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Display on cornerstone viewport
      cornerstone.displayImage(element, {
        imageId: 'coronal',
        minPixelValue: 0,
        maxPixelValue: 255,
        slope: 1,
        intercept: 0,
        windowCenter: 128,
        windowWidth: 256,
        render: cornerstone.renderWebImage,
        getPixelData: () => imageData.data,
        rows: height,
        columns: width,
        height: height,
        width: width,
        color: false,
        columnPixelSpacing: 1,
        rowPixelSpacing: 1,
        sizeInBytes: width * height
      });
    } catch (err) {
      // Don't log if it's just "element not enabled" - that's expected during initialization
      if (!err.message.includes('element not enabled')) {
        console.error('Error reconstructing coronal:', err);
      }
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
      
      // Create image IDs using the sorted slice metadata
      if (data.slicesMetadata && data.slicesMetadata.length > 0) {
        const ids = data.slicesMetadata.map(slice => 
          `wadouri:https://storage.googleapis.com/${data.bucketName}/${data.dicomBasePath}/${slice.filename}`
        );
        setImageIds(ids);
        console.log(`✅ Created ${ids.length} sorted image IDs`);
      } else {
        // Fallback to sequential ordering
        const ids = [];
        for (let i = 1; i <= data.totalSlices; i++) {
          const filename = `slice_${String(i).padStart(4, '0')}.dcm`;
          const url = `https://storage.googleapis.com/${data.bucketName}/${data.dicomBasePath}/${filename}`;
          ids.push(`wadouri:${url}`);
        }
        setImageIds(ids);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading DICOM data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const loadAndDisplayImage = async (sliceIndex) => {
    if (!axialRef.current || !imageIds[sliceIndex]) return;

    try {
      const imageId = imageIds[sliceIndex];
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(axialRef.current, image);
      
      // Enable mouse wheel scrolling
      axialRef.current.addEventListener('wheel', handleMouseWheel);
    } catch (err) {
      console.error('Error loading image:', err);
    }
  };

  const handleMouseWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setCurrentSlice(prev => Math.max(0, prev - 1));
    } else {
      setCurrentSlice(prev => Math.min(imageIds.length - 1, prev + 1));
    }
  };

  if (loading) {
    return (
      <div className="dicom-viewer-mpr-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading DICOM data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dicom-viewer-mpr-container">
        <div className="error">
          <h2>Error Loading DICOM Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const totalSlices = imageIds.length;

  return (
    <div className="dicom-viewer-mpr-container">
      <div className="viewer-header">
        <h1>C Scans Kovai Viewer</h1>
        <div className="patient-info">
          <p><strong>Patient:</strong> {metadata?.patientName || 'N/A'}</p>
          <p><strong>Patient ID:</strong> {metadata?.patientID || 'N/A'}</p>
          <p><strong>Study Date:</strong> {metadata?.studyMetadata?.studyDate || 'N/A'}</p>
          <p><strong>Modality:</strong> {metadata?.studyMetadata?.modality || 'N/A'}</p>
        </div>
        <div className="view-mode-selector">
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

      {viewMode === 'single' ? (
        <div className="single-view">
          <div 
            ref={axialRef}
            className="cornerstone-viewport"
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
      ) : (
        <div className="mpr-view">
          {!mprInitialized ? (
            <div className="mpr-loading">
              <div className="spinner"></div>
              <p>Initializing MPR viewports...</p>
            </div>
          ) : loadedImages.length === 0 ? (
            <div className="mpr-loading">
              <div className="spinner"></div>
              <p>Loading {totalSlices} images for MPR reconstruction...</p>
              <p className="loading-hint">This may take a moment for large datasets</p>
            </div>
          ) : (
            <>
              <div className="mpr-grid">
                <div className="mpr-viewport">
                  <div className="viewport-label">Axial</div>
                  <div ref={axialRef} className="cornerstone-viewport" />
                </div>
                <div className="mpr-viewport">
                  <div className="viewport-label">Sagittal</div>
                  <div ref={sagittalRef} className="cornerstone-viewport" />
                </div>
                <div className="mpr-viewport">
                  <div className="viewport-label">Coronal</div>
                  <div ref={coronalRef} className="cornerstone-viewport" />
                </div>
              </div>
              <div className="viewer-controls">
                <div className="slice-info">
                  <p>Axial Slice {currentSlice + 1} of {totalSlices}</p>
                  <p>Sagittal: {sagittalSlice} | Coronal: {coronalSlice}</p>
                  <p className="success">✅ MPR Ready ({loadedImages.length} images loaded)</p>
                </div>
                <div className="mpr-controls">
                  <div className="control-group">
                    <label>Axial:</label>
                    <button 
                      onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
                      disabled={currentSlice === 0}
                      className="nav-button-small"
                    >
                      ←
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max={totalSlices - 1} 
                      value={currentSlice}
                      onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
                      className="slice-slider-small"
                    />
                    <button 
                      onClick={() => setCurrentSlice(Math.min(totalSlices - 1, currentSlice + 1))}
                      disabled={currentSlice === totalSlices - 1}
                      className="nav-button-small"
                    >
                      →
                    </button>
                  </div>
                  
                  <div className="control-group">
                    <label>Sagittal:</label>
                    <button 
                      onClick={() => setSagittalSlice(Math.max(0, sagittalSlice - 1))}
                      className="nav-button-small"
                    >
                      ←
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max={loadedImages[0]?.columns || 100} 
                      value={sagittalSlice}
                      onChange={(e) => setSagittalSlice(parseInt(e.target.value))}
                      className="slice-slider-small"
                    />
                    <button 
                      onClick={() => setSagittalSlice(Math.min(loadedImages[0]?.columns || 100, sagittalSlice + 1))}
                      className="nav-button-small"
                    >
                      →
                    </button>
                  </div>
                  
                  <div className="control-group">
                    <label>Coronal:</label>
                    <button 
                      onClick={() => setCoronalSlice(Math.max(0, coronalSlice - 1))}
                      className="nav-button-small"
                    >
                      ←
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max={loadedImages[0]?.rows || 100} 
                      value={coronalSlice}
                      onChange={(e) => setCoronalSlice(parseInt(e.target.value))}
                      className="slice-slider-small"
                    />
                    <button 
                      onClick={() => setCoronalSlice(Math.min(loadedImages[0]?.rows || 100, coronalSlice + 1))}
                      className="nav-button-small"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="metadata-section">
        <h3>Study Information</h3>
        <div className="metadata-grid">
          {metadata?.studyMetadata && Object.entries(metadata.studyMetadata).map(([key, value]) => (
            <div key={key} className="metadata-item">
              <strong>{key}:</strong> <span>{value?.toString() || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DicomViewerMPR;
