import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import './DicomViewerPremium.css';

// Initialize cornerstone WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneWADOImageLoader.configure({
  useWebWorkers: true,
  decodeConfig: {
    convertFloatPixelDataToInt: false
  }
});

// Memory diagnostic helper
const logMemory = (label) => {
  if (performance && performance.memory) {
    const mem = performance.memory;
    console.log(`🧠 [MEMORY] ${label}: Used=${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB, Total=${(mem.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB, Limit=${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`);
  } else {
    console.log(`🧠 [MEMORY] ${label}: (performance.memory not available on this browser)`);
  }
};

// Mobile detection — UA-based + coarse pointer (avoids false positives on touch-screen laptops)
const isMobile = () => {
  const ua = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!ua) return false;
  const shortEdge = Math.min(window.innerWidth, window.innerHeight);
  return shortEdge <= 768;
};

// Shared slice scroll handler for mouse wheel and touch swipe on any panel
const makeSliceWheelHandler = (setter, getTotal) => (e) => {
  e.preventDefault();
  const total = getTotal();
  const delta = e.deltaY > 0 ? 1 : -1;
  setter(prev => Math.max(0, Math.min(total - 1, prev + delta)));
};
const makeSliceTouchHandlers = (setter, getTotal, touchRef) => ({
  onTouchStart: (e) => { touchRef.current = e.touches[0].clientX; },
  onTouchMove: (e) => {
    if (touchRef.current === null) return;
    const diff = touchRef.current - e.touches[0].clientX;
    const total = getTotal();
    const pxPerSlice = Math.max(3, (window.innerWidth * 1.2) / total);
    if (Math.abs(diff) >= pxPerSlice) {
      const steps = Math.round(diff / pxPerSlice);
      setter(prev => Math.max(0, Math.min(total - 1, prev + steps)));
      touchRef.current = e.touches[0].clientX;
    }
  },
  onTouchEnd: () => { touchRef.current = null; }
});

