export const getInitialFormState = () => ({
  doctor: {
    doctorId: '',
    doctorName: '',
    doctorPhone: '',
    clinicName: '',
    clinicPhone: '',
    emailWhatsapp: '',
  },
  patient: {
    patientId: '',
    patientName: '',
    age: '',
    sex: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
    referringDoctor: '',
    diagnosticReport: null,
    dicomFile: null,
    patientImage: null,
  },
  diagnosticServices: {
    threeDServices: {
      cbctSingleTooth: { selected: false, toothNumber: '', selectedTeeth: [] },
      cbctSegment: { selected: false, details: '', selectedTeeth: [] },
      cbctMaxilla: false,
      cbctMandible: false,
      cbctTMJ: { selected: false, side: '' },
      cbctMaxillaMandible: false,
      cbctFullSkull: false,
    },
  },
  reasonForReferral: {
    implantPlanning: false,
    cystTumourMalignancy: false,
    teethRootBoneFracture: false,
    rootCanalEndodontic: false,
    impactedSupernumerary: false,
    postOperativeImplant: false,
    tmjPainClicking: false,
    chronicIdiopathicPain: false,
    sinusPathology: false,
    periapicalPeriodontal: false,
    orthodontic: false,
    airwayAnalysis: false,
  },
  clinicalNotes: '',
});

export const validateForm = (formData) => {
  const errors = {};

  // Doctor validation - only required: doctorName, doctorPhone, emailWhatsapp
  const doctorErrors = {};
  if (!formData.doctor.doctorName.trim()) {
    doctorErrors.doctorName = 'Doctor name is required';
  }
  if (!formData.doctor.doctorPhone.trim()) {
    doctorErrors.doctorPhone = 'Doctor phone is required';
  } else if (!/^\d{10}$/.test(formData.doctor.doctorPhone)) {
    doctorErrors.doctorPhone = 'Phone must be 10 digits';
  }
  if (!formData.doctor.emailWhatsapp.trim()) {
    doctorErrors.emailWhatsapp = 'Doctor email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.doctor.emailWhatsapp)) {
    doctorErrors.emailWhatsapp = 'Please enter a valid email address';
  }

  if (Object.keys(doctorErrors).length > 0) {
    errors.doctor = doctorErrors;
  }

  // Patient validation - only required: patientId, patientName, phoneNumber
  const patientErrors = {};
  if (!formData.patient.patientId || !formData.patient.patientId.trim()) {
    patientErrors.patientId = 'Patient ID is required';
  }
  if (!formData.patient.patientName.trim()) {
    patientErrors.patientName = 'Patient name is required';
  }
  if (!formData.patient.phoneNumber.trim()) {
    patientErrors.phoneNumber = 'Phone number is required';
  } else if (!/^\d{10}$/.test(formData.patient.phoneNumber)) {
    patientErrors.phoneNumber = 'Phone must be 10 digits';
  }
  // Note: File uploads are optional since browser storage has size limits

  if (Object.keys(patientErrors).length > 0) {
    errors.patient = patientErrors;
  }

  // Diagnostic services validation
  const diagnosticErrors = {};
  const threeDServices = formData.diagnosticServices?.threeDServices || {};
  
  // CBCT Single Tooth validation
  if (threeDServices.cbctSingleTooth?.selected) {
    const selectedTeeth = threeDServices.cbctSingleTooth.selectedTeeth || [];
    if (selectedTeeth.length !== 1) {
      diagnosticErrors.cbctSingleTooth = 'Please select exactly one tooth for CBCT Single Tooth';
    }
  }
  
  // CBCT Segment validation
  if (threeDServices.cbctSegment?.selected) {
    const selectedTeeth = threeDServices.cbctSegment.selectedTeeth || [];
    if (selectedTeeth.length === 0) {
      diagnosticErrors.cbctSegment = 'Please select at least one tooth for CBCT Segment';
    } else if (selectedTeeth.length > 5) {
      diagnosticErrors.cbctSegment = 'Maximum 5 teeth allowed for CBCT Segment';
    }
  }

  if (Object.keys(diagnosticErrors).length > 0) {
    errors.diagnosticServices = diagnosticErrors;
  }

  return errors;
};

export const getScanTypeSummary = (diagnosticServices) => {
  const scans = [];
  const threeDServices = diagnosticServices?.threeDServices || {};

  // 3D Services only
  if (threeDServices.cbctSingleTooth?.selected) {
    const teeth = threeDServices.cbctSingleTooth.selectedTeeth || [];
    const toothInfo = teeth.length > 0 ? ` (${teeth.join(', ')})` : '';
    scans.push(`CBCT Single${toothInfo}`);
  }
  if (threeDServices.cbctSegment?.selected) {
    const teeth = threeDServices.cbctSegment.selectedTeeth || [];
    const toothInfo = teeth.length > 0 ? ` (${teeth.sort((a, b) => a - b).join(', ')})` : '';
    scans.push(`CBCT Segment${toothInfo}`);
  }
  if (threeDServices.cbctMaxilla) scans.push('CBCT Maxilla');
  if (threeDServices.cbctMandible) scans.push('CBCT Mandible');
  if (threeDServices.cbctTMJ?.selected) scans.push('CBCT TMJ');
  if (threeDServices.cbctMaxillaMandible) scans.push('CBCT Max+Mand');
  if (threeDServices.cbctFullSkull) scans.push('CBCT Full Skull');

  if (scans.length === 0) return 'No scans selected';
  if (scans.length <= 2) return scans.join(', ');
  return `${scans.slice(0, 2).join(', ')} +${scans.length - 2} more`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
