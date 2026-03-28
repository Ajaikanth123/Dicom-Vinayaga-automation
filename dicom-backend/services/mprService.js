import JSZip from 'jszip';
import dicomParser from 'dicom-parser';
import sharp from 'sharp';
sharp.cache(false); // CRITICAL: Stop sharp from caching megabytes of decompressed pixels
sharp.concurrency(1); // CRITICAL: Restrict CPU thread pools to prevent OOM on 2GB pods
import jpegLossless from 'jpeg-lossless-decoder-js';
import { uploadToStorage, downloadFromStorage } from './storageService.js';
import { sendNotifications } from './emailService.js';
import { sendDicomNotification } from './whatsappService.js';
import admin from 'firebase-admin';

/**
 * MPR Pre-Rendering Service
 * Builds a 3D volume from DICOM slices and renders Axial, Sagittal, and Coronal
 * image stacks as JPGs stored in GCS. This allows mobile browsers to view MPR
 * without loading all raw DICOM data into memory.
 */

// Default CT window/level for rendering
export const DEFAULT_WINDOW_CENTER = 300;
export const DEFAULT_WINDOW_WIDTH = 2000;

// Compressed transfer syntaxes that need decompression
const JPEG_LOSSLESS_SYNTAXES = [
    '1.2.840.10008.1.2.4.57',  // JPEG Lossless, Non-Hierarchical (Process 14)
    '1.2.840.10008.1.2.4.70',  // JPEG Lossless, Non-Hierarchical, First-Order Prediction
];

/**
 * Extract raw pixel data from a DICOM buffer.
 * Handles both uncompressed and JPEG Lossless compressed (encapsulated) pixel data.
 * @param {Buffer} dicomBuffer - Raw DICOM file buffer
 * @returns {{ pixels: Int16Array|Uint16Array|Uint8Array, rows: number, columns: number }|null}
 */
export function extractPixelData(dicomBuffer) {
    try {
        const byteArray = new Uint8Array(dicomBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);

        const rows = dataSet.uint16('x00280010') || parseInt(dataSet.string('x00280010')) || 0;
        const columns = dataSet.uint16('x00280011') || parseInt(dataSet.string('x00280011')) || 0;
        const bitsAllocated = dataSet.uint16('x00280100') || parseInt(dataSet.string('x00280100')) || 16;
        const bitsStored = dataSet.uint16('x00280101') || bitsAllocated;
        const pixelRepresentation = dataSet.uint16('x00280103') || 0;
        const samplesPerPixel = dataSet.uint16('x00280002') || 1;
        const transferSyntax = dataSet.string('x00020010') || '1.2.840.10008.1.2'; // default = Implicit VR LE

        const rescaleSlope = parseFloat(dataSet.string('x00281053')) || 1;
        const rescaleIntercept = parseFloat(dataSet.string('x00281052')) || 0;

        const pixelDataElement = dataSet.elements.x7fe00010;

        if (!pixelDataElement || !rows || !columns) {
            console.warn(`🧠 [MPR] Slice has no pixel data or dimensions (rows=${rows}, cols=${columns}, pixelData=${!!pixelDataElement})`);
            return null;
        }

        let pixels;

        // Check if pixel data is encapsulated (compressed)
        if (pixelDataElement.encapsulatedPixelData && pixelDataElement.fragments && pixelDataElement.fragments.length > 0) {
            // === COMPRESSED: Extract and decompress JPEG fragment ===
            const isJpegLossless = JPEG_LOSSLESS_SYNTAXES.includes(transferSyntax);

            if (isJpegLossless) {
                // Extract the first frame's JPEG data using the proper dicomParser API
                // Handled missing basic offset table using readEncapsulatedPixelDataFromFragments
                let jpegData;
                if (!pixelDataElement.basicOffsetTable || pixelDataElement.basicOffsetTable.length === 0) {
                    jpegData = dicomParser.readEncapsulatedPixelDataFromFragments(dataSet, pixelDataElement, 0, pixelDataElement.fragments.length);
                } else {
                    jpegData = dicomParser.readEncapsulatedImageFrame(dataSet, pixelDataElement, 0);
                }

                // Decode using JPEG Lossless decoder
                const decoder = new jpegLossless.Decoder();
                const decodedOutput = decoder.decode(jpegData.buffer, jpegData.byteOffset, jpegData.length);

                // decoder.decode() returns Uint8Array or Uint16Array directly
                // For 16-bit data, it's already a Uint16Array
                if (decodedOutput instanceof Uint16Array || decodedOutput instanceof Uint8Array) {
                    pixels = decodedOutput;
                } else if (decodedOutput instanceof ArrayBuffer) {
                    // Fallback: if it returns an ArrayBuffer
                    if (bitsAllocated === 16) {
                        pixels = new Uint16Array(decodedOutput);
                    } else {
                        pixels = new Uint8Array(decodedOutput);
                    }
                } else {
                    console.warn(`🧠 [MPR] Unexpected decode output type: ${typeof decodedOutput}, constructor: ${decodedOutput?.constructor?.name}`);
                    return null;
                }
            } else {
                console.warn(`🧠 [MPR] Unsupported compressed transfer syntax: ${transferSyntax}`);
                return null;
            }
        } else {
            // === UNCOMPRESSED: Read raw pixel data ===
            const pixelDataOffset = pixelDataElement.dataOffset;
            const pixelDataLength = pixelDataElement.length;

            // Copy to aligned buffer
            const pixelBytes = new Uint8Array(byteArray.buffer, byteArray.byteOffset + pixelDataOffset, pixelDataLength);
            const alignedBuffer = new ArrayBuffer(pixelDataLength);
            new Uint8Array(alignedBuffer).set(pixelBytes);

            if (bitsAllocated === 16) {
                if (pixelRepresentation === 1) {
                    pixels = new Int16Array(alignedBuffer);
                } else {
                    pixels = new Uint16Array(alignedBuffer);
                }
            } else if (bitsAllocated === 8) {
                pixels = new Uint8Array(alignedBuffer);
            } else {
                pixels = new Uint16Array(alignedBuffer);
            }
        }

        return { pixels, rows, columns, bitsAllocated, bitsStored, rescaleSlope, rescaleIntercept, samplesPerPixel };
    } catch (err) {
        console.warn(`🧠 [MPR] Failed to parse DICOM pixel data: ${err.message}`);
        return null;
    }
}