const DicomViewerWithMPR = () => {
  const { caseId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('mpr'); // Default to MPR view
  const [currentSlice, setCurrentSlice] = useState(0);
  const [imageIds, setImageIds] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);
  const [mprLoading, setMprLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [deviceType, setDeviceType] = useState('desktop'); // Default to desktop view
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showingSliceIndicator, setShowingSliceIndicator] = useState(false);

  // Medical imaging tools state
  const [activeTool, setActiveTool] = useState('scroll');
  const [showToolbar, setShowToolbar] = useState(false);
  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState([]);
  const [rulerMeasurements, setRulerMeasurements] = useState([]);
  const [windowLevel, setWindowLevel] = useState({ width: 2000, center: 300 }); // Better CT defaults
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchScrollEnabled, setTouchScrollEnabled] = useState(false);

  // Maximize viewport state
  const [maximizedViewport, setMaximizedViewport] = useState(null); // 'axial', 'sagittal', 'coronal', or null

  const singleViewRef = useRef(null);
  const axialCanvasRef = useRef(null);
  const sagittalCanvasRef = useRef(null);
  const coronalCanvasRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const [singleViewEnabled, setSingleViewEnabled] = useState(false);

  // TRUE MPR SYNCHRONIZATION - Single 3D voxel position shared by all views
  const [mprPosition, setMprPosition] = useState({ x: 0, y: 0, z: 0 });

  // Pre-rendered MPR state
  const [mprData, setMprData] = useState(null); // Server MPR metadata
  const [activeView, setActiveView] = useState('axial'); // Current tab: axial, sagittal, coronal
  const [mprImages, setMprImages] = useState([]); // Loaded JPG object URLs for current view
  const [mprSliceIndex, setMprSliceIndex] = useState(0); // Current slice in pre-rendered view
  const [mprViewLoading, setMprViewLoading] = useState(false);
  const [usePreRendered, setUsePreRendered] = useState(false); // Flag: use pre-rendered vs raw
  const [mprCheckDone, setMprCheckDone] = useState(false); // Gate: blocks legacy loading until MPR check completes
  const [mprStatus, setMprStatus] = useState(null); // Tracks server-side processing ('processing', 'ready', 'not_started')
  const mprCanvasRef = useRef(null); // Single canvas for pre-rendered view
  
  // Panoramic state
  const [panoramicUrls, setPanoramicUrls] = useState([]);
  const [panoramicIndex, setPanoramicIndex] = useState(0);

  // Cross-Section state
  const [isDrawingCurve, setIsDrawingCurve] = useState(false);
  const [crossSectionPoints, setCrossSectionPoints] = useState([]);
  const [crossSectionData, setCrossSectionData] = useState(null);
  const [csStatus, setCsStatus] = useState(null); // processing, ready, error
  const [csImages, setCsImages] = useState([]);
  const [csSliceIndex, setCsSliceIndex] = useState(0);
  const [csProgress, setCsProgress] = useState(null); // { phase, current, total }
  const [isSplitView, setIsSplitView] = useState(false);
  const [jawCurveSliceIndex, setJawCurveSliceIndex] = useState(0);
  const [csFullscreen, setCsFullscreen] = useState(false); // Fullscreen cross-section viewer
  const [panoCollapsed, setPanoCollapsed] = useState(false);
  const [mobileAxialVisible, setMobileAxialVisible] = useState(true);
  const [sliceThickness, setSliceThickness] = useState(0.0);
  const [panoScaleX, setPanoScaleX] = useState(1.0);
  const [panoScaleY, setPanoScaleY] = useState(1.0);
  const csTouchStartRef = useRef(null);
  const axialTouchRef = useRef(null);
  const panoTouchRef = useRef(null);

  // Blob URL cache to instantly switch tabs without redownloading images
  const [cachedMprViews, setCachedMprViews] = useState({ axial: [], sagittal: [], coronal: [], 'cross-sections': [] });
  const activeCacheRef = useRef(cachedMprViews);

  useEffect(() => {
    activeCacheRef.current = cachedMprViews;
  }, [cachedMprViews]);

  // Clean up ALL blob URLs only on unmount
  useEffect(() => {
    return () => {
      Object.values(activeCacheRef.current).forEach(arr => {
        arr.forEach(url => {
          if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
      });
    };
  }, []);

  console.log('📱 [INIT] isMobile:', isMobile(), 'userAgent:', navigator.userAgent.substring(0, 60));
  logMemory('Component render');

  // Handle double-click to maximize/minimize viewport
  const handleViewportDoubleClick = (viewportName) => {
    if (maximizedViewport === viewportName) {
      // Already maximized, minimize it
      setMaximizedViewport(null);
    } else {
      // Maximize this viewport
      setMaximizedViewport(viewportName);
    }
  };

  useEffect(() => {
    fetchDicomData();
  }, [caseId]);

  // Check MPR availability after metadata loads
  useEffect(() => {
    if (metadata) {
      checkMPRAvailability();
    }
  }, [metadata]);

  useEffect(() => {
    if (singleViewRef.current && !singleViewEnabled && viewMode === 'single') {
      try {
        cornerstone.enable(singleViewRef.current);
        setSingleViewEnabled(true);
      } catch (err) {
        console.error('Error enabling cornerstone:', err);
      }
    }
  }, [singleViewRef.current, viewMode]);

  useEffect(() => {
    if (singleViewEnabled && imageIds.length > 0 && viewMode === 'single') {
      loadAndDisplayImage(currentSlice);
    }
  }, [currentSlice, imageIds, singleViewEnabled, viewMode]);

  // For legacy raw DICOM MPR (desktop fallback when no pre-rendered data)
  // CRITICAL: must wait for mprCheckDone AND must NOT run on mobile
  useEffect(() => {
    if (viewMode === 'mpr' && mprCheckDone && !usePreRendered && !isMobile() && imageIds.length > 0 && loadedImages.length === 0) {
      console.log('🔄 [LEGACY MPR] Starting raw DICOM loading (desktop only, mprCheckDone=true, usePreRendered=false)');
      logMemory('Before legacy loadAllImagesForMPR');
      loadAllImagesForMPR();
    } else if (viewMode === 'mpr' && mprCheckDone && !usePreRendered && isMobile()) {
      console.log('📱 [MOBILE] Blocking legacy raw DICOM loading on mobile — no pre-rendered data available');
    }
  }, [viewMode, imageIds, usePreRendered, mprCheckDone]);

  useEffect(() => {
    if (viewMode === 'mpr' && !usePreRendered && loadedImages.length > 0) {
      renderMPRViews();
    }
  }, [viewMode, loadedImages, mprPosition, usePreRendered]);

  // Re-render legacy MPR views when maximize state changes
  useEffect(() => {
    if (viewMode === 'mpr' && !usePreRendered && loadedImages.length > 0) {
      setTimeout(() => {
        renderMPRViews();
      }, 100);
    }
  }, [maximizedViewport]);

  // Load pre-rendered view when active tab changes
  useEffect(() => {
    if (viewMode === 'mpr' && usePreRendered) {
      if (['axial', 'sagittal', 'coronal'].includes(activeView) && mprData) {
        loadMPRView(activeView);
      } else if (activeView === 'cross-sections' && crossSectionData) {
        loadCrossSectionView();
      }
    }
  }, [activeView, viewMode, usePreRendered, mprData, crossSectionData]);


  // Cleanup MPR images on unmount
  useEffect(() => {
    return () => cleanupMPRImages();
  }, []);

  const getBackendUrl = () => {
    return 'https://dicom-backend-517537048458.asia-south1.run.app';
  };

  const fetchDicomData = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/viewer/${caseId}`);

      if (!response.ok) {
        throw new Error('Failed to load DICOM data');
      }

      const data = await response.json();
      setMetadata(data);

      if (data.slicesMetadata && data.slicesMetadata.length > 0) {
        const ids = data.slicesMetadata.map(slice => {
          const url = `https://storage.googleapis.com/${data.bucketName}/${data.dicomBasePath}/${slice.filename}`;
          return `wadouri:${url}`;
        });
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

  // Check if server-side pre-rendered MPR is available
  const checkMPRAvailability = async () => {
    console.log('🔍 [MPR CHECK] Starting MPR availability check...');
    logMemory('Before MPR check');
    try {
      const backendUrl = getBackendUrl();
      console.log('🔍 [MPR CHECK] Fetching:', `${backendUrl}/viewer/mpr-status/${caseId}`);
      const response = await fetch(`${backendUrl}/viewer/mpr-status/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [MPR CHECK] Response:', JSON.stringify(data).substring(0, 200));
        
        if (data.panoramicUrls && data.panoramicUrls.length > 0) {
          console.log(`🖼️ [MPR CHECK] Found ${data.panoramicUrls.length} Panoramic slices`);
          setPanoramicUrls(data.panoramicUrls);
        }
        
        if (data.available) {
          console.log('✅ [MPR CHECK] Pre-rendered MPR AVAILABLE — will use pre-rendered mode');
          setMprData(data);
          setUsePreRendered(true);
          setMprStatus('ready');
          
          // Cross-Section Check (only if MPR is available, as it relies on the same volume)
          try {
            const csRes = await fetch(`${backendUrl}/viewer/cross-sections/${caseId}?branchId=${metadata.branchId || 'default'}`);
            if (csRes.ok) {
            const csJson = await csRes.json();
            const csStatus = csJson.status || (csJson.success && csJson.metadata ? 'ready' : 'not_ready');
            if (csJson.success && csStatus === 'ready' && csJson.metadata) {
              console.log(`🦷 [CS CHECK] Found ${csJson.metadata.totalSections} Cross Sections!`);
              setCrossSectionData(csJson.metadata);
              setCsStatus('ready');
              if (csJson.metadata.sourceSliceIndex != null) {
                setJawCurveSliceIndex(csJson.metadata.sourceSliceIndex);
                setMprSliceIndex(csJson.metadata.sourceSliceIndex);
              } else if (data.axial?.totalSlices) {
                const mid = Math.floor(data.axial.totalSlices / 2);
                setJawCurveSliceIndex(mid);
              }
            } else if (csStatus === 'processing') {
              setCsStatus('processing');
            }
            }
          } catch(e) { console.warn('🦷 [CS CHECK] Failed to fetch cross sections', e); }
          
        } else {
          console.log('⚠️ [MPR CHECK] Pre-rendered MPR NOT available, status:', data.mprStatus);
          if (isMobile()) {
            console.log('📱 [MPR CHECK] On mobile — will show "not available" message instead of loading raw DICOM');
          }
          
          // Even if MPR is not ready, if we have panoramas we should show the prerendered view tab
          if (data.panoramicUrls && data.panoramicUrls.length > 0) {
            setUsePreRendered(true);
            setActiveView('panoramic');
          } else {
            setUsePreRendered(false);
          }
          setMprStatus(data.mprStatus || 'not_started');
        }
      } else {
        console.log('⚠️ [MPR CHECK] Server returned non-OK:', response.status);
        setUsePreRendered(false);
        setMprStatus('error');
      }
    } catch (err) {
      console.log('⚠️ [MPR CHECK] Failed:', err.message);
      setUsePreRendered(false);
      setMprStatus('error');
    } finally {
      // CRITICAL: Always mark check as done so legacy path can proceed (on desktop)
      console.log('🔍 [MPR CHECK] Check complete, unblocking legacy path');
      setMprCheckDone(true);
    }
  };

  // Clean up previous MPR image blob URLs to free memory
  const cleanupMPRImages = () => {
    // We now cache these in memory using cachedMprViews, so do NOT eagerly revoke them here!
    // Memory leaks are prevented by the unmount useEffect in the component root.
    setMprImages([]);
  };

  // Load one view's pre-rendered JPGs from GCS
  const loadMPRView = async (view) => {
    if (!mprData) return;

    if (cachedMprViews[view] && cachedMprViews[view].length > 0) {
      console.log(`⚡ [CACHE] Loading ${view} view from memory cache (${cachedMprViews[view].length} slices)`);
      setMprImages(cachedMprViews[view]);
      return; 
    }

    setMprViewLoading(true);
    setLoadingProgress(0);
    cleanupMPRImages();

    const viewData = mprData[view];
    if (!viewData) {
      console.error(`No MPR data for view: ${view}`);
      setMprViewLoading(false);
      return;
    }

    const totalSlices = viewData.totalSlices;
    const bucketName = mprData.bucketName;
    const viewPath = viewData.path;

    console.log(`🔄 [PRE-RENDERED] Loading ${view} view: ${totalSlices} pre-rendered slices...`);
    logMemory(`Before loading ${view} view`);

    try {
      const imageUrls = [];
      const batchSize = isMobile() ? 10 : 20; // Smaller batches on mobile

      for (let i = 0; i < totalSlices; i += batchSize) {
        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, totalSlices); j++) {
          const filename = `slice_${String(j + 1).padStart(4, '0')}.jpg`;
          const cacheBuster = mprData.generatedAt ? `?v=${new Date(mprData.generatedAt).getTime()}` : '';
          const url = `https://storage.googleapis.com/${bucketName}/${viewPath}/${filename}${cacheBuster}`;
          batchPromises.push(
            fetch(url)
              .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status} for ${filename}`);
                return r.blob();
              })
              .then(blob => ({ index: j, blobUrl: URL.createObjectURL(blob) }))
              .catch(err => {
                console.warn(`⚠️ Failed to load ${filename}:`, err.message);
                return { index: j, blobUrl: null };
              })
          );
        }

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ index, blobUrl }) => {
          imageUrls[index] = blobUrl;
        });

        const progress = Math.round((Math.min(i + batchSize, totalSlices) / totalSlices) * 100);
        setLoadingProgress(progress);

        if ((i + batchSize) % 100 === 0 || i + batchSize >= totalSlices) {
          logMemory(`${view} loading ${Math.min(i + batchSize, totalSlices)}/${totalSlices}`);
        }
      }

      setMprImages(imageUrls);
      setCachedMprViews(prev => ({ ...prev, [view]: imageUrls }));
      setMprSliceIndex(Math.floor(totalSlices / 2)); // Start at center
      setMprViewLoading(false);
      setLoadingProgress(100);
      console.log(`✅ [PRE-RENDERED] Loaded ${totalSlices} ${view} slices`);
      logMemory(`After loading ${view} view`);
    } catch (err) {
      console.error(`❌ [PRE-RENDERED] Error loading ${view} view:`, err);
      logMemory(`Error during ${view} load`);
      setMprViewLoading(false);
    }
  };

  // Load Cross Section JPG array from GCS
  const loadCrossSectionView = async () => {
    if (!crossSectionData) return;
    
    if (cachedMprViews['cross-sections'] && cachedMprViews['cross-sections'].length > 0) {
      console.log(`⚡ [CACHE] Loading cross-sections from memory cache (${cachedMprViews['cross-sections'].length} slices)`);
      setCsImages(cachedMprViews['cross-sections']);
      setCsSliceIndex(0);
      return; 
    }

    setMprViewLoading(true);
    setLoadingProgress(0);
    // REMOVED cleanupMPRImages() to prevent axial view from flashing black during CS load

    const totalSlices = crossSectionData.totalSections;
    const backendUrl = getBackendUrl();
    const csPath = crossSectionData.path;
    // Note: The main MPR payload has the bucket name, or we can use the backend proxy for signing URLs if needed.
    // Wait, dicomBasePath and MPR bucketName are stored in MPR metadata.
    // If MPR is available, we have mprData.bucketName! 
    const bucketName = mprData?.bucketName || 'medical-referral-system-c2e73.firebasestorage.app'; // Fallback if somehow missing

    console.log(`🔄 [CROSS-SECTION] Loading ${totalSlices} slices...`);

    try {
      const imageUrls = [];
      const batchSize = isMobile() ? 10 : 20;

      for (let i = 0; i < totalSlices; i += batchSize) {
        const batchPromises = [];
        for (let j = i; j < Math.min(i + batchSize, totalSlices); j++) {
          const filename = `cs_${String(j + 1).padStart(4, '0')}.jpg`;
          const cacheBuster = crossSectionData.generatedAt ? `?v=${new Date(crossSectionData.generatedAt).getTime()}` : '';
          const url = `https://storage.googleapis.com/${bucketName}/${csPath}/${filename}${cacheBuster}`;
          
          batchPromises.push(
            fetch(url)
              .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.blob();
              })
              .then(blob => ({ index: j, blobUrl: URL.createObjectURL(blob) }))
              .catch(err => ({ index: j, blobUrl: null }))
          );
        }

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ index, blobUrl }) => {
          imageUrls[index] = blobUrl;
        });

        const progress = Math.round((Math.min(i + batchSize, totalSlices) / totalSlices) * 100);
        setLoadingProgress(progress);
      }

      setCsImages(imageUrls);
      setCachedMprViews(prev => ({ ...prev, 'cross-sections': imageUrls }));
      setCsSliceIndex(0);
      setMprViewLoading(false);
      setLoadingProgress(100);
      console.log(`✅ [CROSS-SECTION] Loaded ${totalSlices} slices`);
    } catch (err) {
      console.error(`❌ [CROSS-SECTION] Error loading views:`, err);
      setMprViewLoading(false);
    }
  };


  // Handle tab switch for pre-rendered MPR
  const switchMPRView = (view) => {
    if (view === activeView && view !== 'cross-sections') return;
    setActiveView(view);
    setIsDrawingCurve(false);
    if (view === 'panoramic') {
      setPanoramicIndex(0);
    }
    if (view === 'cross-sections' && crossSectionData) {
      setIsSplitView(true);
      setPanoCollapsed(false);
      if (isMobile()) setCsFullscreen(true);
    }
  };

  // --- CROSS SECTION DRAWING TOOLS ---
  const handleAxialClick = (e) => {
    if (!isDrawingCurve || activeView !== 'axial') return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale CSS pixels to original DICOM dimensionality
    const originalWidth = mprData?.dimensions?.width || 512;
    const originalHeight = mprData?.dimensions?.height || 512;
    
    // The image objectFit is 'contain', so we must precisely calculate the actual rendered image boundaries within the element
    // To be safe, we assume the object stretches, but it retains aspect ratio.
    const containerRatio = rect.width / rect.height;
    const imageRatio = originalWidth / originalHeight;
    
    let renderWidth = rect.width;
    let renderHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (containerRatio > imageRatio) {
      renderWidth = rect.height * imageRatio;
      offsetX = (rect.width - renderWidth) / 2;
    } else {
      renderHeight = rect.width / imageRatio;
      offsetY = (rect.height - renderHeight) / 2;
    }
    
    console.log(`🎯 [AXIAL CLICK] Raw:(${Math.round(x)},${Math.round(y)}) Rendered:${Math.round(renderWidth)}x${Math.round(renderHeight)} Offset:(${Math.round(offsetX)},${Math.round(offsetY)})`);
    
    
    // Check if click was outside the actual image area
    if (x < offsetX || x > offsetX + renderWidth || y < offsetY || y > offsetY + renderHeight) {
      return; 
    }
    
    const imageX = Math.round(((x - offsetX) / renderWidth) * originalWidth);
    const imageY = Math.round(((y - offsetY) / renderHeight) * originalHeight);
    
    setCrossSectionPoints(prev => [...prev, { x: imageX, y: imageY }]);
  };

  const submitCrossSectionRequest = async () => {
    if (crossSectionPoints.length < 3) {
      alert("Please draw at least 3 points along the arch.");
      return;
    }
    
    console.log("Processing..");
    setCsStatus('processing');
    setIsDrawingCurve(false);
    
    try {
      setJawCurveSliceIndex(mprSliceIndex); // Remember the slice where curve was drawn
      const bId = metadata.branchId || mprData?.branchId;
      if (!bId) {
        console.error("❌ Cannot submit request: Missing branchId");
        alert("System error: Missing branch identifier. Please refresh.");
        setCsStatus('error');
        return;
      }

      const numSections = 100;
      const payload = {
        branchId: bId,
        controlPoints: crossSectionPoints,
        numSections,
        sectionWidth: 150,
        sliceIndex: mprSliceIndex
      };
      
      setIsDrawingCurve(false); // Stop drawing mode once submitted
      console.log(`🚀 [CS SUBMIT] Requesting ${numSections} sections with ${crossSectionPoints.length} points`);
      
      const res = await fetch(`${getBackendUrl()}/viewer/generate-cross-sections/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("API call failed");
      
      // Start polling for completion
      const pollInterval = setInterval(async () => {
        try {
          console.log(`📡 [CS POLL] Checking status for branch: ${bId}...`);
          const check = await fetch(`${getBackendUrl()}/viewer/cross-sections/${caseId}?branchId=${bId}`);
          if (check.ok) {
            const data = await check.json();
            const status = data.status || (data.success && data.metadata ? 'ready' : 'not_ready');
            console.log(`📡 [CS POLL] Status: ${status}`, data.progress ? `Progress: ${data.progress.current}/${data.progress.total}` : '');
            
            if (data.progress) {
              setCsProgress(data.progress);
            }

            if (data.success && status === 'ready' && data.metadata) {
              console.log(`✅ [CS POLL] Generation complete!`);
              clearInterval(pollInterval);
              
              // Clear OLD cross-sections from cache and revoke
              if (cachedMprViews['cross-sections']) {
                  cachedMprViews['cross-sections'].forEach(u => {
                      if (u && u.startsWith('blob:')) URL.revokeObjectURL(u);
                  });
              }
              setCachedMprViews(prev => ({ ...prev, 'cross-sections': [] }));
              
              setCrossSectionData(data.metadata);
              setCsStatus('ready');
              setCsProgress(null);
              setIsSplitView(true);
              if (isMobile()) {
                setCsFullscreen(true);
              }
              switchMPRView('cross-sections');
            }
          }
        } catch(e) {
          console.error(`❌ [CS POLL] Error:`, e.message);
        }
      }, 3000);
      
      // Safety timeout after 5 mins
      setTimeout(() => clearInterval(pollInterval), 300000);
      
    } catch(e) {
      console.error("Failed to generate cross sections:", e);
      setCsStatus('error');
      alert("Failed to submit request.");
    }
  };

  const loadAndDisplayImage = async (sliceIndex) => {
    if (!singleViewRef.current || !imageIds[sliceIndex]) return;

    try {
      const imageId = imageIds[sliceIndex];
      const image = await cornerstone.loadImage(imageId);
      cornerstone.displayImage(singleViewRef.current, image);

      const viewport = cornerstone.getViewport(singleViewRef.current);
      if (viewport) {
        viewport.voi.windowWidth = windowLevel.width;
        viewport.voi.windowCenter = windowLevel.center;
        viewport.scale = zoomLevel;
        viewport.translation = panOffset;
        viewport.invert = false;
        cornerstone.setViewport(singleViewRef.current, viewport);
      }
    } catch (err) {
      console.error('Error loading image:', err);
    }
  };

  // Legacy: Load all raw DICOM images for MPR (desktop fallback)
  const loadAllImagesForMPR = async () => {
    setMprLoading(true);
    setLoadingProgress(0);
    console.log('🔄 [LEGACY] Loading all images for MPR (legacy mode)...');
    logMemory('Legacy MPR - start');

    try {
      const images = [];
      const batchSize = 50;

      for (let i = 0; i < imageIds.length; i += batchSize) {
        const batch = imageIds.slice(i, Math.min(i + batchSize, imageIds.length));
        const batchImages = await Promise.all(
          batch.map(id => cornerstone.loadImage(id))
        );
        images.push(...batchImages);

        const progress = Math.round((images.length / imageIds.length) * 100);
        setLoadingProgress(progress);
        console.log(`[LEGACY] Loaded ${images.length}/${imageIds.length} images (${progress}%)`);
        logMemory(`Legacy MPR - ${images.length} loaded`);
      }

      setLoadedImages(images);

      setMprPosition({
        x: Math.floor(images[0].width / 2),
        y: Math.floor(images[0].height / 2),
        z: Math.floor(images.length / 2)
      });

      setMprLoading(false);
      setLoadingProgress(100);
      console.log('✅ [LEGACY] All images loaded for MPR');
      logMemory('Legacy MPR - complete');
    } catch (err) {
      console.error('Error loading images for MPR:', err);
      setError('Failed to load images for MPR');
      setMprLoading(false);
    }
  };

  const [autoDetecting, setAutoDetecting] = useState(false);

  const generateDefaultCurve = async () => {
    console.log('🔍 Auto-detecting jaw curve from DICOM data...');
    setIsDrawingCurve(false);
    setAutoDetecting(true);
    
    try {
      const bId = metadata.branchId || mprData?.branchId;
      if (!bId) {
        alert('System error: Missing branch identifier.');
        setAutoDetecting(false);
        return;
      }

      const sliceIdx = mprSliceIndex >= 0 ? mprSliceIndex : -1;
      const res = await fetch(
        `${getBackendUrl()}/viewer/auto-curve/${caseId}?branchId=${bId}&sliceIndex=${sliceIdx}`
      );

      if (!res.ok) throw new Error('Auto-detection failed');
      const data = await res.json();

      if (data.success && data.points && data.points.length >= 3) {
        console.log(`✅ Auto-detected ${data.points.length} points (method: ${data.method})`);
        setCrossSectionPoints(data.points);
        setCsStatus(null);
        setCrossSectionData(null);
        setCsProgress(null);
      } else {
        alert('Could not detect jaw curve. Please draw manually.');
      }
    } catch (err) {
      console.error('❌ Auto-detect failed:', err);
      alert('Auto-detection failed. Please draw the curve manually.');
    } finally {
      setAutoDetecting(false);
    }
  };

  const renderMPRViews = () => {
    if (loadedImages.length === 0) return;

    renderAxialView();
    renderSagittalView();
    renderCoronalView();
  };

  const renderAxialView = () => {
    const canvas = axialCanvasRef.current;
    if (!canvas || !loadedImages[mprPosition.z]) return;

    const image = loadedImages[mprPosition.z];
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(image.width, image.height);

    const pixelData = image.getPixelData();
    for (let i = 0; i < pixelData.length; i++) {
      const value = Math.min(255, Math.max(0, (pixelData[i] + 1024) / 16));
      imageData.data[i * 4] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const renderSagittalView = () => {
    const canvas = sagittalCanvasRef.current;
    if (!canvas || loadedImages.length === 0) return;

    const width = loadedImages.length;
    const height = loadedImages[0].height;

    // Rotate 90 degrees left: swap width and height
    canvas.width = height;
    canvas.height = width;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(height, width);

    for (let z = 0; z < loadedImages.length; z++) {
      const image = loadedImages[z];
      const pixelData = image.getPixelData();

      for (let y = 0; y < height; y++) {
        const srcIndex = y * image.width + mprPosition.x;
        // Rotate 90 degrees left: (x, y) -> (y, width - x - 1)
        const dstIndex = (width - z - 1) * height + y;
        const value = Math.min(255, Math.max(0, (pixelData[srcIndex] + 1024) / 16));

        imageData.data[dstIndex * 4] = value;
        imageData.data[dstIndex * 4 + 1] = value;
        imageData.data[dstIndex * 4 + 2] = value;
        imageData.data[dstIndex * 4 + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const renderCoronalView = () => {
    const canvas = coronalCanvasRef.current;
    if (!canvas || loadedImages.length === 0) return;

    const width = loadedImages[0].width;
    const height = loadedImages.length;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);

    for (let z = 0; z < loadedImages.length; z++) {
      const image = loadedImages[z];
      const pixelData = image.getPixelData();

      for (let x = 0; x < width; x++) {
        const srcIndex = mprPosition.y * image.width + x;
        // Flip 180 degrees: reverse both Z and X
        const dstIndex = (height - z - 1) * width + (width - x - 1);
        const value = Math.min(255, Math.max(0, (pixelData[srcIndex] + 1024) / 16));

        imageData.data[dstIndex * 4] = value;
        imageData.data[dstIndex * 4 + 1] = value;
        imageData.data[dstIndex * 4 + 2] = value;
        imageData.data[dstIndex * 4 + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleMouseWheel = (e) => {
    if (!singleViewRef.current) return;

    if (activeTool === 'zoom') {
      // Zoom tool using Cornerstone viewport
      e.preventDefault();
      e.stopPropagation();

      const viewport = cornerstone.getViewport(singleViewRef.current);
      if (viewport) {
        const delta = e.deltaY;
        const scaleFactor = delta < 0 ? 1.1 : 0.9;
        viewport.scale = Math.max(0.5, Math.min(5, viewport.scale * scaleFactor));
        setZoomLevel(viewport.scale);
        cornerstone.setViewport(singleViewRef.current, viewport);
      }
    } else if (activeTool === 'scroll') {
      // Scroll slices (default behavior)
      e.preventDefault();
      e.stopPropagation();

      setShowingSliceIndicator(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setShowingSliceIndicator(false);
      }, 800);

      const delta = e.deltaY;
      const sensitivity = Math.abs(delta) > 100 ? 2 : 1;

      if (delta < 0) {
        setCurrentSlice(prev => Math.max(0, prev - sensitivity));
      } else {
        setCurrentSlice(prev => Math.min(imageIds.length - 1, prev + sensitivity));
      }
    }
  };

  const handleMouseDown = (e) => {
    if (!singleViewRef.current) return;

    if (activeTool === 'pan') {
      setIsDragging(true);
      const viewport = cornerstone.getViewport(singleViewRef.current);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        translation: viewport ? { ...viewport.translation } : { x: 0, y: 0 }
      });
    } else if (activeTool === 'windowLevel') {
      setIsDragging(true);
      const viewport = cornerstone.getViewport(singleViewRef.current);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        voi: viewport ? { ...viewport.voi } : { windowWidth: 400, windowCenter: 40 }
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !singleViewRef.current) return;

    const viewport = cornerstone.getViewport(singleViewRef.current);
    if (!viewport) return;

    if (activeTool === 'pan') {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      viewport.translation = {
        x: dragStart.translation.x + deltaX,
        y: dragStart.translation.y + deltaY
      };

      setPanOffset(viewport.translation);
      cornerstone.setViewport(singleViewRef.current, viewport);
    } else if (activeTool === 'windowLevel') {
      const deltaX = (e.clientX - dragStart.x) * 2;
      const deltaY = (e.clientY - dragStart.y) * 2;

      viewport.voi.windowWidth = Math.max(1, dragStart.voi.windowWidth + deltaX);
      viewport.voi.windowCenter = dragStart.voi.windowCenter - deltaY;

      setWindowLevel({
        width: viewport.voi.windowWidth,
        center: viewport.voi.windowCenter
      });

      cornerstone.setViewport(singleViewRef.current, viewport);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (touchScrollEnabled && e.touches.length === 1) {
      setDragStart({ x: 0, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (touchScrollEnabled && e.touches.length === 1) {
      const deltaY = dragStart.y - e.touches[0].clientY;

      if (Math.abs(deltaY) > 10) {
        setShowingSliceIndicator(true);

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          setShowingSliceIndicator(false);
        }, 800);

        const sensitivity = Math.abs(deltaY) > 50 ? 2 : 1;

        if (deltaY > 0) {
          setCurrentSlice(prev => Math.min(imageIds.length - 1, prev + sensitivity));
        } else {
          setCurrentSlice(prev => Math.max(0, prev - sensitivity));
        }

        setDragStart({ x: 0, y: e.touches[0].clientY });
      }
    }
  };

  const resetTools = () => {
    if (!singleViewRef.current) return;

    const viewport = cornerstone.getViewport(singleViewRef.current);
    if (viewport) {
      viewport.scale = 1;
      viewport.translation = { x: 0, y: 0 };
      viewport.voi.windowWidth = 2000;
      viewport.voi.windowCenter = 300;
      viewport.invert = false;
      cornerstone.setViewport(singleViewRef.current, viewport);
    }

    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setWindowLevel({ width: 2000, center: 300 });
    setActiveTool('scroll');
    setRulerActive(false);
    setRulerPoints([]);
    setRulerMeasurements([]);
  };

  const pixelSpacingMm = parseFloat(metadata?.studyMetadata?.pixelSpacing?.split('\\')[0]) || 0.4;

  const handleRulerClick = (e) => {
    if (!rulerActive) return;
    const container = e.currentTarget;
    const containerRect = container.getBoundingClientRect();
    const img = container.querySelector('img');
    if (!img) return;
    const imgRect = img.getBoundingClientRect();
    const x = e.clientX - imgRect.left;
    const y = e.clientY - imgRect.top;
    if (x < 0 || y < 0 || x > imgRect.width || y > imgRect.height) return;
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    const px = x * scaleX;
    const py = y * scaleY;
    const pctX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const pctY = ((e.clientY - containerRect.top) / containerRect.height) * 100;

    if (rulerPoints.length === 0) {
      setRulerPoints([{ px, py, pctX, pctY }]);
    } else if (rulerPoints.length === 1) {
      const p1 = rulerPoints[0];
      const dx = (px - p1.px) * pixelSpacingMm;
      const dy = (py - p1.py) * pixelSpacingMm;
      const distMm = Math.sqrt(dx * dx + dy * dy);
      const newMeasurement = { p1, p2: { px, py, pctX, pctY }, distMm };
      setRulerMeasurements(prev => [...prev, newMeasurement]);
      setRulerPoints([]);
    }
  };

  const RulerOverlay = () => (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20 }}>
      {rulerMeasurements.map((m, i) => (
        <g key={i}>
          <line x1={`${m.p1.pctX}%`} y1={`${m.p1.pctY}%`} x2={`${m.p2.pctX}%`} y2={`${m.p2.pctY}%`}
            stroke="#00ebd3" strokeWidth="2" />
          <circle cx={`${m.p1.pctX}%`} cy={`${m.p1.pctY}%`} r="3" fill="#00ebd3" />
          <circle cx={`${m.p2.pctX}%`} cy={`${m.p2.pctY}%`} r="3" fill="#00ebd3" />
          <text x={`${(m.p1.pctX + m.p2.pctX) / 2}%`} y={`${(m.p1.pctY + m.p2.pctY) / 2 - 1.5}%`}
            fill="#00ebd3" fontSize="12" fontWeight="bold" textAnchor="middle"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
            {m.distMm.toFixed(1)} mm
          </text>
        </g>
      ))}
      {rulerPoints.length === 1 && (
        <circle cx={`${rulerPoints[0].pctX}%`} cy={`${rulerPoints[0].pctY}%`} r="4" fill="#ff4444" stroke="#fff" strokeWidth="1" />
      )}
    </svg>
  );

  const handleTouchScroll = (e) => {
    // For mobile touch scrolling
    const touch = e.touches[0];
    if (!touch) return;

    setShowingSliceIndicator(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setShowingSliceIndicator(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="dicom-viewer-container medical-theme">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading DICOM data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dicom-viewer-container medical-theme">
        <div className="error">
          <h2>Error Loading DICOM Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="dicom-viewer-container medical-theme">
        <div className="error">
          <h2>No Data Found</h2>
          <p>Case ID: {caseId}</p>
        </div>
      </div>
    );
  }
  const totalSlices = imageIds.length;

  // Desktop optimized view
  if (deviceType === 'desktop') {
    return (
      <div className={`dicom-viewer-container medical-theme desktop-layout ${headerCollapsed ? 'header-collapsed' : ''}`}>
        {/* Floating Slice Indicator - Subtle Corner Overlay */}
        {viewMode === 'single' && (
          <div className={`floating-slice-indicator ${showingSliceIndicator ? 'show' : ''}`}>
            <span className="slice-number">{currentSlice + 1}</span>
            <span className="slice-total">/ {totalSlices}</span>
          </div>
        )}

        <div className="viewer-header-medical compact">
          <div className="header-main-row">
            <div className="logo-section-compact">
              <div className="medical-logo-small">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span className="viewer-title">C Scans Kovai</span>
            </div>

            <div className="header-quick-info">
              <span className="quick-info-item">{metadata.studyMetadata?.patientName || 'N/A'}</span>
              <span className="quick-info-separator">•</span>
              <span className="quick-info-item">{totalSlices} slices</span>
              <span className="quick-info-separator">•</span>
              <span className="quick-info-item">{metadata.studyMetadata?.modality || 'N/A'}</span>
            </div>

            <div className="header-actions">
              <button
                className={`tools-btn ${showToolbar ? 'active' : ''}`}
                onClick={() => setShowToolbar(!showToolbar)}
                title="Medical Tools"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </button>

              <div className="view-mode-toggle-compact">
                <button
                  className="mode-btn-compact active"
                  title="MPR View"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>

              <button
                className="header-toggle-btn"
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                title={headerCollapsed ? "Show details" : "Hide details"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ transform: headerCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {showToolbar && (
            <div className="medical-toolbar">
              <button
                className={`tool-btn ${rulerActive ? 'active' : ''}`}
                onClick={() => { setRulerActive(!rulerActive); if (rulerActive) setRulerPoints([]); }}
                title="Ruler - Click two points to measure"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 2l20 20" />
                  <path d="M5.5 5.5L8 3" />
                  <path d="M9.5 9.5L12 7" />
                  <path d="M13.5 13.5L16 11" />
                  <path d="M17.5 17.5L20 15" />
                </svg>
                <span>Ruler</span>
              </button>

              <button
                className="tool-btn"
                onClick={() => { setRulerMeasurements([]); setRulerPoints([]); }}
                title="Clear all measurements"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
                <span>Clear</span>
              </button>

              <button
                className="tool-btn reset-btn"
                onClick={resetTools}
                title="Reset All Tools"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset</span>
              </button>
            </div>
          )}

          {!headerCollapsed && !(isMobile() && activeView === 'cross-sections' && isSplitView) && (
            <div className="header-details-panel">
              <div className="patient-info-compact">
                <div className="info-card-compact">
                  <span className="info-label-compact">Patient ID</span>
                  <span className="info-value-compact">{metadata.studyMetadata?.patientID || 'N/A'}</span>
                </div>
                <div className="info-card-compact">
                  <span className="info-label-compact">Study Date</span>
                  <span className="info-value-compact">{metadata.studyMetadata?.studyDate || 'N/A'}</span>
                </div>
                <div className="info-card-compact">
                  <span className="info-label-compact">Series</span>
                  <span className="info-value-compact">{metadata.studyMetadata?.seriesDescription || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="viewer-main-medical viewer-first">
          {viewMode === 'single' ? (
            <div className="single-view-container-premium">
              <div
                ref={singleViewRef}
                className="cornerstone-viewport-premium"
                onWheel={handleMouseWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                style={{
                  cursor: activeTool === 'pan' ? 'move' : activeTool === 'zoom' ? 'zoom-in' : activeTool === 'windowLevel' ? 'crosshair' : 'default'
                }}
              />

              <div className="viewer-controls-premium">
                <div className="slice-navigation-premium">
                  <button
                    onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
                    disabled={currentSlice === 0}
                    className="nav-btn-premium"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <div className="slice-scrubber">
                    <input
                      type="range"
                      min="0"
                      max={totalSlices - 1}
                      value={currentSlice}
                      onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
                      className="slice-slider-premium"
                      orient="horizontal"
                    />
                    <div className="slice-info-overlay">
                      <span className="current-slice">{currentSlice + 1}</span>
                      <span className="slice-divider">/</span>
                      <span className="total-slices">{totalSlices}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentSlice(Math.min(totalSlices - 1, currentSlice + 1))}
                    disabled={currentSlice === totalSlices - 1}
                    className="nav-btn-premium"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (mprLoading || mprViewLoading) ? (
            <div className="loading-medical">
              <div className="loading-progress-container">
                <div className="loading-progress-bar">
                  <div
                    className="loading-progress-fill"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <p style={{ color: 'var(--medical-text)', fontSize: '14px', margin: '16px 0 0 0' }}>
                  {usePreRendered ? `Loading ${activeView} view...` : `Loading ${totalSlices} slices for MPR...`} {loadingProgress}%
                </p>
              </div>
            </div>
          ) : (!usePreRendered && (mprStatus === 'processing' || mprStatus === 'not_started')) ? (
            <div className="mpr-processing-container" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--medical-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
              <div style={{ margin: '0 auto 24px', width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--medical-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 600 }}>Generating 3D Volume</h3>
              <p style={{ opacity: 0.7, maxWidth: '400px', lineHeight: 1.5, fontSize: '0.95rem' }}>
                Our servers are currently constructing the seamless multi-dimensional views. This advanced process takes 5-10 minutes depending on the slice count. Please refresh the page in a few moments.
              </p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : usePreRendered ? (
            /* Pre-rendered MPR/Panoramic: Tab-based single view */
            <div className="mpr-prerendered-container">
              {/* Hide tabs on mobile when cross-sections are in split view */}
              {!(isMobile() && activeView === 'cross-sections' && isSplitView) && (
              <div className="mpr-view-tabs">
                {(mprData?.available ? ['axial', 'sagittal', 'coronal'] : [])
                    .concat(panoramicUrls.length > 0 ? ['panoramic'] : [])
                    .concat(crossSectionData ? ['cross-sections'] : [])
                    .map(view => (
                  <button
                    key={view}
                    className={`mpr-tab-btn ${activeView === view ? 'active' : ''}`}
                    onClick={() => {
                      if (view === 'cross-sections' && crossSectionData) {
                        setIsSplitView(true);
                        setPanoCollapsed(false);
                        if (isMobile()) setCsFullscreen(true);
                      }
                      switchMPRView(view);
                    }}
                  >
                    {view === 'panoramic' ? '2D Radiograph' : view === 'cross-sections' ? 'Cross-Sections' : view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              )}
              <div className="mpr-prerendered-viewport">
                {/* Hide viewport label on mobile cross-section split view */}
                {!(isMobile() && activeView === 'cross-sections' && isSplitView) && (
                <div className="viewport-label-premium" style={{ textTransform: 'capitalize' }}>
                  {activeView === 'panoramic' ? '2D Radiograph / Panoramic' : activeView}
                </div>
                )}
                
                {activeView === 'cross-sections' ? (
                  isMobile() && isSplitView ? (
                    /* ========== MOBILE 3-PANEL CROSS-SECTION LAYOUT ========== */
                    <div style={{
                      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                      zIndex: 9999, backgroundColor: '#0a0e14',
                      display: 'flex', flexDirection: 'row',
                      touchAction: 'none', overflow: 'hidden'
                    }}
                      onTouchStart={(e) => { csTouchStartRef.current = e.touches[0].clientX; }}
                      onTouchMove={(e) => {
                        if (csTouchStartRef.current === null) return;
                        const currentX = e.touches[0].clientX;
                        const diff = csTouchStartRef.current - currentX;
                        const total = crossSectionData?.totalSections || 100;
                        const pxPerSlice = (window.innerWidth * 1.5) / total;
                        if (Math.abs(diff) >= pxPerSlice) {
                          const steps = Math.round(diff / pxPerSlice);
                          setCsSliceIndex(prev => Math.max(0, Math.min(total - 1, prev + steps)));
                          csTouchStartRef.current = currentX;
                        }
                      }}
                      onTouchEnd={() => { csTouchStartRef.current = null; }}
                    >
                      {/* Top bar: Axial toggle + Thickness slider + Close */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10001,
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px',
                        background: 'rgba(10,14,20,0.92)', borderBottom: '1px solid #3d4a5d'
                      }}>
                        <button
                          onClick={() => setMobileAxialVisible(v => !v)}
                          style={{
                            background: mobileAxialVisible ? 'rgba(0,235,211,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${mobileAxialVisible ? '#00ebd3' : '#3d4a5d'}`,
                            borderRadius: 4, color: mobileAxialVisible ? '#00ebd3' : '#8b9bb4',
                            padding: '3px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                          }}
                        >
                          {mobileAxialVisible ? 'Hide Axial' : 'Show Axial'}
                        </button>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          <span style={{ color: '#5a6a7e', fontSize: 9, whiteSpace: 'nowrap' }}>Thick:</span>
                          <input type="range" min="1" max="50" step="0.5" value={sliceThickness || 1}
                            onChange={e => setSliceThickness(parseFloat(e.target.value))}
                            style={{ flex: 1, height: 3, accentColor: '#00ebd3', cursor: 'pointer', minWidth: 0 }} />
                          <span style={{ color: '#00ebd3', fontSize: 10, fontWeight: 600, minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            {(sliceThickness || 1).toFixed(1)}
                          </span>
                        </div>
                        <button
                          onClick={() => { setIsSplitView(false); setCsFullscreen(false); switchMPRView('axial'); }}
                          onTouchEnd={(e) => { e.stopPropagation(); setIsSplitView(false); setCsFullscreen(false); switchMPRView('axial'); }}
                          style={{
                            background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid #555',
                            borderRadius: '50%', width: 24, height: 24, fontSize: 12, flexShrink: 0,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >✕</button>
                      </div>

                      {/* LEFT: Axial with jaw curve — collapsible */}
                      {mobileAxialVisible && (
                      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #3d4a5d', paddingTop: 28 }}>
                        <div style={{ background: 'rgba(13,115,119,0.5)', color: '#00ebd3', padding: '2px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: '14px' }}>
                          Axial
                        </div>
                        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}>
                          <img
                            src={cachedMprViews['axial']?.[jawCurveSliceIndex] || mprImages[jawCurveSliceIndex] || ''}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            alt="Axial Preview"
                          />
                          <svg
                            viewBox={`0 0 ${mprData?.dimensions?.width || 512} ${mprData?.dimensions?.height || 512}`}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
                          >
                            {crossSectionPoints.length > 0 ? (
                              <polyline
                                points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none" stroke="#00ebd3" strokeWidth="3" strokeDasharray="5,5"
                              />
                            ) : crossSectionData?.curvePoints?.length > 0 && (
                              <polyline
                                points={crossSectionData.curvePoints.filter((_, i) => i % 5 === 0).map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none" stroke="#00ebd3" strokeWidth="2" strokeDasharray="5,5" opacity="0.7"
                              />
                            )}
                            {crossSectionPoints.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ff0055" stroke="#fff" strokeWidth="1.5" />
                            ))}
                            {crossSectionData?.curvePoints?.[csSliceIndex] && (
                              <circle
                                cx={crossSectionData.curvePoints[csSliceIndex].x}
                                cy={crossSectionData.curvePoints[csSliceIndex].y}
                                r="8" fill="#00ebd3" stroke="#fff" strokeWidth="2"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(0,235,211,0.8))' }}
                              />
                            )}
                          </svg>
                        </div>
                      </div>
                      )}

                      {/* RIGHT (or FULL when axial hidden): Panoramic + Cross-Section */}
                      <div style={{ width: mobileAxialVisible ? '50%' : '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 28, transition: 'width 0.25s ease' }}>
                        {/* Panoramic */}
                        <div style={{ height: '50%', display: 'flex', flexDirection: 'column', borderBottom: '1px solid #3d4a5d', overflow: 'hidden' }}>
                          <div style={{ background: 'rgba(13,115,119,0.5)', color: '#00ebd3', padding: '2px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: '14px' }}>
                            Panoramic
                          </div>
                          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f1319', overflow: 'hidden' }}>
                            {crossSectionData?.panoramicUrl ? (
                              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '100%', transform: `scaleX(${panoScaleX}) scaleY(${panoScaleY})`, transformOrigin: 'center center' }}>
                                <img
                                  src={crossSectionData.panoramicUrl}
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                                  alt="Dynamic Panoramic"
                                />
                                <div style={{
                                  position: 'absolute', top: 0, bottom: 0,
                                  left: `${(csSliceIndex / (crossSectionData.totalSections > 1 ? crossSectionData.totalSections - 1 : 1)) * 100}%`,
                                  width: Math.max(2, Math.round(sliceThickness / (pixelSpacingMm || 0.4) * 0.3)),
                                  backgroundColor: sliceThickness > 0 ? 'rgba(0,235,211,0.25)' : '#00ebd3',
                                  borderLeft: '1px solid #00ebd3', borderRight: sliceThickness > 0 ? '1px solid #00ebd3' : 'none',
                                  boxShadow: '0 0 5px rgba(0,235,211,0.8)',
                                  transform: 'translateX(-50%)', pointerEvents: 'none'
                                }} />
                              </div>
                            ) : (
                              <span style={{ color: '#8b9bb4', fontSize: 10 }}>Loading...</span>
                            )}
                          </div>
                        </div>

                        {/* Cross-Section */}
                        <div style={{ height: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ background: 'rgba(13,115,119,0.5)', color: '#00ebd3', padding: '2px 6px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: '14px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Cross-Section</span>
                            <span style={{ opacity: 0.7 }}>{csSliceIndex + 1}/{crossSectionData?.totalSections || 100}</span>
                          </div>
                          <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden', position: 'relative' }}
                            onClick={rulerActive ? handleRulerClick : undefined}
                          >
                            <img
                              src={csImages[csSliceIndex] || ''}
                              style={{ objectFit: 'contain', width: '100%', height: '100%', cursor: rulerActive ? 'crosshair' : 'default' }}
                              alt={`Cross-Section ${csSliceIndex + 1}`}
                            />
                            <RulerOverlay />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                  /* ========== DESKTOP CROSS-SECTION SPLIT VIEW ========== */
                  <div className={`mpr-split-container ${isSplitView ? 'split' : 'full'}`}>
                    {isSplitView && (
                      <div
                        className="mpr-split-panel axial-preview"
                        onWheel={makeSliceWheelHandler(setCsSliceIndex, () => crossSectionData?.totalSections || 100)}
                        {...makeSliceTouchHandlers(setCsSliceIndex, () => crossSectionData?.totalSections || 100, axialTouchRef)}
                        style={{ touchAction: 'none', cursor: 'ns-resize' }}
                      >
                        <div className="split-panel-label">Source Jaw Curve (Slice {jawCurveSliceIndex + 1})</div>
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img
                            src={cachedMprViews['axial'][jawCurveSliceIndex] || mprImages[jawCurveSliceIndex] || ''}
                            className="mpr-canvas-premium mpr-img-element"
                            style={{ objectFit: 'contain' }}
                            alt="Axial Preview"
                            draggable={false}
                          />
                          <svg
                             viewBox={`0 0 ${mprData?.dimensions?.width || 512} ${mprData?.dimensions?.height || 512}`}
                             preserveAspectRatio="xMidYMid meet"
                             style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
                           >
                            {crossSectionPoints.length > 0 ? (
                              <polyline
                                points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none" stroke="#00ebd3" strokeWidth="3" strokeDasharray="5,5"
                              />
                            ) : crossSectionData?.curvePoints?.length > 0 && (
                              <polyline
                                points={crossSectionData.curvePoints.filter((_, i) => i % 5 === 0).map(p => `${p.x},${p.y}`).join(' ')}
                                fill="none" stroke="#00ebd3" strokeWidth="2" strokeDasharray="5,5" opacity="0.7"
                              />
                            )}
                            {crossSectionPoints.map((p, i) => (
                              <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ff0055" stroke="#fff" strokeWidth="1.5" />
                            ))}
                            {crossSectionData?.curvePoints?.[csSliceIndex] && (
                              <circle
                                cx={crossSectionData.curvePoints[csSliceIndex].x}
                                cy={crossSectionData.curvePoints[csSliceIndex].y}
                                r="8" fill="#00ebd3" stroke="#fff" strokeWidth="2"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(0,235,211,0.8))' }}
                              />
                            )}
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="mpr-split-panel main-gallery" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px' }}>
                      {/* Panoramic panel */}
                      <div className="pano-preview-container" style={{ flex: panoCollapsed ? '0 0 auto' : '1', minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', border: '1px solid #3d4a5d', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="split-panel-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e2430', borderBottom: '1px solid #3d4a5d', cursor: 'pointer', padding: '4px 12px' }} onClick={() => setPanoCollapsed(prev => !prev)}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b9bb4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: panoCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            Dynamic Panoramic View
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPanoCollapsed(prev => !prev); }}
                              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #3d4a5d', borderRadius: '4px', color: '#8b9bb4', padding: '2px 8px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {panoCollapsed ? '▶ Expand' : '▼ Minimize'}
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsSplitView(false); setCsFullscreen(false); switchMPRView('axial'); }}
                              className="split-toggle-btn"
                              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
                            >
                              Exit Split-View
                            </button>
                          </div>
                        </div>
                        {!panoCollapsed && (
                        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          {/* Horizontal stretch slider */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#0a0e14', borderBottom: '1px solid #1e2430' }}>
                            <span style={{ color: '#5a6a7e', fontSize: 9, whiteSpace: 'nowrap' }}>H</span>
                            <input type="range" min="50" max="200" step="5" value={Math.round(panoScaleX * 100)}
                              onChange={e => setPanoScaleX(parseInt(e.target.value) / 100)}
                              style={{ flex: 1, height: 3, accentColor: '#00ebd3', cursor: 'pointer' }} />
                            <span style={{ color: '#5a6a7e', fontSize: 9, minWidth: 28, textAlign: 'right' }}>{Math.round(panoScaleX * 100)}%</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                            <div
                              style={{ flex: 1, position: 'relative', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', touchAction: 'none', cursor: 'ew-resize' }}
                              onWheel={makeSliceWheelHandler(setCsSliceIndex, () => crossSectionData?.totalSections || 100)}
                              {...makeSliceTouchHandlers(setCsSliceIndex, () => crossSectionData?.totalSections || 100, panoTouchRef)}
                            >
                              {crossSectionData?.panoramicUrl ? (
                                <div style={{ position: 'relative', width: `${panoScaleX * 100}%`, height: `${panoScaleY * 100}%` }}>
                                  <img
                                    src={crossSectionData.panoramicUrl}
                                    style={{ width: '100%', height: '100%', display: 'block' }}
                                    alt="Dynamic Panoramic"
                                    draggable={false}
                                  />
                                  <div style={{
                                    position: 'absolute', top: 0, bottom: 0,
                                    left: `${(csSliceIndex / (crossSectionData.totalSections > 1 ? crossSectionData.totalSections - 1 : 1)) * 100}%`,
                                    width: '2px', backgroundColor: '#00ebd3',
                                    boxShadow: '0 0 5px rgba(0,235,211,0.8)', zIndex: 10,
                                    transform: 'translateX(-50%)', pointerEvents: 'none'
                                  }} />
                                </div>
                              ) : (
                                <div style={{ color: '#8b9bb4', fontSize: '13px' }}>Processing panoramic view...</div>
                              )}
                            </div>
                            {/* Vertical stretch slider */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 2px', background: '#0a0e14', borderLeft: '1px solid #1e2430', width: 20 }}>
                              <span style={{ color: '#5a6a7e', fontSize: 9 }}>V</span>
                              <input type="range" min="50" max="200" step="5" value={Math.round(panoScaleY * 100)}
                                onChange={e => setPanoScaleY(parseInt(e.target.value) / 100)}
                                style={{ flex: 1, accentColor: '#00ebd3', cursor: 'pointer', writingMode: 'vertical-lr', direction: 'rtl', width: 3 }} />
                              <span style={{ color: '#5a6a7e', fontSize: 9 }}>{Math.round(panoScaleY * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>

                      {/* Cross-Section panel */}
                      <div className="cs-gallery-container" style={{ flex: '1', minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid #3d4a5d', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="split-panel-label" style={{ backgroundColor: '#1e2430', borderBottom: '1px solid #3d4a5d' }}>
                          Cross-Section {csSliceIndex + 1}{crossSectionData?.totalSections ? ` / ${crossSectionData.totalSections}` : ''}
                        </div>
                        <div
                          style={{ flex: 1, minHeight: 0, backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '10px', touchAction: 'none', cursor: rulerActive ? 'crosshair' : 'ew-resize', position: 'relative' }}
                          onWheel={makeSliceWheelHandler(setCsSliceIndex, () => crossSectionData?.totalSections || 100)}
                          {...makeSliceTouchHandlers(setCsSliceIndex, () => crossSectionData?.totalSections || 100, csTouchStartRef)}
                          onClick={rulerActive ? handleRulerClick : undefined}
                        >
                          <img
                            src={csImages[csSliceIndex] || ''}
                            className="mpr-img-element"
                            style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                            alt={`Cross-Section ${csSliceIndex + 1}`}
                            draggable={false}
                          />
                          <RulerOverlay />
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                ) : activeView === 'panoramic' ? (
                  <img
                    src={panoramicUrls[panoramicIndex]?.url || ''}
                    className="mpr-canvas-premium mpr-img-element"
                    style={{ objectFit: 'contain' }}
                    alt={`Panoramic slice ${panoramicIndex + 1}`}
                  />
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 60px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                    onClick={rulerActive ? handleRulerClick : undefined}
                  >
                    <img
                      src={mprImages[mprSliceIndex] || ''}
                      className="mpr-canvas-premium mpr-img-element"
                      onClick={!rulerActive ? handleAxialClick : undefined}
                      style={{ cursor: rulerActive ? 'crosshair' : (isDrawingCurve && activeView === 'axial' ? 'crosshair' : 'default'), width: '100%', height: '100%', objectFit: 'contain' }}
                      alt={`MPR ${activeView} slice ${mprSliceIndex + 1}`}
                    />
                    <RulerOverlay />
                    
                    {/* SVG overlay for drawing points */}
                    {activeView === 'axial' && (isDrawingCurve || crossSectionPoints.length > 0) && (
                      <svg
                        viewBox={`0 0 ${mprData?.dimensions?.width || 512} ${mprData?.dimensions?.height || 512}`}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
                      >
                        <polyline
                          points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#00ebd3"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                        {crossSectionPoints.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ff0055" stroke="#fff" strokeWidth="1.5" />
                        ))}
                      </svg>
                    )}
                    
                    {/* Floating Controls for Cross Section Generation */}
                    {activeView === 'axial' && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '300px' }}>
                        <button
                          onClick={() => { console.log("Draw Jaw Curve"); setIsDrawingCurve(!isDrawingCurve); }}
                          style={{ background: isDrawingCurve ? '#ff0055' : 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {isDrawingCurve ? 'Stop Drawing' : 'Draw Jaw Curve'}
                        </button>
                        {!isDrawingCurve && crossSectionPoints.length === 0 && (
                          <button
                            onClick={generateDefaultCurve}
                            disabled={autoDetecting}
                            style={{ background: autoDetecting ? '#555' : 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: autoDetecting ? 'wait' : 'pointer', fontSize: '12px' }}
                          >
                            {autoDetecting ? 'Detecting...' : 'Auto-Detect Curve'}
                          </button>
                        )}
                        {crossSectionPoints.length > 0 && (
                          <>
                            <button
                              onClick={() => { console.log("Undo"); setCrossSectionPoints(prev => prev.slice(0, -1)); }}
                              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Undo
                            </button>
                            <button
                              onClick={() => { console.log("Clear"); setCrossSectionPoints([]); }}
                              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Clear
                            </button>
                            {crossSectionPoints.length >= 3 && (
                              <button
                                onClick={submitCrossSectionRequest}
                                disabled={csStatus === 'processing'}
                                style={{ background: 'var(--medical-accent, #00ebd3)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', minWidth: '130px' }}
                              >
                                {csStatus === 'processing' ? (
                                  csProgress ? (
                                    `${Math.round((csProgress.current / csProgress.total) * 100)}% ...`
                                  ) : 'Processing...'
                                ) : 'Generate Cross-Sections'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="viewport-controls-premium">
                  {activeView === 'panoramic' ? (
                    <>
                      <span className="slice-label-premium">
                        {panoramicIndex + 1}/{panoramicUrls.length || 0}
                      </span>
                      {panoramicUrls.length > 1 && (
                        <input
                          type="range"
                          min="0"
                          max={panoramicUrls.length - 1}
                          value={panoramicIndex}
                          onChange={(e) => setPanoramicIndex(parseInt(e.target.value))}
                          className="viewport-slider-premium"
                        />
                      )}
                    </>
                  ) : activeView === 'cross-sections' ? (
                    <>
                      <span className="slice-label-premium">
                        {csSliceIndex + 1}/{crossSectionData?.totalSections || 0}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={(crossSectionData?.totalSections || 1) - 1}
                        value={csSliceIndex}
                        onChange={(e) => setCsSliceIndex(parseInt(e.target.value))}
                        className="viewport-slider-premium"
                      />
                    </>
                  ) : (
                    <>
                      <span className="slice-label-premium">
                        {mprSliceIndex + 1}/{mprData?.[activeView]?.totalSlices || 0}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={(mprData?.[activeView]?.totalSlices || 1) - 1}
                        value={mprSliceIndex}
                        onChange={(e) => setMprSliceIndex(parseInt(e.target.value))}
                        className="viewport-slider-premium"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Legacy raw DICOM MPR: 3-panel layout (desktop fallback) */
            <div className={`mpr-grid-premium ${maximizedViewport ? 'maximized' : ''}`}>
              {(!maximizedViewport || maximizedViewport === 'axial') && (
                <div className={`mpr-viewport-premium ${maximizedViewport === 'axial' ? 'maximized-viewport' : ''}`}>
                  <div className="viewport-label-premium axial-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    Axial
                    {maximizedViewport === 'axial' && (
                      <span className="maximize-hint">Double-click to restore</span>
                    )}
                  </div>
                  <canvas
                    ref={axialCanvasRef}
                    className="mpr-canvas-premium"
                    onDoubleClick={() => handleViewportDoubleClick('axial')}
                  />
                  <div className="viewport-controls-premium">
                    <span className="slice-label-premium">{mprPosition.z + 1}/{totalSlices}</span>
                    <input
                      type="range"
                      min="0"
                      max={totalSlices - 1}
                      value={mprPosition.z}
                      onChange={(e) => setMprPosition(prev => ({ ...prev, z: parseInt(e.target.value) }))}
                      className="viewport-slider-premium"
                    />
                  </div>
                </div>
              )}

              {(!maximizedViewport || maximizedViewport === 'sagittal') && (
                <div className={`mpr-viewport-premium ${maximizedViewport === 'sagittal' ? 'maximized-viewport' : ''}`}>
                  <div className="viewport-label-premium sagittal-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="3" x2="12" y2="21" />
                    </svg>
                    Sagittal
                    {maximizedViewport === 'sagittal' && (
                      <span className="maximize-hint">Double-click to restore</span>
                    )}
                  </div>
                  <canvas
                    ref={sagittalCanvasRef}
                    className="mpr-canvas-premium"
                    onDoubleClick={() => handleViewportDoubleClick('sagittal')}
                  />
                  <div className="viewport-controls-premium">
                    <span className="slice-label-premium">X: {mprPosition.x}</span>
                    <input
                      type="range"
                      min="0"
                      max={loadedImages.length > 0 ? loadedImages[0].width - 1 : 0}
                      value={mprPosition.x}
                      onChange={(e) => setMprPosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                      className="viewport-slider-premium"
                    />
                  </div>
                </div>
              )}

              {(!maximizedViewport || maximizedViewport === 'coronal') && (
                <div className={`mpr-viewport-premium ${maximizedViewport === 'coronal' ? 'maximized-viewport' : ''}`}>
                  <div className="viewport-label-premium coronal-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                    </svg>
                    Coronal
                    {maximizedViewport === 'coronal' && (
                      <span className="maximize-hint">Double-click to restore</span>
                    )}
                  </div>
                  <canvas
                    ref={coronalCanvasRef}
                    className="mpr-canvas-premium"
                    onDoubleClick={() => handleViewportDoubleClick('coronal')}
                  />
                  <div className="viewport-controls-premium">
                    <span className="slice-label-premium">Y: {mprPosition.y}</span>
                    <input
                      type="range"
                      min="0"
                      max={loadedImages.length > 0 ? loadedImages[0].height - 1 : 0}
                      value={mprPosition.y}
                      onChange={(e) => setMprPosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                      className="viewport-slider-premium"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile optimized view
  return (
    <div className="dicom-viewer-container medical-theme mobile-layout">
      {/* Floating Slice Indicator for Mobile - Subtle Corner */}
      {viewMode === 'single' && (
        <div className={`floating-slice-indicator mobile ${showingSliceIndicator ? 'show' : ''}`}>
          <span className="slice-number">{currentSlice + 1}</span>
          <span className="slice-total">/ {totalSlices}</span>
        </div>
      )}

      <div className="mobile-header-compact">
        <button
          className="back-btn-compact"
          onClick={() => setDeviceType(null)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="mobile-title-compact">
          <span className="patient-name-mobile">{metadata.studyMetadata?.patientName || 'N/A'}</span>
          <span className="slice-count-mobile">{totalSlices} slices</span>
        </div>
        <div className="mobile-view-toggle-compact">
          <button className="mobile-mode-btn-compact active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mobile-viewer-area-fullscreen">
        {viewMode === 'single' ? (
          <>
            <div
              ref={singleViewRef}
              className="mobile-viewport-fullscreen"
              onWheel={handleMouseWheel}
              onTouchMove={handleTouchScroll}
            />
            <div className="mobile-controls-bottom">
              <div className="mobile-slice-scrubber">
                <button
                  onClick={() => setCurrentSlice(Math.max(0, currentSlice - 1))}
                  disabled={currentSlice === 0}
                  className="mobile-nav-btn-large"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="mobile-slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max={totalSlices - 1}
                    value={currentSlice}
                    onChange={(e) => setCurrentSlice(parseInt(e.target.value))}
                    className="mobile-slider-large"
                  />
                  <div className="mobile-slice-info">
                    {currentSlice + 1} / {totalSlices}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentSlice(Math.min(totalSlices - 1, currentSlice + 1))}
                  disabled={currentSlice === totalSlices - 1}
                  className="mobile-nav-btn-large"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (mprLoading || mprViewLoading) ? (
          <div className="mobile-loading">
            <div className="loading-progress-container">
              <div className="loading-progress-bar">
                <div
                  className="loading-progress-fill"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p style={{ color: 'var(--medical-text)', fontSize: '14px', margin: '16px 0 0 0' }}>
                {usePreRendered ? `Loading ${activeView} view...` : `Loading ${totalSlices} slices...`} {loadingProgress}%
              </p>
            </div>
          </div>
        ) : usePreRendered ? (
          /* Pre-rendered MPR on mobile: tab-based single view */
          <div className="mobile-mpr-container-premium">
            <div className="mpr-view-tabs" style={{ display: 'flex', gap: '4px', padding: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(mprData?.available ? ['axial', 'sagittal', 'coronal'] : [])
                .concat(panoramicUrls.length > 0 ? ['panoramic'] : [])
                .concat(crossSectionData || csStatus === 'ready' ? ['cross-sections'] : [])
                .map(view => (
                <button
                  key={view}
                  className={`mpr-tab-btn ${activeView === view ? 'active' : ''}`}
                  onClick={() => switchMPRView(view)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === view ? 'var(--medical-primary, #00b4d8)' : 'rgba(255,255,255,0.1)',
                    color: activeView === view ? '#fff' : 'var(--medical-text, #ccc)',
                    fontSize: '13px',
                    fontWeight: activeView === view ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  {view === 'panoramic' ? '2D Radiograph' : view === 'cross-sections' ? 'Cross-Sections' : view}
                </button>
              ))}
            </div>
            <div className="mobile-mpr-viewport-premium">
              <div className="mobile-viewport-label-premium" style={{ textTransform: 'capitalize' }}>{activeView}</div>
              {activeView === 'panoramic' ? (
                <img
                  src={panoramicUrls[panoramicIndex]?.url || ''}
                  className="mobile-canvas-premium mpr-img-element"
                  style={{ objectFit: 'contain' }}
                  alt={`Panoramic slice ${panoramicIndex + 1}`}
                />
              ) : activeView === 'cross-sections' ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  onClick={rulerActive ? handleRulerClick : undefined}
                >
                  <img
                    src={csImages[csSliceIndex] || ''}
                    className="mobile-canvas-premium mpr-img-element"
                    style={{ cursor: rulerActive ? 'crosshair' : 'default' }}
                    alt={`Cross-Section ${csSliceIndex + 1}`}
                  />
                  <RulerOverlay />
                </div>
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                  onClick={rulerActive ? handleRulerClick : undefined}
                >
                  <img
                    src={mprImages[mprSliceIndex] || ''}
                    className="mobile-canvas-premium mpr-img-element"
                    onClick={!rulerActive ? handleAxialClick : undefined}
                    style={{ cursor: rulerActive ? 'crosshair' : 'default', width: '100%', height: '100%', objectFit: 'contain' }}
                    alt={`MPR ${activeView} slice ${mprSliceIndex + 1}`}
                  />
                  <RulerOverlay />
                  
                  {activeView === 'axial' && (isDrawingCurve || crossSectionPoints.length > 0) && (
                    <svg
                      viewBox={`0 0 ${mprData?.dimensions?.width || 512} ${mprData?.dimensions?.height || 512}`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
                    >
                      <polyline
                        points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#00ebd3"
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                      {crossSectionPoints.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="6" fill="#ff0055" stroke="#fff" strokeWidth="2" />
                      ))}
                    </svg>
                  )}
                  
                  {activeView === 'axial' && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '280px' }}>
                      <button
                        onClick={() => { console.log("Draw Jaw Curve"); setIsDrawingCurve(!isDrawingCurve); }}
                        style={{ background: isDrawingCurve ? '#ff0055' : 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                      >
                        {isDrawingCurve ? 'Stop Drawing' : 'Draw Jaw'}
                      </button>
                      {crossSectionPoints.length > 0 && (
                        <>
                          <button
                            onClick={() => { console.log("Undo"); setCrossSectionPoints(prev => prev.slice(0, -1)); }}
                            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            Undo
                          </button>
                          <button
                            onClick={() => { console.log("Clear"); setCrossSectionPoints([]); }}
                            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            Clear
                          </button>
                          {crossSectionPoints.length >= 3 && (
                            <button
                              onClick={submitCrossSectionRequest}
                              disabled={csStatus === 'processing'}
                              style={{ background: 'var(--medical-accent, #00ebd3)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', minWidth: '100px' }}
                            >
                              {csStatus === 'processing' ? (
                                csProgress ? (
                                  `${Math.round((csProgress.current / csProgress.total) * 100)}%`
                                ) : '...'
                              ) : 'Generate 3D CS'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="mobile-viewport-controls">
                {activeView === 'panoramic' ? (
                  <>
                    <span className="mobile-slice-label">
                      {panoramicIndex + 1}/{panoramicUrls.length || 0}
                    </span>
                    {panoramicUrls.length > 1 && (
                      <input
                        type="range"
                        min="0"
                        max={panoramicUrls.length - 1}
                        value={panoramicIndex}
                        onChange={(e) => setPanoramicIndex(parseInt(e.target.value))}
                        className="mobile-slider-large"
                      />
                    )}
                  </>
                ) : activeView === 'cross-sections' ? (
                  <>
                    <span className="mobile-slice-label">
                      {csSliceIndex + 1}/{crossSectionData?.totalSections || 0}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={(crossSectionData?.totalSections || 1) - 1}
                      value={csSliceIndex}
                      onChange={(e) => setCsSliceIndex(parseInt(e.target.value))}
                      className="mobile-slider-large"
                    />
                  </>
                ) : (
                  <>
                    <span className="mobile-slice-label">
                      {mprSliceIndex + 1}/{mprData?.[activeView]?.totalSlices || 0}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={(mprData?.[activeView]?.totalSlices || 1) - 1}
                      value={mprSliceIndex}
                      onChange={(e) => setMprSliceIndex(parseInt(e.target.value))}
                      className="mobile-slider-large"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Legacy raw DICOM MPR on mobile (will likely crash on large files) */
          <div className="mobile-mpr-container-premium">
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--medical-text, #ccc)' }}>
              <p style={{ marginBottom: '8px' }}>⚠️ MPR not optimized for mobile on this case.</p>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Pre-rendered MPR data is being generated. Please try again in a few minutes.</p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Cross-Section Viewer Overlay (Portrait only — landscape uses inline 3-panel) */}
      {csFullscreen && crossSectionData && !(isMobile() && isSplitView && window.innerWidth > window.innerHeight) && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999,
            backgroundColor: '#0a0e14', display: 'flex', flexDirection: 'column', touchAction: 'none'
          }}
          onTouchStart={(e) => { csTouchStartRef.current = e.touches[0].clientX; }}
          onTouchMove={(e) => {
            if (csTouchStartRef.current === null) return;
            const currentX = e.touches[0].clientX;
            const diff = csTouchStartRef.current - currentX;
            const total = crossSectionData?.totalSections || 100;
            const pxPerSlice = (window.innerWidth * 1.5) / total;
            if (Math.abs(diff) >= pxPerSlice) {
              const steps = Math.round(diff / pxPerSlice);
              setCsSliceIndex(prev => Math.max(0, Math.min(total - 1, prev + steps)));
              csTouchStartRef.current = currentX;
            }
          }}
          onTouchEnd={() => { csTouchStartRef.current = null; }}
        >
          {/* Close button */}
          <button
            onClick={() => setCsFullscreen(false)}
            style={{
              position: 'absolute', top: '12px', right: '12px', zIndex: 10001,
              background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >✕</button>

          {/* TOP (25%): Panoramic View with H/V sliders */}
          <div style={{ flex: '0 0 25%', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0e14', overflow: 'hidden', borderBottom: '2px solid #1e2430' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 6px', background: '#0a0e14', borderBottom: '1px solid #1e2430' }}>
              <span style={{ color: '#5a6a7e', fontSize: 8 }}>H</span>
              <input type="range" min="50" max="200" step="5" value={Math.round(panoScaleX * 100)}
                onChange={e => setPanoScaleX(parseInt(e.target.value) / 100)}
                style={{ flex: 1, height: 2, accentColor: '#00ebd3', cursor: 'pointer' }} />
              <span style={{ color: '#5a6a7e', fontSize: 8, minWidth: 22 }}>{Math.round(panoScaleX * 100)}%</span>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {crossSectionData.panoramicUrl ? (
                  <div style={{ position: 'relative', width: `${panoScaleX * 100}%`, height: `${panoScaleY * 100}%` }}>
                    <img
                      src={crossSectionData.panoramicUrl}
                      style={{ width: '100%', height: '100%', display: 'block' }}
                      alt="Panoramic"
                    />
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0,
                      left: `${(csSliceIndex / Math.max(1, crossSectionData.totalSections - 1)) * 100}%`,
                      width: '2px', backgroundColor: '#00ebd3',
                      boxShadow: '0 0 8px rgba(0,235,211,0.9)', transform: 'translateX(-50%)',
                      pointerEvents: 'none',
                    }} />
                  </div>
                ) : (
                  <div style={{ color: '#8b9bb4' }}>Loading panoramic...</div>
                )}
                <div style={{ position: 'absolute', top: '4px', left: '6px', color: '#00ebd3', fontSize: '9px', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>PANORAMIC</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 1px', background: '#0a0e14', borderLeft: '1px solid #1e2430', width: 16 }}>
                <span style={{ color: '#5a6a7e', fontSize: 7 }}>V</span>
                <input type="range" min="50" max="200" step="5" value={Math.round(panoScaleY * 100)}
                  onChange={e => setPanoScaleY(parseInt(e.target.value) / 100)}
                  style={{ flex: 1, accentColor: '#00ebd3', cursor: 'pointer', writingMode: 'vertical-lr', direction: 'rtl', width: 2 }} />
                <span style={{ color: '#5a6a7e', fontSize: 7 }}>{Math.round(panoScaleY * 100)}%</span>
              </div>
            </div>
          </div>

          {/* MIDDLE (40%): Axial view with curve overlay */}
          <div style={{ flex: '0 0 40%', position: 'relative', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderBottom: '2px solid #1e2430' }}>
            <img
              src={mprImages[mprSliceIndex] || ''}
              style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
              alt="Axial view"
            />
            {crossSectionPoints.length > 0 && (
              <svg
                viewBox={`0 0 ${mprData?.dimensions?.width || 512} ${mprData?.dimensions?.height || 512}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              >
                <polyline
                  points={crossSectionPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="#00ebd3" strokeWidth="2" strokeDasharray="6,3" opacity="0.9"
                />
                {crossSectionPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ff4081" stroke="#fff" strokeWidth="1" opacity="0.85" />
                ))}
                {crossSectionData?.curvePoints?.[csSliceIndex] && (
                  <circle
                    cx={crossSectionData.curvePoints[csSliceIndex].x}
                    cy={crossSectionData.curvePoints[csSliceIndex].y}
                    r="7" fill="#00ebd3" stroke="#fff" strokeWidth="2"
                  />
                )}
              </svg>
            )}
            <div style={{ position: 'absolute', top: '6px', left: '8px', color: '#ff6b6b', fontSize: '11px', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              AXIAL (SLICE {mprSliceIndex + 1})
            </div>
          </div>

          {/* BOTTOM (35%): Cross-Section */}
          <div style={{ flex: '1', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', overflow: 'hidden' }}
            onClick={rulerActive ? handleRulerClick : undefined}
          >
            <img
              src={csImages[csSliceIndex] || ''}
              style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', cursor: rulerActive ? 'crosshair' : 'default' }}
              alt={`Cross-Section ${csSliceIndex + 1}`}
            />
            <RulerOverlay />
            <div style={{ position: 'absolute', top: '6px', left: '8px', color: '#00ebd3', fontSize: '11px', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              CROSS-SECTION {csSliceIndex + 1} / {crossSectionData.totalSections}
            </div>
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
              ← Swipe anywhere to scroll →
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DicomViewerWithMPR;
