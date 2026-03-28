import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormContext } from '../../context/FormContext';
import './Layout.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, userData } = useAuth();
  const { currentBranch, getBranchName } = useFormContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.clear();

      // Logout from Firebase
      await logout();

      // Navigate to login
      navigate('/login');
      onClose();

      // Force reload to clear any cached state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <svg viewBox="0 0 24 24" className="logo-icon">
              <path
                fill="currentColor"
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"
              />
            </svg>
            <div className="logo-text">
              <span className="logo-title">Vinayaga Automation</span>
              <span className="logo-subtitle">Diagnostic Center</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/create"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path
                fill="currentColor"
                d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
              />
            </svg>
            <span>Create Form</span>
          </NavLink>

          <NavLink
            to="/manage"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path
                fill="currentColor"
                d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
              />
            </svg>
            <span>Manage Forms</span>
          </NavLink>

          <NavLink
            to="/patients"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path
                fill="currentColor"
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </svg>
            <span>Branch Patients</span>
          </NavLink>

          <NavLink
            to="/doctors"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path
                fill="currentColor"
                d="M14.84 16.26C17.86 16.83 20 18.29 20 20v2H4v-2c0-1.71 2.14-3.17 5.16-3.74L12 21l2.84-4.74zM8 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"
              />
            </svg>
            <span>Manage Doctors</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="nav-icon">
              <path
                fill="currentColor"
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"
              />
            </svg>
            <span>Analytics</span>
          </NavLink>
        </nav>

        <div className="sidebar-user-section">
          {userData && (
            <div className="user-info">
              <div className="user-avatar">
                <svg viewBox="0 0 24 24" className="avatar-icon">
                  <path
                    fill="currentColor"
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
              </div>
              <div className="user-details">
                <span className="user-name">{userData.name || userData.email}</span>
                <span className="user-branch">
                  {userData.isAdmin && currentBranch
                    ? getBranchName(currentBranch)
                    : (userData.branchDisplayName || userData.branchName || 'No Branch')
                  }
                </span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" className="logout-icon">
              <path
                fill="currentColor"
                d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <p>© 2026 Vinayaga Automation</p>
          <p className="version">v1.0.1</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
