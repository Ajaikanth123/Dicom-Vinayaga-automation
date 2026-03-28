import { downloadFromStorage } from './services/storageService.js';
import dicomParser from 'dicom-parser';

try {
    // First get metadata to find actual slice filenames
    const metaBuf = await downloadFromStorage('dicom/ramanathapuram/9d514bf1-16ce-4a54-8ee8-403d27a83249/metadata.json');
    const meta = JSON.parse(metaBuf.toString());

    console.log('=== Metadata ===');
    console.log('totalSlices:', meta.totalSlices);
    console.log('dicomBasePath:', meta.dicomBasePath);
    console.log('First 3 slices:', JSON.stringify(meta.slicesMetadata?.slice(0, 3)));

    // Get first slice filename
    const firstFilename = meta.slicesMetadata?.[0]?.filename;
    const slicePath = `${meta.dicomBasePath}/${firstFilename}`;
    console.log('\nLoading slice:', slicePath);

    const buf = await downloadFromStorage(slicePath);
    console.log('Buffer size:', buf.length);

    const byteArray = new Uint8Array(buf);
    const ds = dicomParser.parseDicom(byteArray);

    console.log('\n=== DICOM Header ===');
    console.log('TransferSyntax:', ds.string('x00020010'));
    console.log('Rows:', ds.uint16('x00280010'));
    console.log('Cols:', ds.uint16('x00280011'));
    console.log('BitsAllocated:', ds.uint16('x00280100'));
    console.log('BitsStored:', ds.uint16('x00280101'));
    console.log('PixelRepresentation:', ds.uint16('x00280103'));
    console.log('SamplesPerPixel:', ds.uint16('x00280002'));
    console.log('PhotometricInterpretation:', ds.string('x00280004'));

    const pde = ds.elements.x7fe00010;
    console.log('\n=== Pixel Data ===');
    console.log('Offset:', pde?.dataOffset);
    console.log('Length:', pde?.length);
    console.log('Encapsulated:', pde?.encapsulatedPixelData || false);
    console.log('Fragments:', pde?.fragments?.length || 0);

    if (pde) {
        const start = pde.dataOffset;
        const first20 = Array.from(byteArray.slice(start, start + 20));
        console.log('First 20 bytes:', first20.map(b => b.toString(16).padStart(2, '0')).join(' '));
    }
} catch (e) {
    console.error('Error:', e.message, e.stack);
}
