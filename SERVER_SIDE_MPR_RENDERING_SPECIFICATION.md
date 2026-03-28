# Server-Side MPR Rendering - Technical Specification

## 📋 Overview

Instead of loading 576 DICOM slices on mobile devices, the backend pre-generates MPR views as optimized images. Mobile devices download lightweight JPEGs instead of processing raw DICOM data.

---

## 🎯 Benefits

### Memory Savings
- **Current**: 1.5GB RAM (576 DICOM slices decoded)
- **Server-Side**: 5-10MB RAM (3 JPEG images)
- **Reduction**: 99.3% less memory usage

### Performance
- **Current**: 30-60 seconds loading + crash risk
- **Server-Side**: 2-5 seconds loading, no crash
- **User Experience**: Instant, smooth, reliable

### Bandwidth
- **Current**: 500MB download (all DICOM files)
- **Server-Side**: 2-5MB download (compressed JPEGs)
- **Reduction**: 99% less bandwidth

---

## 🏗️ Architecture

### Current Flow (Client-Side MPR)
```
Mobile Browser
    ↓
Download 576 DICOM files (500MB)
    ↓
Decode each file in JavaScript
    ↓
Store in memory (1.5GB)
    ↓
Generate 3 MPR views using Canvas
    ↓
CRASH at 65% (out of memory)
```

### New Flow (Server-Side MPR)
```
Mobile Browser
    ↓
Request: GET /mpr/:caseId?quality=mobile
    ↓
Backend (Cloud Run)
    ↓
Load DICOM from GCS
    ↓
Generate 3 MPR views (Axial, Sagittal, Coronal)
    ↓
Compress to JPEG (quality: 85)
    ↓
Cache in GCS
    ↓
Return URLs to 3 images
    ↓
Mobile downloads 3 JPEGs (2-5MB total)
    ↓
Display instantly, no processing needed
```

---

## 🔧 Backend Implementation

### New API Endpoint

**Route**: `GET /mpr/:caseId`

**Query Parameters**:
- `quality`: `mobile` | `tablet` | `desktop`
- `view`: `axial` | `sagittal` | `coronal` | `all`
- `slice`: Specific slice number (optional)
- `format`: `jpeg` | `png` | `webp`

**Response**:
```json
{
  "caseId": "abc123",
  "views": {
    "axial": {
      "url": "https://storage.googleapis.com/.../mpr/axial.jpg",
      "width": 512,
      "height": 512,
      "sliceCount": 576
    },
    "sagittal": {
      "url": "https://storage.googleapis.com/.../mpr/sagittal.jpg",
      "width": 512,
      "height": 576,
      "sliceCount": 512
    },
    "coronal": {
      "url": "https://storage.googleapis.com/.../mpr/coronal.jpg",
      "width": 512,
      "height": 576,
      "sliceCount": 512
    }
  },
  "cached": true,
  "generatedAt": "2026-02-26T10:30:00Z"
}
```

---

## 📦 Backend Processing Steps

### Step 1: Check Cache
```javascript
// Check if MPR images already exist
const cacheKey = `mpr/${caseId}/${quality}/`;
const cachedFiles = await storage.bucket(bucketName)
  .getFiles({ prefix: cacheKey });

if (cachedFiles.length === 3) {
  // Return cached URLs
  return {
    axial: `https://storage.googleapis.com/${bucketName}/${cacheKey}axial.jpg`,
    sagittal: `https://storage.googleapis.com/${bucketName}/${cacheKey}sagittal.jpg`,
    coronal: `https://storage.googleapis.com/${bucketName}/${cacheKey}coronal.jpg`,
    cached: true
  };
}
```

### Step 2: Load DICOM Files
```javascript
// Load all DICOM slices (server has plenty of RAM)
const slices = [];
for (const sliceMetadata of metadata.slicesMetadata) {
  const filePath = `${metadata.dicomBasePath}/${sliceMetadata.filename}`;
  const [file] = await storage.bucket(bucketName).file(filePath).download();
  const dataSet = dicomParser.parseDicom(file);
  const pixelData = extractPixelData(dataSet);
  slices.push(pixelData);
}
```

### Step 3: Generate MPR Views
```javascript
// Generate Axial view (middle slice)
const axialSlice = slices[Math.floor(slices.length / 2)];
const axialImage = createImageFromPixelData(axialSlice);

