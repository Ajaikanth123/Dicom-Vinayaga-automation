import fs from 'fs';
import JSZip from 'jszip';
import dicomParser from 'dicom-parser';
import { dicomToJpeg } from './services/dicomProcessor.js';

async function testDXJpeg() {
    const buf = fs.readFileSync('C:\\Users\\Admin\\Desktop\\DICOM\\MRS M DEEPA 32 F ( DR S J DINESHRAJA) FULL SKULL.zip');
    const zip = await JSZip.loadAsync(buf);
    
    for (const [name, file] of Object.entries(zip.files)) {
        if(file.dir) continue;
        const data = await file.async('nodebuffer');
        
        let localMod = 'Unknown';
        try {
            const ds = dicomParser.parseDicom(new Uint8Array(data));
            localMod = ds.string('x00080060');
        } catch(e){}
        
        if (localMod === 'DX') {
            console.log(`Testing DX File for Jpeg rendering: ${name}`);
            try {
                const jpeg = await dicomToJpeg(data);
                console.log(`SUCCESS! Generated JPEG of size: ${(jpeg.length/1024).toFixed(2)} KB`);
            } catch (err) {
                console.error(`dicomToJpeg CRASHED on the DX file:`, err);
            }
        }
    }
}
testDXJpeg();
