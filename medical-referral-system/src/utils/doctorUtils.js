// Doctor Management Utilities
// Storage key for doctors list
const DOCTORS_STORAGE_KEY = 'anbu_doctors';

/**
 * Generate unique doctor ID
 */
export const generateDoctorId = (doctorName, doctorEmail) => {
  const cleanName = doctorName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `DR-${cleanName}-${timestamp}`;
};

/**
 * Get all doctors from localStorage
 */
export const getDoctorsFromStorage = () => {
  try {
    const stored = localStorage.getItem(DOCTORS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading doctors:', error);
  }
  return [];
};

/**
 * Save doctors to localStorage
 */
export const saveDoctorsToStorage = (doctors) => {
  try {
    localStorage.setItem(DOCTORS_STORAGE_KEY, JSON.stringify(doctors));
    return true;
  } catch (error) {
    console.error('Error saving doctors:', error);
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded. Please clear some data.');
    }
    return false;
  }
};

/**
 * Check if doctor exists by email or phone
 * Returns the existing doctor if found, null otherwise
 */
export const findDoctorByEmailOrPhone = (email, phone) => {
  const doctors = getDoctorsFromStorage();
  
  // Normalize for comparison
  const normalizedEmail = email?.toLowerCase().trim();
  const normalizedPhone = phone?.replace(/\D/g, '');
  
  return doctors.find(doctor => {
    const doctorEmail = doctor.doctorEmail?.toLowerCase().trim();
    const doctorPhone = doctor.doctorPhone?.replace(/\D/g, '');
    
    // Match if either email OR phone matches
    return (normalizedEmail && doctorEmail === normalizedEmail) ||
           (normalizedPhone && doctorPhone === normalizedPhone);
  }) || null;
};

/**
 * Add new doctor to storage
 * Returns the created doctor object or null if duplicate
 */
export const addDoctor = (doctorData) => {
  const doctors = getDoctorsFromStorage();
  
  // Check for duplicates
  const existing = findDoctorByEmailOrPhone(doctorData.doctorEmail, doctorData.doctorPhone);
  if (existing) {
    console.log('Doctor already exists:', existing.id);
    return null; // Duplicate found
  }
  
  const newDoctor = {
    id: generateDoctorId(doctorData.doctorName, doctorData.doctorEmail),
    doctorName: doctorData.doctorName,
    doctorPhone: doctorData.doctorPhone,
    doctorEmail: doctorData.doctorEmail,
    clinicName: doctorData.clinicName || '',
    clinicPhone: doctorData.clinicPhone || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  doctors.push(newDoctor);
  saveDoctorsToStorage(doctors);
  
  console.log('Doctor added:', newDoctor.id);
  return newDoctor;
};

/**
 * Update existing doctor
 */
export const updateDoctor = (doctorId, doctorData) => {
  const doctors = getDoctorsFromStorage();
  const index = doctors.findIndex(d => d.id === doctorId);
  
  if (index === -1) {
    console.error('Doctor not found:', doctorId);
    return false;
  }
  
  // Check if email/phone conflicts with another doctor
  const existing = findDoctorByEmailOrPhone(doctorData.doctorEmail, doctorData.doctorPhone);
  if (existing && existing.id !== doctorId) {
    console.error('Email or phone already used by another doctor:', existing.id);
    return false;
  }
  
  doctors[index] = {
    ...doctors[index],
    doctorName: doctorData.doctorName,
    doctorPhone: doctorData.doctorPhone,
    doctorEmail: doctorData.doctorEmail,
    clinicName: doctorData.clinicName || '',
    clinicPhone: doctorData.clinicPhone || '',
    updatedAt: new Date().toISOString()
  };
  
  saveDoctorsToStorage(doctors);
  console.log('Doctor updated:', doctorId);
  return true;
};

/**
 * Delete doctor
 */
export const deleteDoctor = (doctorId) => {
  const doctors = getDoctorsFromStorage();
  const filtered = doctors.filter(d => d.id !== doctorId);
  
  if (filtered.length === doctors.length) {
    console.error('Doctor not found:', doctorId);
    return false;
  }
  
  saveDoctorsToStorage(filtered);
  console.log('Doctor deleted:', doctorId);
  return true;
};

/**
 * Search doctors by name or email (for autocomplete)
 */
export const searchDoctors = (query) => {
  if (!query || query.trim().length === 0) {
    return getDoctorsFromStorage(); // Return all if no query
  }
  
  const doctors = getDoctorsFromStorage();
  const normalizedQuery = query.toLowerCase().trim();
  
  return doctors.filter(doctor => {
    const name = doctor.doctorName?.toLowerCase() || '';
    const email = doctor.doctorEmail?.toLowerCase() || '';
    
    return name.includes(normalizedQuery) || email.includes(normalizedQuery);
  });
};

/**
 * Auto-add doctor from form submission (reverse sync)
 * Only adds if doctor doesn't exist
 */
export const autoAddDoctorFromForm = (doctorData) => {
  // Validate required fields
  if (!doctorData.doctorName || !doctorData.doctorPhone || !doctorData.doctorEmail) {
    console.log('Incomplete doctor data, skipping auto-add');
    return null;
  }
  
  // Check if already exists
  const existing = findDoctorByEmailOrPhone(doctorData.doctorEmail, doctorData.doctorPhone);
  if (existing) {
    console.log('Doctor already exists, skipping auto-add:', existing.id);
    return existing;
  }
  
  // Add new doctor
  const newDoctor = addDoctor(doctorData);
  if (newDoctor) {
    console.log('Auto-added doctor from form:', newDoctor.id);
  }
  
  return newDoctor;
};
