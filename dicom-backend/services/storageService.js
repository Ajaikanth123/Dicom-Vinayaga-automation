import { Storage } from '@google-cloud/storage';
import path from 'path';

/**
 * Google Cloud Storage Service
 * Handles file uploads and downloads from Google Cloud Storage
 */

let storage = null;
let bucket = null;

/**
 * Initialize storage and bucket (lazy initialization)
 */
function initStorage() {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
    });

    const bucketName = process.env.GCS_BUCKET_NAME || 'dicom-connect-storage';
    bucket = storage.bucket(bucketName);

    console.log('📦 Storage initialized with bucket:', bucketName);
  }
  return bucket;
}

/**
 * Upload file to Google Cloud Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} destination - Destination path in storage
 * @param {object} metadata - File metadata
 * @returns {Promise<string>} - Public URL
 */
export async function uploadToStorage(fileBuffer, destination, metadata = {}) {
  try {
    const bucket = initStorage();
    const file = bucket.file(destination);

    await file.save(fileBuffer, {
      metadata: {
        contentType: metadata.contentType || 'application/octet-stream',
        metadata: metadata,
        cacheControl: metadata.cacheControl || 'public, max-age=31536000'
      },
      public: true
    });

    const bucketName = bucket.name;
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;

    console.log(`✅ Uploaded: ${destination}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Upload failed: ${destination}`, error);
    throw error;
  }
}

/**
 * Upload DICOM ZIP file
 * @param {Buffer} fileBuffer - ZIP file buffer
 * @param {string} branchId - Branch ID
 * @param {string} caseId - Case ID
 * @param {object} metadata - File metadata
 * @returns {Promise<string>} - Storage path
 */
export async function uploadDicomZip(fileBuffer, branchId, caseId, metadata = {}) {
  const destination = `dicom/${branchId}/${caseId}/original.zip`;
  await uploadToStorage(fileBuffer, destination, {
    ...metadata,
    contentType: 'application/zip',
    uploadedAt: new Date().toISOString()
  });
  return destination;
}

/**
 * Upload PDF report
 * @param {Buffer} fileBuffer - PDF file buffer
 * @param {string} branchId - Branch ID
 * @param {string} caseId - Case ID
 * @param {object} metadata - File metadata
 * @returns {Promise<string>} - Download URL
 */
export async function uploadReport(fileBuffer, branchId, caseId, metadata = {}) {
  const destination = `reports/${branchId}/${caseId}/report.pdf`;
  return await uploadToStorage(fileBuffer, destination, {
    ...metadata,
    contentType: 'application/pdf',
    uploadedAt: new Date().toISOString()
  });
}

/**
 * Upload processed DICOM image (thumbnail, preview, or tile)
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} caseId - Case ID
 * @param {string} type - Image type (thumbnail, preview, tile)
 * @param {string} filename - Filename
 * @returns {Promise<string>} - Download URL
 */
export async function uploadProcessedImage(imageBuffer, caseId, type, filename) {
  const destination = `processed/${caseId}/${type}/${filename}`;
  return await uploadToStorage(imageBuffer, destination, {
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000' // Cache for 1 year
  });
}

/**
 * Upload metadata JSON
 * @param {object} metadata - Metadata object
 * @param {string} caseId - Case ID
 * @returns {Promise<string>} - Download URL
 */
export async function uploadMetadata(metadata, caseId) {
  const destination = `processed/${caseId}/metadata.json`;
  const buffer = Buffer.from(JSON.stringify(metadata, null, 2));
  return await uploadToStorage(buffer, destination, {
    contentType: 'application/json'
  });
}

/**
 * Download file from storage
 * @param {string} path - File path in storage
 * @returns {Promise<Buffer>} - File buffer
 */
export async function downloadFromStorage(path) {
  try {
    const bucket = initStorage();
    const file = bucket.file(path);
    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    console.error(`❌ Download failed: ${path}`, error);
    throw error;
  }
}

/**
 * Delete file from storage
 * @param {string} path - File path in storage
 */
export async function deleteFromStorage(path) {
  try {
    const bucket = initStorage();
    await bucket.file(path).delete();
    console.log(`🗑️  Deleted: ${path}`);
  } catch (error) {
    console.error(`❌ Delete failed: ${path}`, error);
    throw error;
  }
}

/**
 * Check if file exists
 * @param {string} path - File path in storage
 * @returns {Promise<boolean>}
 */
export async function fileExists(path) {
  try {
    const bucket = initStorage();
    const [exists] = await bucket.file(path).exists();
    return exists;
  } catch (error) {
    return false;
  }
}

export default {
  uploadToStorage,
  uploadDicomZip,
  uploadReport,
  uploadProcessedImage,
  uploadMetadata,
  downloadFromStorage,
  deleteFromStorage,
  fileExists
};
