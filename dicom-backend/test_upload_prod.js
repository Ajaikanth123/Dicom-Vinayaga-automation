import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const zipFilePath = 'C:\\Users\\Admin\\Desktop\\DICOM\\MRS M DEEPA 32 F ( DR S J DINESHRAJA) FULL SKULL.zip';
const backendUrl = 'https://dicom-backend-59642964164.asia-south1.run.app';

async function testUpload() {
  console.log(`Starting production test upload for: ${zipFilePath}`);
  
  const form = new FormData();
  form.append('branchId', 'test-branch');
  form.append('caseId', 'test-pano-case');
  form.append('patientName', 'DEEPA TEST');
  form.append('patientId', 'PT-TEST-002');
  
  // Create readable stream for the ZIP file
  form.append('files', fs.createReadStream(zipFilePath));

  try {
    console.log(`Sending POST request to ${backendUrl}/upload ...`);
    console.log('This may take 1-2 minutes depending on connection speed.');
    
    const response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();
    console.log('\nUpload Result:');
    console.dir(result, { depth: null, colors: true });

    if (response.ok) {
      console.log('\n✅ Upload Successful!');
      console.log(`Check Firebase at path: /forms/test-branch/test-pano-case`);
      console.log('You can now check the viewer frontend for this case to see the 2D Radiograph tab.');
    } else {
      console.log('\n❌ Upload Failed');
    }
  } catch (error) {
    console.error('Error during test upload:', error);
  }
}

testUpload();