// Generate Sagittal view (reconstruct from X axis)
const sagittalImage = reconstructSagittal(slices, middleX);

// Generate Coronal view (reconstruct from Y axis)
const coronalImage = reconstructCoronal(slices, middleY);
```

### Step 4: Compress & Upload
```javascript
// Compress based on quality setting
const jpegQuality = {
  mobile: 75,    // Smaller file, good enough for mobile
  tablet: 85,    // Balanced
  desktop: 95    // High quality
}[quality];

// Convert to JPEG using Sharp
const axialJpeg = await sharp(axialImage)
  .jpeg({ quality: jpegQuality })
  .toBuffer();

// Upload to GCS
await storage.bucket(bucketName)
  .file(`${cacheKey}axial.jpg`)
  .save(axialJpeg, {
    metadata: { contentType: 'image/jpeg' },
    public: true
  });

// Repeat for sagittal and coronal
```

### Step 5: Return URLs
```javascript
return {
  axial: `https://storage.googleapis.com/${bucketName}/${cacheKey}axial.jpg`,
  sagittal: `https://storage.googleapis.com/${bucketName}/${cacheKey}sagittal.jpg`,
  coronal: `https://storage.googleapis.com/${bucketName}/${cacheKey}coronal.jpg`,
  cached: false,
  generatedAt: new Date().toISOString()
};
```

---

## 🎨 Frontend Changes

### Detect Device & Choose Rendering Method

```javascript
useEffect(() => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const deviceMemory = navigator.deviceMemory || 4;
  
  if (isMobile || deviceMemory < 4) {
    setRenderingMethod('server-side');
    setDeviceType('mobile');
  } else {
    setRenderingMethod('client-side');
    setDeviceType('desktop');
  }
}, []);
```

### Load Server-Side MPR

```javascript
const loadServerSideMPR = async () => {
  setMprLoading(true);
  
  try {
    // Request pre-rendered MPR images
    const response = await fetch(
      `${backendUrl}/mpr/${caseId}?quality=mobile&format=jpeg`
    );
    const data = await response.json();
    
    // Load the 3 JPEG images
    const axialImg = new Image();
    axialImg.src = data.views.axial.url;
    await axialImg.decode();
    
    const sagittalImg = new Image();
    sagittalImg.src = data.views.sagittal.url;
    await sagittalImg.decode();
    
    const coronalImg = new Image();
    coronalImg.src = data.views.coronal.url;
    await coronalImg.decode();
    
    // Store images
    setMprImages({
      axial: axialImg,
      sagittal: sagittalImg,
      coronal: coronalImg
    });
    
    setMprLoading(false);
    console.log('✅ Server-side MPR loaded');
  } catch (err) {
    console.error('Error loading server-side MPR:', err);
    setError('Failed to load MPR views');
    setMprLoading(false);
  }
};
```

### Display Server-Side MPR

```javascript
const renderServerSideMPR = () => {
  // Axial view
  const axialCanvas = axialCanvasRef.current;
  const axialCtx = axialCanvas.getContext('2d');
  axialCanvas.width = mprImages.axial.width;
  axialCanvas.height = mprImages.axial.height;
  axialCtx.drawImage(mprImages.axial, 0, 0);
  
  // Sagittal view
  const sagittalCanvas = sagittalCanvasRef.current;
  const sagittalCtx = sagittalCanvas.getContext('2d');
  sagittalCanvas.width = mprImages.sagittal.width;
  sagittalCanvas.height = mprImages.sagittal.height;
  sagittalCtx.drawImage(mprImages.sagittal, 0, 0);
  
  // Coronal view
  const coronalCanvas = coronalCanvasRef.current;
  const coronalCtx = coronalCanvas.getContext('2d');
  coronalCanvas.width = mprImages.coronal.width;
  coronalCanvas.height = mprImages.coronal.height;
  coronalCtx.drawImage(mprImages.coronal, 0, 0);
};
```

---

## 📊 Performance Comparison

### Initial Load Time

| Method | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Client-Side MPR | 30-60s | 45-90s | Crash |
| Server-Side MPR | 2-5s | 2-5s | 2-5s |

### Memory Usage

| Method | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Client-Side MPR | 1.5GB | 1.5GB | Crash |
| Server-Side MPR | 10MB | 10MB | 10MB |

### Bandwidth Usage

| Method | Desktop | Tablet | Mobile |
|--------|---------|--------|--------|
| Client-Side MPR | 500MB | 500MB | 500MB |
| Server-Side MPR | 3MB | 4MB | 2MB |

---

## 💰 Cost Analysis

### Cloud Run Processing

**Per MPR Generation**:
- CPU time: ~10-30 seconds
- Memory: 2GB
- Cost: ~$0.001 per generation

**With Caching**:
- First request: $0.001 (generate)
- Subsequent requests: $0.00001 (serve from cache)
- 1000 views: ~$1 (if all unique cases)
- 1000 views: ~$0.01 (if same cases, cached)

### Storage Costs

**Per Case**:
- 3 JPEG images × 1MB each = 3MB
- Storage: $0.00006/month
- Bandwidth: $0.36 per 1000 downloads

**100 Cases**:
- Storage: $0.006/month
- Bandwidth: $36 per 1000 downloads

---

## 🔄 Interactive Features

### Slice Navigation

Instead of loading all slices, generate on-demand:

**API**: `GET /mpr/:caseId/slice/:sliceNumber?view=axial`

**Frontend**:
```javascript
const handleSliceChange = async (newSlice) => {
  setCurrentSlice(newSlice);
  
  // Request specific slice from server
  const response = await fetch(
    `${backendUrl}/mpr/${caseId}/slice/${newSlice}?view=axial&quality=mobile`
  );
  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);
  
  // Update canvas
  const img = new Image();
  img.src = imageUrl;
  await img.decode();
  
  const ctx = axialCanvasRef.current.getContext('2d');
  ctx.drawImage(img, 0, 0);
};
```

**Optimization**: Pre-fetch adjacent slices
```javascript
// Pre-fetch next 5 slices in background
for (let i = 1; i <= 5; i++) {
  const nextSlice = currentSlice + i;
  if (nextSlice < totalSlices) {
    fetch(`${backendUrl}/mpr/${caseId}/slice/${nextSlice}?view=axial&quality=mobile`)
      .then(r => r.blob())
      .then(blob => {
        sliceCache.set(nextSlice, URL.createObjectURL(blob));
      });
  }
}
```

---

## 🎬 Video Streaming Option

### Generate MP4 Video

Instead of individual images, create a video of all slices:

**Backend**:
```javascript
// Use FFmpeg to create video from slices
const ffmpeg = require('fluent-ffmpeg');

