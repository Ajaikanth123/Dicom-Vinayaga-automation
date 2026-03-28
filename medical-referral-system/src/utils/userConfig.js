// User configuration and branch assignment

// Admin users who can access all branches
export const ADMIN_EMAILS = [
  'admin@anbu-dental.com',
  'anbudentalscans@gmail.com' // Add admin emails here
];

// Branch assignment mapping: email -> branchId
export const BRANCH_ASSIGNMENTS = {
  'anbudentalscans@gmail.com': 'ANBU-SLM-LIC',
  '3danbudentalscansramnadu@gmail.com': 'ANBU-RMD',
  '3danbuscanshosur@gmail.com': 'ANBU-HSR',
  'salemgugai@anbu-dental.com': 'ANBU-SLM-GUG'
};

/**
 * Check if user is admin
 * @param {string} email - User email
 * @returns {boolean}
 */
export const isAdmin = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Get assigned branch for user
 * @param {string} email - User email
 * @returns {string|null} - Branch ID or null if not assigned
 */
export const getAssignedBranch = (email) => {
  if (!email) return null;
  return BRANCH_ASSIGNMENTS[email.toLowerCase()] || null;
};

/**
 * Get login provider display name
 * @param {object} user - Firebase user object
 * @returns {string}
 */
export const getLoginProvider = (user) => {
  if (!user) return 'Unknown';
  
  // Check providerData for the actual provider
  if (user.providerData && user.providerData.length > 0) {
    const providerId = user.providerData[0].providerId;
    
    if (providerId === 'google.com') {
      return 'Google';
    } else if (providerId === 'password') {
      return 'Email';
    }
  }
  
  return 'Email';
};

/**
 * Get user display info
 * @param {object} user - Firebase user object
 * @returns {object}
 */
export const getUserInfo = (user) => {
  if (!user) return null;
  
  return {
    email: user.email,
    displayName: user.displayName || user.email,
    photoURL: user.photoURL,
    provider: getLoginProvider(user),
    isAdmin: isAdmin(user.email),
    assignedBranch: getAssignedBranch(user.email)
  };
};
