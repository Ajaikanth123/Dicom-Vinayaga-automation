import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Tooth3DViewer from '../components/Tooth3DViewer';
import './Login.css';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, loginWithGoogle, register, error: authError } = useAuth();
  const navigate = useNavigate();

  const switchMode = (newMode) => {
    setLocalError('');
    setSuccessMsg('');
    setMode(newMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (regPassword !== regConfirm) {
      setLocalError('Passwords do not match');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      await register(regEmail, regPassword, regName);
      navigate('/');
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="login-container">
      {/* Left Brand Panel */}
      <div className="login-brand-panel">
        <div className="brand-shape"></div>
        <div className="brand-shape"></div>
        <div className="brand-shape"></div>
        <div className="brand-shape"></div>
        <motion.div
          className="brand-content"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="brand-logo-wrapper">
            <svg viewBox="0 0 24 24">
              <path fill="white" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
            </svg>
          </div>
          <h2 className="brand-title">Vinayaga Automation</h2>
          <p className="brand-subtitle">Advanced CBCT imaging and diagnostic referral management platform</p>
          <Tooth3DViewer />
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel">
        <div className="login-background"></div>

        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div
              key="login"
              className="login-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="login-header">
                <div className="logo-container">
                  <div className="logo-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                      <path fill="white" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                    </svg>
                  </div>
                </div>
                <h1>Welcome Back</h1>
                <p>Sign in to your diagnostic portal</p>
              </div>

              {displayError && (
                <motion.div className="error-message" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  ⚠️ {displayError}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="login-form">
                <div className="input-group">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="Email Address" />
                </div>
                <div className="input-group">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" placeholder="Password" />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                <motion.button type="submit" className="login-button" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  {isLoading ? <span className="loading-spinner"></span> : <><span>Sign In</span> <span className="arrow">→</span></>}
                </motion.button>

                <div className="divider"><span>or</span></div>

                <motion.button type="button" className="google-button" onClick={handleGoogleSignIn} disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </motion.button>

                <motion.button type="button" className="create-account-button" onClick={() => switchMode('register')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  ✨ Create Account
                </motion.button>
              </form>

              <div className="login-footer">
                <p>© 2026 Vinayaga Automation</p>
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="register"
              className="login-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="login-header">
                <div className="logo-container">
                  <div className="logo-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                      <path fill="white" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                    </svg>
                  </div>
                </div>
                <h1>Create Account</h1>
                <p>Join the diagnostic portal</p>
              </div>

              {displayError && (
                <motion.div className="error-message" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  ⚠️ {displayError}
                </motion.div>
              )}

              {successMsg && (
                <motion.div className="success-message" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  ✅ {successMsg}
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="login-form">
                <div className="input-group">
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required className="input-field" placeholder="Full Name" />
                </div>
                <div className="input-group">
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className="input-field" placeholder="Email Address" />
                </div>
                <div className="input-group">
                  <input type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="input-field" placeholder="Password (min 6 characters)" />
                  <button type="button" className="password-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                    {showRegPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <div className="input-group">
                  <input type={showRegPassword ? 'text' : 'password'} value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} required className="input-field" placeholder="Confirm Password" />
                </div>

                <motion.button type="submit" className="login-button" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  {isLoading ? <span className="loading-spinner"></span> : <><span>Create Account</span> <span className="arrow">→</span></>}
                </motion.button>

                <div className="divider"><span>or</span></div>

                <motion.button type="button" className="google-button" onClick={handleGoogleSignIn} disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </motion.button>

                <button type="button" className="back-to-login" onClick={() => switchMode('login')}>
                  ← Back to Sign In
                </button>
              </form>

              <div className="login-footer">
                <p>© 2026 Vinayaga Automation</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Login;
