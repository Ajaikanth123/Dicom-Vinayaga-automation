import fs from 'fs';
import { dicomToJpeg } from './services/dicomProcessor.js';

async function testJpeg() {
    try {
        const buf = fs.readFileSync('slice_0576.dcm');
        console.log('Testing dicomToJpeg...');
        const jpeg = await dicomToJpeg(buf);
        console.log('SUCCESS! output size:', jpeg.length);
    } catch(e) {
        console.log('CRASHED!', e);
    }
}
testJpeg();
