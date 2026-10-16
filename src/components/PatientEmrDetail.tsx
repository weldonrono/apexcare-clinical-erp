import React, { useState } from 'react';
import { 
  Patient, 
  UserRole, 
  ClinicalScope, 
  Prescription, 
  LabRadiologyOrder, 
  ClinicalEncounter,
  VitalSigns
} from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  Pill, 
  Stethoscope, 
  Activity, 
  FileText, 
  AlertTriangle, 
  Receipt, 
  Radio, 
  CheckCircle2, 
  Plus, 
  UploadCloud, 
  Calendar, 
  Phone, 
  Clock, 
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { DicomViewer } from './DicomViewer';
import { S3UploadModal } from './S3UploadModal';

interface PatientEmrDetailProps {
  patient: Patient;
  userRole: UserRole;
  userScopes: ClinicalScope[];
  onBack: () => void;
  onUpdatePatient: (updated: Patient) => void;
  onLogAuditEvent: (action: string, summary: string, diff?: string) => void;
}

export const PatientEmrDetail: React.FC<PatientEmrDetailProps> = ({
  patient,
  userRole,
  userScopes,
  onBack,
  onUpdatePatient,
  onLogAuditEvent
}) => {
  const [activeTab, setActiveTab] = useState<'clinical' | 'vitals' | 'prescriptions' | 'radiology' | 'billing'>('clinical');
  const [isS3ModalOpen, setIsS3ModalOpen] = useState(false);
  const [showAddRx, setShowAddRx] = useState(false);
  const [showAddVitals, setShowAddVitals] = useState(false);

  // New Rx form state
  const [newDrug, setNewDrug] = useState({
    name: 'Amoxicillin-Clavulanate',
    dosage: '875/125 mg',
    route: 'Oral (PO)',
    frequency: 'BID (Twice Daily)',
    durationDays: 10
  });

  // New Vitals form state
  const [newVitals, setNewVitals] = useState<Partial<VitalSigns>>({
    bloodPressureSys: 120,
    bloodPressureDia: 80,
    heartRate: 72,
    oxygenSaturation: 98,
    temperatureF: 98.6,
    respiratoryRate: 16,
    painScale: 0
  });

  // RBAC Permission checks
  const canReadDiagnostics = userScopes.includes('emr:read_diagnostics');
  const canWriteEncounter = userScopes.includes('emr:write_encounter');
  const canPrescribe = userScopes.includes('rx:prescribe');
  const canDispense = userScopes.includes('pharmacy:dispense');
  const canReconcileBilling = userScopes.includes('billing:reconcile');
  const canTriageIntake = userScopes.includes('triage:intake');

  // Allergy warning checker for Eleanor Hawthorne or any patient
  const hasPenicillinAllergy = patient.allergies.some(a => 
    a.allergen.toLowerCase().includes('penicillin') || a.allergen.toLowerCase().includes('amoxicillin')
  );

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPrescribe) return;

    // Allergy conflict check
    const isConflict = hasPenicillinAllergy && (newDrug.name.toLowerCase().includes('amoxicillin') || newDrug.name.toLowerCase().includes('penicillin'));
    
    const newRx: Prescription = {
      id: `rx_${Date.now().toString().slice(-4)}`,
      patientId: patient.id,
      drugName: newDrug.name,
      genericName: newDrug.name,
      dosage: newDrug.dosage,
      route: newDrug.route,
      frequency: newDrug.frequency,
      durationDays: newDrug.durationDays,
      prescribedBy: 'Dr. Marcus Vance, MD',
      doctorLicense: 'CA-MED-44012',
      prescribedAt: new Date().toISOString(),
      verifiedByDoctor: true,
      status: 'queued_in_pharmacy',
      allergyWarning: isConflict ? 'CONTRAINDICATION WARNING: Patient has registered Penicillin allergy!' : undefined
    };

    const updatedPatient: Patient = {
      ...patient,
      prescriptions: [newRx, ...patient.prescriptions],
      queueStatus: 'pharmacy_dispense',
      lastUpdated: new Date().toISOString()
    };

    onUpdatePatient(updatedPatient);
    onLogAuditEvent(
      'PRESCRIPTION_ORDERED_BY_PHYSICIAN',
      `Dr. Marcus Vance ordered ${newDrug.name} ${newDrug.dosage} for ${patient.firstName} ${patient.lastName}`,
      `Added Prescription ID ${newRx.id}, routed to Pharmacy Queue`
    );

    setShowAddRx(false);
  };

  const handleDispenseRx = (rxId: string) => {
    if (!canDispense) return;

    const updatedRx = patient.prescriptions.map(rx => {
      if (rx.id === rxId) {
        return {
          ...rx,
          status: 'dispensed' as const,
          dispensedBy: 'Dr. Priya Chen, PharmD',
          dispensedAt: new Date().toISOString(),
          batchLotNumber: `LOT-RX-${Math.floor(1000 + Math.random() * 9000)}-D`
        };
      }
      return rx;
    });

    const updatedPatient: Patient = {
      ...patient,
      prescriptions: updatedRx,
      queueStatus: 'billing_reconciliation',
      lastUpdated: new Date().toISOString()
    };

    onUpdatePatient(updatedPatient);
    onLogAuditEvent(
      'PHARMACY_DISPENSED_PRESCRIPTION',
      `Pharmacist Dr. Priya Chen dispensed Rx #${rxId} for ${patient.firstName} ${patient.lastName}`,
      `Status changed to 'dispensed', Lot batch authenticated`
    );
  };

  const handleCollectPayment = () => {
    if (!canReconcileBilling) return;

    const updatedPatient: Patient = {
      ...patient,
      billing: {
        ...patient.billing,
        status: 'paid_in_full',
        balanceDue: 0,
        paymentMethod: 'HSA / Commercial Insurance Adjudicated',
        reconciledAt: new Date().toISOString(),
        reconciledBy: 'David O\'Connor (Revenue Cycle)'
      },
      queueStatus: 'discharged',
      lastUpdated: new Date().toISOString()
    };

    onUpdatePatient(updatedPatient);
    onLogAuditEvent(
      'BILLING_CLAIM_ADJUDICATED_AND_SETTLED',
      `Cashier David O'Connor settled claim ${patient.billing.claimId} ($${patient.billing.balanceDue} collected)`,
      `Status: paid_in_full, Patient discharged`
    );
  };

  const handleAddVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const vitalsRecord: VitalSigns = {
      bloodPressureSys: Number(newVitals.bloodPressureSys || 120),
      bloodPressureDia: Number(newVitals.bloodPressureDia || 80),
      heartRate: Number(newVitals.heartRate || 72),
      oxygenSaturation: Number(newVitals.oxygenSaturation || 98),
      temperatureF: Number(newVitals.temperatureF || 98.6),
      respiratoryRate: Number(newVitals.respiratoryRate || 16),
      painScale: Number(newVitals.painScale || 0),
      recordedAt: new Date().toISOString(),
      recordedBy: 'Nurse Elena Rostova, RN'
    };

    const updatedPatient: Patient = {
      ...patient,
      vitals: [vitalsRecord, ...patient.vitals],
      lastUpdated: new Date().toISOString()
    };

    onUpdatePatient(updatedPatient);
    onLogAuditEvent(
      'TRIAGE_VITALS_RECORDED',
      `Nurse Elena Rostova recorded vitals for ${patient.firstName} ${patient.lastName}: BP ${vitalsRecord.bloodPressureSys}/${vitalsRecord.bloodPressureDia}, HR ${vitalsRecord.heartRate}`,
      `Vitals logged to permanent clinical record`
    );
    setShowAddVitals(false);
  };

  const handleS3UploadSuccess = (order: any) => {
    const updatedPatient: Patient = {
      ...patient,
      imagingOrders: [order, ...patient.imagingOrders],
      lastUpdated: new Date().toISOString()
    };
    onUpdatePatient(updatedPatient);
    onLogAuditEvent(
      'AWS_S3_PACS_INGESTION_COMPLETED',
      `Direct S3 upload completed for ${patient.firstName} ${patient.lastName}: ${order.title}`,
      `Object key: ${order.imagingS3Key}, Server-side encryption AES256`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition shrink-0"
              title="Return to Queue Board"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-100">
                  {patient.firstName} {patient.lastName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-mono text-xs text-slate-300">
                  {patient.mrn}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  DOB: {patient.dob} ({new Date().getFullYear() - new Date(patient.dob).getFullYear()}y) · {patient.gender}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                <span>Blood: <strong className="text-slate-200">{patient.bloodType}</strong></span>
                <span>·</span>
                <span>Insurance: <strong className="text-slate-200">{patient.insuranceProvider}</strong></span>
                <span>·</span>
                <span>Policy: <strong className="text-slate-200">{patient.policyNumber}</strong></span>
              </div>
            </div>
          </div>

          {/* RBAC Isolation Badge */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-right">
              <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 font-mono">
                {canReadDiagnostics ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Full EMR Diagnostic Access
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Redacted Diagnostic Scopes (SLO #1)
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                Current Role: <span className="font-mono text-cyan-400">{userRole}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Allergy Alert Banner if any */}
        {patient.allergies.length > 0 && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold text-rose-200">Documented Allergies:</span>
              <div className="flex items-center gap-2">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700/60 font-mono text-[11px]">
                    {a.allergen} ({a.severity}) — {a.reaction}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-mono text-rose-400">Cross-Checked on Prescribing</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'clinical'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Encounter & SOAP</span>
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'vitals'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Vital Signs & Triage</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'prescriptions'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Prescriptions ({patient.prescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('radiology')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'radiology'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>PACS & S3 Radiology</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'billing'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Billing & Claims</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Clinical Encounter & SOAP */}
      {activeTab === 'clinical' && (
        <div className="space-y-6">
          {patient.encounters.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No clinical encounters signed for this patient yet. Doctor examination pending.
            </div>
          ) : (
            patient.encounters.map(encounter => (
              <div key={encounter.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{encounter.chiefComplaint}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      Encounter Date: {encounter.encounterDate} · Attending: {encounter.clinicianName}
                    </div>
                  </div>
                  {encounter.isSigned && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Clinician Cryptographically Signed
                    </span>
                  )}
                </div>

                {/* Granular RBAC Demonstration: Redaction of Clinical Notes for Billing/Cashier */}
                {!canReadDiagnostics ? (
                  <div className="p-6 bg-slate-950 border border-amber-800/80 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <Lock className="w-4 h-4 text-amber-400" />
                      SLO #1 ENFORCED: Clinical SOAP Notes Redacted
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your current role (<span className="font-mono text-cyan-300">{userRole}</span>) does not possess the clinical scope{' '}
                      <span className="font-mono text-amber-300">`emr:read_diagnostics`</span>. Under HIPAA minimum-necessary access principles,
                      confidential diagnostic narratives and psychiatric formulations are stripped at the API middleware layer.
                    </p>
                    <div className="p-3 bg-slate-900 rounded font-mono text-xs text-slate-500">
                      [REDACTED: SENSITIVE CLINICAL ASSESSMENT - ACCESS LEVEL RESTRICTED]
                    </div>
                  </div>
                ) : (
                  /* Full SOAP notes for Doctor/Clinician */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono text-cyan-400">
                          S - Subjective
                        </div>
                        <p className="text-slate-300 leading-relaxed">{encounter.subjectiveNotes}</p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono text-cyan-400">
                          O - Objective
                        </div>
                        <p className="text-slate-300 leading-relaxed">{encounter.objectiveNotes}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono text-cyan-400">
                          A - Assessment & Diagnosis
                        </div>
                        <p className="text-slate-300 leading-relaxed font-medium">{encounter.assessmentNotes}</p>

                        {/* ICD-10 Coding */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                          <div className="text-[11px] font-mono text-slate-500">ICD-10 Diagnostic Codes:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {encounter.icd10Codes.map(icd => (
                              <span key={icd.code} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300">
                                <strong>{icd.code}</strong>: {icd.description}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-mono text-cyan-400">
                          P - Plan & Interventions
                        </div>
                        <p className="text-slate-300 leading-relaxed">{encounter.planNotes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sensitive / Psychiatric notes section */}
                {encounter.psychiatricOrSensitiveNotes && (
                  <div className="p-4 bg-slate-950 border border-purple-900/60 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-purple-300 font-semibold font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-purple-400" />
                        Confidential Behavioral & Sensitive Health Record
                      </span>
                      <span>Restricted to Attending Clinician</span>
                    </div>
                    {canReadDiagnostics ? (
                      <p className="text-slate-300 font-mono text-xs leading-relaxed">
                        {encounter.psychiatricOrSensitiveNotes}
                      </p>
                    ) : (
                      <div className="text-slate-500 font-mono text-xs">
                        [RESTRICTED: BEHAVIORAL HEALTH DATA CONCEALED BY POLICY]
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Vital Signs & Triage */}
      {activeTab === 'vitals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Vital Signs Flowsheet</h3>
            {canTriageIntake && (
              <button
                onClick={() => setShowAddVitals(!showAddVitals)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New Vitals</span>
              </button>
            )}
          </div>

          {/* Add Vitals Form */}
          {showAddVitals && (
            <form onSubmit={handleAddVitals} className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Blood Pressure (Sys/Dia)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="120"
                      value={newVitals.bloodPressureSys}
                      onChange={e => setNewVitals({ ...newVitals, bloodPressureSys: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                    />
                    <span className="text-slate-500">/</span>
                    <input
                      type="number"
                      placeholder="80"
                      value={newVitals.bloodPressureDia}
                      onChange={e => setNewVitals({ ...newVitals, bloodPressureDia: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={newVitals.heartRate}
                    onChange={e => setNewVitals({ ...newVitals, heartRate: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={newVitals.oxygenSaturation}
                    onChange={e => setNewVitals({ ...newVitals, oxygenSaturation: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVitals.temperatureF}
                    onChange={e => setNewVitals({ ...newVitals, temperatureF: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVitals(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 text-white rounded text-xs font-medium"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          )}

          {/* Vitals List */}
          <div className="space-y-3">
            {patient.vitals.map((v, i) => (
              <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Recorded: {new Date(v.recordedAt).toLocaleString()}</span>
                  <span>Recorded by: {v.recordedBy}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Blood Pressure</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {v.bloodPressureSys}/{v.bloodPressureDia} <span className="text-[10px] text-slate-500">mmHg</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Heart Rate</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {v.heartRate} <span className="text-[10px] text-slate-500">bpm</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">SpO2 Oxygen</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                      {v.oxygenSaturation}%
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Temperature</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {v.temperatureF}°F
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Respiration</div>
                    <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                      {v.respiratoryRate} <span className="text-[10px] text-slate-500">/min</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400">Pain Scale</div>
                    <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                      {v.painScale} / 10
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Prescriptions & Dispensation */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Medication Orders & Pharmacy Station</h3>
              <p className="text-xs text-slate-400">
                Doctors prescribe with license verification · Pharmacists review allergy interactions before dispensation.
              </p>
            </div>
            {canPrescribe && (
              <button
                onClick={() => setShowAddRx(!showAddRx)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Prescription</span>
              </button>
            )}
          </div>

          {/* New Prescription Form */}
          {showAddRx && (
            <form onSubmit={handleAddPrescription} className="p-5 bg-slate-900 border border-slate-700 rounded-xl space-y-4">
              <div className="font-semibold text-xs text-slate-200 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-400" />
                Electronic Prescription Writer (e-Rx)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Medication Name</label>
                  <select
                    value={newDrug.name}
                    onChange={e => setNewDrug({ ...newDrug, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs"
                  >
                    <option value="Amoxicillin-Clavulanate">Amoxicillin-Clavulanate (Augmentin) [Penicillin Class]</option>
                    <option value="Clopidogrel (Plavix)">Clopidogrel (Plavix) 75mg</option>
                    <option value="Atorvastatin (Lipitor)">Atorvastatin (Lipitor) 40mg</option>
                    <option value="Azithromycin (Zithromax)">Azithromycin (Z-Pak) 250mg</option>
                    <option value="Lisinopril">Lisinopril 10mg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Dosage & Strength</label>
                  <input
                    type="text"
                    value={newDrug.dosage}
                    onChange={e => setNewDrug({ ...newDrug, dosage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Frequency & Instructions</label>
                  <input
                    type="text"
                    value={newDrug.frequency}
                    onChange={e => setNewDrug({ ...newDrug, frequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Allergy Alert in writer */}
              {hasPenicillinAllergy && newDrug.name.includes('Amoxicillin') && (
                <div className="p-3 bg-rose-950/70 border border-rose-600 rounded-lg flex items-center gap-2 text-xs text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    CRITICAL WARNING: Patient Eleanor Hawthorne has documented life-threatening allergy to Penicillin/Amoxicillin!
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRx(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium"
                >
                  Sign & Authorize (MD-44012)
                </button>
              </div>
            </form>
          )}

          {/* Rx Orders list */}
          <div className="space-y-3">
            {patient.prescriptions.map(rx => (
              <div key={rx.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-400">
                      <Pill className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{rx.drugName}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {rx.dosage} · {rx.route} · {rx.frequency} · {rx.durationDays} Days
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-medium ${
                      rx.status === 'dispensed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {rx.status === 'dispensed' ? 'Dispensed' : 'Queued in Pharmacy'}
                    </span>

                    {/* Pharmacist Action Button */}
                    {canDispense && rx.status !== 'dispensed' && (
                      <button
                        onClick={() => handleDispenseRx(rx.id)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg shadow transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispense & Authenticate Lot</span>
                      </button>
                    )}
                  </div>
                </div>

                {rx.allergyWarning && (
                  <div className="p-2.5 bg-rose-950/50 border border-rose-800 rounded text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{rx.allergyWarning}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                  <span>Prescribed by: {rx.prescribedBy} ({rx.doctorLicense})</span>
                  {rx.dispensedBy && (
                    <span className="text-emerald-400">
                      Dispensed by: {rx.dispensedBy} · Batch: {rx.batchLotNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: PACS & S3 Radiology */}
      {activeTab === 'radiology' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">PACS Radiology & AWS S3 Vault</h3>
              <p className="text-xs text-slate-400">
                SLO #3: Zero-exposure direct-to-S3 ingestion · 15-minute presigned SigV4 tokens with AES-256 encryption.
              </p>
            </div>

            {userRole === 'clinician_doctor' && (
              <button
                onClick={() => setIsS3ModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Request S3 Ingestion Token</span>
              </button>
            )}
          </div>

          {patient.imagingOrders.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No radiology imaging studies ordered for this patient.
            </div>
          ) : (
            patient.imagingOrders.map(order => (
              <div key={order.id} className="space-y-4">
                <DicomViewer
                  patientName={`${patient.firstName} ${patient.lastName}`}
                  patientMrn={patient.mrn}
                  modality={order.modality}
                  examTitle={order.title}
                  s3Key={order.imagingS3Key || 'tenants/metro-gen/patients/radiology/exam.dcm'}
                  expiresInSeconds={900}
                />

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-slate-200">Radiologist Diagnostic Findings:</div>
                  <p className="text-slate-300 font-mono leading-relaxed">{order.findings}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: Billing & Claims Reconciliation */}
      {activeTab === 'billing' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Revenue Cycle & Claims Adjudication</h3>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Claim ID: {patient.billing.claimId} · Payer: {patient.insuranceProvider}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-mono font-medium ${
              patient.billing.status === 'paid_in_full'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              Status: {patient.billing.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* CPT Charge Code Itemized Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-left font-mono">
                  <th className="py-2.5">CPT Code</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5 text-center">Units</th>
                  <th className="py-2.5 text-right">Standard Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {patient.billing.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-2.5 text-cyan-400 font-bold">{item.cptCode}</td>
                    <td className="py-2.5 text-slate-300">{item.description}</td>
                    <td className="py-2.5 text-center text-slate-400">{item.units}</td>
                    <td className="py-2.5 text-right text-slate-200 tabular-nums">${item.fee.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 max-w-sm ml-auto space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Gross Total Charges:</span>
              <span className="tabular-nums text-slate-200">${patient.billing.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Insurance Payout (80%):</span>
              <span className="tabular-nums">-${patient.billing.insuranceCoverageAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Patient Copay:</span>
              <span className="tabular-nums text-slate-200">${patient.billing.copayAmount.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-cyan-300">
              <span>Patient Balance Due:</span>
              <span className="tabular-nums text-base">${patient.billing.balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Button for Billing Cashier */}
          {canReconcileBilling && patient.billing.status !== 'paid_in_full' && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleCollectPayment}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg transition"
              >
                <DollarSign className="w-4 h-4" />
                <span>Collect ${patient.billing.balanceDue.toFixed(2)} & Reconcile Ledger</span>
              </button>
            </div>
          )}

          {patient.billing.reconciledBy && (
            <div className="text-[11px] font-mono text-emerald-400">
              Reconciled by: {patient.billing.reconciledBy} on {new Date(patient.billing.reconciledAt || '').toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* S3 Ingestion Modal */}
      <S3UploadModal
        patientId={patient.id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        patientMrn={patient.mrn}
        isOpen={isS3ModalOpen}
        onClose={() => setIsS3ModalOpen(false)}
        onUploadSuccess={handleS3UploadSuccess}
      />
    </div>
  );
};
