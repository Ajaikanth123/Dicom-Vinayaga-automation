import sharp from 'sharp';
import admin from 'firebase-admin';
import { uploadToStorage, downloadFromStorage } from './storageService.js';
import { extractPixelData, renderToJpg, applyWindowLevel, DEFAULT_WINDOW_CENTER, DEFAULT_WINDOW_WIDTH } from './mprService.js';

// --- Spline Math Functions ---

function getDistance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function evaluateSpline(points, numSamplesPerSegment = 200) {
    // Duplicate end points for open spline
    const controlPoints = [points[0], ...points, points[points.length - 1]];
    const curve = [];
    
    for (let i = 1; i < controlPoints.length - 2; i++) {
        const p0 = controlPoints[i - 1];
        const p1 = controlPoints[i];
        const p2 = controlPoints[i + 1];
        const p3 = controlPoints[i + 2];
        
        for (let t = 0; t < 1.0; t += (1 / numSamplesPerSegment)) {
            const t2 = t * t;
            const t3 = t2 * t;
            
            const x = 0.5 * ((2 * p1.x) + 
                            (-p0.x + p2.x) * t + 
                            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + 
                            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
                            
            const y = 0.5 * ((2 * p1.y) + 
                            (-p0.y + p2.y) * t + 
                            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + 
                            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
            
            if (curve.length === 0 || getDistance(curve[curve.length - 1], { x, y }) > 0.01) {
                curve.push({ x, y });
            }
        }
    }
    curve.push(controlPoints[controlPoints.length - 2]);
    return curve;
}

function getEquidistantPoints(curve, numPoints) {
    let totalLength = 0;
    const distances = [0];
    for (let i = 1; i < curve.length; i++) {
        const d = getDistance(curve[i-1], curve[i]);
        totalLength += d;
        distances.push(totalLength);
    }
    
    const step = totalLength / (numPoints - 1);
    const equidistant = [];
    let currentDist = 0;
    let curveIdx = 0;
    
    for (let i = 0; i < numPoints; i++) {
        const targetDist = i * step;
        
        while (curveIdx < distances.length - 1 && distances[curveIdx + 1] < targetDist) {
            curveIdx++;
        }
        
        if (curveIdx >= distances.length - 1) {
            equidistant.push(curve[curve.length - 1]);
            continue;
        }
        
        const d0 = distances[curveIdx];
        const d1 = distances[curveIdx + 1];
        const t = (targetDist - d0) / (d1 - d0 || 1);
        
        const p0 = curve[curveIdx];
        const p1 = curve[curveIdx + 1];
        
        const x = p0.x + (p1.x - p0.x) * t;
        const y = p0.y + (p1.y - p0.y) * t;
        equidistant.push({ x, y });
    }
    
    // Calculate normals with wide smoothing kernel to eliminate banding
    const halfKernel = Math.max(10, Math.floor(equidistant.length / 80));
    for (let i = 0; i < equidistant.length; i++) {
        const lo = Math.max(0, i - halfKernel);
        const hi = Math.min(equidistant.length - 1, i + halfKernel);
        const dx = equidistant[hi].x - equidistant[lo].x;
        const dy = equidistant[hi].y - equidistant[lo].y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        equidistant[i].nx = -dy / len;
        equidistant[i].ny = dx / len;
    }
    
    return equidistant;
}


/**
 * Automatically detect the jaw arch curve by analyzing a single axial DICOM slice.
 * Uses bone thresholding + column-scanning to trace the dental arch.
 * 
 * @param {string} branchId 
 * @param {string} caseId 
 * @param {number} sliceIndex - Which axial slice to analyze (0-based). If -1, auto-pick ~50%.
 * @returns {Promise<{points: Array<{x,y}>, sliceIndex: number, dimensions: {width, height}}>}
 */
export async function detectJawCurve(branchId, caseId, sliceIndex = -1) {
    console.log(`🔍 [AUTO-CURVE] Starting jaw detection for ${branchId}/${caseId}`);
    const startTime = Date.now();

    // 1. Fetch case metadata
    const metadataUrl = `dicom/${branchId}/${caseId}/metadata.json`;
    const metadataBuffer = await downloadFromStorage(metadataUrl);
    const caseMetadata = JSON.parse(metadataBuffer.toString());

    const totalSlices = caseMetadata.totalSlices;
    const slicesMetadata = caseMetadata.slicesMetadata || [];
    const basePath = caseMetadata.dicomBasePath;

    // Auto-pick slice at ~50% depth if not specified (where teeth are most visible in CBCT)
    const targetSlice = sliceIndex >= 0 ? Math.min(sliceIndex, totalSlices - 1) : Math.floor(totalSlices * 0.50);
    console.log(`🔍 [AUTO-CURVE] Analyzing slice ${targetSlice + 1}/${totalSlices}`);

    // 2. Download and extract that single slice
    const sliceInfo = slicesMetadata[targetSlice];
    const filename = sliceInfo?.filename || `slice_${String(targetSlice + 1).padStart(4, '0')}.dcm`;
    const slicePath = `${basePath}/${filename}`;

    const sliceBuffer = await downloadFromStorage(slicePath);
    const sliceData = extractPixelData(sliceBuffer);

    if (!sliceData || !sliceData.pixels) {
        throw new Error('Failed to extract pixel data from slice');
    }

    const { pixels, rows, columns } = sliceData;
    console.log(`🔍 [AUTO-CURVE] Slice dimensions: ${columns}x${rows}`);

    // 3. Determine bone threshold using adaptive percentile
    const sampleValues = [];
    const sampleStep = Math.max(1, Math.floor(pixels.length / 10000));
    for (let i = 0; i < pixels.length; i += sampleStep) {
        if (pixels[i] > 0) sampleValues.push(pixels[i]);
    }
    sampleValues.sort((a, b) => a - b);
    
    // Use 80th percentile — catches teeth + cortical bone
    const boneThreshold = sampleValues.length > 100 
        ? sampleValues[Math.floor(sampleValues.length * 0.80)] 
        : 400;
    console.log(`🔍 [AUTO-CURVE] Bone threshold: ${boneThreshold}`);

    // 4. Create binary bone mask
    const boneMask = new Uint8Array(columns * rows);
    for (let i = 0; i < pixels.length && i < columns * rows; i++) {
        boneMask[i] = pixels[i] >= boneThreshold ? 1 : 0;
    }

    // 5. Find bounding box of all bone pixels
    let minBoneX = columns, maxBoneX = 0, minBoneY = rows, maxBoneY = 0;
    let boneCount = 0;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            if (boneMask[y * columns + x]) {
                if (x < minBoneX) minBoneX = x;
                if (x > maxBoneX) maxBoneX = x;
                if (y < minBoneY) minBoneY = y;
                if (y > maxBoneY) maxBoneY = y;
                boneCount++;
            }
        }
    }
    console.log(`🔍 [AUTO-CURVE] Bone bbox: X[${minBoneX}-${maxBoneX}], Y[${minBoneY}-${maxBoneY}], count: ${boneCount}`);

    if (boneCount < 100) {
        console.warn(`🔍 [AUTO-CURVE] Too few bone pixels, returning generic arch`);
        const w = columns, h = rows;
        return {
            points: [
                { x: Math.round(w * 0.22), y: Math.round(h * 0.55) },
                { x: Math.round(w * 0.25), y: Math.round(h * 0.42) },
                { x: Math.round(w * 0.32), y: Math.round(h * 0.32) },
                { x: Math.round(w * 0.42), y: Math.round(h * 0.25) },
                { x: Math.round(w * 0.50), y: Math.round(h * 0.22) },
                { x: Math.round(w * 0.58), y: Math.round(h * 0.25) },
                { x: Math.round(w * 0.68), y: Math.round(h * 0.32) },
                { x: Math.round(w * 0.75), y: Math.round(h * 0.42) },
                { x: Math.round(w * 0.78), y: Math.round(h * 0.55) }
            ],
            sliceIndex: targetSlice,
            dimensions: { width: columns, height: rows },
            method: 'fallback'
        };
    }

    // 6. Column-scan: for each X column, find the TOPMOST bone pixel (smallest Y)
    //    This traces the teeth row because teeth are the topmost dense structures in axial view.
    //    We scan the middle portion of the bone bounding box to avoid spine and skull edges.
    const boneWidth = maxBoneX - minBoneX;
    const scanStartX = Math.round(minBoneX + boneWidth * 0.10); // Skip outer 10% on each side
    const scanEndX = Math.round(maxBoneX - boneWidth * 0.10);
    const scanStep = Math.max(1, Math.round((scanEndX - scanStartX) / 60)); // ~60 sample columns

    const rawContour = [];
    for (let x = scanStartX; x <= scanEndX; x += scanStep) {
        // Scan top-to-bottom to find the first bone pixel
        for (let y = minBoneY; y <= maxBoneY; y++) {
            if (boneMask[y * columns + x]) {
                rawContour.push({ x, y });
                break;
            }
        }
    }

    console.log(`🔍 [AUTO-CURVE] Raw contour points: ${rawContour.length}`);

    if (rawContour.length < 5) {
        console.warn(`🔍 [AUTO-CURVE] Column scan found too few points, returning generic arch`);
        const w = columns, h = rows;
        return {
            points: [
                { x: Math.round(w * 0.22), y: Math.round(h * 0.55) },
                { x: Math.round(w * 0.25), y: Math.round(h * 0.42) },
                { x: Math.round(w * 0.32), y: Math.round(h * 0.32) },
                { x: Math.round(w * 0.42), y: Math.round(h * 0.25) },
                { x: Math.round(w * 0.50), y: Math.round(h * 0.22) },
                { x: Math.round(w * 0.58), y: Math.round(h * 0.25) },
                { x: Math.round(w * 0.68), y: Math.round(h * 0.32) },
                { x: Math.round(w * 0.75), y: Math.round(h * 0.42) },
                { x: Math.round(w * 0.78), y: Math.round(h * 0.55) }
            ],
            sliceIndex: targetSlice,
            dimensions: { width: columns, height: rows },
            method: 'fallback'
        };
    }

    // 7. Smooth the contour with a moving average (window=5) to remove noise
    const smoothed = [];
    const windowSize = 5;
    const halfW = Math.floor(windowSize / 2);
    for (let i = 0; i < rawContour.length; i++) {
        let sumX = 0, sumY = 0, count = 0;
        for (let j = Math.max(0, i - halfW); j <= Math.min(rawContour.length - 1, i + halfW); j++) {
            sumX += rawContour[j].x;
            sumY += rawContour[j].y;
            count++;
        }
        smoothed.push({ x: Math.round(sumX / count), y: Math.round(sumY / count) });
    }

    // 8. Select 9 equidistant points from the smoothed contour
    const targetCount = 9;
    const selectedPoints = [];
    for (let i = 0; i < targetCount; i++) {
        const idx = Math.round((i / (targetCount - 1)) * (smoothed.length - 1));
        selectedPoints.push(smoothed[idx]);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`🔍 [AUTO-CURVE] ✅ Detected ${selectedPoints.length} arch points in ${elapsed}s`);
    console.log(`🔍 [AUTO-CURVE] Points:`, selectedPoints.map(p => `(${p.x},${p.y})`).join(' → '));

    return {
        points: selectedPoints,
        sliceIndex: targetSlice,
        dimensions: { width: columns, height: rows },
        method: 'auto-detected'
    };
}


