import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save a new user profile to Firebase DB
  const saveUserProfile = async (uid, profile) => {
    const userRef = ref(database, `users/${uid}`);
    await set(userRef, {
      ...profile,
      createdAt: Date.now(),
      role: 'user'
    });
    return profile;
  };

  // Fetch user data from Realtime Database
  const fetchUserData = async (uid, fallbackProfile = null) => {
    try {
      const userRef = ref(database, `users/${uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);
        return data;
      } else if (fallbackProfile) {
        // Auto-create profile for Google sign-in users
        await saveUserProfile(uid, fallbackProfile);
        setUserData(fallbackProfile);
        return fallbackProfile;
      } else {
        setError('User profile not found.');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user profile');
      return null;
    }
  };

  // Register with email, password, and name
  const register = async (email, password, name) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const profile = { email, name, uid: result.user.uid };
      await saveUserProfile(result.user.uid, profile);
      setUserData(profile);
      return result;
    } catch (err) {
      console.error('Register error:', err);
      let msg = 'Registration failed';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered';
      else if (err.code === 'auth/weak-password') msg = 'Password must be at least 6 characters';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
      setError(msg);
      throw new Error(msg);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchUserData(result.user.uid);
      return result;
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Login failed';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email';
      else if (err.code === 'auth/wrong-password') msg = 'Incorrect password';
      else if (err.code === 'auth/invalid-credential') msg = 'Invalid email or password';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Try again later';
      setError(msg);
      throw new Error(msg);
    }
  };

  // Login with Google — auto-creates profile if first time
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { uid, email, displayName, photoURL } = result.user;
      const fallback = { email, name: displayName || email, photoURL: photoURL || null, uid };
      await fetchUserData(uid, fallback);
      return result;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google sign-in failed');
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