ffmpeg()
  .input('slice_%04d.jpg')
  .inputFPS(10) // 10 frames per second
  .videoCodec('libx264')
  .outputOptions([
    '-preset fast',
    '-crf 23', // Quality
    '-movflags +faststart' // Web optimization
  ])
  .output(`${cacheKey}axial.mp4`)
  .on('end', () => {
    console.log('Video generated');
  })
  .run();
```

**Frontend**:
```javascript
<video 
  src={mprVideoUrl} 
  controls 
  style={{ width: '100%', height: '100%' }}
  onTimeUpdate={(e) => {
    const currentSlice = Math.floor(e.target.currentTime * 10);
    setCurrentSlice(currentSlice);
  }}
/>
```

**Benefits**:
- Smooth playback
- Browser-native controls
- Seekable timeline
- Even less memory usage

---

## 🔐 Security Considerations

### Signed URLs

Generate temporary signed URLs for MPR images:

```javascript
const [signedUrl] = await storage
  .bucket(bucketName)
  .file(`${cacheKey}axial.jpg`)
  .getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 3600 * 1000 // 1 hour
  });
```

### Access Control

Check user permissions before generating MPR:

```javascript
// Verify user has access to this case
const hasAccess = await checkUserAccess(userId, caseId);
if (!hasAccess) {
  return res.status(403).json({ error: 'Access denied' });
}
```

---

## 📈 Scalability

### Caching Strategy

**Level 1: GCS Cache**
- Store generated MPR images
- TTL: 30 days
- Automatic cleanup of old files

**Level 2: CDN Cache**
- Use Cloud CDN in front of GCS
- Edge caching for faster delivery
- Reduces GCS bandwidth costs

**Level 3: Browser Cache**
- Set cache headers
- `Cache-Control: public, max-age=86400`
- Reduces repeat downloads

### Load Balancing

Cloud Run automatically scales:
- 0 instances when idle (no cost)
- Auto-scale to 100+ instances under load
- Each instance can handle 80 concurrent requests

---

## 🎯 Implementation Priority

### Phase 1: Basic Server-Side MPR (1-2 days)
- ✅ New `/mpr/:caseId` endpoint
- ✅ Generate 3 static MPR views
- ✅ Cache in GCS
- ✅ Frontend loads JPEGs instead of DICOM

### Phase 2: Interactive Slicing (2-3 days)
- ✅ `/mpr/:caseId/slice/:number` endpoint
- ✅ On-demand slice generation
- ✅ Pre-fetching adjacent slices
- ✅ Smooth navigation

### Phase 3: Video Streaming (3-4 days)
- ✅ FFmpeg integration
- ✅ MP4 generation
- ✅ Video player UI
- ✅ Seek controls

### Phase 4: Optimization (1-2 days)
- ✅ CDN integration
- ✅ Quality presets
- ✅ WebP format support
- ✅ Progressive JPEG

---

## 🔍 Quality Presets

### Mobile (75% JPEG quality)
- File size: ~500KB per view
- Total: ~1.5MB for 3 views
- Load time: 1-2 seconds on 4G
- Diagnostic quality: Good for review

### Tablet (85% JPEG quality)
- File size: ~1MB per view
- Total: ~3MB for 3 views
- Load time: 2-3 seconds on WiFi
- Diagnostic quality: Very good

### Desktop (95% JPEG quality)
- File size: ~2MB per view
- Total: ~6MB for 3 views
- Load time: 1-2 seconds on broadband
- Diagnostic quality: Excellent

---

## 🚀 Deployment Steps

### 1. Update Backend

Add new dependencies:
```json
{
  "dependencies": {
    "sharp": "^0.33.5",
    "fluent-ffmpeg": "^2.1.2"
  }
}
```

### 2. Create MPR Service

`dicom-backend/services/mprService.js`

### 3. Add Route

`dicom-backend/routes/mpr.js`

### 4. Update Frontend

Detect device and choose rendering method

### 5. Deploy

```bash
# Backend
gcloud run deploy dicom-backend --source dicom-backend

