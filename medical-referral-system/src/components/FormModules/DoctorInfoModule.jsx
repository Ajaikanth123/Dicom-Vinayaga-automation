import React, { useState, useEffect, useRef } from 'react';
import { FormSection, InputField } from '../FormElements';
import { useFormContext } from '../../context/FormContext';
import './DoctorInfoModule.css';

const DoctorIcon = () => (
  <svg viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M14.84 16.26C17.86 16.83 20 18.29 20 20v2H4v-2c0-1.71 2.14-3.17 5.16-3.74L12 21l2.84-4.74zM8 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"
    />
  </svg>
);

// Custom hook for doctor save functionality
export const useDoctorSave = (doctorData) => {
  const { currentBranch } = useFormContext();
  const [doctors, setDoctors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Prevent race conditions

  useEffect(() => {
    loadDoctors();
  }, [currentBranch]);

  const loadDoctors = async () => {
    if (!currentBranch) return;
    
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
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const saveDoctor = async () => {
    if (!currentBranch || !doctorData.doctorName || !doctorData.doctorPhone || !doctorData.emailWhatsapp) {
      return;
    }

    try {
      const { getDatabase, ref, push } = await import('firebase/database');
      const db = getDatabase();
      const doctorsRef = ref(db, `doctors/${currentBranch}`);
      
      const newDoctorData = {
        doctorName: doctorData.doctorName,
        doctorPhone: doctorData.doctorPhone,
        emailWhatsapp: doctorData.emailWhatsapp,
        hospital: doctorData.hospital || '',
        clinicName: doctorData.clinicName || '',
        clinicPhone: doctorData.clinicPhone || '',
        doctorId: doctorData.doctorId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await push(doctorsRef, newDoctorData);
      await loadDoctors();
    } catch (error) {
      console.error('Error saving doctor:', error);
      throw error;
    }
  };

  const handleManualSave = async () => {
    // Prevent multiple simultaneous saves (race condition protection)
    if (isProcessing) {
      return;
    }
    
    const existingDoctor = doctors.find(
      d => d.doctorName?.toLowerCase() === doctorData.doctorName?.toLowerCase()
    );
    
    // Check if doctor exists with EXACT same data (not modified)
    if (existingDoctor) {
      // Normalize empty strings and undefined to empty string for comparison
      const normalizeField = (field) => field || '';
      
      const isModified = normalizeField(existingDoctor.doctorPhone) !== normalizeField(doctorData.doctorPhone) ||
                        normalizeField(existingDoctor.emailWhatsapp) !== normalizeField(doctorData.emailWhatsapp) ||
                        normalizeField(existingDoctor.hospital) !== normalizeField(doctorData.hospital) ||
                        normalizeField(existingDoctor.clinicName) !== normalizeField(doctorData.clinicName) ||
                        normalizeField(existingDoctor.clinicPhone) !== normalizeField(doctorData.clinicPhone) ||
                        normalizeField(existingDoctor.doctorId) !== normalizeField(doctorData.doctorId);
      
      if (!isModified) {
        alert('This doctor already exists in Manage Doctors!');
        return;
      }
      // If modified, allow save (will create new entry with same name but different details)
    }

    setIsProcessing(true); // Lock to prevent race conditions
    setSaving(true);
    setSaveSuccess(false);

    try {
      await saveDoctor();
      // Reload doctors list immediately after save to update button logic
      await loadDoctors();
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      alert('Failed to save doctor. Please try again.');
    } finally {
      setSaving(false);
      setIsProcessing(false); // Unlock after complete
    }
  };

  const doctorExists = doctors.some(
    d => d.doctorName?.toLowerCase() === doctorData.doctorName?.toLowerCase()
  );

  // Check if EXACT doctor (all fields matching) exists in database
  const exactDoctorExists = doctors.some(d => {
    if (d.doctorName?.toLowerCase() === doctorData.doctorName?.toLowerCase()) {
      // Same name, check if ALL fields match exactly
      const normalizeField = (field) => field || '';
      
      return normalizeField(d.doctorPhone) === normalizeField(doctorData.doctorPhone) &&
             normalizeField(d.emailWhatsapp) === normalizeField(doctorData.emailWhatsapp) &&
             normalizeField(d.hospital) === normalizeField(doctorData.hospital) &&
             normalizeField(d.clinicName) === normalizeField(doctorData.clinicName) &&
             normalizeField(d.clinicPhone) === normalizeField(doctorData.clinicPhone) &&
             normalizeField(d.doctorId) === normalizeField(doctorData.doctorId);
    }
    return false;
  });

  // Show button ONLY if exact doctor doesn't exist
  // (If doctor name exists but with different data, allow save)
  const showButton = !exactDoctorExists;
  const canSave = doctorData.doctorName && doctorData.doctorPhone && doctorData.emailWhatsapp && showButton && !isProcessing;

  return {
    handleManualSave,
    saving,
    saveSuccess,
    canSave,
    doctorExists,
    showButton,
    isProcessing
  };
};

const DoctorInfoModule = ({ data, onChange, errors = {}, disabled = false }) => {
  const { currentBranch } = useFormContext();
  const [doctors, setDoctors] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    loadDoctors();
  }, [currentBranch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDoctors = async () => {
    if (!currentBranch) return;
    
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
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });

    if (name === 'doctorName' && value.trim()) {
      const filtered = doctors.filter(doctor =>
        doctor.doctorName?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDoctors(filtered);
      setShowSuggestions(filtered.length > 0);
    } else if (name === 'doctorName') {
      setShowSuggestions(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    onChange({
      ...data,
      doctorName: doctor.doctorName || '',
      doctorPhone: doctor.doctorPhone || '',
      emailWhatsapp: doctor.emailWhatsapp || '',
      hospital: doctor.hospital || '',
      clinicName: doctor.clinicName || '',
      clinicPhone: doctor.clinicPhone || '',
      doctorId: doctor.doctorId || ''
    });
    setShowSuggestions(false);
  };

  const handleDoctorNameBlur = async () => {
    console.log('[Auto-Save] Blur event triggered');
    console.log('[Auto-Save] Doctor Name:', data.doctorName);
    console.log('[Auto-Save] Phone:', data.doctorPhone);
    console.log('[Auto-Save] Email:', data.emailWhatsapp);
    console.log('[Auto-Save] Show Suggestions:', showSuggestions);
    
    setTimeout(async () => {
      if (!showSuggestions && data.doctorName && data.doctorPhone && data.emailWhatsapp) {
        console.log('[Auto-Save] All conditions met, checking for existing doctor...');
        
        const existingDoctor = doctors.find(
          d => d.doctorName?.toLowerCase() === data.doctorName?.toLowerCase()
        );
        
        if (existingDoctor) {
          console.log('[Auto-Save] Doctor already exists, skipping save');
        } else {
          console.log('[Auto-Save] New doctor detected, saving...');
          await saveNewDoctor();
        }
      } else {
        console.log('[Auto-Save] Conditions not met:');
        console.log('  - showSuggestions:', showSuggestions);
        console.log('  - doctorName filled:', !!data.doctorName);
        console.log('  - doctorPhone filled:', !!data.doctorPhone);
        console.log('  - emailWhatsapp filled:', !!data.emailWhatsapp);
      }
    }, 200);
  };

  const saveNewDoctor = async () => {
    if (!currentBranch || !data.doctorName || !data.doctorPhone || !data.emailWhatsapp) {
      console.log('[Auto-Save] Missing required data');
      return;
    }

    try {
      console.log('[Auto-Save] Saving to Firebase...');
      const { getDatabase, ref, push } = await import('firebase/database');
      const db = getDatabase();
      const doctorsRef = ref(db, `doctors/${currentBranch}`);
      
      const doctorData = {
        doctorName: data.doctorName,
        doctorPhone: data.doctorPhone,
        emailWhatsapp: data.emailWhatsapp,
        hospital: data.hospital || '',
        clinicName: data.clinicName || '',
        clinicPhone: data.clinicPhone || '',
        doctorId: data.doctorId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await push(doctorsRef, doctorData);
      console.log('✅ New doctor auto-saved:', data.doctorName);
      
      await loadDoctors();
      console.log('✅ Doctors list reloaded');
    } catch (error) {
      console.error('❌ Error auto-saving doctor:', error);
    }
  };

  return (
    <FormSection title="Doctor Information" icon={<DoctorIcon />}>
      <div className="form-row">
        <InputField
          label="Doctor ID"
          name="doctorId"
          value={data.doctorId}
          onChange={handleChange}
          placeholder="e.g., DR-2024-001"
          error={errors.doctorId}
          disabled={disabled}
        />
        <div className="autocomplete-wrapper" ref={suggestionsRef}>
          <InputField
            label="Doctor Name"
            name="doctorName"
            value={data.doctorName}
            onChange={handleChange}
            onBlur={handleDoctorNameBlur}
            placeholder="Enter doctor's full name"
            required
            error={errors.doctorName}
            disabled={disabled}
          />
          {showSuggestions && filteredDoctors.length > 0 && (
            <div className="suggestions-dropdown">
              {filteredDoctors.map(doctor => (
                <div
                  key={doctor.id}
                  className="suggestion-item"
                  onClick={() => handleSelectDoctor(doctor)}
                >
                  <div className="suggestion-name">{doctor.doctorName}</div>
                  <div className="suggestion-details">
                    {doctor.emailWhatsapp} • {doctor.doctorPhone}
                    {doctor.hospital && ` • ${doctor.hospital}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="form-row">
        <InputField
          label="Doctor Phone Number"
          name="doctorPhone"
          type="tel"
          value={data.doctorPhone}
          onChange={handleChange}
          placeholder="10-digit phone number"
          required
          error={errors.doctorPhone}
          disabled={disabled}
          maxLength={10}
        />
        <InputField
          label="Clinic Name"
          name="clinicName"
          value={data.clinicName}
          onChange={handleChange}
          placeholder="Enter clinic name"
          error={errors.clinicName}
          disabled={disabled}
        />
      </div>
      <div className="form-row">
        <InputField
          label="Clinic Phone Number"
          name="clinicPhone"
          type="tel"
          value={data.clinicPhone}
          onChange={handleChange}
          placeholder="Clinic contact number"
          error={errors.clinicPhone}
          disabled={disabled}
        />
        <InputField
          label="Doctor Email"
          name="emailWhatsapp"
          value={data.emailWhatsapp}
          onChange={handleChange}
          placeholder="Email address"
          required
          error={errors.emailWhatsapp}
          disabled={disabled}
        />
      </div>
    </FormSection>
  );
};

export default DoctorInfoModule;