/**
 * Generate orthogonal Cross-Sections along a user-drawn jawline curve
 * @param {string} branchId 
 * @param {string} caseId 
 * @param {Array<{x, y}>} controlPoints - Array of 2D coordinates drawn by user on Axial plane
 * @param {number} numSections - How many cross-sectional slices to generate
 * @param {number} sectionWidth - Pixel width of the orthogonal cut (e.g. 150)
 */
export async function generateCrossSections(branchId, caseId, controlPoints, numSections = 100, sectionWidth = 150, sliceIndex = null) {
    console.log(`🦷 [CS] Starting Cross-Section generation for ${branchId}/${caseId}`);
    const startTime = Date.now();
    const db = admin.database();

    // Set processing status
    await db.ref(`forms/${branchId}/${caseId}`).update({
        crossSectionStatus: 'processing',
        csProgress: { phase: 'Starting...', current: 0, total: 100 },
        csStartedAt: new Date().toISOString()
    });

    let lastProgressTime = 0;
    const reportProgress = async (phase, current, total) => {
        const now = Date.now();
        if (now - lastProgressTime > 1500 || current === total) {
            lastProgressTime = now;
            await db.ref(`forms/${branchId}/${caseId}/csProgress`).update({
                phase, current, total
            }).catch(e => console.warn('CS Progress update failed:', e.message));
        }
    };

    try {
        // 1. Interpolate Math Curve
        const fineCurve = evaluateSpline(controlPoints, 50);
        const targetPlanes = getEquidistantPoints(fineCurve, numSections);

        // 2. Fetch Metadata
        const metadataUrl = `dicom/${branchId}/${caseId}/metadata.json`;
        const metadataBuffer = await downloadFromStorage(metadataUrl);
        const caseMetadata = JSON.parse(metadataBuffer.toString());

        const totalSlices = caseMetadata.totalSlices;
        const slicesMetadata = caseMetadata.slicesMetadata || [];
        const basePath = caseMetadata.dicomBasePath;
        
        // Note: MPR metadata holds the true auto-detected dimensions if it was generated
        const mprPath = `dicom/${branchId}/${caseId}/mpr/metadata.json`;
        let rows = 512, columns = 512, wc = DEFAULT_WINDOW_CENTER, ww = DEFAULT_WINDOW_WIDTH;
        try {
            const mprBuf = await downloadFromStorage(mprPath);
            const mprMeta = JSON.parse(mprBuf.toString());
            rows = mprMeta.dimensions.height;
            columns = mprMeta.dimensions.width;
            wc = mprMeta.windowLevel.center;
            ww = mprMeta.windowLevel.width;
            console.log(`🦷 [CS] Fetched MPR Volume params: ${columns}x${rows}, W:${ww} C:${wc}`);
        } catch (e) {
            console.warn(`🦷 [CS] MPR metadata not found, relying on DICOM headers`);
        }

        // Anisotropic Scaling Calculation
        let xySpacing = 1.0;
        let zSpacing = 1.0;
        if (caseMetadata.studyMetadata) {
            if (caseMetadata.studyMetadata.pixelSpacing) {
                xySpacing = parseFloat(caseMetadata.studyMetadata.pixelSpacing.split('\\')[0]) || 1.0;
            }
            if (caseMetadata.studyMetadata.sliceThickness) {
                zSpacing = parseFloat(caseMetadata.studyMetadata.sliceThickness) || 1.0;
            }
        }
        let zRatio = zSpacing / xySpacing;
        if (isNaN(zRatio) || zRatio <= 0.1 || zRatio > 10) zRatio = 1.0; // Fallback to 1.0 if wildly inaccurate
        console.log(`🦷 [CS] Voxel Spacing: XY=${xySpacing.toFixed(3)}mm, Z=${zSpacing.toFixed(3)}mm (Z-Ratio: ${zRatio.toFixed(3)})`);

        const depth = totalSlices;

        // 3. Rebuild the 3D Volume into RAM
        console.log(`🦷 [CS] Allocating 3D Voxel Engine (${columns}x${rows}x${depth})...`);
        const volume = new Int16Array(columns * rows * depth);
        const BATCH_SIZE = 50; // Increased for faster downloads

        for (let batchStart = 0; batchStart < totalSlices; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, totalSlices);
            const batchPromises = [];

            for (let z = batchStart; z < batchEnd; z++) {
                batchPromises.push((async () => {
                    const sliceInfo = slicesMetadata[z];
                    const filename = sliceInfo?.filename || `slice_${String(z + 1).padStart(4, '0')}.dcm`;
                    const slicePath = `${basePath}/${filename}`;

                    try {
                        const sliceBuffer = await downloadFromStorage(slicePath);
                        const sliceData = extractPixelData(sliceBuffer);

                        if (sliceData && sliceData.pixels) {
                            rows = sliceData.rows;
                            columns = sliceData.columns; // Update definitively if missed
                            const offset = z * rows * columns;
                            for (let i = 0; i < sliceData.pixels.length && i < rows * columns; i++) {
                                volume[offset + i] = sliceData.pixels[i];
                            }
                        }
                    } catch (err) {
                        console.warn(`🦷 [CS] warning loading slice ${z + 1}: ${err.message}`);
                    }
                })());
            }
            await Promise.all(batchPromises);
            console.log(`🦷 [CS] Voxel ingestion: ${batchEnd}/${totalSlices}`);
            await reportProgress('Loading 3D Volume', batchEnd, totalSlices);
        }

        // 4. Generate the Cross-Sections by sampling along orthogonal vectors
        console.log(`🦷 [CS] Slicing ${numSections} orthogonal planes...`);
        console.log(`🦷 [CS] Sample Plane 0: x=${targetPlanes[0].x.toFixed(1)}, y=${targetPlanes[0].y.toFixed(1)}, nx=${targetPlanes[0].nx.toFixed(2)}, ny=${targetPlanes[0].ny.toFixed(2)}`);
        const csBasePath = `dicom/${branchId}/${caseId}/cross-sections`;

        const UPLOAD_BATCH_SIZE = 20; // 20 concurrent uploads
        for (let i = 0; i < targetPlanes.length; i += UPLOAD_BATCH_SIZE) {
            const batchPlanes = targetPlanes.slice(i, i + UPLOAD_BATCH_SIZE);
            
            const uploadPromises = batchPlanes.map(async (plane, idx) => {
                const s = i + idx;
                const imgHeight = Math.round(depth * zRatio);  // Scaled Y-axis
                const imgWidth = sectionWidth;                 // X-axis of generated image is the orthongal span
                const pixelBuffer = new Uint8Array(imgWidth * imgHeight);

                // Origin of the normal line
                const cx = plane.x;
                const cy = plane.y;
                const nx = plane.nx;
                const ny = plane.ny;
                
                // Map each pixel in the 2D cross section
                for (let y = 0; y < imgHeight; y++) {
                    const vz = Math.min(depth - 1, Math.floor(y / zRatio)); // Nearest neighbor lookup along Z
                    const dstY = (imgHeight - y - 1); 

                    for (let x = 0; x < imgWidth; x++) {
                        const offset = x - (sectionWidth / 2);
                        const vx = Math.round(cx + offset * nx);
                        const vy = Math.round(cy + offset * ny);
                        
                        let pixelValue = 0; 
                        if (vz >= 0 && vz < depth && vx >= 0 && vx < columns && vy >= 0 && vy < rows) {
                            const vIndex = vz * (rows * columns) + vy * columns + vx;
                            pixelValue = applyWindowLevel(volume[vIndex], wc, ww);
                        }
                        
                        pixelBuffer[dstY * imgWidth + x] = pixelValue;
                    }
                }

                // Export to JPEG
                const jpg = await sharp(Buffer.from(pixelBuffer), {
                    raw: { width: imgWidth, height: imgHeight, channels: 1 }
                })
                .jpeg({ quality: 90 })
                .toBuffer();

                const filename = `cs_${String(s + 1).padStart(4, '0')}.jpg`;
                await uploadToStorage(jpg, `${csBasePath}/${filename}`, {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000'
                });
            });

            await Promise.all(uploadPromises);
            const currentRendered = Math.min(i + UPLOAD_BATCH_SIZE, numSections);
            console.log(`🦷 [CS] Rendered and uploaded ${currentRendered}/${numSections} planes`);
            await reportProgress('Generating Slices', currentRendered, numSections);
        }

        // 4.5 Generate Dynamic 2D Panoramic (Carestream-style Average Intensity Projection)
        console.log(`🦷 [CS] Generating Dynamic 2D Panoramic Image...`);
        // High-res spline for panoramic — eliminates banding from coarse curve interpolation
        const hiResCurve = evaluateSpline(controlPoints, 500);
        let curvePixelLength = 0;
        for (let i = 1; i < hiResCurve.length; i++) {
            curvePixelLength += getDistance(hiResCurve[i - 1], hiResCurve[i]);
        }
        const panoWidth = Math.max(800, Math.round(curvePixelLength * 1.5));
        const panoPlanes = getEquidistantPoints(hiResCurve, panoWidth);
        // Thin slab MIP: ~10 voxels each side ≈ 8mm at 0.4mm voxel spacing
        const panoHalfSlab = 10;

        // Full depth — let user see all vertical anatomy; frontend handles cropping/scaling
        const panoHeight = Math.round(depth * zRatio);
        const panoRawBuffer = new Float64Array(panoWidth * panoHeight);
        console.log(`🦷 [CS] Panoramic MIP: ${panoWidth}x${panoHeight}, halfSlab=${panoHalfSlab}, depth=${depth}`);

        for (let x = 0; x < panoWidth; x++) {
            const plane = panoPlanes[x];
            for (let y = 0; y < panoHeight; y++) {
                const vz = Math.min(depth - 1, Math.floor(y / zRatio));
                const dstY = (panoHeight - y - 1);
                let maxVal = -Infinity;

                for (let offset = -panoHalfSlab; offset <= panoHalfSlab; offset++) {
                    const fx = plane.x + offset * plane.nx;
                    const fy = plane.y + offset * plane.ny;
                    const ix = Math.round(fx), iy = Math.round(fy);
                    if (vz >= 0 && vz < depth && ix >= 0 && ix < columns && iy >= 0 && iy < rows) {
                        const val = volume[vz * (rows * columns) + iy * columns + ix];
                        if (val > maxVal) maxVal = val;
                    }
                }
                panoRawBuffer[dstY * panoWidth + x] = maxVal === -Infinity ? 0 : maxVal;
            }
        }

        // Adaptive windowing: compute percentiles from actual MIP data
        const sampleCount = Math.min(200000, panoRawBuffer.length);
        const sampleStep = Math.max(1, Math.floor(panoRawBuffer.length / sampleCount));
        const samples = [];
        for (let i = 0; i < panoRawBuffer.length; i += sampleStep) {
            const v = panoRawBuffer[i];
            if (isFinite(v) && v > 0) samples.push(v);
        }
        samples.sort((a, b) => a - b);
        const pLow = samples[Math.floor(samples.length * 0.01)] || 0;
        const pHigh = samples[Math.floor(samples.length * 0.995)] || 4095;
        const range = (pHigh - pLow) || 1;
        console.log(`🦷 [CS] Adaptive MIP window: p1%=${pLow.toFixed(0)}, p99.5%=${pHigh.toFixed(0)}, range=${range.toFixed(0)}`);

        const panoBuffer = new Uint8Array(panoWidth * panoHeight);
        for (let i = 0; i < panoRawBuffer.length; i++) {
            const normalized = (panoRawBuffer[i] - pLow) / range;
            // Gamma 0.7 — lifts mid-tones for dental visibility (like OPG film)
            const gamma = Math.pow(Math.max(0, Math.min(1, normalized)), 0.7);
            panoBuffer[i] = Math.round(gamma * 255);
        }

        const panoJpg = await sharp(Buffer.from(panoBuffer), {
            raw: { width: panoWidth, height: panoHeight, channels: 1 }
        })
        .normalize()
        .sharpen({ sigma: 1.0, m1: 1.5, m2: 0.7 })
        .jpeg({ quality: 95 })
        .toBuffer();

        const panoTimestamp = Date.now();
        const panoFilename = `dynamic_pano_${panoTimestamp}.jpg`;
        const panoUrl = await uploadToStorage(panoJpg, `${csBasePath}/${panoFilename}`, {
            contentType: 'image/jpeg',
            cacheControl: 'no-cache, no-store'
        });
        console.log(`🦷 [CS] Dynamic Panoramic uploaded!`);

        // 5. Build and upload Cross-Section Metadata
        const csMetadata = {
            caseId,
            branchId,
            totalSections: numSections,
            sectionWidth,
            dimensions: { width: sectionWidth, height: Math.round(depth * zRatio) },
            curvePoints: targetPlanes.map(p => ({ x: p.x, y: p.y })),
            sourceSliceIndex: sliceIndex != null ? sliceIndex : Math.floor(depth / 2),
            path: csBasePath,
            panoramicUrl: panoUrl,
            generatedAt: new Date().toISOString()
        };

        const metaBuffer = Buffer.from(JSON.stringify(csMetadata, null, 2));
        await uploadToStorage(metaBuffer, `${csBasePath}/metadata.json`, { contentType: 'application/json' });

        await db.ref(`forms/${branchId}/${caseId}`).update({
            crossSectionStatus: 'ready',
            csProgress: { phase: 'Complete', current: 100, total: 100 },
            csCompletedAt: new Date().toISOString()
        });

        console.log(`🦷 [CS] ✅ Operations complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        return csMetadata;
    } catch (error) {
        console.error(`🦷 [CS] ❌ Generation failed:`, error);
        await db.ref(`forms/${branchId}/${caseId}`).update({
            crossSectionStatus: 'error',
            csError: error.message
        });
        throw error;
    }
}