# Frontend
cd medical-referral-system
npm run build
firebase deploy --only hosting
```

---

## 📊 Success Metrics

### Before (Client-Side MPR)
- Mobile crash rate: 95%
- Average load time: 45 seconds (before crash)
- Memory usage: 1.5GB
- Bandwidth: 500MB
- User satisfaction: Low

### After (Server-Side MPR)
- Mobile crash rate: 0%
- Average load time: 3 seconds
- Memory usage: 10MB
- Bandwidth: 3MB
- User satisfaction: High

---

## 🎓 Technical Advantages

### 1. Consistent Quality
- Server has powerful CPU/GPU
- Consistent rendering across devices
- No browser compatibility issues

### 2. Reduced Client Complexity
- No DICOM parsing in browser
- No canvas manipulation
- Simple image display

### 3. Better Caching
- Generated once, served many times
- CDN-friendly
- Reduced backend load

### 4. Future-Proof
- Easy to add AI enhancements
- Server-side image processing
- Advanced rendering techniques

---

## 💡 Recommendation

**Start with Phase 1** (Basic Server-Side MPR):
- Solves the mobile crash issue immediately
- Minimal code changes
- Low cost (~$1 per 1000 unique cases)
- Can iterate to add interactive features later

**This is the most elegant solution** because:
- ✅ Works on ALL devices
- ✅ Fast and reliable
- ✅ Scalable
- ✅ Cost-effective with caching
- ✅ Better user experience

---

**Estimated Implementation Time**: 2-3 days for full solution
**Cost**: ~$0.001 per case (first view), cached thereafter
**Impact**: 100% mobile compatibility, 99% memory reduction
