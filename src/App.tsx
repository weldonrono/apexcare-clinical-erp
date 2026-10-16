import React, { useState } from 'react';
import { 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  Stethoscope, 
  Activity, 
  Pill, 
  Receipt, 
  FileText, 
  Radio, 
  ChevronDown, 
  Plus, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { 
  TenantId, 
  UserRole, 
  Patient, 
  AuditBlock, 
  QueueEvent, 
  PatientQueueStatus 
} from './types';
import { 
  DEFAULT_USERS, 
  CLINIC_TENANTS, 
  ROLE_PERMISSIONS, 
  computeBlockHash 
} from './utils/crypto';
import { 
  INITIAL_PATIENTS, 
  INITIAL_AUDIT_BLOCKS, 
  INITIAL_QUEUE_EVENTS 
} from './data/mockDatabase';
import { RoomQueueBoard } from './components/RoomQueueBoard';
import { PatientDirectory } from './components/PatientDirectory';
import { PatientEmrDetail } from './components/PatientEmrDetail';
import { AuditLedgerView } from './components/AuditLedgerView';
import { TechnicalWalkthrough } from './components/TechnicalWalkthrough';

export default function App() {
  // Navigation tabs
  const [activeNav, setActiveNav] = useState<'queue' | 'directory' | 'audit' | 'walkthrough'>('queue');
  
  // Multi-tenant selection
  const [activeTenantId, setActiveTenantId] = useState<TenantId>('metro-gen');

  // Role switching
  const [activeRole, setActiveRole] = useState<UserRole>('clinician_doctor');

  // Database states
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [auditBlocks, setAuditBlocks] = useState<AuditBlock[]>(INITIAL_AUDIT_BLOCKS);
  const [pristineAuditBlocks, setPristineAuditBlocks] = useState<AuditBlock[]>(INITIAL_AUDIT_BLOCKS);
  const [queueEvents, setQueueEvents] = useState<QueueEvent[]>(INITIAL_QUEUE_EVENTS);

  // Selected patient for detailed EMR view
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Active user session derived from selected role
  const currentUser = {
    ...DEFAULT_USERS[activeRole],
    tenantId: activeTenantId
  };

  const currentTenant = CLINIC_TENANTS.find(t => t.id === activeTenantId) || CLINIC_TENANTS[0];

  // Helper to append a cryptographically hashed block to the immutable audit trail
  const logAuditEvent = async (action: string, summary: string, diff?: string) => {
    const prevBlock = auditBlocks[auditBlocks.length - 1];
    const newIndex = prevBlock ? prevBlock.blockIndex + 1 : 0;
    const prevHash = prevBlock ? prevBlock.currentHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();

    const currentHash = await computeBlockHash(
      newIndex,
      prevHash,
      timestamp,
      currentUser.id,
      currentUser.role,
      action,
      selectedPatientId || 'system',
      summary
    );

    const newBlock: AuditBlock = {
      blockIndex: newIndex,
      timestamp,
      actorId: currentUser.id,
      actorRole: currentUser.role,
      actorName: currentUser.name,
      tenantId: activeTenantId,
      action,
      resourceType: 'emr_record',
      resourceId: selectedPatientId || 'system',
      previousHash: prevHash,
      currentHash,
      payloadSummary: summary,
      deltaDiff: diff,
      signature: `SIG_HMAC_SHA256_${currentUser.badgeNumber}_VALIDATED`
    };

    setAuditBlocks(prev => [...prev, newBlock]);
    setPristineAuditBlocks(prev => [...prev, newBlock]);
  };

  // Transition patient status and log Redis pub/sub queue event
  const handleTransitionStatus = (patientId: string, toStatus: PatientQueueStatus, room?: string) => {
    const targetPatient = patients.find(p => p.id === patientId);
    if (!targetPatient) return;

    const fromStatus = targetPatient.queueStatus;

    const updatedPatients = patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          queueStatus: toStatus,
          assignedRoom: room || p.assignedRoom,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });

    setPatients(updatedPatients);

    // Append to live Redis event stream
    const newQueueEvent: QueueEvent = {
      id: `evt_${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      tenantId: activeTenantId,
      patientId,
      patientName: `${targetPatient.firstName} ${targetPatient.lastName}`,
      mrn: targetPatient.mrn,
      fromStatus,
      toStatus,
      room,
      actor: currentUser.name,
      actorRole: currentUser.role,
      latencyMs: Number((Math.random() * 4 + 7).toFixed(1))
    };

    setQueueEvents(prev => [newQueueEvent, ...prev]);

    // Append to immutable audit ledger
    logAuditEvent(
      'QUEUE_STATUS_TRANSITION',
      `${currentUser.name} transferred ${targetPatient.firstName} ${targetPatient.lastName} (${targetPatient.mrn}) from ${fromStatus} to ${toStatus}${room ? ` in ${room}` : ''}`,
      `status: "${fromStatus}" -> "${toStatus}"`
    );
  };

  // Tamper simulation for auditor testing
  const handleTamperBlock = (blockIndex: number, fakePayload: string) => {
    setAuditBlocks(prev =>
      prev.map(b => {
        if (b.blockIndex === blockIndex) {
          return {
            ...b,
            payloadSummary: fakePayload,
            deltaDiff: '[TAMPERED BY SIMULATED ATTACKER]'
          };
        }
        return b;
      })
    );
  };

  const handleRestoreLedger = () => {
    setAuditBlocks([...pristineAuditBlocks]);
  };

  // Patient detail view helper
  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Bar Contract: 3 zones separated by gap-8: [Brand wordmark] - [4 single-line nav links] - [1 primary action] */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0 sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-900/40">
            A
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100">
            ApexCare Clinical ERP
          </span>
        </div>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => {
              setActiveNav('queue');
              setSelectedPatientId(null);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeNav === 'queue' && !selectedPatientId ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Live Consultation Queue
          </button>

          <button
            onClick={() => {
              setActiveNav('directory');
              setSelectedPatientId(null);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeNav === 'directory' && !selectedPatientId ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Patient EMR Charts
          </button>

          <button
            onClick={() => {
              setActiveNav('audit');
              setSelectedPatientId(null);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeNav === 'audit' && !selectedPatientId ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Cryptographic Audit Ledger
          </button>

          <button
            onClick={() => {
              setActiveNav('walkthrough');
              setSelectedPatientId(null);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeNav === 'walkthrough' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Technical Architecture & Walkthrough
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setActiveNav('walkthrough');
              setSelectedPatientId(null);
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm transition whitespace-nowrap shrink-0"
          >
            Architecture Walkthrough
          </button>
        </div>
      </header>

      {/* Workspace Operational Toolbar (Clinic Tenant & Role Switcher) */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        {/* Tenant Selector */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-slate-400 font-medium hidden sm:inline">Active Facility:</span>
          <select
            value={activeTenantId}
            onChange={(e) => {
              setActiveTenantId(e.target.value as TenantId);
              setSelectedPatientId(null);
            }}
            className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-medium focus:ring-1 focus:ring-cyan-500"
          >
            {CLINIC_TENANTS.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.city})
              </option>
            ))}
          </select>
        </div>

        {/* Interactive Role Switcher for SLO #1 Demonstration */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium hidden md:inline">Simulate Active Role:</span>
          <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg gap-1">
            <button
              onClick={() => setActiveRole('triage_nurse')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                activeRole === 'triage_nurse' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Triage Nurse
            </button>
            <button
              onClick={() => setActiveRole('clinician_doctor')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                activeRole === 'clinician_doctor' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Clinician Doctor
            </button>
            <button
              onClick={() => setActiveRole('pharmacist')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                activeRole === 'pharmacist' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pharmacist
            </button>
            <button
              onClick={() => setActiveRole('billing_cashier')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                activeRole === 'billing_cashier' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Billing Cashier
            </button>
            <button
              onClick={() => setActiveRole('compliance_auditor')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                activeRole === 'compliance_auditor' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auditor
            </button>
          </div>
        </div>

        {/* User Badge Info */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold">{currentUser.name}</span>
          <span className="text-slate-500">[{currentUser.badgeNumber}]</span>
        </div>
      </div>

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* Render Patient Detail View if a patient is selected */}
        {selectedPatient ? (
          <PatientEmrDetail
            patient={selectedPatient}
            userRole={activeRole}
            userScopes={currentUser.scopes}
            onBack={() => setSelectedPatientId(null)}
            onUpdatePatient={(updated) => {
              setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
            }}
            onLogAuditEvent={logAuditEvent}
          />
        ) : (
          <>
            {activeNav === 'queue' && (
              <RoomQueueBoard
                patients={patients}
                queueEvents={queueEvents}
                activeTenantId={activeTenantId}
                userRole={activeRole}
                onTransitionStatus={handleTransitionStatus}
                onSelectPatient={(p) => setSelectedPatientId(p.id)}
              />
            )}

            {activeNav === 'directory' && (
              <PatientDirectory
                patients={patients}
                activeTenantId={activeTenantId}
                userRole={activeRole}
                onSelectPatient={(p) => setSelectedPatientId(p.id)}
                onRegisterPatient={(newPt) => {
                  setPatients(prev => [newPt, ...prev]);
                  logAuditEvent(
                    'NEW_PATIENT_INTAKE_REGISTERED',
                    `Nurse registered new patient: ${newPt.firstName} ${newPt.lastName} (${newPt.mrn})`,
                    `Created MRN: ${newPt.mrn}, Triage Acuity: ${newPt.triageAcuity}`
                  );
                }}
              />
            )}

            {activeNav === 'audit' && (
              <AuditLedgerView
                blocks={auditBlocks}
                activeTenantId={activeTenantId}
                onTamperBlock={handleTamperBlock}
                onRestoreLedger={handleRestoreLedger}
              />
            )}

            {activeNav === 'walkthrough' && (
              <TechnicalWalkthrough />
            )}
          </>
        )}
      </main>

      {/* Quiet Minimal Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        ApexCare Multi-Tenant Clinical ERP & Secure Medical Records · PostgreSQL RBAC Schema · AWS S3 SigV4 · Redis Pub/Sub
      </footer>
    </div>
  );
}
