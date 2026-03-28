import fetch from 'node-fetch';

async function testFetch() {
  const url = `https://dicom-backend-59642964164.asia-south1.run.app/viewer/b5fe1397-9d47-4fbc-babd-f7c7e5d61c1a?branchId=ramanathapuram`;
  console.log(`Fetching from: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Total slices: ${data.slicesMetadata?.length || 0}`);
    console.log(`Panoramic URLs length: ${data.panoramicUrls?.length || 0}`);
    if (data.panoramicUrls) {
      console.log('Panoramic URLs:', JSON.stringify(data.panoramicUrls, null, 2));
    }
  } catch (err) {
    console.error('Error fetching data:', err.message);
  }
}

testFetch();
