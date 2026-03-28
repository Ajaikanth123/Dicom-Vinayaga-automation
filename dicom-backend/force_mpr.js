import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import { generateMPR } from './services/mprService.js';

// Initialize Firebase
const serviceAccountKey = await import('./serviceAccountKey.json', { assert: { type: 'json' } });
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey.default),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

async function run() {
    const branchId = 'ramanathapuram';
    const caseId = '70d2945f-a3a0-4b73-a36a-0d5884bfbfd2';
    console.log(`🚀 Starting manual MPR generation for case ${caseId}`);

    try {
        await generateMPR(branchId, caseId);
        console.log('✅ Generation complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed:', err);
        process.exit(1);
    }
}

run();