/**
 * Apply window/level and convert a single value to 8-bit
 */
export function applyWindowLevel(value, windowCenter, windowWidth) {
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;
    if (value <= lower) return 0;
    if (value >= upper) return 255;
    return Math.round(((value - lower) / windowWidth) * 255);
}

/**
 * Render a grayscale 8-bit buffer to a JPG using sharp
 * @param {Uint8Array} pixelBuffer - 8-bit grayscale pixel buffer
 * @param {number} width 
 * @param {number} height 
 * @returns {Promise<Buffer>} JPG buffer
 */
export async function renderToJpg(pixelBuffer, width, height) {
    return sharp(Buffer.from(pixelBuffer), {
        raw: { width, height, channels: 1 }
    })
        .jpeg({ quality: 85 })
        .toBuffer();
}

/**
 * Generate pre-rendered MPR image stacks for a case.
 * 
 * Flow:
 * 1. Download all DICOM slices from GCS
 * 2. Build 3D volume (flat Int16Array)
 * 3. Render Axial/Sagittal/Coronal stacks as JPGs
 * 4. Upload JPGs to GCS
 * 5. Save MPR metadata
 * 
 * @param {string} branchId 
 * @param {string} caseId 
 * @param {object} notificationData - Optional delivery targets to email once complete
 * @returns {Promise<object>} MPR metadata
 */
