import { ref, set, get, update, remove, onValue, off, push } from 'firebase/database';
import { database } from '../../firebase';

/**
 * Firebase Realtime Database Service
 * Handles all form CRUD operations
 */

// Save a form to Firebase
export const saveFormToFirebase = async (branchId, formId, formData) => {
  try {
    const formRef = ref(database, `forms/${branchId}/${formId}`);
    // Use `update` instead of `set` to merge new user data with concurrent backend metadata (like MPR status)
    await update(formRef, {
      ...formData,
      updatedAt: Date.now()
    });
    console.log(`[Firebase] Form saved/merged: ${branchId}/${formId}`);
    return true;
  } catch (error) {
    console.error('[Firebase] Error saving form:', error);
    throw error;
  }
};

// Get all forms for a branch
export const getFormsFromFirebase = async (branchId) => {
  try {
    const formsRef = ref(database, `forms/${branchId}`);
    const snapshot = await get(formsRef);

    if (snapshot.exists()) {
      const formsData = snapshot.val();
      // Convert object to array
      const formsArray = Object.keys(formsData).map(key => ({
        id: key,
        ...formsData[key]
      }));
      console.log(`[Firebase] Loaded ${formsArray.length} forms from ${branchId}`);
      return formsArray;
    }

    console.log(`[Firebase] No forms found for ${branchId}`);
    return [];
  } catch (error) {
    console.error('[Firebase] Error loading forms:', error);
    return [];
  }
};

// Get a single form
export const getFormFromFirebase = async (branchId, formId) => {
  try {
    const formRef = ref(database, `forms/${branchId}/${formId}`);
    const snapshot = await get(formRef);

    if (snapshot.exists()) {
      return { id: formId, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error('[Firebase] Error loading form:', error);
    return null;
  }
};

// Update a form
export const updateFormInFirebase = async (branchId, formId, updates) => {
  try {
    const formRef = ref(database, `forms/${branchId}/${formId}`);
    await update(formRef, {
      ...updates,
      updatedAt: Date.now()
    });
    console.log(`[Firebase] Form updated: ${branchId}/${formId}`);
    return true;
  } catch (error) {
    console.error('[Firebase] Error updating form:', error);
    throw error;
  }
};

// Delete a form
export const deleteFormFromFirebase = async (branchId, formId) => {
  try {
    const formRef = ref(database, `forms/${branchId}/${formId}`);
    await remove(formRef);
    console.log(`[Firebase] Form deleted: ${branchId}/${formId}`);
    return true;
  } catch (error) {
    console.error('[Firebase] Error deleting form:', error);
    throw error;
  }
};


// Listen to real-time updates for a branch
export const subscribeToForms = (branchId, callback) => {
  const formsRef = ref(database, `forms/${branchId}`);

  const unsubscribe = onValue(formsRef, (snapshot) => {
    if (snapshot.exists()) {
      const formsData = snapshot.val();
      const formsArray = Object.keys(formsData).map(key => ({
        id: key,
        ...formsData[key]
      }));
      callback(formsArray);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('[Firebase] Subscription error:', error);
    callback([]);
  });

  // Return unsubscribe function
  return () => off(formsRef);
};

// Get all forms from all branches (for viewing other branches)
export const getAllBranchForms = async (branchIds) => {
  try {
    const allForms = {};

    for (const branchId of branchIds) {
      const forms = await getFormsFromFirebase(branchId);
      allForms[branchId] = forms;
    }

    return allForms;
  } catch (error) {
    console.error('[Firebase] Error loading all branch forms:', error);
    return {};
  }
};

// Search forms across branches
export const searchForms = async (branchIds, searchTerm) => {
  try {
    const allForms = await getAllBranchForms(branchIds);
    const results = [];

    Object.keys(allForms).forEach(branchId => {
      const branchForms = allForms[branchId].filter(form => {
        const searchLower = searchTerm.toLowerCase();
        return (
          form.patient?.patientName?.toLowerCase().includes(searchLower) ||
          form.patient?.patientId?.toLowerCase().includes(searchLower) ||
          form.doctor?.doctorName?.toLowerCase().includes(searchLower) ||
          form.patient?.phoneNumber?.includes(searchTerm)
        );
      });
      results.push(...branchForms);
    });

    return results;
  } catch (error) {
    console.error('[Firebase] Error searching forms:', error);
    return [];
  }
};

// Migrate localStorage data to Firebase (one-time migration)
export const migrateLocalStorageToFirebase = async (branchId) => {
  try {
    const storageKey = `manageForms_${branchId}`;
    const localData = localStorage.getItem(storageKey);

    if (!localData) {
      console.log(`[Firebase] No localStorage data to migrate for ${branchId}`);
      return { migrated: 0, skipped: 0 };
    }

    const forms = JSON.parse(localData);
    let migrated = 0;
    let skipped = 0;

    for (const form of forms) {
      // Check if form already exists in Firebase
      const existing = await getFormFromFirebase(branchId, form.id);

      if (!existing) {
        await saveFormToFirebase(branchId, form.id, form);
        migrated++;
      } else {
        skipped++;
      }
    }

    console.log(`[Firebase] Migration complete: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped };
  } catch (error) {
    console.error('[Firebase] Migration error:', error);
    throw error;
  }
};
