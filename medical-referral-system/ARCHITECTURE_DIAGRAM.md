# 🏗️ System Architecture Diagram

## Complete DICOM Cloud Viewer System

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCAN CENTER                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Web Interface (Your Current System)                          │  │
│  │  - Upload DICOM ZIP (500MB)                                   │  │
│  │  - Upload PDF Report                                          │  │
│  │  - Enter Doctor/Patient Details                              │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FIREBASE STORAGE                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  /dicom/{branchId}/{caseId}/original.zip                     │  │
│  │  /reports/{branchId}/{caseId}/report.pdf                     │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              BACKEND SERVER (Google Cloud Run)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  1. Extract ZIP                                               │  │
│  │  2. Parse DICOM files                                         │  │
│  │  3. Extract metadata                                          │  │
│  │  4. Generate thumbnails (256x256)                            │  │
│  │  5. Create preview images (512x512)                          │  │
│  │  6. Generate tile pyramid (256x256 tiles)                    │  │
│  │  7. Convert to WebP format                                   │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              GOOGLE CLOUD STORAGE (CDN)                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  /processed/{caseId}/                                         │  │
│  │    ├── metadata.json                                          │  │
│  │    ├── thumbnails/                                            │  │
│  │    │   ├── slice_001.webp                                     │  │
│  │    │   ├── slice_002.webp                                     │  │
│  │    │   └── ...                                                │  │
│  │    ├── previews/                                              │  │
│  │    │   ├── slice_001.webp                                     │  │
│  │    │   └── ...                                                │  │
│  │    └── tiles/                                                 │  │
│  │        ├── slice_001/                                         │  │
│  │        │   ├── 0_0.webp                                       │  │
│  │        │   ├── 0_1.webp                                       │  │
│  │        │   └── ...                                            │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              FIREBASE REALTIME DATABASE                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  /forms/{branchId}/{caseId}                                   │  │
│  │    ├── patient: {...}                                         │  │
│  │    ├── doctor: {...}                                          │  │
│  │    ├── dicomData:                                             │  │
│  │    │   ├── studyId                                            │  │
│  │    │   ├── sliceCount                                         │  │
│  │    │   ├── viewerUrl                                          │  │
│  │    │   └── processedAt                                        │  │
│  │    └── caseTracking:                                          │  │
│  │        ├── accessToken: "abc123xyz"                           │  │
│  │        └── secureLink: "https://..."                          │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              WHATSAPP BUSINESS API                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Send to Doctor:                                              │  │
│  │    "New scan ready: [View Link]"                             │  │
│  │                                                               │  │
│  │  Send to Patient:                                             │  │
│  │    "Scan complete. Doctor will contact you soon."            │  │
│  └────────────────┬─────────────────────────────────────────────┘  │
└────────────────────┼────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   DOCTOR     │          │   PATIENT    │
│   📱 Mobile  │          │   📱 Mobile  │
└──────┬───────┘          └──────────────┘
       │
       │ Clicks WhatsApp Link
       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              DICOM VIEWER (Firebase Hosting)                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  React App with Cornerstone.js                                │  │
│  │                                                               │  │
│  │  1. Validate access token                                    │  │
│  │  2. Load metadata (10KB)                                     │  │
│  │  3. Show thumbnail grid (500KB)                              │  │
│  │  4. Progressive load on interaction                          │  │
│  │                                                               │  │
│  │  Features:                                                    │  │
│  │  - Touch zoom/pan                                            │  │
│  │  - Slice navigation                                          │  │
│  │  - Windowing controls                                        │  │
│  │  - Measurements                                              │  │
│  │  - 3D rendering                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```


---

## Data Flow Timeline

```
Time    Action                              Data Size    Location
─────────────────────────────────────────────────────────────────────
0:00    User uploads DICOM ZIP              500 MB       Browser
0:05    File reaches Firebase Storage       500 MB       Cloud
0:06    Backend triggered                   -            Cloud Run
0:10    ZIP extracted                       500 MB       Memory
0:15    DICOM files parsed                  -            Memory
0:20    Thumbnails generated                2 MB         Memory
0:25    Previews generated                  10 MB        Memory
0:30    Tiles generated                     50 MB        Memory
0:35    Upload to Cloud Storage             62 MB        Cloud
0:40    Database updated                    5 KB         Firebase
0:41    WhatsApp sent to doctor             -            API
0:42    WhatsApp sent to patient            -            API
0:45    Processing complete                 -            -

        Doctor clicks link                  -            Mobile
