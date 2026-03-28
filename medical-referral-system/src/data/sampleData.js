export const getSampleDataForBranch = (branch) => {
  if (branch === 'Branch 1') {
    return [
      {
        id: 'sample-b1-001',
        branch: 'Branch 1',
        createdAt: '2026-01-02T09:30:00.000Z',
        updatedAt: '2026-01-02T09:30:00.000Z',
        doctor: {
          doctorId: 'DR-B1-001',
          doctorName: 'Dr. Sarah Mitchell',
          doctorPhone: '9876543210',
          clinicName: 'Smile Dental Care',
          clinicPhone: '0442345678',
          emailWhatsapp: 'dr.sarah@smiledentalcare.com',
        },
        patient: {
          patientId: 'PT-B1-001',
          patientName: 'John Anderson',
          age: '45',
          sex: 'Male',
          phoneNumber: '9123456789',
          date: '2026-01-02',
        },
        diagnosticServices: {
          threeDServices: {
            cbctSingleTooth: { selected: true, toothNumber: '16', selectedTeeth: [16] },
            cbctSegment: { selected: false, details: '', selectedTeeth: [] },
            cbctMaxilla: false,
            cbctMandible: false,
            cbctTMJ: { selected: false, side: '' },
            cbctMaxillaMandible: false,
            cbctFullSkull: false,
          },
        },
        reasonForReferral: {
          implantPlanning: true,
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
        clinicalNotes: 'Branch 1 - Patient requires implant planning for upper right first molar.',
      },
      {
        id: 'sample-b1-002',
        branch: 'Branch 1',
        createdAt: '2026-01-01T16:45:00.000Z',
        updatedAt: '2026-01-01T16:45:00.000Z',
        doctor: {
          doctorId: 'DR-B1-002',
          doctorName: 'Dr. Michael Thompson',
          doctorPhone: '9876543211',
          clinicName: 'Elite Dental Clinic',
          clinicPhone: '0442345679',
          emailWhatsapp: 'dr.michael@elitedental.com',
        },
        patient: {
          patientId: 'PT-B1-002',
          patientName: 'Maria Rodriguez',
          age: '32',
          sex: 'Female',
          phoneNumber: '9123456788',
          date: '2026-01-01',
        },
        diagnosticServices: {
          threeDServices: {
            cbctSingleTooth: { selected: false, toothNumber: '', selectedTeeth: [] },
            cbctSegment: { selected: true, details: 'Teeth: 14, 15, 16, 17', selectedTeeth: [14, 15, 16, 17] },
            cbctMaxilla: false,
            cbctMandible: false,
            cbctTMJ: { selected: false, side: '' },
            cbctMaxillaMandible: false,
            cbctFullSkull: false,
          },
        },
        reasonForReferral: {
          implantPlanning: true,
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
        clinicalNotes: 'Branch 1 - Multiple implant planning for upper right quadrant. Patient lost teeth due to periodontal disease.',
      },
    ];
  }
  
  if (branch === 'Branch 2') {
    return [
      {
        id: 'sample-b2-001',
        branch: 'Branch 2',
        createdAt: '2026-01-01T14:15:00.000Z',
        updatedAt: '2026-01-01T14:15:00.000Z',
        doctor: {
          doctorId: 'DR-B2-001',
          doctorName: 'Dr. Rajesh Kumar',
          doctorPhone: '9988776655',
          clinicName: 'Advanced Orthodontics Center',
          clinicPhone: '0801234567',
          emailWhatsapp: 'rajesh.ortho@gmail.com',
        },
        patient: {
          patientId: 'PT-B2-001',
          patientName: 'Emily Chen',
          age: '16',
          sex: 'Female',
          phoneNumber: '9876123456',
          date: '2026-01-01',
        },
        diagnosticServices: {
          threeDServices: {
            cbctSingleTooth: { selected: false, toothNumber: '', selectedTeeth: [] },
            cbctSegment: { selected: false, details: '', selectedTeeth: [] },
            cbctMaxilla: true,
            cbctMandible: true,
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
          orthodontic: true,
          airwayAnalysis: true,
        },
        clinicalNotes: 'Branch 2 - Orthodontic treatment planning. Class II Division 1 malocclusion.',
      },
    ];
  }
  
  // Branch 3 starts empty
  return [];
};
