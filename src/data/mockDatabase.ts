import { Patient, AuditBlock, QueueEvent, TenantId } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pt_1001',
    tenantId: 'metro-gen',
    mrn: 'MRN-892104',
    firstName: 'Eleanor',
    lastName: 'Hawthorne',
    dob: '1968-04-12',
    gender: 'Female',
    bloodType: 'A+',
    phone: '(555) 234-8910',
    insuranceProvider: 'Blue Cross Blue Shield PPO',
    policyNumber: 'BCBS-9941029',
    queueStatus: 'waiting_doctor',
    triageAcuity: 2, // Emergent (Chest pain/shortness of breath)
    assignedRoom: 'Exam Room 3',
    assignedDoctor: 'Dr. Marcus Vance, MD',
    checkInTime: '2026-10-15T06:45:00Z',
    lastUpdated: '2026-10-15T07:15:00Z',
    allergies: [
      { allergen: 'Penicillin VK', severity: 'severe', reaction: 'Anaphylaxis, Urticaria' },
      { allergen: 'Ciprofloxacin', severity: 'moderate', reaction: 'Severe nausea, rash' }
    ],
    vitals: [
      {
        bloodPressureSys: 148,
        bloodPressureDia: 92,
        heartRate: 104,
        oxygenSaturation: 94,
        temperatureF: 99.1,
        respiratoryRate: 22,
        painScale: 7,
        recordedAt: '2026-10-15T06:52:00Z',
        recordedBy: 'Nurse Elena Rostova, RN'
      }
    ],
    encounters: [
      {
        id: 'enc_881',
        patientId: 'pt_1001',
        tenantId: 'metro-gen',
        clinicianId: 'usr_doc_304',
        clinicianName: 'Dr. Marcus Vance, MD',
        encounterDate: '2026-10-15',
        chiefComplaint: 'Acute substernal chest pressure radiating to left scapula for 90 minutes',
        subjectiveNotes: 'Patient reports progressive retrosternal squeezing pain that woke her at 05:00. Associated with diaphoresis, dyspnea on exertion. Denies previous MI, admits to hypertension non-compliance for 3 weeks.',
        objectiveNotes: 'Patient appears anxious, mildly diaphoretic. S1/S2 present, no audible S3/S4. Bilateral bibasilar crackles on auscultation. ECG shows ST depression in leads V4-V6. Troponin I elevated at 0.18 ng/mL.',
        assessmentNotes: 'Acute Coronary Syndrome (NSTEMI) / Unstable Angina pectoris with concurrent stage 2 essential hypertension.',
        psychiatricOrSensitiveNotes: 'CONFIDENTIAL: Patient undergoing bereavement counseling following spouse demise 4 months ago; taking Sertraline 50mg po daily.',
        icd10Codes: [
          { code: 'I21.4', description: 'Non-ST elevation (NSTEMI) myocardial infarction' },
          { code: 'I10', description: 'Essential (primary) hypertension' },
          { code: 'R07.9', description: 'Chest pain, unspecified' }
        ],
        planNotes: '1. Immediate Dual Antiplatelet Therapy (Aspirin 324mg chewable + Clopidogrel 300mg load). 2. Sublingual Nitroglycerin 0.4mg PRN. 3. Stat Cardiology consult for coronary catheterization. 4. Transfer to Cardiac Telemetry.',
        isSigned: true,
        signedAt: '2026-10-15T07:10:00Z'
      }
    ],
    prescriptions: [
      {
        id: 'rx_9021',
        patientId: 'pt_1001',
        drugName: 'Clopidogrel (Plavix)',
        genericName: 'Clopidogrel Bisulfate',
        dosage: '75 mg',
        route: 'Oral (PO)',
        frequency: 'Once Daily',
        durationDays: 30,
        prescribedBy: 'Dr. Marcus Vance, MD',
        doctorLicense: 'CA-MED-44012',
        prescribedAt: '2026-10-15T07:12:00Z',
        verifiedByDoctor: true,
        status: 'queued_in_pharmacy',
        allergyWarning: 'Patient has confirmed Penicillin allergy. No cross-reactivity with thienopyridines.'
      },
      {
        id: 'rx_9022',
        patientId: 'pt_1001',
        drugName: 'Atorvastatin (Lipitor)',
        genericName: 'Atorvastatin Calcium',
        dosage: '80 mg',
        route: 'Oral (PO)',
        frequency: 'Nightly',
        durationDays: 30,
        prescribedBy: 'Dr. Marcus Vance, MD',
        doctorLicense: 'CA-MED-44012',
        prescribedAt: '2026-10-15T07:12:00Z',
        verifiedByDoctor: true,
        status: 'queued_in_pharmacy'
      }
    ],
    imagingOrders: [
      {
        id: 'img_301',
        patientId: 'pt_1001',
        type: 'xray',
        title: 'Chest X-Ray AP/Lateral Portable',
        orderedBy: 'Dr. Marcus Vance, MD',
        orderedAt: '2026-10-15T06:58:00Z',
        status: 'imaging_uploaded',
        modality: 'Digital Radiography (DX)',
        imagingS3Key: 'tenants/metro-gen/patients/pt_1001/radiology/chest_xray_ap.dcm',
        imagingExpiresAt: '2026-10-15T08:45:00Z',
        findings: 'Mild cardiomegaly with peribronchial cuffing. No gross pneumothorax or acute focal consolidation.',
        s3Encryption: 'AES256'
      }
    ],
    billing: {
      id: 'inv_4001',
      patientId: 'pt_1001',
      tenantId: 'metro-gen',
      claimId: 'CLM-2026-9041',
      status: 'pending_adjudication',
      items: [
        { cptCode: '99285', description: 'Emergency Dept Visit High Severity / Immediate Threat', units: 1, fee: 820.00 },
        { cptCode: '93000', description: 'Electrocardiogram 12-lead with interpretation', units: 1, fee: 145.00 },
        { cptCode: '71045', description: 'Radiologic Examination Chest Single View', units: 1, fee: 195.00 },
        { cptCode: '84484', description: 'Troponin Quantitative Cardiac Marker', units: 1, fee: 120.00 }
      ],
      totalAmount: 1280.00,
      insuranceCoverageAmount: 1088.00,
      copayAmount: 50.00,
      balanceDue: 142.00
    }
  },
  {
    id: 'pt_1002',
    tenantId: 'metro-gen',
    mrn: 'MRN-773190',
    firstName: 'Julian',
    lastName: 'Sterling',
    dob: '1984-11-20',
    gender: 'Male',
    bloodType: 'O-',
    phone: '(555) 781-4421',
    insuranceProvider: 'Aetna Open Choice',
    policyNumber: 'AET-419082',
    queueStatus: 'pharmacy_dispense',
    triageAcuity: 3, // Urgent
    assignedRoom: 'Exam Room 1',
    assignedDoctor: 'Dr. Marcus Vance, MD',
    checkInTime: '2026-10-15T06:10:00Z',
    lastUpdated: '2026-10-15T07:22:00Z',
    allergies: [
      { allergen: 'Sulfa Drugs', severity: 'moderate', reaction: 'Maculopapular rash' }
    ],
    vitals: [
      {
        bloodPressureSys: 128,
        bloodPressureDia: 82,
        heartRate: 78,
        oxygenSaturation: 98,
        temperatureF: 101.4,
        respiratoryRate: 18,
        painScale: 4,
        recordedAt: '2026-10-15T06:18:00Z',
        recordedBy: 'Nurse Elena Rostova, RN'
      }
    ],
    encounters: [
      {
        id: 'enc_882',
        patientId: 'pt_1002',
        tenantId: 'metro-gen',
        clinicianId: 'usr_doc_304',
        clinicianName: 'Dr. Marcus Vance, MD',
        encounterDate: '2026-10-15',
        chiefComplaint: 'Productive cough, yellow-green sputum, fever of 101.5F for 4 days',
        subjectiveNotes: 'Patient states symptoms began with sore throat and nasal congestion, migrated to dense chest congestion. Shivering chills last night. Non-smoker.',
        objectiveNotes: 'Right lower lobe bronchial breath sounds with localized inspiratory crackles. Pharynx clear. Tympanic membranes normal.',
        assessmentNotes: 'Community-acquired bacterial pneumonia of right lower lobe (ICD-10 J18.9).',
        psychiatricOrSensitiveNotes: 'No sensitive psychological history reported. Denies substance misuse.',
        icd10Codes: [
          { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
          { code: 'R50.9', description: 'Fever, unspecified' }
        ],
        planNotes: 'Initiate Azithromycin 500mg Day 1 then 250mg daily + Amoxicillin-Clavulanate 875/125mg BID. Encourage fluids and rest.',
        isSigned: true,
        signedAt: '2026-10-15T07:05:00Z'
      }
    ],
    prescriptions: [
      {
        id: 'rx_9023',
        patientId: 'pt_1002',
        drugName: 'Azithromycin (Zithromax Z-Pak)',
        genericName: 'Azithromycin',
        dosage: '250 mg tab',
        route: 'Oral (PO)',
        frequency: 'Daily for 5 days',
        durationDays: 5,
        prescribedBy: 'Dr. Marcus Vance, MD',
        doctorLicense: 'CA-MED-44012',
        prescribedAt: '2026-10-15T07:08:00Z',
        verifiedByDoctor: true,
        status: 'queued_in_pharmacy'
      }
    ],
    imagingOrders: [],
    billing: {
      id: 'inv_4002',
      patientId: 'pt_1002',
      tenantId: 'metro-gen',
      claimId: 'CLM-2026-9042',
      status: 'pending_adjudication',
      items: [
        { cptCode: '99214', description: 'Office or other outpatient visit, 30-39 min', units: 1, fee: 240.00 },
        { cptCode: '87880', description: 'Infectious agent antigen detection rapid test', units: 1, fee: 65.00 }
      ],
      totalAmount: 305.00,
      insuranceCoverageAmount: 245.00,
      copayAmount: 30.00,
      balanceDue: 30.00
    }
  },
  {
    id: 'pt_1003',
    tenantId: 'metro-gen',
    mrn: 'MRN-449021',
    firstName: 'Amara',
    lastName: 'Kovacs',
    dob: '1995-08-30',
    gender: 'Female',
    bloodType: 'B+',
    phone: '(555) 349-1109',
    insuranceProvider: 'UnitedHealthcare Choice',
    policyNumber: 'UHC-8810294',
    queueStatus: 'billing_reconciliation',
    triageAcuity: 4, // Less Urgent
    assignedRoom: 'Exam Room 4',
    assignedDoctor: 'Dr. Marcus Vance, MD',
    checkInTime: '2026-10-15T05:30:00Z',
    lastUpdated: '2026-10-15T07:25:00Z',
    allergies: [],
    vitals: [
      {
        bloodPressureSys: 118,
        bloodPressureDia: 74,
        heartRate: 72,
        oxygenSaturation: 99,
        temperatureF: 98.6,
        respiratoryRate: 16,
        painScale: 2,
        recordedAt: '2026-10-15T05:38:00Z',
        recordedBy: 'Nurse Elena Rostova, RN'
      }
    ],
    encounters: [
      {
        id: 'enc_883',
        patientId: 'pt_1003',
        tenantId: 'metro-gen',
        clinicianId: 'usr_doc_304',
        clinicianName: 'Dr. Marcus Vance, MD',
        encounterDate: '2026-10-15',
        chiefComplaint: 'Right ankle inversion sprain while jogging',
        subjectiveNotes: 'Stepped on uneven pavement. Immediate lateral ankle pain with swelling. Able to bear weight with moderate limp.',
        objectiveNotes: 'Edema over anterior talofibular ligament (ATFL). No tenderness over malleoli (Ottawa Ankle Rules negative for fracture). Anterior drawer mildly positive.',
        assessmentNotes: 'Grade II sprain of right anterior talofibular ligament.',
        psychiatricOrSensitiveNotes: 'No sensitive history.',
        icd10Codes: [
          { code: 'S93.411A', description: 'Sprain of calcaneofibular ligament of right ankle, initial encounter' }
        ],
        planNotes: 'RICE protocol (Rest, Ice, Compression, Elevation). Lace-up ankle brace prescribed. Ibuprofen 600mg TID with food.',
        isSigned: true,
        signedAt: '2026-10-15T06:20:00Z'
      }
    ],
    prescriptions: [
      {
        id: 'rx_9024',
        patientId: 'pt_1003',
        drugName: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosage: '600 mg tab',
        route: 'Oral (PO)',
        frequency: 'Every 8 hours with meals',
        durationDays: 7,
        prescribedBy: 'Dr. Marcus Vance, MD',
        doctorLicense: 'CA-MED-44012',
        prescribedAt: '2026-10-15T06:22:00Z',
        verifiedByDoctor: true,
        status: 'dispensed',
        dispensedBy: 'Dr. Priya Chen, PharmD',
        dispensedAt: '2026-10-15T06:55:00Z',
        batchLotNumber: 'LOT-IBU-992-B'
      }
    ],
    imagingOrders: [],
    billing: {
      id: 'inv_4003',
      patientId: 'pt_1003',
      tenantId: 'metro-gen',
      claimId: 'CLM-2026-9043',
      status: 'patient_responsibility',
      items: [
        { cptCode: '99213', description: 'Office outpatient visit, low medical decision making', units: 1, fee: 165.00 },
        { cptCode: '29540', description: 'Strapping; ankle and/or foot supportive splint', units: 1, fee: 85.00 }
      ],
      totalAmount: 250.00,
      insuranceCoverageAmount: 180.00,
      copayAmount: 25.00,
      balanceDue: 45.00
    }
  },
  {
    id: 'pt_1004',
    tenantId: 'metro-gen',
    mrn: 'MRN-330198',
    firstName: 'Mateo',
    lastName: 'Delgado',
    dob: '2001-02-14',
    gender: 'Male',
    bloodType: 'O+',
    phone: '(555) 902-8871',
    insuranceProvider: 'Kaiser Permanente HMO',
    policyNumber: 'KP-552910',
    queueStatus: 'waiting_triage',
    triageAcuity: 3,
    checkInTime: '2026-10-15T07:28:00Z',
    lastUpdated: '2026-10-15T07:28:00Z',
    allergies: [],
    vitals: [],
    encounters: [],
    prescriptions: [],
    imagingOrders: [],
    billing: {
      id: 'inv_4004',
      patientId: 'pt_1004',
      tenantId: 'metro-gen',
      claimId: 'CLM-2026-9044',
      status: 'unbilled',
      items: [],
      totalAmount: 0,
      insuranceCoverageAmount: 0,
      copayAmount: 0,
      balanceDue: 0
    }
  },
  // Patient for Westside Specialty Clinic
  {
    id: 'pt_2001',
    tenantId: 'westside-spec',
    mrn: 'MRN-WSS-1049',
    firstName: 'Genevieve',
    lastName: 'Mercer',
    dob: '1959-12-05',
    gender: 'Female',
    bloodType: 'AB-',
    phone: '(555) 612-9901',
    insuranceProvider: 'Medicare Advantage Part B',
    policyNumber: 'MED-992014-G',
    queueStatus: 'in_consultation',
    triageAcuity: 3,
    assignedRoom: 'Echo Lab Suite 2',
    assignedDoctor: 'Dr. Marcus Vance, MD',
    checkInTime: '2026-10-15T06:30:00Z',
    lastUpdated: '2026-10-15T07:18:00Z',
    allergies: [
      { allergen: 'Iodinated Radiocontrast', severity: 'life-threatening', reaction: 'Laryngeal edema, circulatory collapse' }
    ],
    vitals: [
      {
        bloodPressureSys: 136,
        bloodPressureDia: 84,
        heartRate: 68,
        oxygenSaturation: 97,
        temperatureF: 98.4,
        respiratoryRate: 16,
        painScale: 1,
        recordedAt: '2026-10-15T06:35:00Z',
        recordedBy: 'Nurse Elena Rostova, RN'
      }
    ],
    encounters: [
      {
        id: 'enc_901',
        patientId: 'pt_2001',
        tenantId: 'westside-spec',
        clinicianId: 'usr_doc_304',
        clinicianName: 'Dr. Marcus Vance, MD',
        encounterDate: '2026-10-15',
        chiefComplaint: 'Routine cardiac surveillance post aortic valve replacement',
        subjectiveNotes: 'Patient doing well. Exercises 30 minutes daily on stationary bicycle. No syncope or palpitations.',
        objectiveNotes: 'Mechanical S2 click crisp and regular. No regurgitant murmur. INR therapeutic at 2.6.',
        assessmentNotes: 'Aortic valve replacement surveillance (ICD-10 Z95.2). Warfarin anticoagulation stable.',
        psychiatricOrSensitiveNotes: '',
        icd10Codes: [
          { code: 'Z95.2', description: 'Presence of prosthetic heart valve' },
          { code: 'Z79.01', description: 'Long term (current) use of anticoagulants' }
        ],
        planNotes: 'Continue Warfarin 4mg daily. Repeat INR in 4 weeks. Transthoracic echocardiogram ordered.',
        isSigned: true,
        signedAt: '2026-10-15T07:00:00Z'
      }
    ],
    prescriptions: [
      {
        id: 'rx_9025',
        patientId: 'pt_2001',
        drugName: 'Warfarin (Coumadin)',
        genericName: 'Warfarin Sodium',
        dosage: '4 mg tab',
        route: 'Oral (PO)',
        frequency: 'Once Daily at 18:00',
        durationDays: 30,
        prescribedBy: 'Dr. Marcus Vance, MD',
        doctorLicense: 'CA-MED-44012',
        prescribedAt: '2026-10-15T07:05:00Z',
        verifiedByDoctor: true,
        status: 'queued_in_pharmacy'
      }
    ],
    imagingOrders: [
      {
        id: 'img_302',
        patientId: 'pt_2001',
        type: 'mri',
        title: 'Cardiac MRI Functional Flow Analysis',
        orderedBy: 'Dr. Marcus Vance, MD',
        orderedAt: '2026-10-15T06:40:00Z',
        status: 'imaging_uploaded',
        modality: 'Magnetic Resonance (MR)',
        imagingS3Key: 'tenants/westside-spec/patients/pt_2001/radiology/cardiac_mri_cine.dcm',
        imagingExpiresAt: '2026-10-15T08:50:00Z',
        findings: 'Normal prosthetic disc motion. Left ventricular ejection fraction preserved at 58%.',
        s3Encryption: 'AES256'
      }
    ],
    billing: {
      id: 'inv_4005',
      patientId: 'pt_2001',
      tenantId: 'westside-spec',
      claimId: 'CLM-2026-9045',
      status: 'pending_adjudication',
      items: [
        { cptCode: '93306', description: 'Transthoracic echocardiography complete with Doppler', units: 1, fee: 650.00 }
      ],
      totalAmount: 650.00,
      insuranceCoverageAmount: 520.00,
      copayAmount: 20.00,
      balanceDue: 110.00
    }
  },
  // Patient for Valley Urgent Care
  {
    id: 'pt_3001',
    tenantId: 'valley-urg',
    mrn: 'MRN-VUC-8802',
    firstName: 'Tobias',
    lastName: 'Fletcher',
    dob: '2012-06-18',
    gender: 'Male',
    bloodType: 'A-',
    phone: '(555) 441-2918',
    insuranceProvider: 'Cigna Open Access Plus',
    policyNumber: 'CIG-99120',
    queueStatus: 'waiting_doctor',
    triageAcuity: 3,
    assignedRoom: 'Exam Room 2',
    assignedDoctor: 'Dr. Marcus Vance, MD',
    checkInTime: '2026-10-15T07:10:00Z',
    lastUpdated: '2026-10-15T07:20:00Z',
    allergies: [],
    vitals: [
      {
        bloodPressureSys: 104,
        bloodPressureDia: 68,
        heartRate: 92,
        oxygenSaturation: 97,
        temperatureF: 102.2,
        respiratoryRate: 20,
        painScale: 6,
        recordedAt: '2026-10-15T07:15:00Z',
        recordedBy: 'Nurse Elena Rostova, RN'
      }
    ],
    encounters: [],
    prescriptions: [],
    imagingOrders: [],
    billing: {
      id: 'inv_4006',
      patientId: 'pt_3001',
      tenantId: 'valley-urg',
      claimId: 'CLM-2026-9046',
      status: 'unbilled',
      items: [],
      totalAmount: 0,
      insuranceCoverageAmount: 0,
      copayAmount: 0,
      balanceDue: 0
    }
  }
];

