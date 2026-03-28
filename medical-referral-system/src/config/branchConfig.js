// Branch configuration for ANBU Dental
// Maps user UIDs and emails to their respective branches

export const BRANCHES = {
  SALEM_GUGAI: {
    id: 'salem-gugai',
    name: 'ANBU Salem Gugai',
    displayName: 'Salem Gugai'
  },
  SALEM_LIC: {
    id: 'salem-lic',
    name: 'ANBU Salem LIC',
    displayName: 'Salem LIC'
  },
  RAMANATHAPURAM: {
    id: 'ramanathapuram',
    name: 'ANBU Ramanathapuram',
    email: '3danbudentalscansramnadu@gmail.com',
    uid: 'AC2pyfRushhIrWsk4FUQfRIboJc2',
    phone: '+919360421853',
    displayName: 'Ramanathapuram'
  },
  HOSUR: {
    id: 'hosur',
    name: 'ANBU Hosur',
    email: '3danbuscanshosur@gmail.com',
    uid: '9saCUKmPqNR8bfnFhGGj6htfWoP2',
    phone: '+919345845378',
    displayName: 'Hosur'
  }
};

// Admin user who can select between Salem branches
export const ADMIN_USER = {
  email: 'anbudentalscans@gmail.com',
  canSelectBranches: [BRANCHES.SALEM_GUGAI.id, BRANCHES.SALEM_LIC.id]
};

// Map UID to branch (for auto-routing)
export const getBranchByUID = (uid) => {
  if (uid === BRANCHES.RAMANATHAPURAM.uid) {
    return BRANCHES.RAMANATHAPURAM;
  }
  if (uid === BRANCHES.HOSUR.uid) {
    return BRANCHES.HOSUR;
  }
  return null;
};

// Map email to branch (for auto-routing)
export const getBranchByEmail = (email) => {
  const normalizedEmail = email?.toLowerCase().trim();
  
  if (normalizedEmail === BRANCHES.RAMANATHAPURAM.email.toLowerCase()) {
    return BRANCHES.RAMANATHAPURAM;
  }
  if (normalizedEmail === BRANCHES.HOSUR.email.toLowerCase()) {
    return BRANCHES.HOSUR;
  }
  return null;
};

// Check if user is admin (can select branches)
export const isAdminUser = (email) => {
  const normalizedEmail = email?.toLowerCase().trim();
  return normalizedEmail === ADMIN_USER.email.toLowerCase();
};

// Get branches available for admin to select
export const getAdminBranches = () => {
  return [BRANCHES.SALEM_GUGAI, BRANCHES.SALEM_LIC];
};

// Get all branches as array
export const getAllBranches = () => {
  return Object.values(BRANCHES);
};

// Check if user belongs to a branch
export const userBelongsToBranch = (user, branchId) => {
  if (!user) return false;
  
  const branch = getBranchByUID(user.uid) || getBranchByEmail(user.email);
  return branch?.id === branchId;
};
