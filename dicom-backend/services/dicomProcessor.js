import JSZip from 'jszip';
import dicomParser from 'dicom-parser';
import sharp from 'sharp';

/**
 * DICOM Processing Service
 * Extracts, parses, and processes DICOM files for web viewing
 */

/**
 * Extract DICOM files from ZIP
 * @param {Buffer} zipBuffer - ZIP file buffer
 * @returns {Promise<Array>} - Array of {filename, buffer} objects
 */
export async function extractDicomFromZip(zipBuffer) {
  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const dicomFiles = [];

    for (const [filename, file] of Object.entries(zip.files)) {
      // Skip directories and non-DICOM files
      if (file.dir) continue;

      const ext = filename.toLowerCase().split('.').pop();
      if (!['dcm', 'dicom', 'dic'].includes(ext) && !filename.includes('DICOM')) {
        continue;
      }

      const buffer = await file.async('nodebuffer');
      dicomFiles.push({ filename, buffer });
    }

    console.log(`📦 Extracted ${dicomFiles.length} DICOM files from ZIP`);
    return dicomFiles;
  } catch (error) {
    console.error('❌ ZIP extraction failed:', error);
    throw new Error('Failed to extract DICOM files from ZIP');
  }
}

/**
 * Parse DICOM file and extract metadata
 * @param {Buffer} dicomBuffer - DICOM file buffer
 * @returns {object} - Parsed metadata
 */
