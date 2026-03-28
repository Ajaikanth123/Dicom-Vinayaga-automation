import admin from 'firebase-admin';

// Read the credentials safely
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./config/service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'medical-referral-system-60efc.firebasestorage.app'
  });
}

async function checkPanoExists() {
  try {
    const bucket = admin.storage().bucket();
    const prefix = 'dicom/test-branch/test-pano-case/pano/';
    
    console.log(`Checking GCS for files in: ${prefix}`);
    
    const [files] = await bucket.getFiles({ prefix });
    
    if (files.length === 0) {
      console.log('No Panoramic files found yet.');
    } else {
      console.log(`✅ Found ${files.length} Panoramic files!`);
      files.forEach(f => console.log(`- ${f.name} (${f.metadata.size} bytes)`));
    }
    
    // Also check metadata.json
    console.log(`\nChecking metadata.json...`);
    const [metaFile] = await bucket.file('dicom/test-branch/test-pano-case/metadata.json').download();
    const metadata = JSON.parse(metaFile.toString());
    console.log(`panoramicUrls length inside metadata:`, metadata.panoramicUrls?.length || 0);
    if (metadata.panoramicUrls?.length > 0) {
       console.log(`URL 1:`, metadata.panoramicUrls[0].url);
    }
    
    process.exit(0);
  } catch (err) {
    if (err.code === 404) {
      console.log('Metadata not found yet. Upload might still be running.');
    } else {
      console.error('Error checking GCS:', err);
    }
    process.exit(1);
  }
}

checkPanoExists();
