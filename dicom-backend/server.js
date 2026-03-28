// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import uploadRoutes from './routes/upload.js';
import viewerRoutes from './routes/viewer.js';
import signedUrlRoutes from './routes/signedUrl.js';
import emailRoutes from './routes/email.js';
import whatsappRoutes from './routes/whatsapp.js';
import crossSectionRoutes from './routes/crossSection.js';

// Initialize Firebase Admin (only for Realtime Database)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
} else {
  // For local development, use service account key file
  try {
    const serviceAccountKey = await import('./serviceAccountKey.json', {
      assert: { type: 'json' }
    });
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey.default),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  } catch (error) {
    console.error('⚠️  Firebase Admin initialization failed:', error.message);
    console.log('📝 Please add serviceAccountKey.json or set FIREBASE_SERVICE_ACCOUNT env variable');
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - CRITICAL for Cloud Run
const allowedOrigins = [
  'https://cscanskovai-44ebc.web.app',
  'https://cscanskovai-44ebc.firebaseapp.com',
  'https://frontend-517537048458.asia-south1.run.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server & tools like curl/postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️  CORS blocked origin: ${origin}`);
    return callback(new Error('CORS not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ✅ HANDLE PREFLIGHT (CRITICAL) - Without this, upload always fails on Cloud Run
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DICOM Backend Server',
    version: '1.0.0',
    storage: 'Google Cloud Storage',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/upload', uploadRoutes);
app.use('/viewer', crossSectionRoutes); // Must go before viewerRoutes to prevent /:caseId interception
app.use('/viewer', viewerRoutes);
app.use('/signed-url', signedUrlRoutes);
app.use('/email', emailRoutes);
app.use('/whatsapp', whatsappRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DICOM Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📦 Storage: Google Cloud Storage (${process.env.GCS_BUCKET_NAME})`);
  console.log(`💾 Database: Firebase Realtime Database`);
});

export default app;
