/**
 * Script to add users to Firebase Realtime Database
 * 
 * Prerequisites:
 * 1. Make sure you're in the medical-referral-system folder
 * 2. Firebase is already configured in your project
 * 
 * Run: node ../add-users-to-firebase.js
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration (from your .env file)
const firebaseConfig = {
  apiKey: "AIzaSyDqKKLN_zzqLqxqxqxqxqxqxqxqxqxqxqx", // Replace with your actual API key
  authDomain: "nice4-d7886.firebaseapp.com",
  databaseURL: "https://nice4-d7886-default-rtdb.firebaseio.com",
  projectId: "nice4-d7886",
  storageBucket: "nice4-d7886.firebasestorage.app",
  messagingSenderId: "59642964164",
  appId: "1:59642964164:web:xxxxxxxxxxxxx" // Replace with your actual app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Users to add
const users = [
  {
    uid: 'AC2pyfRushhIrWsk4FUQfRIboJc2',
    email: '3danbudentalscansramnadu@gmail.com',
    password: 'Anbu@9360421853',
    data: {
      email: '3danbudentalscansramnadu@gmail.com',
      name: 'ANBU Ramanathapuram',
      role: 'branch-user',
      assignedBranch: 'ramanathapuram',
      branchName: 'ANBU Ramanathapuram',
      branchDisplayName: 'Ramanathapuram',
      createdAt: new Date().toISOString()
    }
  },
  {
    uid: '9saCUKmPqNR8bfnFhGGj6htfWoP2',
    email: '3danbuscanshosur@gmail.com',
    password: 'Anbu@9345845378',
    data: {
      email: '3danbuscanshosur@gmail.com',
      name: 'ANBU Hosur',
      role: 'branch-user',
      assignedBranch: 'hosur',
      branchName: 'ANBU Hosur',
      branchDisplayName: 'Hosur',
      createdAt: new Date().toISOString()
    }
  }
];

// Admin user (will be created in Authentication, then added to database)
const adminUser = {
  email: 'anbudentalscans@gmail.com',
  password: 'Anbu@Salem2024', // Change this to your preferred password
  data: {
    email: 'anbudentalscans@gmail.com',
    name: 'Admin User',
    role: 'admin',
    isAdmin: true,
    canSelectBranches: true,
    createdAt: new Date().toISOString()
  }
};

async function addUsersToDatabase() {
  console.log('🚀 Starting to add users to Firebase...\n');

  try {
    // Add existing users (Ramanathapuram and Hosur)
    for (const user of users) {
      console.log(`📝 Adding ${user.data.name} to database...`);
      const userRef = ref(database, `users/${user.uid}`);
      
      // Check if user already exists
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        console.log(`   ⚠️  User already exists, updating...`);
      }
      
      await set(userRef, user.data);
      console.log(`   ✅ ${user.data.name} added successfully!\n`);
    }

    // Create admin user in Authentication
    console.log(`📝 Creating admin user in Authentication...`);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminUser.email,
        adminUser.password
      );
      
      const adminUid = userCredential.user.uid;
      console.log(`   ✅ Admin user created with UID: ${adminUid}\n`);

      // Add admin user to database
      console.log(`📝 Adding admin user to database...`);
      const adminRef = ref(database, `users/${adminUid}`);
      await set(adminRef, adminUser.data);
      console.log(`   ✅ Admin user added to database!\n`);

    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        console.log(`   ⚠️  Admin user already exists in Authentication`);
        console.log(`   ℹ️  You need to manually get the UID from Firebase Console`);
        console.log(`   ℹ️  Then add to database with that UID\n`);
      } else {
        throw authError;
      }
    }

    console.log('✅ All users processed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Ramanathapuram user: ✅');
    console.log('   - Hosur user: ✅');
    console.log('   - Admin user: Check above for status');
    console.log('\n🎉 Done! You can now test the login system.');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error adding users:', error);
    console.error('\nError details:', error.message);
    process.exit(1);
  }
}

// Run the script
addUsersToDatabase();
