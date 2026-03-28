import express from 'express';
import { generateCrossSections, detectJawCurve } from '../services/crossSectionService.js';
import { downloadFromStorage } from '../services/storageService.js';
import admin from 'firebase-admin';

const router = express.Router();

/**
 * Auto-Detect Jaw Curve from DICOM data
 * GET /viewer/auto-curve/:caseId?branchId=xxx&sliceIndex=yyy
 */
router.get('/auto-curve/:caseId', async (req, res) => {
    const { caseId } = req.params;
    const { branchId, sliceIndex } = req.query;

    if (!branchId) {
        return res.status(400).json({ success: false, message: 'Missing branchId' });
    }

    try {
        console.log(`🔍 [AUTO-CURVE] API request for ${caseId}`);
        const result = await detectJawCurve(branchId, caseId, sliceIndex ? parseInt(sliceIndex) : -1);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('🔍 [AUTO-CURVE] API Error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Trigger Generation of Cross-Section Images
 * POST /viewer/generate-cross-sections/:caseId
 * 
 * Body requires:
 * {
 *   branchId: "branch-uuid",
 *   controlPoints: [{ x: 50, y: 120 }, { x: 70, y: 150 }, ...],
 *   numSections: 100,
 *   sectionWidth: 150
 * }
 */
router.post('/generate-cross-sections/:caseId', async (req, res) => {
    const { caseId } = req.params;
    const { branchId, controlPoints, numSections = 100, sectionWidth = 150, sliceIndex } = req.body;

    if (!branchId || !controlPoints || !Array.isArray(controlPoints) || controlPoints.length < 3) {
        return res.status(400).json({ success: false, message: 'Invalid payload: branchId and at least 3 controlPoints required' });
    }

    try {
        console.log(`🦷 [CS] API Request to generate ${numSections} cross sections for ${caseId}...`);
        
        // Fire and forget
        generateCrossSections(branchId, caseId, controlPoints, numSections, sectionWidth, sliceIndex).catch(err => {
            console.error(`🦷 [CS] Background failure:`, err.message);
        });

        res.json({
            success: true,
            message: 'Cross-section generation started',
            status: 'processing'
        });
    } catch (error) {
        console.error('🦷 [CS] API Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Check Status / Fetch Metadata
 * GET /viewer/cross-sections/:caseId?branchId=...
 */
router.get('/cross-sections/:caseId', async (req, res) => {
    const { caseId } = req.params;
    const { branchId } = req.query;

    if (!branchId || !caseId) {
        return res.status(400).json({ success: false, message: 'Missing branchId or caseId' });
    }

    try {
        const db = admin.database();
        const statusSnapshot = await db.ref(`forms/${branchId}/${caseId}`).once('value');
        const formData = statusSnapshot.val() || {};
        const status = formData.crossSectionStatus;
        const progress = formData.csProgress;
        
        if (status === 'processing') {
            return res.json({ success: true, status: 'processing', progress });
        }
        
        const metadataPath = `dicom/${branchId}/${caseId}/cross-sections/metadata.json`;
        const buffer = await downloadFromStorage(metadataPath);
        const metadata = JSON.parse(buffer.toString());
        res.json({ success: true, status: 'ready', metadata, progress });
    } catch (error) {
        // Normal if not generated yet
        res.json({ success: false, status: 'not_ready', message: 'Metadata not found' });
    }
});

export default router;
