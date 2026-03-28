import admin from 'firebase-admin';
import JSZip from 'jszip';
import dicomParser from 'dicom-parser';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'nice4-dicom-storage'
  });
}

function getString(dataSet, tag) {
  const element = dataSet.elements[tag];
  if (!element) return null;
  return dataSet.string(tag);
}

async function analyzeZip() {
  try {
    const bucket = admin.storage().bucket();
    const zipPath = 'dicom/ramanathapuram/b5fe1397-9d47-4fbc-babd-f7c7e5d61c1a/upload/MRS M DEEPA 32 F ( DR S J DINESHRAJA) FULL SKULL.zip';
    
    console.log(`Downloading original ZIP: ${zipPath}...`);
    const [fileBuffer] = await bucket.file(zipPath).download();
    
    console.log(`Unzipping ${(fileBuffer.length/1024/1024).toFixed(2)} MB...`);
    const zip = await JSZip.loadAsync(fileBuffer);
    
    let totalFiles = 0;
    const modalities = {};
    
    for (const [filename, file] of Object.entries(zip.files)) {
      if (file.dir) continue;
      
      const ext = filename.toLowerCase().split('.').pop();
      if (!['dcm', 'dicom', 'dic'].includes(ext) && !filename.includes('DICOM')) continue;
      
      const buffer = await file.async('nodebuffer');
      totalFiles++;
      
      try {
        const byteArray = new Uint8Array(buffer);
        const dataSet = dicomParser.parseDicom(byteArray);
        const modality = getString(dataSet, 'x00080060') || 'UNKNOWN';
        
        modalities[modality] = (modalities[modality] || 0) + 1;
      } catch (e) {
        // Skip unparseable
      }
    }
    
    console.log(`\n--- ZIP CONTENTS ANALYSIS ---`);
    console.log(`Total Valid DICOM Files: ${totalFiles}`);
    console.log(`Modalities Found:`);
    for (const [mod, count] of Object.entries(modalities)) {
        console.log(`   - ${mod}: ${count} files`);
    }
    console.log(`\nIf the machine included a Panoramic/Scout, we would see 'DX', 'CR', 'SC', or 'PX' listed above.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error analyzing zip:', err);
    process.exit(1);
  }
}

analyzeZip();