export const INITIAL_AUDIT_BLOCKS: AuditBlock[] = [
  {
    blockIndex: 0,
    timestamp: '2026-10-15T00:00:00.000Z',
    actorId: 'system_genesis',
    actorRole: 'compliance_auditor',
    actorName: 'ApexCare Genesis Engine',
    tenantId: 'metro-gen',
    action: 'SYSTEM_LEDGER_GENESIS',
    resourceType: 'system_root',
    resourceId: 'chain_genesis',
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    currentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    payloadSummary: 'Cryptographic immutable ledger anchor initialized with 256-bit zero root block.',
    signature: 'SIG_ED25519_ROOT_GENESIS_VERIFIED'
  },
  {
    blockIndex: 1,
    timestamp: '2026-10-15T05:30:12.000Z',
    actorId: 'usr_triage_901',
    actorRole: 'triage_nurse',
    actorName: 'Nurse Elena Rostova, RN',
    tenantId: 'metro-gen',
    action: 'TRIAGE_CHECKIN_ACUITY_ASSIGNED',
    resourceType: 'patient',
    resourceId: 'pt_1003',
    previousHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    currentHash: '4a8b75e9f82d1c68e1a3994bb720c29419b489ca688b17b07d643884b8401f92',
    payloadSummary: 'Patient Amara Kovacs (MRN-449021) checked into Valley Triage. Acuity Level 4 assigned.',
    deltaDiff: 'queueStatus: "waiting_triage" -> "triage_in_progress", vitals: BP 118/74 HR 72',
    signature: 'SIG_HMAC_SHA256_RN88219_VALIDATED'
  },
  {
    blockIndex: 2,
    timestamp: '2026-10-15T06:22:45.000Z',
    actorId: 'usr_doc_304',
    actorRole: 'clinician_doctor',
    actorName: 'Dr. Marcus Vance, MD',
    tenantId: 'metro-gen',
    action: 'CLINICAL_ENCOUNTER_SIGNED_AND_RX_ORDERED',
    resourceType: 'encounter',
    resourceId: 'enc_883',
    previousHash: '4a8b75e9f82d1c68e1a3994bb720c29419b489ca688b17b07d643884b8401f92',
    currentHash: 'c90a1b88e104928f991448b10543dd924f0c4bb7a346519da985012ca942bf11',
    payloadSummary: 'Dr. Vance signed clinical encounter for Amara Kovacs. Prescribed Ibuprofen 600mg PO.',
    deltaDiff: 'isSigned: true, status: "queued_in_pharmacy", icd10: S93.411A',
    signature: 'SIG_HMAC_SHA256_MD44012_VALIDATED'
  },
  {
    blockIndex: 3,
    timestamp: '2026-10-15T06:45:10.000Z',
    actorId: 'usr_triage_901',
    actorRole: 'triage_nurse',
    actorName: 'Nurse Elena Rostova, RN',
    tenantId: 'metro-gen',
    action: 'EMERGENCY_TRIAGE_INTAKE',
    resourceType: 'patient',
    resourceId: 'pt_1001',
    previousHash: 'c90a1b88e104928f991448b10543dd924f0c4bb7a346519da985012ca942bf11',
    currentHash: '8b3c10842fe9488a09e0487cd2290fbb66487192ba091177651a09d3bca24589',
    payloadSummary: 'Patient Eleanor Hawthorne (MRN-892104) triage: Acuity Level 2 (Emergent). BP 148/92, SpO2 94%.',
    deltaDiff: 'triageAcuity: 2, queueStatus: "waiting_doctor", room: "Exam Room 3"',
    signature: 'SIG_HMAC_SHA256_RN88219_VALIDATED'
  },
  {
    blockIndex: 4,
    timestamp: '2026-10-15T06:58:30.000Z',
    actorId: 'usr_doc_304',
    actorRole: 'clinician_doctor',
    actorName: 'Dr. Marcus Vance, MD',
    tenantId: 'metro-gen',
    action: 'AWS_S3_PRESIGNED_UPLOAD_TOKEN_ISSUED',
    resourceType: 'radiology_order',
    resourceId: 'img_301',
    previousHash: '8b3c10842fe9488a09e0487cd2290fbb66487192ba091177651a09d3bca24589',
    currentHash: '2049e9140aa9381745fba1894d8721c0b39519ae87bb49204918e95817a02cbf',
    payloadSummary: 'Issued S3 SigV4 Pre-Signed PUT token (TTL 900s) for Chest X-Ray DICOM ingestion with AES256 encryption.',
    deltaDiff: 'imagingS3Key: "tenants/metro-gen/patients/pt_1001/radiology/chest_xray_ap.dcm"',
    signature: 'SIG_HMAC_SHA256_S3_SIGV4_ISSUED'
  },
  {
    blockIndex: 5,
    timestamp: '2026-10-15T06:55:00.000Z',
    actorId: 'usr_pharm_512',
    actorRole: 'pharmacist',
    actorName: 'Dr. Priya Chen, PharmD',
    tenantId: 'metro-gen',
    action: 'PHARMACY_PRESCRIPTION_DISPENSED',
    resourceType: 'prescription',
    resourceId: 'rx_9024',
    previousHash: '2049e9140aa9381745fba1894d8721c0b39519ae87bb49204918e95817a02cbf',
    currentHash: 'f419b8849aa01099238e4a9081b238dc0049281a89c748924b10594a87224901',
    payloadSummary: 'Verified and dispensed Ibuprofen 600mg tab for Amara Kovacs. Lot # LOT-IBU-992-B logged.',
    deltaDiff: 'status: "dispensed", verifiedByDoctor: true, batchLot: "LOT-IBU-992-B"',
    signature: 'SIG_HMAC_SHA256_RPH61904_VALIDATED'
  }
];

