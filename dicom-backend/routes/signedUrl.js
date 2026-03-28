import express from 'express';
import { Storage } from '@google-cloud/storage';

const router = express.Router();
const storage = new Storage();

/**
 * POST /signed-url
 * Generate a signed URL for direct upload to GCS
 */
router.post('/', async (req, res) => {
  try {
    const { branchId, caseId, filename, contentType } = req.body;

    if (!branchId || !caseId || !filename) {
      return res.status(400).json({ error: 'branchId, caseId, and filename are required' });
    }

    const bucketName = process.env.GCS_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);
    
    // Generate unique filename
    const destination = `dicom/${branchId}/${caseId}/upload/${filename}`;
    const file = bucket.file(destination);

    // Generate signed URL for upload (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType: contentType || 'application/zip',
    });

    console.log(`✅ Generated signed URL for: ${destination}`);

    res.json({
      uploadUrl: url,
      destination,
      bucketName
    });

  } catch (error) {
    console.error('❌ Signed URL generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
