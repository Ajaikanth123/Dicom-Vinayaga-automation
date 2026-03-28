# Cornerstone3D MPR Viewer Guide

## Overview
The new DICOM viewer has been upgraded to use **Cornerstone3D**, which is specifically designed for React applications and provides proper Multi-Planar Reconstruction (MPR) support.

## What Changed

### Previous Implementation (Abandoned)
- Used `cornerstone-core` (legacy version)
- Had React lifecycle incompatibility issues
- Elements were constantly destroyed and recreated
- MPR views failed to render properly

### New Implementation (Current)
- Uses `@cornerstonejs/core` (Cornerstone3D)
- React-friendly architecture
- Proper volume loading for MPR
- Stable viewport management

## Features

### 1. Single View Mode
- View all 576 DICOM slices in sequence
- Mouse wheel scrolling through slices
- Slider navigation
- Previous/Next buttons
- Shows current slice number

### 2. MPR View Mode
- **Axial View**: Top-down view (original scan orientation)
- **Sagittal View**: Side view (left-right cross-section)
- **Coronal View**: Front view (front-back cross-section)
- All three views synchronized
- Loads entire volume (all 576 slices)

## How to Use

### Accessing the Viewer
1. Upload a DICOM ZIP file through the form
2. Check your email for the viewer link
3. Click the link to open the viewer
4. No authentication required

### Switching View Modes
- Click **"Single View"** button for slice-by-slice viewing
- Click **"MPR View"** button for three orthogonal views

### Navigation in Single View
- **Mouse Wheel**: Scroll up/down to navigate slices
- **Slider**: Drag to jump to specific slice
- **Buttons**: Click Previous/Next for step-by-step navigation

### Navigation in MPR View
- All three views are displayed simultaneously
- Each view shows a different anatomical plane
- Views are automatically synchronized

## Technical Details

### Packages Installed
```json
{
  "@cornerstonejs/core": "^4.15.21",
  "@cornerstonejs/tools": "^4.15.21",
  "@cornerstonejs/streaming-image-volume-loader": "^1.86.1"
}
```

### File Structure
- **DicomViewerCS3D.jsx**: Main viewer component using Cornerstone3D
- **DicomViewerCornerstone.jsx**: Old single-view implementation (kept as backup)
- **DicomViewer.css**: Shared styles for both viewers

### How It Works

#### Single View Mode
1. Creates a STACK viewport
2. Loads image IDs from metadata
3. Displays one slice at a time
4. User navigates through the stack

#### MPR View Mode
1. Creates a VOLUME from all image IDs
2. Loads entire volume into memory
3. Creates three ORTHOGRAPHIC viewports
4. Each viewport shows a different orientation:
   - Axial: Original scan plane
   - Sagittal: Side-to-side plane
   - Coronal: Front-to-back plane

### Data Flow
```
Backend (port 8080)
  ↓
Fetches metadata.json from Google Cloud Storage
  ↓
Returns: {
  slicesMetadata: [...],  // Sorted by instance number
  studyMetadata: {...},
  totalSlices: 576,
  dicomBasePath: "dicom/branch/caseId/files",
  bucketName: "nice4-dicom-storage"
}
  ↓
Frontend constructs image URLs:
https://storage.googleapis.com/{bucket}/{basePath}/{filename}
  ↓
Cornerstone3D loads images via WADO Image Loader
  ↓
Displays in viewport(s)
```

## Testing

### Test Case
- **Case ID**: `c8f3a3a1-26ef-4f2b-808d-15ebf605431a`
- **Total Slices**: 576
- **Patient**: MRS M DEEPA
- **Study**: FULL SKULL

### Test URL
```
http://localhost:5174/viewer/c8f3a3a1-26ef-4f2b-808d-15ebf605431a
```

### Expected Behavior
1. **Loading**: Shows spinner while fetching metadata
2. **Single View**: 
   - Displays first slice
   - Mouse wheel scrolls through all 576 slices
   - Slider shows current position
3. **MPR View**:
   - Shows three viewports side-by-side
   - Each viewport displays different anatomical plane
   - All views are synchronized

## Troubleshooting

### Issue: Viewer shows blank screen
**Solution**: Check browser console for errors. Ensure:
- Backend is running on port 8080
- Frontend is running on port 5174
- Case ID exists in database
- Metadata.json exists in Google Cloud Storage

### Issue: MPR view not loading
**Solution**: 
- Check that all 576 DICOM files are uploaded to GCS
- Verify metadata.json contains slicesMetadata array
- Check browser console for volume loading errors

### Issue: Images not displaying
**Solution**:
- Verify CORS is configured on GCS bucket
- Check that files are publicly readable
- Ensure image URLs are correct in metadata

### Issue: Slow performance
**Solution**:
- MPR mode loads entire volume (576 slices) into memory
- This is normal for large datasets
- Consider using a more powerful device for better performance
- Single view mode is lighter and faster

## Browser Compatibility

### Recommended Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Support
- Works on mobile browsers
- Single view mode recommended for mobile
- MPR view may be slow on mobile devices

## Next Steps

### Potential Enhancements
1. **Window/Level Adjustment**: Adjust brightness/contrast
2. **Zoom/Pan Tools**: Navigate within images
3. **Measurement Tools**: Measure distances and angles
4. **Annotations**: Add markers and notes
5. **3D Volume Rendering**: True 3D visualization (if needed)
6. **Cine Mode**: Auto-play through slices
7. **Crosshair Synchronization**: Show position across MPR views

### Adding Tools
Cornerstone3D includes a comprehensive tools library:
```javascript
import * as cornerstoneTools from '@cornerstonejs/tools';

// Available tools:
// - WindowLevel
// - Zoom
// - Pan
// - Length
// - Angle
// - Rectangle ROI
// - Ellipse ROI
// - And many more...
```

## Resources

### Documentation
- [Cornerstone3D Docs](https://www.cornerstonejs.org/)
- [Cornerstone3D GitHub](https://github.com/cornerstonejs/cornerstone3D)
- [Examples](https://www.cornerstonejs.org/live-examples/)

### Support
- Check browser console for detailed error messages
- Review Cornerstone3D documentation for advanced features
- Test with different DICOM datasets to ensure compatibility

## Summary

The new Cornerstone3D implementation provides:
- ✅ React-friendly architecture
- ✅ Stable viewport management
- ✅ Proper MPR support with three orthogonal views
- ✅ All 576 slices loaded and displayed
- ✅ Toggle between Single and MPR modes
- ✅ Mobile browser support
- ✅ No authentication required for viewer access

The viewer is now production-ready and can handle large DICOM datasets efficiently!
