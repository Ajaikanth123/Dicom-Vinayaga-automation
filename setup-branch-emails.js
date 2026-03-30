/**
 * Setup Branch-Specific Email Configurations in Firebase
 * Run this script to initialize email settings for Ramanathapuram and Hosur branches
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./dicom-backend/serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nice4-d7886-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

// Branch-specific email configurations
const branchEmailSettings = {
  'ramanathapuram': {
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: '3danbudentalscansramnadu2@gmail.com',
        pass: 'jvrp wdhd umxc azvm'
      }
    },
    organization: {
      name: 'C Scans Kovai - Ramanathapuram',
      email: '3danbudentalscansramnadu2@gmail.com',
      phone: '+919360421853',
      address: 'Ramanathapuram Branch',
      supportEmail: '3danbudentalscansramnadu2@gmail.com',
      supportPhone: '+919360421853',
      logoUrl: ''
    }
  },
  'hosur': {
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: '3danbuscanshosur2@gmail.com',
        pass: 'hjlq hysb juet ikeq'
      }
    },
    organization: {
      name: 'C Scans Kovai - Hosur',
      email: '3danbuscanshosur2@gmail.com',
      phone: '+919345845378',
      address: 'Hosur Branch',
      supportEmail: '3danbuscanshosur2@gmail.com',
      supportPhone: '+919345845378',
      logoUrl: ''
    }
  }
};

async function setupBranchEmails() {
  try {
    console.log('🚀 Setting up branch-specific email configurations...\n');

    for (const [branchId, settings] of Object.entries(branchEmailSettings)) {
      console.log(`📧 Configuring ${branchId} branch...`);
      
      const branchRef = db.ref(`emailSettings/branches/${branchId}`);
      await branchRef.set(settings);
      
      console.log(`✅ ${branchId} branch email settings saved`);
      console.log(`   Email: ${settings.smtp.auth.user}`);
      console.log(`   Organization: ${settings.organization.name}\n`);
    }

    console.log('✅ All branch email configurations have been set up successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Ramanathapuram: 3danbudentalscansramnadu2@gmail.com');
    console.log('   - Hosur: 3danbuscanshosur2@gmail.com');
    console.log('   - Salem branches will use default/global settings\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up branch emails:', error);
    process.exit(1);
  }
}

setupBranchEmails();
