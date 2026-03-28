import express from 'express';
import admin from 'firebase-admin';
import dicomParser from 'dicom-parser';
import { generateMPR, getMPRStatus } from '../services/mprService.js';
import { downloadFromStorage } from '../services/storageService.js';

const router = express.Router();

/**
 * GET /viewer/dicom-info/:caseId (TEMP diagnostic endpoint)
 */
router.get('/dicom-info/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { branchId } = req.query;

    const metaBuf = await downloadFromStorage(`dicom/${branchId}/${caseId}/metadata.json`);
    const meta = JSON.parse(metaBuf.toString());

    const firstFilename = meta.slicesMetadata?.[0]?.filename;
    const slicePath = `${meta.dicomBasePath}/${firstFilename}`;

    const buf = await downloadFromStorage(slicePath);
    const byteArray = new Uint8Array(buf);
    const ds = dicomParser.parseDicom(byteArray);

    const pde = ds.elements.x7fe00010;
    const rows = ds.uint16('x00280010') || 0;
    const cols = ds.uint16('x00280011') || 0;
    const bitsAllocated = ds.uint16('x00280100') || 16;
    const pixelRep = ds.uint16('x00280103') || 0;

    const result = {
      slicePath, rows, cols, bitsAllocated, pixelRep,
      transferSyntax: ds.string('x00020010'),
      bitsStored: ds.uint16('x00280101'),
      photometric: ds.string('x00280004'),
      rescaleSlope: ds.string('x00281053'),
      rescaleIntercept: ds.string('x00281052'),
      encapsulated: pde?.encapsulatedPixelData || false,
      fragments: pde?.fragments?.length || 0,
      pixelDataLength: pde?.length,
    };

    // Test JPEG Lossless decoding
    if (pde?.encapsulatedPixelData && pde?.fragments?.length > 0) {
      console.log('🧠 [Viewer] Entering JPEG decode block...');
      try {
        console.log('🧠 [Viewer] Importing library...');
        const jpegLosslessLib = await import('jpeg-lossless-decoder-js');
        console.log('🧠 [Viewer] Library imported successfully.');

        // Handle empty basicOffsetTable safely
        let jpegData;
        console.log('🧠 [Viewer] Checking basic offset table... length = ', pde.basicOffsetTable ? pde.basicOffsetTable.length : 'none');
        if (!pde.basicOffsetTable || pde.basicOffsetTable.length === 0) {
          console.log('🧠 [Viewer] Calling readEncapsulatedPixelDataFromFragments...');
          jpegData = dicomParser.readEncapsulatedPixelDataFromFragments(ds, pde, 0, pde.fragments.length);
        } else {
          console.log('🧠 [Viewer] Calling readEncapsulatedImageFrame...');
          jpegData = dicomParser.readEncapsulatedImageFrame(ds, pde, 0);
        }

        console.log('🧠 [Viewer] Extraction successful. jpegData length =', jpegData ? jpegData.length : 'undefined');
        result.firstBytes = Array.from(jpegData.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        console.log('🧠 [Viewer] firstBytes:', result.firstBytes);

        console.log('🧠 [Viewer] Instantiating decoder...');
        const decoder = new jpegLosslessLib.Decoder();
        const decoded = decoder.decode(jpegData.buffer, jpegData.byteOffset, jpegData.length);
        result.decodedBytes = decoded.byteLength;

        const px = pixelRep === 1 ? new Int16Array(decoded) : new Uint16Array(decoded);
        let min = Infinity, max = -Infinity, sum = 0, nonZero = 0;
        for (let i = 0; i < px.length; i++) {
          if (px[i] < min) min = px[i];
          if (px[i] > max) max = px[i];
          sum += px[i];
          if (px[i] !== 0) nonZero++;
        }
        result.pixelCount = px.length;
        result.pixelMin = min;
        result.pixelMax = max;
        result.pixelMean = Math.round(sum / px.length);
        result.nonZeroPixels = nonZero;
        result.first20 = Array.from(px.slice(0, 20));
        result.middle20 = Array.from(px.slice(Math.floor(px.length / 2), Math.floor(px.length / 2) + 20));
      } catch (decodeErr) {
        result.decodeError = decodeErr instanceof Error ? decodeErr.message : String(decodeErr);
        result.decodeStack = decodeErr instanceof Error ? decodeErr.stack : "";
      }
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

/**
 * Helper to fetch main metadata and extract panoramic URLs
 */
async function getPanoramicUrls(branchId, caseId) {
  try {
    const metadataUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/dicom/${branchId}/${caseId}/metadata.json`;
    const response = await fetch(metadataUrl);
    if (response.ok) {
        const metadata = await response.json();
        return metadata.panoramicUrls || [];
    }
  } catch (err) {
    console.error(`Failed to fetch panoramicUrls for ${caseId}:`, err);
  }
  return [];
}

/**
 * GET /viewer/mpr-status/:caseId
 * Check if pre-rendered MPR data exists for a case, and return any pre-computed Panoramic URLs
 */
router.get('/mpr-status/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { branchId } = req.query;

    if (!branchId) {
      // Search for the branch
      const db = admin.database();
      const formsSnapshot = await db.ref('forms').once('value');
      const allForms = formsSnapshot.val();

      if (allForms) {
        for (const [branch, branchCases] of Object.entries(allForms)) {
          if (branchCases && branchCases[caseId]) {
            const mprData = await getMPRStatus(branch, caseId);
            const panoramicUrls = await getPanoramicUrls(branch, caseId);
            
            if (mprData) {
              return res.json({ available: true, panoramicUrls, ...mprData });
            }
            // Check Firebase for status
            const formData = branchCases[caseId];
            return res.json({
              available: false,
              mprStatus: formData.mprStatus || 'not_started',
              branchId: branch,
              panoramicUrls
            });
          }
        }
      }
      return res.json({ available: false, mprStatus: 'not_started', panoramicUrls: [] });
    }

    const mprData = await getMPRStatus(branchId, caseId);
    const panoramicUrls = await getPanoramicUrls(branchId, caseId);
    
    if (mprData) {
      return res.json({ available: true, panoramicUrls, ...mprData });
    }

    // Check Firebase for processing status
    const db = admin.database();
    const snapshot = await db.ref(`forms/${branchId}/${caseId}/mprStatus`).once('value');
    const status = snapshot.val() || 'not_started';

    return res.json({ available: false, mprStatus: status, branchId, panoramicUrls });
  } catch (error) {
    console.error('❌ MPR status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /viewer/generate-mpr/:caseId
 * Trigger MPR generation for an existing case
 */
router.post('/generate-mpr/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    let { branchId } = req.body;

    // If no branchId, search for it
    if (!branchId) {
      const db = admin.database();
      const formsSnapshot = await db.ref('forms').once('value');
      const allForms = formsSnapshot.val();

      if (allForms) {
        for (const [branch, branchCases] of Object.entries(allForms)) {
          if (branchCases && branchCases[caseId]) {
            branchId = branch;
            break;
          }
        }
      }
    }

    if (!branchId) {
      return res.status(404).json({ error: 'Case not found in any branch' });
    }

    // Check if already processing or ready
    const db = admin.database();
    const statusSnapshot = await db.ref(`forms/${branchId}/${caseId}/mprStatus`).once('value');
    const currentStatus = statusSnapshot.val();

    if (currentStatus === 'processing') {
      return res.json({ message: 'MPR generation already in progress', status: 'processing' });
    }

    // Run synchronously to keep Cloud Run CPU alive for the entire generation
    console.log(`🧠 [MPR] Starting synchronous MPR generation for ${caseId}...`);

    try {
      const result = await generateMPR(branchId, caseId);
      res.json({
        message: 'MPR generation complete',
        status: 'ready',
        branchId,
        dimensions: result.dimensions,
        axialSlices: result.axial.totalSlices,
        sagittalSlices: result.sagittal.totalSlices,
        coronalSlices: result.coronal.totalSlices,
        generationTimeMs: result.generationTimeMs
      });
    } catch (genErr) {
      console.error(`❌ MPR generation failed for ${caseId}:`, genErr);
      res.status(500).json({ error: 'MPR generation failed', details: genErr.message });
    }
  } catch (error) {
    console.error('❌ Generate MPR error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /viewer/:caseId
 * Get DICOM viewer data for a case - fetches metadata from Google Cloud Storage
 */
router.get('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { branchId } = req.query;

    const db = admin.database();

    // If branchId is provided, use it directly
    if (branchId) {
      const metadataUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/dicom/${branchId}/${caseId}/metadata.json`;

      console.log(`📥 Fetching metadata from: ${metadataUrl}`);

      try {
        const response = await fetch(metadataUrl);
        if (response.ok) {
          const metadata = await response.json();
          console.log('✅ Metadata loaded:', { totalSlices: metadata.totalSlices });
          return res.json({ ...metadata, branchId });
        } else {
          console.log(`❌ Metadata not found at ${metadataUrl}`);
        }
      } catch (err) {
        console.error('Failed to fetch metadata from storage:', err);
      }
    }

    // Search across all branches for the caseId
    console.log(`🔍 Searching for case ${caseId} across all branches...`);
    const formsSnapshot = await db.ref('forms').once('value');
    const allForms = formsSnapshot.val();

    if (!allForms) {
      return res.status(404).json({ error: 'No forms found' });
    }

    // Search through all branches
    for (const [branch, branchCases] of Object.entries(allForms)) {
      if (branchCases && branchCases[caseId]) {
        console.log(`✅ Found case in branch: ${branch}`);

        // Fetch metadata from Google Cloud Storage
        const metadataUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/dicom/${branch}/${caseId}/metadata.json`;

        console.log(`📥 Fetching metadata from: ${metadataUrl}`);

        try {
          const response = await fetch(metadataUrl);
          if (response.ok) {
            const metadata = await response.json();
            console.log('✅ Metadata loaded from storage:', {
              totalSlices: metadata.totalSlices,
              basePath: metadata.dicomBasePath
            });
            return res.json({ ...metadata, branchId: branch });
          } else {
            console.log(`❌ Metadata not found: ${response.status}`);
          }
        } catch (err) {
          console.error('Failed to fetch metadata from storage:', err);
        }
      }
    }

    return res.status(404).json({ error: 'Case not found or metadata not available' });

  } catch (error) {
    console.error('❌ Viewer data error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
