import admin from 'firebase-admin';
import dicomParser from 'dicom-parser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'nice4-dicom-storage' /* production bucket */
  });
}

async function fetchSlice() {
  try {
    const bucket = admin.storage().bucket();
    const filePath = 'dicom/ramanathapuram/b5fe1397-9d47-4fbc-babd-f7c7e5d61c1a/files/slice_0576.dcm';
    console.log(`Downloading ${filePath}...`);
    
    const [fileBuffer] = await bucket.file(filePath).download();
    
    // Parse it locally
    const byteArray = new Uint8Array(fileBuffer);
    const dataSet = dicomParser.parseDicom(byteArray);
    
    const modality = dataSet.elements.x00080060 ? dataSet.string('x00080060') : 'NOT_FOUND';
    console.log(`Modality is EXACTLY: "${modality}"`);
    console.log('Hex code of characters:');
    for (let i = 0; i < modality.length; i++) {
        console.log(`Char ${i}: ${modality[i]} (code: ${modality.charCodeAt(i)})`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
fetchSlice();
