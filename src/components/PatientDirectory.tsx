import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Stethoscope, 
  Filter, 
  ChevronRight, 
  FileText, 
  AlertTriangle, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { Patient, TenantId, UserRole } from '../types';

interface PatientDirectoryProps {
  patients: Patient[];
  activeTenantId: TenantId;
  userRole: UserRole;
  onSelectPatient: (patient: Patient) => void;
  onRegisterPatient: (newPatient: Patient) => void;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  activeTenantId,
  userRole,
  onSelectPatient,
  onRegisterPatient
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  // New patient form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '1990-01-01',
    gender: 'Female' as 'Female' | 'Male' | 'Other',
    bloodType: 'O+',
    phone: '(555) 000-0000',
    insuranceProvider: 'Blue Cross Blue Shield PPO',
    policyNumber: 'BCBS-100293',
    triageAcuity: 3 as const,
    chiefComplaint: ''
  });

  const tenantPatients = patients.filter(p => p.tenantId === activeTenantId);

  const filtered = tenantPatients.filter(p => {
    const matchesSearch =
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.insuranceProvider.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.queueStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) return;

    const mrnNum = Math.floor(100000 + Math.random() * 900000);
    const newPt: Patient = {
      id: `pt_${Date.now().toString().slice(-4)}`,
      tenantId: activeTenantId,
      mrn: `MRN-${mrnNum}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dob: formData.dob,
      gender: formData.gender,
      bloodType: formData.bloodType,
      phone: formData.phone,
      insuranceProvider: formData.insuranceProvider,
      policyNumber: formData.policyNumber,
      queueStatus: 'waiting_triage',
      triageAcuity: formData.triageAcuity,
      checkInTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      allergies: [],
      vitals: [],
      encounters: [],
      prescriptions: [],
      imagingOrders: [],
      billing: {
        id: `inv_${Date.now().toString().slice(-4)}`,
        patientId: `pt_${Date.now().toString().slice(-4)}`,
        tenantId: activeTenantId,
        claimId: `CLM-2026-${mrnNum.toString().slice(-4)}`,
        status: 'unbilled',
        items: [],
        totalAmount: 0,
        insuranceCoverageAmount: 0,
        copayAmount: 0,
        balanceDue: 0
      }
    };

    onRegisterPatient(newPt);
    setShowIntakeModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      dob: '1990-01-01',
      gender: 'Female',
      bloodType: 'O+',
      phone: '(555) 000-0000',
      insuranceProvider: 'Blue Cross Blue Shield PPO',
      policyNumber: 'BCBS-100293',
      triageAcuity: 3,
      chiefComplaint: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Patient Electronic Medical Records (EMR) Directory
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Partitioned database namespace · 18,412 total digitized records indexed across network
            </p>
          </div>

          <button
            onClick={() => setShowIntakeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium transition shadow-lg shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Patient Intake</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Patient Name, MRN (e.g. MRN-892104), or Insurance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Queue Statuses</option>
              <option value="waiting_triage">Waiting Triage</option>
              <option value="waiting_doctor">Waiting Doctor</option>
              <option value="in_consultation">In Consultation</option>
              <option value="pharmacy_dispense">Pharmacy Dispense</option>
              <option value="billing_reconciliation">Billing Reconciliation</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-left bg-slate-950/60">
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-3">DOB / Age</th>
                <th className="py-3 px-3">Acuity</th>
                <th className="py-3 px-3">Queue Status</th>
                <th className="py-3 px-3">Insurance Payer</th>
                <th className="py-3 px-3">Encounter / Orders</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filtered.map(patient => (
                <tr
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="hover:bg-slate-950/50 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200 hover:text-cyan-300 transition">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{patient.mrn}</div>
                  </td>

                  <td className="py-3.5 px-3 text-slate-400">
                    <div>{patient.dob}</div>
                    <div className="text-[11px] text-slate-500">
                      {new Date().getFullYear() - new Date(patient.dob).getFullYear()}y · {patient.gender}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300">
                      ESI-{patient.triageAcuity}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-[11px] text-cyan-300 capitalize">
                      {patient.queueStatus.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-300 text-[11px] max-w-[150px] truncate">
                    {patient.insuranceProvider}
                  </td>

                  <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                    <div>{patient.encounters.length} Enc · {patient.prescriptions.length} Rx</div>
                    {patient.imagingOrders.length > 0 && (
                      <div className="text-purple-400">{patient.imagingOrders.length} PACS S3</div>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right tabular-nums text-slate-200">
                    ${patient.billing.balanceDue.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPatient(patient);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                      title="Open Full EMR Chart"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Patient Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                New Patient Registration & Triage Intake
              </h3>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    placeholder="e.g. Samuel"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    placeholder="e.g. Sterling"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Blood Type</label>
                  <select
                    value={formData.bloodType}
                    onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Insurance Provider</label>
                  <input
                    type="text"
                    value={formData.insuranceProvider}
                    onChange={e => setFormData({ ...formData, insuranceProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Triage Acuity (ESI 1-5)</label>
                  <select
                    value={formData.triageAcuity}
                    onChange={e => setFormData({ ...formData, triageAcuity: Number(e.target.value) as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  >
                    <option value={1}>1 - Immediate / Resuscitation</option>
                    <option value={2}>2 - Emergent</option>
                    <option value={3}>3 - Urgent</option>
                    <option value={4}>4 - Less Urgent</option>
                    <option value={5}>5 - Non-urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium"
                >
                  Complete Registration & Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