export async function generateMPR(branchId, caseId, notificationData = null) {
    console.log(`🧠 [MPR] Starting MPR generation for ${branchId}/${caseId}`);

    const startTime = Date.now();
    const db = admin.database();

    let lastProgressTime = 0;
    const reportProgress = async (phase, current, total) => {
        const now = Date.now();
        // Throttle Firebase writes to every 1.5s to prevent freezing the server
        if (now - lastProgressTime > 1500 || current === total) {
            lastProgressTime = now;
            await db.ref(`forms/${branchId}/${caseId}`).update({
                mprProgress: { phase, current, total }
            }).catch(e => console.warn('Progress update failed:', e.message));
        }
    };

    // Update status to processing
    await db.ref(`forms/${branchId}/${caseId}`).update({
        mprStatus: 'processing',
        mprStartedAt: new Date().toISOString()
    });

    try {
        // Step 1: Get metadata to know how many slices and their order
        const metadataUrl = `dicom/${branchId}/${caseId}/metadata.json`;
        const metadataBuffer = await downloadFromStorage(metadataUrl);
        const caseMetadata = JSON.parse(metadataBuffer.toString());

        const totalSlices = caseMetadata.totalSlices;
        const slicesMetadata = caseMetadata.slicesMetadata || [];
        const basePath = caseMetadata.dicomBasePath;

        console.log(`🧠 [MPR] Total slices: ${totalSlices}`);

        // Step 2: Find dimensions by probing from the middle of the stack
        // This avoids edge cases like 2D Scout/Localizer images which often sit at the ends
        let rows = 0, columns = 0;
        const startProbeIndex = Math.floor(totalSlices / 2);
        const maxProbe = Math.min(startProbeIndex + 10, totalSlices);

        for (let probe = startProbeIndex; probe < maxProbe; probe++) {
            const filename = slicesMetadata[probe]?.filename || `slice_${String(probe + 1).padStart(4, '0')}.dcm`;
            const slicePath = `${basePath}/${filename}`;
            try {
                const sliceBuffer = await downloadFromStorage(slicePath);
                const probeResult = extractPixelData(sliceBuffer);
                if (probeResult && probeResult.rows > 0 && probeResult.columns > 0) {
                    rows = probeResult.rows;
                    columns = probeResult.columns;
                    // Log detailed slice info for debugging
                    const minVal = Math.min(...Array.from(probeResult.pixels.slice(0, 1000)));
                    const maxVal = Math.max(...Array.from(probeResult.pixels.slice(0, 1000)));
                    console.log(`🧠 [MPR] Found dimensions from slice ${probe + 1}: ${columns}x${rows}`);
                    console.log(`🧠 [MPR] Pixel info: bits=${probeResult.bitsAllocated}, stored=${probeResult.bitsStored}, rescale=${probeResult.rescaleSlope}*x+${probeResult.rescaleIntercept}, samples=${probeResult.samplesPerPixel}`);
                    console.log(`🧠 [MPR] Sample pixel range (first 1000): min=${minVal}, max=${maxVal}`);
                    break;
                }
            } catch (err) {
                console.warn(`🧠 [MPR] Probe slice ${probe + 1} failed: ${err.message}`);
            }
        }

        if (!rows || !columns) {
            throw new Error(`Could not determine slice dimensions from first ${maxProbe} slices`);
        }

        const depth = totalSlices;

        console.log(`🧠 [MPR] Volume dimensions: ${columns}x${rows}x${depth} (WxHxD)`);
        const volumeMemMB = (columns * rows * depth * 2 / 1024 / 1024).toFixed(1);
        console.log(`🧠 [MPR] Volume memory: ${volumeMemMB} MB`);

        // Step 3: Build the 3D volume
        // Store as flat Int16Array: volume[z * rows * columns + y * columns + x]
        const volume = new Int16Array(columns * rows * depth);
        const BATCH_SIZE = 15; // Set to 15 to prevent Sharp/GCS OOM on 2GiB container

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
                            if (sliceData.columns === columns && sliceData.rows === rows) {
                                // Copy pixel data into volume
                                const offset = z * rows * columns;
                                for (let i = 0; i < sliceData.pixels.length && i < rows * columns; i++) {
                                    volume[offset + i] = sliceData.pixels[i];
                                }
                            } else {
                                console.warn(`🧠 [MPR] Slice ${z + 1} dimensions (${sliceData.columns}x${sliceData.rows}) do not match volume (${columns}x${rows})`);
                            }
                        }
                    } catch (err) {
                        console.warn(`🧠 [MPR] Warning: Failed to load slice ${z + 1}: ${err.message}`);
                    }
                })());
            }

            // Wait for all 50 downloads and parses to finish
            await Promise.all(batchPromises);
            
            console.log(`🧠 [MPR] Loaded ${batchEnd}/${totalSlices} slices into volume`);
            await reportProgress('Extracting 3D Voxel Memory', batchEnd, totalSlices);
        }

        console.log(`🧠 [MPR] 3D volume built. Computing window/level...`);

        // Auto-compute window/level from actual volume data
        // Sample non-zero voxels to find value range
        const sampleCount = Math.min(100000, volume.length);
        const step = Math.max(1, Math.floor(volume.length / sampleCount));
        const samples = [];
        for (let i = 0; i < volume.length; i += step) {
            if (volume[i] !== 0) samples.push(volume[i]);
        }
        samples.sort((a, b) => a - b);

        let wc, ww;
        if (samples.length > 100) {
            // Use 1st-99th percentile for robust window/level
            const p1 = samples[Math.floor(samples.length * 0.01)];
            const p99 = samples[Math.floor(samples.length * 0.99)];
            ww = Math.max(p99 - p1, 1);
            wc = Math.round(p1 + ww / 2);
            console.log(`🧠 [MPR] Auto window/level from volume: center=${wc}, width=${ww} (p1=${p1}, p99=${p99}, samples=${samples.length})`);
        } else {
            // Fallback to defaults
            wc = DEFAULT_WINDOW_CENTER;
            ww = DEFAULT_WINDOW_WIDTH;
            console.log(`🧠 [MPR] Using default window/level: center=${wc}, width=${ww} (not enough non-zero samples)`);
        }

        const mprBasePath = `dicom/${branchId}/${caseId}/mpr`;

        // Step 4: Render Axial stack (one image per Z position)
        console.log(`🧠 [MPR] Rendering Axial stack (${depth} images, ${columns}x${rows} each)...`);
        for (let batchStart = 0; batchStart < depth; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, depth);
            const batchPromises = [];

            for (let z = batchStart; z < batchEnd; z++) {
                batchPromises.push((async () => {
                    const pixelBuffer = new Uint8Array(columns * rows);
                    const offset = z * rows * columns;

                    for (let i = 0; i < rows * columns; i++) {
                        pixelBuffer[i] = applyWindowLevel(volume[offset + i], wc, ww);
                    }

                    const jpg = await renderToJpg(pixelBuffer, columns, rows);
                    const filename = `slice_${String(z + 1).padStart(4, '0')}.jpg`;
                    await uploadToStorage(jpg, `${mprBasePath}/axial/${filename}`, {
                        contentType: 'image/jpeg',
                        cacheControl: 'public, max-age=31536000'
                    });
                })());
            }

            await Promise.all(batchPromises);
            console.log(`🧠 [MPR] Axial: ${batchEnd}/${depth}`);
            await reportProgress('Generating Axial Views', batchEnd, depth);
        }

        // Step 5: Render Sagittal stack (one image per X position)
        // Sagittal: for each X, iterate Z (depth) and Y (rows) => image is depth x rows
        // Rotated 90° left like the frontend: canvas width=rows, canvas height=depth
        console.log(`🧠 [MPR] Rendering Sagittal stack (${columns} images, ${rows}x${depth} each)...`);
        for (let batchStart = 0; batchStart < columns; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, columns);
            const batchPromises = [];

            for (let x = batchStart; x < batchEnd; x++) {
                batchPromises.push((async () => {
                    const imgWidth = rows;
                    const imgHeight = depth;
                    const pixelBuffer = new Uint8Array(imgWidth * imgHeight);

                    for (let z = 0; z < depth; z++) {
                        for (let y = 0; y < rows; y++) {
                            const srcIndex = z * rows * columns + y * columns + x;
                            // Rotate 90° left
                            const dstIndex = (depth - z - 1) * rows + y;
                            pixelBuffer[dstIndex] = applyWindowLevel(volume[srcIndex], wc, ww);
                        }
                    }

                    const jpg = await renderToJpg(pixelBuffer, imgWidth, imgHeight);
                    const filename = `slice_${String(x + 1).padStart(4, '0')}.jpg`;
                    await uploadToStorage(jpg, `${mprBasePath}/sagittal/${filename}`, {
                        contentType: 'image/jpeg',
                        cacheControl: 'public, max-age=31536000'
                    });
                })());
            }

            await Promise.all(batchPromises);
            console.log(`🧠 [MPR] Sagittal: ${batchEnd}/${columns}`);
            await reportProgress('Generating Sagittal Views', batchEnd, columns);
        }

        // Step 6: Render Coronal stack (one image per Y position)
        // Coronal: for each Y, iterate Z (depth) and X (columns) => image is columns x depth
        // Flipped 180° like the frontend
        console.log(`🧠 [MPR] Rendering Coronal stack (${rows} images, ${columns}x${depth} each)...`);
        for (let batchStart = 0; batchStart < rows; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, rows);
            const batchPromises = [];

            for (let y = batchStart; y < batchEnd; y++) {
                batchPromises.push((async () => {
                    const imgWidth = columns;
                    const imgHeight = depth;
                    const pixelBuffer = new Uint8Array(imgWidth * imgHeight);

                    for (let z = 0; z < depth; z++) {
                        for (let x = 0; x < columns; x++) {
                            const srcIndex = z * rows * columns + y * columns + x;
                            // Flip 180°: reverse both Z and X
                            const dstIndex = (depth - z - 1) * columns + (columns - x - 1);
                            pixelBuffer[dstIndex] = applyWindowLevel(volume[srcIndex], wc, ww);
                        }
                    }

                    const jpg = await renderToJpg(pixelBuffer, imgWidth, imgHeight);
                    const filename = `slice_${String(y + 1).padStart(4, '0')}.jpg`;
                    await uploadToStorage(jpg, `${mprBasePath}/coronal/${filename}`, {
                        contentType: 'image/jpeg',
                        cacheControl: 'public, max-age=31536000'
                    });
                })());
            }

            await Promise.all(batchPromises);
            console.log(`🧠 [MPR] Coronal: ${batchEnd}/${rows}`);
            await reportProgress('Generating Coronal Views', batchEnd, rows);
        }

        // Step 7: Save MPR metadata
        const mprMetadata = {
            caseId,
            branchId,
            bucketName: process.env.GCS_BUCKET_NAME,
            mprBasePath,
            dimensions: { width: columns, height: rows, depth },
            axial: {
                totalSlices: depth,
                imageWidth: columns,
                imageHeight: rows,
                path: `${mprBasePath}/axial`
            },
            sagittal: {
                totalSlices: columns,
                imageWidth: rows,
                imageHeight: depth,
                path: `${mprBasePath}/sagittal`
            },
            coronal: {
                totalSlices: rows,
                imageWidth: columns,
                imageHeight: depth,
                path: `${mprBasePath}/coronal`
            },
            windowLevel: { center: wc, width: ww },
            generatedAt: new Date().toISOString(),
            generationTimeMs: Date.now() - startTime
        };

        const metaBuffer = Buffer.from(JSON.stringify(mprMetadata, null, 2));
        await uploadToStorage(metaBuffer, `${mprBasePath}/metadata.json`, {
            contentType: 'application/json'
        });

        // Update Firebase status
        await db.ref(`forms/${branchId}/${caseId}`).update({
            mprStatus: 'ready',
            mprCompletedAt: new Date().toISOString(),
            mprMetadata: {
                dimensions: mprMetadata.dimensions,
                axialSlices: mprMetadata.axial.totalSlices,
                sagittalSlices: mprMetadata.sagittal.totalSlices,
                coronalSlices: mprMetadata.coronal.totalSlices,
                generationTimeMs: mprMetadata.generationTimeMs
            }
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`🧠 [MPR] ✅ MPR generation complete in ${elapsed}s`);
        console.log(`🧠 [MPR] Generated: ${depth} axial + ${columns} sagittal + ${rows} coronal = ${depth + columns + rows} total images`);

        if (notificationData) {
            console.log('📧 [MPR] Sending delayed email notifications...');
            await sendNotifications(
                notificationData.doctor,
                notificationData.patient,
                {
                    viewerLink: notificationData.viewerLink,
                    caseId,
                    studyDate: notificationData.studyDate
                },
                branchId
            ).catch(err => console.error('📧 [MPR] Failed to send email notifications:', err.message));

            console.log('📱 [MPR] Sending delayed WhatsApp notifications...');
            if (notificationData.doctor?.doctorPhone || notificationData.patient?.patientPhone) {
                await sendDicomNotification(
                    notificationData.doctor?.doctorPhone,
                    notificationData.doctor?.doctorName,
                    notificationData.patient?.patientName,
                    notificationData.viewerLink,
                    null, // reportUrl
                    "3D CBCT Scan" // Service name
                ).catch(err => console.error('📱 [MPR] Failed to send WhatsApp notifications:', err.message));
            }
        }

        return mprMetadata;
    } catch (error) {
        console.error(`🧠 [MPR] ❌ MPR generation failed:`, error);

        // Update Firebase with error
        await db.ref(`forms/${branchId}/${caseId}`).update({
            mprStatus: 'error',
            mprError: error.message
        });

        throw error;
    }
}

/**
 * Check if MPR data exists for a case
 * @param {string} branchId 
 * @param {string} caseId 
 * @returns {Promise<object|null>} MPR metadata or null
 */
export async function getMPRStatus(branchId, caseId) {
    try {
        const metadataPath = `dicom/${branchId}/${caseId}/mpr/metadata.json`;
        const buffer = await downloadFromStorage(metadataPath);
        return JSON.parse(buffer.toString());
    } catch (error) {
        return null;
    }
}

export default { generateMPR, getMPRStatus };
