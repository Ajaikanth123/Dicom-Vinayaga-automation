import React, { useState, useEffect } from 'react';
import { getFormsFromFirebase } from '../services/firebaseService';
import './Pages.css';

const STORAGE_KEY = 'anbu_branches';

const getDefaultBranches = () => [
  { id: 'salem-lic', branchName: 'ANBU – Salem (LIC Colony)', city: 'Salem', address: '', phone: '' },
  { id: 'salem-gugai', branchName: 'ANBU – Salem (Gugai)', city: 'Salem', address: '', phone: '' },
  { id: 'ramanathapuram', branchName: 'ANBU – Ramanathapuram', city: 'Ramanathapuram', address: '', phone: '' },
  { id: 'hosur', branchName: 'ANBU – Hosur', city: 'Hosur', address: '', phone: '' },
];

const generateId = (branchName, city) => {
  const cleanName = branchName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
  const cleanCity = city.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
  return `${cleanName}-${cleanCity}-${Date.now().toString(36).toUpperCase()}`;
};

const ManageBranches = () => {
  const [branches, setBranches] = useState([]);
  const [branchCounts, setBranchCounts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showSuccess, setShowSuccess] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    branchName: '',
    city: '',
    address: '',
    phone: ''
  });

  // Load branches from localStorage and counts from Firebase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      let branchList;
      
      if (stored) {
        branchList = JSON.parse(stored);
      } else {
        branchList = getDefaultBranches();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(branchList));
      }
      
      setBranches(branchList);
      
      // Load patient counts from Firebase
      const counts = {};
      for (const branch of branchList) {
        try {
          const forms = await getFormsFromFirebase(branch.id);
          counts[branch.id] = forms.filter(f => !f.isArchived).length;
        } catch (error) {
          console.error(`Error loading forms for ${branch.id}:`, error);
          counts[branch.id] = 0;
        }
      }
      
      setBranchCounts(counts);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Save branches to localStorage
  const saveBranches = (newBranches) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBranches));
    setBranches(newBranches);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingId) {
      // Update existing branch
      const updated = branches.map(b => 
        b.id === editingId ? { ...b, ...formData } : b
      );
      saveBranches(updated);
      setShowSuccess('Branch updated successfully!');
      setEditingId(null);
    } else {
      // Add new branch
      const newBranch = {
        id: generateId(formData.branchName, formData.city),
        ...formData
      };
      saveBranches([...branches, newBranch]);
      setShowSuccess('Branch added successfully!');
    }

    setFormData({ branchName: '', city: '', address: '', phone: '' });
    setTimeout(() => setShowSuccess(''), 3000);
  };

  const handleEdit = (branch) => {
    setEditingId(branch.id);
    setFormData({
      branchName: branch.branchName,
      city: branch.city,
      address: branch.address || '',
      phone: branch.phone || ''
    });
    setErrors({});
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this branch? This cannot be undone.')) {
      const updated = branches.filter(b => b.id !== id);
      saveBranches(updated);
      setShowSuccess('Branch deleted successfully!');
      setTimeout(() => setShowSuccess(''), 3000);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ branchName: '', city: '', address: '', phone: '' });
    setErrors({});
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Manage Branches</h1>
        <p className="page-subtitle">Add, edit, or remove branch locations</p>
      </div>

      {showSuccess && (
        <div className="success-banner" style={{
          background: '#d4edda',
          color: '#155724',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '16px'
        }}>
          ✓ {showSuccess}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="form-section" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#333' }}>
          {editingId ? 'Edit Branch' : 'Add New Branch'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
                Branch Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="e.g., ANBU – Salem Main"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors.branchName ? '2px solid red' : '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.branchName && <span style={{ color: 'red', fontSize: '14px' }}>{errors.branchName}</span>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
                City <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Salem"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: errors.city ? '2px solid red' : '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.city && <span style={{ color: 'red', fontSize: '14px' }}>{errors.city}</span>}
            </div>
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
                Address (Optional)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full address"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., 9876543210"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {editingId ? 'Update Branch' : 'Save Branch'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Branches List */}
      <div className="form-section">
        <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#333' }}>
          All Branches ({branches.length})
        </h2>
        {loading ? (
          <p style={{ color: '#666', fontSize: '16px' }}>Loading branches...</p>
        ) : branches.length === 0 ? (
          <p style={{ color: '#666', fontSize: '16px' }}>No branches added yet. Add your first branch above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {branches.map((branch) => (
              <div
                key={branch.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {branch.branchName}
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      background: '#007bff', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: '12px' 
                    }}>
                      {branchCounts[branch.id] || 0} Active
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    {branch.city}
                    {branch.address && ` • ${branch.address}`}
                    {branch.phone && ` • ${branch.phone}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(branch)}
                    style={{
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    style={{
                      padding: '8px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBranches;
