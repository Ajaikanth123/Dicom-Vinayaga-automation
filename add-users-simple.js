/**
 * Simple script to add users to Firebase Realtime Database
 * This only adds to database, not Authentication
 * 
 * Run from project root: node add-users-simple.js
 */

const https = require('https');

// Your Firebase Realtime Database URL
const DATABASE_URL = 'https://nice4-d7886-default-rtdb.firebaseio.com';

// Users data to add
const usersData = {
  'AC2pyfRushhIrWsk4FUQfRIboJc2': {
    email: '3danbudentalscansramnadu@gmail.com',
    name: 'ANBU Ramanathapuram',
    role: 'branch-user',
    assignedBranch: 'ramanathapuram',
    branchName: 'ANBU Ramanathapuram',
    branchDisplayName: 'Ramanathapuram',
    createdAt: new Date().toISOString()
  },
  '9saCUKmPqNR8bfnFhGGj6htfWoP2': {
    email: '3danbuscanshosur@gmail.com',
    name: 'ANBU Hosur',
    role: 'branch-user',
    assignedBranch: 'hosur',
    branchName: 'ANBU Hosur',
    branchDisplayName: 'Hosur',
    createdAt: new Date().toISOString()
  }
};

// IMPORTANT: Replace this with the actual UID from Firebase Authentication
// After you create the admin user in Firebase Console, copy the UID here
const ADMIN_UID = 'REPLACE_WITH_ADMIN_UID_FROM_FIREBASE_CONSOLE';

// Add admin user data
if (ADMIN_UID !== 'REPLACE_WITH_ADMIN_UID_FROM_FIREBASE_CONSOLE') {
  usersData[ADMIN_UID] = {
    email: 'anbudentalscans@gmail.com',
    name: 'Admin User',
    role: 'admin',
    isAdmin: true,
    canSelectBranches: true,
    createdAt: new Date().toISOString()
  };
}

function addUsersToFirebase() {
  console.log('🚀 Adding users to Firebase Realtime Database...\n');

  const data = JSON.stringify(usersData);
  
  const options = {
    hostname: 'nice4-d7886-default-rtdb.firebaseio.com',
    path: '/users.json',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Users added successfully!\n');
        console.log('📋 Added users:');
        console.log('   - Ramanathapuram (UID: AC2pyfRushhIrWsk4FUQfRIboJc2)');
        console.log('   - Hosur (UID: 9saCUKmPqNR8bfnFhGGj6htfWoP2)');
        
        if (ADMIN_UID !== 'REPLACE_WITH_ADMIN_UID_FROM_FIREBASE_CONSOLE') {
          console.log(`   - Admin (UID: ${ADMIN_UID})`);
        } else {
          console.log('\n⚠️  Admin user NOT added - Please:');
          console.log('   1. Create admin user in Firebase Console Authentication');
          console.log('   2. Copy the UID');
          console.log('   3. Replace ADMIN_UID in this script');
          console.log('   4. Run this script again');
        }
        
        console.log('\n🎉 Done! Check Firebase Console to verify.');
      } else {
        console.error('❌ Error:', res.statusCode, responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
  });

  req.write(data);
  req.end();
}

// Run the script
addUsersToFirebase();