export function parseDicomMetadata(dicomBuffer) {
  try {
    const byteArray = new Uint8Array(dicomBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    // Extract common DICOM tags
    const metadata = {
      patientName: getString(dataSet, 'x00100010'),
      patientID: getString(dataSet, 'x00100020'),
      patientBirthDate: getString(dataSet, 'x00100030'),
      patientSex: getString(dataSet, 'x00100040'),
      studyDate: getString(dataSet, 'x00080020'),
      studyTime: getString(dataSet, 'x00080030'),
      studyDescription: getString(dataSet, 'x00081030'),
      seriesDescription: getString(dataSet, 'x0008103e'),
      modality: getString(dataSet, 'x00080060'),
      manufacturer: getString(dataSet, 'x00080070'),
      institutionName: getString(dataSet, 'x00080080'),
      rows: getNumber(dataSet, 'x00280010'),
      columns: getNumber(dataSet, 'x00280011'),
      pixelSpacing: getString(dataSet, 'x00280030'),
      sliceThickness: getString(dataSet, 'x00180050'),
      sliceLocation: getNumber(dataSet, 'x00201041'),
      instanceNumber: getNumber(dataSet, 'x00200013'),
      imagePosition: getString(dataSet, 'x00200032'),
      imageOrientation: getString(dataSet, 'x00200037'),
      windowCenter: getNumber(dataSet, 'x00281050'),
      windowWidth: getNumber(dataSet, 'x00281051'),
    };

    return metadata;
  } catch (error) {
    console.error('❌ DICOM parsing failed:', error);
    return null;
  }
}

/**
 * Extract pixel data from DICOM and convert to image
 * @param {Buffer} dicomBuffer - DICOM file buffer
 * @returns {Promise<Buffer>} - PNG image buffer
 */
export async function dicomToImage(dicomBuffer) {
  try {
    const byteArray = new Uint8Array(dicomBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    const rows = dataSet.elements.x00280010 ? dataSet.uint16('x00280010') : null;
    const columns = dataSet.elements.x00280011 ? dataSet.uint16('x00280011') : null;
    const pixelData = dataSet.elements.x7fe00010;

    if (!pixelData || !rows || !columns) {
      throw new Error('Missing pixel data or dimensions');
    }

    // Get pixel data
    const pixelDataOffset = pixelData.dataOffset;
    const pixelDataLength = pixelData.length;
    const pixels = new Uint16Array(
      byteArray.buffer,
      byteArray.byteOffset + pixelDataOffset,
      pixelDataLength / 2
    );

    // Normalize to 8-bit using Window/Level if available, fallback to Min/Max
    const wcStr = dataSet.string('x00281050');
    const wwStr = dataSet.string('x00281051');
    const riStr = dataSet.string('x00281052');
    const rsStr = dataSet.string('x00281053');

    const rescaleIntercept = riStr ? parseFloat(riStr.split('\\')[0]) : 0;
    const rescaleSlope = rsStr ? parseFloat(rsStr.split('\\')[0]) : 1;
    
    // Some tags have multiple values (e.g., "8192\\8192")
    let windowCenter = wcStr ? parseFloat(wcStr.split('\\')[0]) : null;
    let windowWidth = wwStr ? parseFloat(wwStr.split('\\')[0]) : null;

    if (windowCenter === null || windowWidth === null) {
      const min = Math.min(...pixels);
      const max = Math.max(...pixels);
      windowCenter = (max + min) / 2;
      windowWidth = max - min;
    }

    const wMin = windowCenter - 0.5 - (windowWidth - 1) / 2;
    const wMax = windowCenter - 0.5 + (windowWidth - 1) / 2;

    const normalized = new Uint8Array(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
      const hu = (pixels[i] * rescaleSlope) + rescaleIntercept;
      if (hu <= wMin) {
        normalized[i] = 0;
      } else if (hu > wMax) {
        normalized[i] = 255;
      } else {
        normalized[i] = Math.round(((hu - (windowCenter - 0.5)) / (windowWidth - 1) + 0.5) * 255);
      }
    }

    // Convert to PNG using sharp
    const imageBuffer = await sharp(Buffer.from(normalized), {
      raw: {
        width: columns,
        height: rows,
        channels: 1
      }
    })
      .png()
      .toBuffer();

    return imageBuffer;
  } catch (error) {
    console.error('❌ DICOM to image conversion failed:', error);
    throw error;
  }
}

/**
 * Extract pixel data from DICOM and convert to JPEG (for Panoramics and 2D Radiographs)
 * @param {Buffer} dicomBuffer - DICOM file buffer
 * @returns {Promise<Buffer>} - JPEG image buffer
 */
export async function dicomToJpeg(dicomBuffer) {
  try {
    const byteArray = new Uint8Array(dicomBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);

    const rows = dataSet.elements.x00280010 ? dataSet.uint16('x00280010') : null;
    const columns = dataSet.elements.x00280011 ? dataSet.uint16('x00280011') : null;
    const pixelData = dataSet.elements.x7fe00010;

    if (!pixelData || !rows || !columns) {
      throw new Error('Missing pixel data or dimensions');
    }

    // Get pixel data
    const pixelDataOffset = pixelData.dataOffset;
    const pixelDataLength = pixelData.length;
    const pixels = new Uint16Array(
      byteArray.buffer,
      byteArray.byteOffset + pixelDataOffset,
      pixelDataLength / 2
    );

    // Normalize to 8-bit using Window/Level if available, fallback to Min/Max
    const wcStr = dataSet.string('x00281050');
    const wwStr = dataSet.string('x00281051');
    const riStr = dataSet.string('x00281052');
    const rsStr = dataSet.string('x00281053');

    const rescaleIntercept = riStr ? parseFloat(riStr.split('\\')[0]) : 0;
    const rescaleSlope = rsStr ? parseFloat(rsStr.split('\\')[0]) : 1;
    
    // Some tags have multiple values
    let windowCenter = wcStr ? parseFloat(wcStr.split('\\')[0]) : null;
    let windowWidth = wwStr ? parseFloat(wwStr.split('\\')[0]) : null;

    if (windowCenter === null || windowWidth === null) {
      const min = Math.min(...pixels);
      const max = Math.max(...pixels);
      windowCenter = (max + min) / 2;
      windowWidth = max - min;
    }

    const wMin = windowCenter - 0.5 - (windowWidth - 1) / 2;
    const wMax = windowCenter - 0.5 + (windowWidth - 1) / 2;

    const normalized = new Uint8Array(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
      const hu = (pixels[i] * rescaleSlope) + rescaleIntercept;
      if (hu <= wMin) {
        normalized[i] = 0;
      } else if (hu > wMax) {
        normalized[i] = 255;
      } else {
        normalized[i] = Math.round(((hu - (windowCenter - 0.5)) / (windowWidth - 1) + 0.5) * 255);
      }
    }

    // Convert to JPEG using sharp
    const imageBuffer = await sharp(Buffer.from(normalized), {
      raw: {
        width: columns,
        height: rows,
        channels: 1
      }
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    return imageBuffer;
  } catch (error) {
    console.error('❌ DICOM to JPEG conversion failed:', error);
    throw error;
  }
}

/**
 * Generate thumbnail from DICOM
 * @param {Buffer} dicomBuffer - DICOM file buffer
 * @param {number} size - Thumbnail size (default 256)
 * @returns {Promise<Buffer>} - WebP thumbnail buffer
 */
export async function generateThumbnail(dicomBuffer, size = 256) {
  try {
    const imageBuffer = await dicomToImage(dicomBuffer);

    const thumbnail = await sharp(imageBuffer)
      .resize(size, size, { fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('❌ Thumbnail generation failed:', error);
    throw error;
  }
}

/**
 * Generate preview image from DICOM
 * @param {Buffer} dicomBuffer - DICOM file buffer
 * @param {number} size - Preview size (default 512)
 * @returns {Promise<Buffer>} - WebP preview buffer
 */
export async function generatePreview(dicomBuffer, size = 512) {
  try {
    const imageBuffer = await dicomToImage(dicomBuffer);

    const preview = await sharp(imageBuffer)
      .resize(size, size, { fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();

    return preview;
  } catch (error) {
    console.error('❌ Preview generation failed:', error);
    throw error;
  }
}

/**
 * Generate tiles for progressive loading
 * @param {Buffer} dicomBuffer - DICOM file buffer
 * @param {number} tileSize - Tile size (default 256)
 * @returns {Promise<Array>} - Array of {x, y, buffer} tile objects
 */
export async function generateTiles(dicomBuffer, tileSize = 256) {
  try {
    const imageBuffer = await dicomToImage(dicomBuffer);
    const metadata = await sharp(imageBuffer).metadata();

    const tiles = [];
    const cols = Math.ceil(metadata.width / tileSize);
    const rows = Math.ceil(metadata.height / tileSize);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const left = x * tileSize;
        const top = y * tileSize;
        const width = Math.min(tileSize, metadata.width - left);
        const height = Math.min(tileSize, metadata.height - top);

        const tileBuffer = await sharp(imageBuffer)
          .extract({ left, top, width, height })
          .webp({ quality: 90 })
          .toBuffer();

        tiles.push({ x, y, buffer: tileBuffer });
      }
    }

    console.log(`🎨 Generated ${tiles.length} tiles (${cols}x${rows})`);
    return tiles;
  } catch (error) {
    console.error('❌ Tile generation failed:', error);
    throw error;
  }
}

// Helper functions
function getString(dataSet, tag) {
  const element = dataSet.elements[tag];
  if (!element) return null;
  return dataSet.string(tag);
}

function getNumber(dataSet, tag) {
  const element = dataSet.elements[tag];
  if (!element) return null;
  const value = dataSet.string(tag);
  return value ? parseFloat(value) : null;
}

export default {
  extractDicomFromZip,
  parseDicomMetadata,
  dicomToImage,
  generateThumbnail,
  generatePreview,
  generateTiles
};
