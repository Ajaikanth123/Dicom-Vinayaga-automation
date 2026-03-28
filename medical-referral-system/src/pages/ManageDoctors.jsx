import React, { useState, useEffect } from 'react';
import { useFormContext } from '../context/FormContext';
import './ManageDoctors.css';

const ManageDoctors = () => {
  const { currentBranch, getBranchName } = useFormContext();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    doctorName: '',
    doctorPhone: '',
    emailWhatsapp: '',
    hospital: '',
    clinicName: '',
    clinicPhone: '',
    doctorId: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadDoctors();
  }, [currentBranch]);

  const loadDoctors = async () => {
    if (!currentBranch) return;
    
    setLoading(true);
    try {
      const { getDatabase, ref, get } = await import('firebase/database');
      const db = getDatabase();
      const doctorsRef = ref(db, `doctors/${currentBranch}`);
      const snapshot = await get(doctorsRef);
      
      if (snapshot.exists()) {
        const doctorsData = snapshot.val();
        const doctorsList = Object.keys(doctorsData).map(key => ({
          id: key,
          ...doctorsData[key]
        }));
        setDoctors(doctorsList);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      alert('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Doctor name is required';
    }
    
    if (!formData.doctorPhone.trim()) {
      newErrors.doctorPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.doctorPhone)) {
      newErrors.doctorPhone = 'Phone number must be 10 digits';
    }
    
    if (!formData.emailWhatsapp.trim()) {
      newErrors.emailWhatsapp = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailWhatsapp)) {
      newErrors.emailWhatsapp = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const { getDatabase, ref, push, set } = await import('firebase/database');
      const db = getDatabase();
      
      const doctorData = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (editingDoctor) {
        // Update existing doctor
        const doctorRef = ref(db, `doctors/${currentBranch}/${editingDoctor.id}`);
        await set(doctorRef, {
          ...doctorData,
          createdAt: editingDoctor.createdAt
        });
      } else {
        // Add new doctor
        const doctorsRef = ref(db, `doctors/${currentBranch}`);
        await push(doctorsRef, doctorData);
      }
      
      // Reset form and reload
      setFormData({
        doctorName: '',
        doctorPhone: '',
        emailWhatsapp: '',
        hospital: '',
        clinicName: '',
        clinicPhone: '',
        doctorId: ''
      });
      setShowAddModal(false);
      setEditingDoctor(null);
      loadDoctors();
      
      alert(editingDoctor ? 'Doctor updated successfully!' : 'Doctor added successfully!');
    } catch (error) {
      console.error('Error saving doctor:', error);
      alert('Failed to save doctor');
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      doctorName: doctor.doctorName || '',
      doctorPhone: doctor.doctorPhone || '',
      emailWhatsapp: doctor.emailWhatsapp || '',
      hospital: doctor.hospital || '',
      clinicName: doctor.clinicName || '',
      clinicPhone: doctor.clinicPhone || '',
      doctorId: doctor.doctorId || ''
    });
    setShowAddModal(true);
  };

  const handleView = (doctor) => {
    setViewingDoctor(doctor);
    setShowViewModal(true);
  };

  const handleDelete = async (doctorId) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    
    try {
      const { getDatabase, ref, remove } = await import('firebase/database');
      const db = getDatabase();
      const doctorRef = ref(db, `doctors/${currentBranch}/${doctorId}`);
      await remove(doctorRef);
      loadDoctors();
      alert('Doctor deleted successfully!');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  const handleAddNew = () => {
    setEditingDoctor(null);
    setFormData({
      doctorName: '',
      doctorPhone: '',
      emailWhatsapp: '',
      hospital: '',
      clinicName: '',
      clinicPhone: '',
      doctorId: ''
    });
    setErrors({});
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingDoctor(null);
    setErrors({});
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.emailWhatsapp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.hospital?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-doctors-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Manage Doctors</h1>
          <p className="branch-info">Branch: {getBranchName(currentBranch)}</p>
        </div>
        <button className="btn-primary" onClick={handleAddNew}>
          <svg viewBox="0 0 24 24" className="btn-icon">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Add Doctor
        </button>
      </div>

      <div className="search-bar">
        <svg viewBox="0 0 24 24" className="search-icon">
          <path fill="currentColor" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
        </svg>
        <input
          type="text"
          placeholder="Search doctors by name, email, or hospital..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading doctors...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" className="empty-icon">
            <path fill="currentColor" d="M14.84 16.26C17.86 16.83 20 18.29 20 20v2H4v-2c0-1.71 2.14-3.17 5.16-3.74L12 21l2.84-4.74zM8 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
          </svg>
          <h3>No doctors found</h3>
          <p>{searchTerm ? 'Try a different search term' : 'Add your first doctor to get started'}</p>
          {!searchTerm && (
            <button className="btn-primary" onClick={handleAddNew}>
              Add Doctor
            </button>
          )}
        </div>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-card-content">
                <div className="doctor-avatar">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M14.84 16.26C17.86 16.83 20 18.29 20 20v2H4v-2c0-1.71 2.14-3.17 5.16-3.74L12 21l2.84-4.74zM8 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
                  </svg>
                </div>
                <div className="doctor-info">
                  <h3>{doctor.doctorName}</h3>
                  {doctor.hospital && <p className="hospital">{doctor.hospital}</p>}
                  <div className="doctor-details">
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" className="detail-icon">
                        <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                      <span>{doctor.emailWhatsapp}</span>
                    </div>
                    <div className="detail-item">
                      <svg viewBox="0 0 24 24" className="detail-icon">
                        <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      <span>{doctor.doctorPhone}</span>
                    </div>
                    {doctor.clinicName && (
                      <div className="detail-item">
                        <svg viewBox="0 0 24 24" className="detail-icon">
                          <path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                        </svg>
                        <span>{doctor.clinicName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="doctor-actions">
                <button className="btn-icon" onClick={() => handleView(doctor)} title="View">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                  </svg>
                </button>
                <button className="btn-icon" onClick={() => handleEdit(doctor)} title="Edit">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                  </svg>
                </button>
                <button className="btn-icon btn-delete" onClick={() => handleDelete(doctor.id)} title="Delete">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="doctor-form">
              <div className="form-group">
                <label>Doctor Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  placeholder="Enter doctor's full name"
                  className={errors.doctorName ? 'error' : ''}
                />
                {errors.doctorName && <span className="error-message">{errors.doctorName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    value={formData.doctorPhone}
                    onChange={(e) => setFormData({ ...formData, doctorPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit phone number"
                    maxLength={10}
                    className={errors.doctorPhone ? 'error' : ''}
                  />
                  {errors.doctorPhone && <span className="error-message">{errors.doctorPhone}</span>}
                </div>

                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    value={formData.emailWhatsapp}
                    onChange={(e) => setFormData({ ...formData, emailWhatsapp: e.target.value })}
                    placeholder="doctor@example.com"
                    className={errors.emailWhatsapp ? 'error' : ''}
                  />
                  {errors.emailWhatsapp && <span className="error-message">{errors.emailWhatsapp}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Hospital / Clinic Name</label>
                <input
                  type="text"
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  placeholder="Enter hospital or clinic name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Clinic Name</label>
                  <input
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    placeholder="Clinic name"
                  />
                </div>

                <div className="form-group">
                  <label>Clinic Phone</label>
                  <input
                    type="tel"
                    value={formData.clinicPhone}
                    onChange={(e) => setFormData({ ...formData, clinicPhone: e.target.value })}
                    placeholder="Clinic phone number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Doctor ID</label>
                <input
                  type="text"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  placeholder="e.g., DR-2024-001"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingDoctor && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Doctor Details</h2>
              <button className="btn-close" onClick={() => setShowViewModal(false)}>
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>
            <div className="view-content">
              <div className="view-section">
                <div className="view-avatar">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M14.84 16.26C17.86 16.83 20 18.29 20 20v2H4v-2c0-1.71 2.14-3.17 5.16-3.74L12 21l2.84-4.74zM8 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
                  </svg>
                </div>
                <h3 className="view-name">{viewingDoctor.doctorName}</h3>
              </div>

              <div className="view-details">
                <div className="view-item">
                  <label>Email / WhatsApp</label>
                  <div className="view-value">
                    <svg viewBox="0 0 24 24" className="view-icon">
                      <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <span>{viewingDoctor.emailWhatsapp}</span>
                  </div>
                </div>

                <div className="view-item">
                  <label>Phone Number</label>
                  <div className="view-value">
                    <svg viewBox="0 0 24 24" className="view-icon">
                      <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    <span>{viewingDoctor.doctorPhone}</span>
                  </div>
                </div>

                {viewingDoctor.hospital && (
                  <div className="view-item">
                    <label>Hospital</label>
                    <div className="view-value">
                      <svg viewBox="0 0 24 24" className="view-icon">
                        <path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                      </svg>
                      <span>{viewingDoctor.hospital}</span>
                    </div>
                  </div>
                )}

                {viewingDoctor.clinicName && (
                  <div className="view-item">
                    <label>Clinic Name</label>
                    <div className="view-value">
                      <svg viewBox="0 0 24 24" className="view-icon">
                        <path fill="currentColor" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
                      </svg>
                      <span>{viewingDoctor.clinicName}</span>
                    </div>
                  </div>
                )}

                {viewingDoctor.clinicPhone && (
                  <div className="view-item">
                    <label>Clinic Phone</label>
                    <div className="view-value">
                      <svg viewBox="0 0 24 24" className="view-icon">
                        <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      <span>{viewingDoctor.clinicPhone}</span>
                    </div>
                  </div>
                )}

                {viewingDoctor.doctorId && (
                  <div className="view-item">
                    <label>Doctor ID</label>
                    <div className="view-value">
                      <svg viewBox="0 0 24 24" className="view-icon">
                        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13H13V7H11M11,15V17H13V15H11Z" />
                      </svg>
                      <span>{viewingDoctor.doctorId}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
                <button type="button" className="btn-primary" onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingDoctor);
                }}>
                  Edit Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDoctors;
