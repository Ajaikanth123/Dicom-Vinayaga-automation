import fs from 'fs';
import { extractPixelData, renderToJpg } from './services/mprService.js';

function applyWindowLevel(value, windowCenter, windowWidth) {
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;
    if (value <= lower) return 0;
    if (value >= upper) return 255;
    return Math.round(((value - lower) / windowWidth) * 255);
}
import { downloadFromStorage } from './services/storageService.js';

async function test() {
    try {
        console.log("Downloading slice...");
        const buf = await downloadFromStorage('dicom/ramanathapuram/9d514bf1-16ce-4a54-8ee8-403d27a83249/files/slice_0150.dcm');
        console.log("Extracting pixel data...");
        const result = extractPixelData(buf);
        if (!result) return console.log("Failed to extract");
        console.log(`Extracted: ${result.columns}x${result.rows}, bits=${result.bitsAllocated}`);

        const wc = 800, ww = 2000;
        const pixelBuffer = new Uint8Array(result.columns * result.rows);
        for (let i = 0; i < result.pixels.length && i < pixelBuffer.length; i++) {
            pixelBuffer[i] = applyWindowLevel(result.pixels[i], wc, ww);
        }

        console.log("Rendering to JPG...");
        const jpgBuf = await renderToJpg(pixelBuffer, result.columns, result.rows);
        fs.writeFileSync('test_single.jpg', jpgBuf);
        console.log('Saved to test_single.jpg');
    } catch (e) {
        console.error(e);
    }
}
test();
