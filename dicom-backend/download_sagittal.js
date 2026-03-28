import fs from 'fs';
import { downloadFromStorage } from './services/storageService.js';

async function test() {
    try {
        console.log("Downloading sagittal slice 136...");
        const buf = await downloadFromStorage('dicom/ramanathapuram/9d514bf1-16ce-4a54-8ee8-403d27a83249/mpr/sagittal/slice_0136.jpg');
        fs.writeFileSync('sagittal_slice_0136.jpg', buf);
        console.log("Saved sagittal_slice_0136.jpg");
    } catch (e) { console.error(e); }
}
test();
