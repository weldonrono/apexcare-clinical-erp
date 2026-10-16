export type TenantId = 'metro-gen' | 'westside-spec' | 'valley-urg';

export interface Tenant {
  id: TenantId;
  name: string;
  type: string;
  city: string;
  activeClinicians: number;
  totalRooms: number;
}

export type UserRole = 
  | 'triage_nurse'
  | 'clinician_doctor'
  | 'pharmacist'
  | 'billing_cashier'
  | 'compliance_auditor';

export type ClinicalScope =
  | 'triage:intake'
  | 'emr:read_diagnostics'
  | 'emr:write_encounter'
  | 'rx:prescribe'
  | 'pharmacy:dispense'
  | 'billing:reconcile'
  | 's3:generate_presigned_url'
  | 'audit:read'
  | 'audit:verify'
  | 'tenant:manage';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  badgeNumber: string;
  tenantId: TenantId;
  scopes: ClinicalScope[];
  avatar: string;
}

export type TriageAcuity = 1 | 2 | 3 | 4 | 5; // ESI: 1-Immediate/Resuscitation, 2-Emergent, 3-Urgent, 4-Less Urgent, 5-Non-urgent

export type PatientQueueStatus =
  | 'waiting_triage'
  | 'triage_in_progress'
  | 'waiting_doctor'
  | 'in_consultation'
  | 'lab_radiology_pending'
  | 'pharmacy_dispense'
  | 'billing_reconciliation'
  | 'discharged';

export interface VitalSigns {
  bloodPressureSys: number;
  bloodPressureDia: number;
  heartRate: number;
  oxygenSaturation: number;
  temperatureF: number;
  respiratoryRate: number;
  painScale: number; // 0-10
  recordedAt: string;
  recordedBy: string;
}

export interface Allergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  reaction: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  drugName: string;
  genericName: string;
  dosage: string;
  route: string;
  frequency: string;
  durationDays: number;
  prescribedBy: string;
  doctorLicense: string;
  prescribedAt: string;
  verifiedByDoctor: boolean;
  status: 'pending_doctor_sig' | 'queued_in_pharmacy' | 'dispensed' | 'cancelled';
  dispensedBy?: string;
  dispensedAt?: string;
  batchLotNumber?: string;
  allergyWarning?: string;
}

export interface LabRadiologyOrder {
  id: string;
  patientId: string;
  type: 'xray' | 'mri' | 'ct_scan' | 'blood_panel' | 'metabolic_panel';
  title: string;
  orderedBy: string;
  orderedAt: string;
  status: 'ordered' | 'imaging_uploaded' | 'completed';
  modality?: string;
  imagingS3Key?: string;
  imagingPresignedUrl?: string;
  imagingExpiresAt?: string;
  findings?: string;
  s3Encryption: 'AES256' | 'aws:kms';
}

export interface ClinicalEncounter {
  id: string;
  patientId: string;
  tenantId: TenantId;
  clinicianId: string;
  clinicianName: string;
  encounterDate: string;
  chiefComplaint: string;
  subjectiveNotes: string;
  objectiveNotes: string;
  assessmentNotes: string; // Sensitive clinical diagnosis
  psychiatricOrSensitiveNotes?: string; // Highest sensitivity
  icd10Codes: { code: string; description: string }[];
  planNotes: string;
  isSigned: boolean;
  signedAt?: string;
}

export interface BillingInvoice {
  id: string;
  patientId: string;
  tenantId: TenantId;
  claimId: string;
  status: 'unbilled' | 'pending_adjudication' | 'paid_in_full' | 'patient_responsibility';
  items: {
    cptCode: string;
    description: string;
    units: number;
    fee: number;
  }[];
  totalAmount: number;
  insuranceCoverageAmount: number;
  copayAmount: number;
  balanceDue: number;
  paymentMethod?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  // Note: Billing specialist does NOT receive sensitive diagnosis text, only the CPT billing codes & masked ICD-10 grouping.
}

export interface Patient {
  id: string;
  tenantId: TenantId;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Female' | 'Male' | 'Other';
  bloodType: string;
  phone: string;
  insuranceProvider: string;
  policyNumber: string;
  queueStatus: PatientQueueStatus;
  triageAcuity: TriageAcuity;
  assignedRoom?: string;
  assignedDoctor?: string;
  checkInTime: string;
  lastUpdated: string;
  allergies: Allergy[];
  vitals: VitalSigns[];
  encounters: ClinicalEncounter[];
  prescriptions: Prescription[];
  imagingOrders: LabRadiologyOrder[];
  billing: BillingInvoice;
}

export interface AuditBlock {
  blockIndex: number;
  timestamp: string;
  actorId: string;
  actorRole: UserRole;
  actorName: string;
  tenantId: TenantId;
  action: string;
  resourceType: string;
  resourceId: string;
  previousHash: string;
  currentHash: string;
  payloadSummary: string;
  deltaDiff?: string;
  signature: string;
}

export interface QueueEvent {
  id: string;
  timestamp: string;
  tenantId: TenantId;
  patientId: string;
  patientName: string;
  mrn: string;
  fromStatus: PatientQueueStatus;
  toStatus: PatientQueueStatus;
  room?: string;
  actor: string;
  actorRole: UserRole;
  latencyMs: number;
}
