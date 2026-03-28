# Viewer Fix Complete - slicesMetadata Added

## Problem Identified

The viewer showed "Slice 1/0" because the metadata.json file was missing the `slicesMetadata` array. The viewer code expects this array to know which DICOM files to load:

```javascript
if (data.slicesMetadata && data.slicesMetadata.length > 0) {
  const ids = data.slicesMetadata.map(slice => {
    const url = `https://storage.googleapis.com/${data.bucketName}/${data.dicomBasePath}/${slice.filename}`;
    return `wadouri:${url}`;
  });
  setImageIds(ids);
}
```

## Root Cause

The `/upload/process` endpoint (used for signed URL uploads) was NOT including `slicesMetadata` in the metadata.json file. The regular `/upload` endpoint had this field, but the signed URL path didn't.

## Fix Applied

Updated `dicom-backend/routes/upload.js` in the `/upload/process` endpoint to:

1. Parse metadata from each DICOM file during upload
2. Create `slicesMetadata` array with filename and instance number
3. Sort slices by instance number for proper ordering
4. Include `slicesMetadata` in metadata.json

### Code Changes:

```javascript
// Parse metadata from all DICOM files for proper ordering
const slicesMetadata = [];
for (let i = 0; i < dicomFiles.length; i++) {
  const dicom = dicomFiles[i];
  const filename = `slice_${String(i + 1).padStart(4, '0')}.dcm`;
  
  await uploadToStorage(dicom.buffer, `dicom/${branchId}/${caseId}/files/${filename}`, {
    contentType: 'application/dicom'
  });
  
  // Parse metadata for this slice
  const sliceMetadata = parseDicomMetadata(dicom.buffer);
  slicesMetadata.push({
    index: i + 1,
    filename: filename,
    instanceNumber: sliceMetadata?.instanceNumber || i + 1,
    sliceLocation: sliceMetadata?.sliceLocation,
    imagePosition: sliceMetadata?.imagePosition
  });
  
  if ((i + 1) % 50 === 0) console.log(`   ${i + 1}/${dicomFiles.length}...`);
}

// Sort by instance number
slicesMetadata.sort((a, b) => (a.instanceNumber || 0) - (b.instanceNumber || 0));
```

## Deployment

Backend deployed successfully:
- **Revision**: dicom-backend-00013-9tk
- **URL**: https://dicom-backend-59642964164.asia-south1.run.app
- **Status**: LIVE

## What You Need to Do

**Upload the file again!**

The previous upload was processed with the old code that didn't include `slicesMetadata`. You need to upload the 119MB file again so it processes with the new code.

### Steps:

1. Go to https://nice4-d7886.web.app
2. Login
3. Create a new form
4. Upload the 119MB DICOM file again
5. Wait for processing to complete
6. Open the viewer link

### Expected Result:

This time the viewer should show:
- ✅ "Axial (Slice 1/576)" instead of "Slice 1/0"
- ✅ All 576 DICOM images load correctly
- ✅ Single View mode works (scroll through slices)
- ✅ MPR View mode works (Axial, Sagittal, Coronal)

## Verification

After upload completes, check the metadata:

```bash
curl "https://dicom-backend-59642964164.asia-south1.run.app/viewer/<NEW_CASE_ID>"
```

You should see:
```json
{
  "caseId": "...",
  "totalSlices": 576,
  "slicesMetadata": [
    {
      "index": 1,
      "filename": "slice_0001.dcm",
      "instanceNumber": 1,
      ...
    },
    ...
  ]
}
```

## Why This Happened

The signed URL upload feature was added later, and the `/upload/process` endpoint was created by copying code from the regular `/upload` endpoint. However, the section that creates `slicesMetadata` was accidentally omitted in the copy.

Both endpoints now have identical metadata generation logic.

## Files Modified

- `dicom-backend/routes/upload.js` - Added slicesMetadata to /upload/process endpoint

## Status

- [x] Bug identified
- [x] Fix implemented
- [x] Backend deployed
- [ ] **Upload file again to test fix**

---

**The backend is fixed. Upload the file again to see the viewer working with all 576 slices!**
