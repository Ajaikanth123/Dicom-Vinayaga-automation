import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const zipFilePath = 'C:\\Users\\Admin\\Desktop\\DICOM\\MRS M DEEPA 32 F ( DR S J DINESHRAJA) FULL SKULL.zip';

async function testUpload() {
  console.log(`Starting test upload for: ${zipFilePath}`);
  
  const form = new FormData();
  form.append('branchId', 'test-upload');
  form.append('caseId', 'pano-test-case-1');
  form.append('patientName', 'MRS DEEPA Test');
  form.append('patientId', 'PT-TEST-001');
  
  // Create readable stream for the ZIP file
  form.append('files', fs.createReadStream(zipFilePath));

  try {
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();
    console.log('Upload Result:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Upload Successful');
    } else {
      console.log('❌ Upload Failed');
    }
  } catch (error) {
    console.error('Error during test upload:', error);
  }
}

testUpload();