0:46    Viewer loads metadata               10 KB        Mobile
0:47    Thumbnails load                     500 KB       Mobile
0:48    First preview loads                 100 KB       Mobile
0:49    Ready to view!                      610 KB       Mobile
```

---

## Mobile Viewing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Doctor's Mobile Browser                                         │
│                                                                  │
│  Step 1: Click WhatsApp Link                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  https://dicom.anbu-dental.com/case/abc123xyz          │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  Step 2: Validate Token (< 1 second)                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ✓ Token valid                                          │    │
│  │  ✓ Case found                                           │    │
│  │  ✓ Access granted                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  Step 3: Load Metadata (< 1 second)                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Patient: John Doe                                      │    │
│  │  Study Date: 2026-01-30                                │    │
│  │  Slices: 150                                            │    │
│  │  Modality: CT                                           │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  Step 4: Load Thumbnail Grid (2 seconds)                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  [img] [img] [img] [img] [img]                         │    │
│  │  [img] [img] [img] [img] [img]                         │    │
│  │  [img] [img] [img] [img] [img]                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  Step 5: User Selects Slice                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │         [Preview Image Loads - 512x512]                │    │
│  │                                                         │    │
│  │  [Zoom] [Pan] [Window] [Measure]                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  Step 6: User Zooms In                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │    [High-res tiles load progressively]                 │    │
│  │                                                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Total Data Used: 10-50 MB (vs 500 MB original)                │
│  Time to First View: 3-5 seconds                               │
│  Smooth Navigation: ✓                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌──────────────────┐
│  CreateForm.jsx  │  (Your existing upload interface)
└────────┬─────────┘
         │
         │ 1. User uploads DICOM ZIP + PDF
         ▼
┌──────────────────┐
│ FormContext.jsx  │  (State management)
└────────┬─────────┘
         │
         │ 2. Call uploadDicomFile()
         ▼
┌──────────────────┐
│    api.js        │  (API service)
└────────┬─────────┘
         │
         │ 3. POST to backend
         ▼
┌──────────────────┐
│  Backend Server  │  (Cloud Run)
│                  │
│  ┌────────────┐  │
│  │ Upload API │  │  4. Receive file
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │  Storage   │  │  5. Save to Firebase Storage
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │ Processor  │  │  6. Extract & process
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │  Notifier  │  │  7. Send WhatsApp
│  └────────────┘  │
└────────┬─────────┘
         │
         │ 8. Update database
         ▼
┌──────────────────┐
│ Firebase DB      │
└────────┬─────────┘
         │
         │ 9. Real-time update
         ▼
┌──────────────────┐
│  ManageForms.jsx │  (Shows updated status)
└──────────────────┘

         │
         │ 10. Doctor clicks WhatsApp link
         ▼
┌──────────────────┐
│ DicomViewer.jsx  │  (New component to create)
│                  │
│  ┌────────────┐  │
│  │ Validate   │  │  11. Check token
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │ Load Meta  │  │  12. Get case data
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │ Cornerstone│  │  13. Render DICOM
│  └────────────┘  │
└──────────────────┘
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Access Control Layers                                       │
└─────────────────────────────────────────────────────────────┘

Layer 1: Upload (Scan Center)
┌──────────────────────────────────────┐
│  Firebase Authentication Required    │
│  - Must be logged in                 │
│  - Must have branch access           │
└──────────────────────────────────────┘

Layer 2: Storage (Original Files)
┌──────────────────────────────────────┐
│  Firebase Storage Rules              │
│  - Auth required for read/write      │
│  - Branch-based access control       │
└──────────────────────────────────────┘

Layer 3: Processing (Backend)
┌──────────────────────────────────────┐
│  Service Account Authentication      │
│  - Backend has admin access          │
│  - Validates requests                │
└──────────────────────────────────────┘

Layer 4: Viewer (Doctor/Patient)
┌──────────────────────────────────────┐
│  Token-Based Access                  │
│  - Unique 12-char token per case     │
│  - No login required                 │
│  - Token validated on each request   │
│  - Optional: Expiration (30 days)    │
└──────────────────────────────────────┘

Layer 5: Processed Files (CDN)
┌──────────────────────────────────────┐
│  Public Read with Token              │
│  - Files served via CDN              │
│  - Token in URL or header            │
│  - Fast delivery                     │
└──────────────────────────────────────┘
```

