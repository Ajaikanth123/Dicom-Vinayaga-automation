import dicomParser from 'dicom-parser';
import * as jpegLosslessLib from 'jpeg-lossless-decoder-js';
import { downloadFromStorage } from './services/storageService.js';
import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin (needed for storageService)
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (keyPath) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.GCS_BUCKET_NAME
        });
    }
}

async function testDecode() {
    try {
        console.log("Downloading test DICOM...");
        const buf = await downloadFromStorage("dicom/ramanathapuram/9d514bf1-16ce-4a54-8ee8-403d27a83249/slice_0001.dcm");
        const byteArray = new Uint8Array(buf);
        const ds = dicomParser.parseDicom(byteArray);

        const pde = ds.elements.x7fe00010;
        const rows = ds.uint16('x00280010');
        const cols = ds.uint16('x00280011');
        const bitsAllocated = ds.uint16('x00280100');

        if (pde && pde.encapsulatedPixelData && pde.fragments && pde.fragments.length > 0) {
            console.log("Encapsulated data found");

            // Extract the first frame's compressed data correctly using dicomParser
            const jpegData = dicomParser.readEncapsulatedImageFrame(ds, pde, 0);

            console.log("JPEG fragment size:", jpegData.length);
            console.log("First bytes:", Array.from(jpegData.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));

            // Try to instantiate decoder
            const decoder = new jpegLosslessLib.Decoder();

            console.log("Decoding...");
            const decoded = decoder.decode(jpegData.buffer, jpegData.byteOffset, jpegData.length);

            if (decoded) {
                console.log("Decoded type:", decoded.constructor.name);
                console.log("Decoded byteLength:", decoded.byteLength);
                console.log("Decoded length:", decoded.length);
            } else {
                console.log("DECODED IS UNDEFINED!");
            }
        } else {
            console.log("No encapsulated data");
        }
    } catch (e) {
        console.error("ERROR MESSAGE:", e.message);
        if (e.stack) console.error(e.stack);
    }
    process.exit(0);
}
testDecode();
