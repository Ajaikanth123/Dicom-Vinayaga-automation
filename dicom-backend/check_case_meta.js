import admin from 'firebase-admin';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'nice4-dicom-storage'
  });
}

async function checkMetadata() {
  try {
    const bucket = admin.storage().bucket();
    const filePath = 'dicom/ramanathapuram/b5fe1397-9d47-4fbc-babd-f7c7e5d61c1a/metadata.json';
    
    const [metaFile] = await bucket.file(filePath).download();
    const metadata = JSON.parse(metaFile.toString());
    
    const nullSlices = metadata.slicesMetadata.filter(s => !s.sliceLocation && !s.imagePosition);
    console.log(`There are ${nullSlices.length} slices without loc/pos.`);
    if (nullSlices.length > 0) {
        console.log('Indexes:', nullSlices.map(s => s.index));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error fetching metadata:', err);
    process.exit(1);
  }
}

checkMetadata();