export const INITIAL_QUEUE_EVENTS: QueueEvent[] = [
  {
    id: 'evt_101',
    timestamp: '2026-10-15T07:15:20Z',
    tenantId: 'metro-gen',
    patientId: 'pt_1001',
    patientName: 'Eleanor Hawthorne',
    mrn: 'MRN-892104',
    fromStatus: 'waiting_triage',
    toStatus: 'waiting_doctor',
    room: 'Exam Room 3',
    actor: 'Nurse Elena Rostova, RN',
    actorRole: 'triage_nurse',
    latencyMs: 8.4
  },
  {
    id: 'evt_102',
    timestamp: '2026-10-15T07:22:04Z',
    tenantId: 'metro-gen',
    patientId: 'pt_1002',
    patientName: 'Julian Sterling',
    mrn: 'MRN-773190',
    fromStatus: 'in_consultation',
    toStatus: 'pharmacy_dispense',
    room: 'Exam Room 1',
    actor: 'Dr. Marcus Vance, MD',
    actorRole: 'clinician_doctor',
    latencyMs: 9.1
  },
  {
    id: 'evt_103',
    timestamp: '2026-10-15T07:25:31Z',
    tenantId: 'metro-gen',
    patientId: 'pt_1003',
    patientName: 'Amara Kovacs',
    mrn: 'MRN-449021',
    fromStatus: 'pharmacy_dispense',
    toStatus: 'billing_reconciliation',
    room: 'Exam Room 4',
    actor: 'Dr. Priya Chen, PharmD',
    actorRole: 'pharmacist',
    latencyMs: 11.2
  }
];
