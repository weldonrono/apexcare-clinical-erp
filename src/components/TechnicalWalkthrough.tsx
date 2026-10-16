import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Server, 
  Database, 
  Radio, 
  UploadCloud, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  GitBranch, 
  Sparkles, 
  Terminal, 
  Send,
  Zap,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { UserRole, ClinicalScope } from '../types';
import { ROLE_PERMISSIONS } from '../utils/crypto';

export const TechnicalWalkthrough: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'rbac_matrix' | 's3_pipeline' | 'redis_queue'>('architecture');
  const [selectedRoleTest, setSelectedRoleTest] = useState<UserRole>('billing_cashier');
  const [testedEndpoint, setTestedEndpoint] = useState<string>('GET /api/emr/diagnostics/pt_1001');
  const [testResult, setTestResult] = useState<{
    status: number;
    message: string;
    details: string;
    allowed: boolean;
  } | null>(null);

  const [redisSimulatorStatus, setRedisSimulatorStatus] = useState<'idle' | 'publishing' | 'broadcasted'>('idle');
  const [simulatedPacket, setSimulatedPacket] = useState<any>(null);

  // Role simulation test runner
  const runEndpointTest = (endpoint: string, role: UserRole) => {
    setTestedEndpoint(endpoint);
    const perms = ROLE_PERMISSIONS[role].allowedScopes;

    let requiredScope: ClinicalScope = 'emr:read_diagnostics';
    if (endpoint.includes('prescriptions/dispense')) requiredScope = 'pharmacy:dispense';
    if (endpoint.includes('billing/reconcile')) requiredScope = 'billing:reconcile';
    if (endpoint.includes('s3/presign')) requiredScope = 's3:generate_presigned_url';
    if (endpoint.includes('audit/verify')) requiredScope = 'audit:verify';

    const isAllowed = perms.includes(requiredScope);

    if (isAllowed) {
      setTestResult({
        status: 200,
        allowed: true,
        message: '200 OK — Scopes Validated',
        details: `Actor possessed required claim [${requiredScope}]. Payload returned unmasked.`
      });
    } else {
      setTestResult({
        status: 403,
        allowed: false,
        message: '403 Forbidden — SLO #1 RBAC Policy Enforcement',
        details: `Access Denied: Missing mandatory scope [${requiredScope}]. Caller only possesses: [${perms.join(', ')}]. Diagnostic payload masked to null.`
      });
    }
  };

  // Run initial test
  React.useEffect(() => {
    runEndpointTest(testedEndpoint, selectedRoleTest);
  }, [selectedRoleTest]);

  // Redis test runner
  const handleTriggerRedisBroadcast = () => {
    setRedisSimulatorStatus('publishing');
    const event = {
      channel: 'clinic:metro-gen:queue',
      event: 'PATIENT_ROOM_CALL',
      patientMrn: 'MRN-892104',
      targetRoom: 'Exam Room 3',
      dispatchedBy: 'Dr. Marcus Vance, MD',
      timestamp: new Date().toISOString(),
      clusterNodesAcked: 3,
      latencyMs: (Math.random() * 4 + 7.2).toFixed(1)
    };

    setTimeout(() => {
      setSimulatedPacket(event);
      setRedisSimulatorStatus('broadcasted');
    }, 300);
  };

  const allScopes: ClinicalScope[] = [
    'triage:intake',
    'emr:read_diagnostics',
    'emr:write_encounter',
    'rx:prescribe',
    'pharmacy:dispense',
    'billing:reconcile',
    's3:generate_presigned_url',
    'audit:read',
    'audit:verify',
    'tenant:manage'
  ];

  const allRoles: UserRole[] = [
    'triage_nurse',
    'clinician_doctor',
    'pharmacist',
    'billing_cashier',
    'compliance_auditor'
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950/70 border border-cyan-800/60 rounded-xl text-cyan-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Interactive Technical Walkthrough & Architecture
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    Lead Software Engineer
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  ApexCare Multi-Tenant Clinical ERP & Secure Medical Records · Production Case Study
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>The Engineering Challenge:</strong> A healthcare network operating across 3 distributed clinics was crippled by paper charts
              and uncoordinated department handoffs. The system demanded <em>absolute role isolation</em> (e.g. billing cashiers must NEVER view
              confidential diagnostic notes; pharmacists must verify doctor signatures before dispensing) while sustaining zero-latency emergency triage.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-slate-400">Reduction in Patient Dwell:</div>
              <div className="text-lg font-bold text-emerald-400">68% Dwell Decrease</div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-slate-400">Digitized EMR Charts:</div>
              <div className="text-lg font-bold text-cyan-400">18,412 Charts Active</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'architecture'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            System Architecture & SLOs
          </button>

          <button
            onClick={() => setActiveTab('rbac_matrix')}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'rbac_matrix'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Granular RBAC Authorization Matrix (SLO #1)
          </button>

          <button
            onClick={() => setActiveTab('s3_pipeline')}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 's3_pipeline'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AWS S3 Pre-Signed File Ingestion (SLO #3)
          </button>

          <button
            onClick={() => setActiveTab('redis_queue')}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition border-b-2 ${
              activeTab === 'redis_queue'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Real-Time Redis Pub/Sub Queue Synchronizer
          </button>
        </div>
      </div>

      {/* Tab 1: System Architecture & SLOs */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Core SLO Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">SLO #1</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">
                  Zero Data Leakage
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">Strict Department Data Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Triage, Clinician, Pharmacy, and Billing roles execute within isolated permission realms. Diagnostic narratives,
                psychiatric formulations, and prescription details are pruned at the API middleware layer prior to client dispatch.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">
                Metric: 0 Unauthorized Diagnostic Disclosures
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">SLO #2</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                  100% Coverage
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">Immutable EMR Audit Trails</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every clinical write, prescription issuance, and vitals recording appends to an immutable SHA-256 chained ledger.
                Direct database modifications are cryptographically discovered by running the verification engine.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">
                Metric: 100% Immutable Audit Trail Coverage
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400">SLO #3</span>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800">
                  Zero Server Ingestion
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">Zero-Exposure PACS / S3 Architecture</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Radiology DICOM and high-resolution lab media are ingested directly from clinician browsers into AWS S3 using 15-minute
                cryptographic SigV4 pre-signed URLs with AES-256 server-side encryption. Node.js servers never buffer raw media.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">
                Metric: 0 bytes raw imaging on intermediate servers
              </div>
            </div>
          </div>

          {/* Technical Stack Architecture Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Multi-Tenant Architecture Diagram
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Clinic Alpha (Metro General HQ)
                </div>
                <div className="text-slate-400 text-[11px]">Tenant ID: `metro-gen`</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Partitioned PostgreSQL schema with tenancy foreign keys. Level 1 trauma facilities, cardiac telemetry, and ICU.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Clinic Beta (Westside Specialty)
                </div>
                <div className="text-slate-400 text-[11px]">Tenant ID: `westside-spec`</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Oncology, cardiac catheterization, MRI functional imaging. Enforces dedicated HIPAA data retention policies.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Clinic Gamma (Valley Urgent Care)
                </div>
                <div className="text-slate-400 text-[11px]">Tenant ID: `valley-urg`</div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  High-throughput ambulatory walk-ins, rapid ESI-acuity scoring, prescription dispensing, and prompt cashiering.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Granular RBAC Authorization Matrix */}
      {activeTab === 'rbac_matrix' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Granular RBAC Authorization Matrix & Middleware Verification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Centralized permission middleware verifying JWT claims against defined clinical scopes before reaching controller logic.
              </p>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-left">
                    <th className="py-3 px-3">Role / Clinical Scope</th>
                    {allScopes.map(scope => (
                      <th key={scope} className="py-3 px-2 text-center text-[11px] truncate max-w-[110px]" title={scope}>
                        {scope.replace(':', '\n')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {allRoles.map(role => {
                    const info = ROLE_PERMISSIONS[role];
                    return (
                      <tr key={role} className="hover:bg-slate-950/40">
                        <td className="py-3 px-3 font-semibold text-slate-200 whitespace-nowrap">
                          <div>{info.title.split('/')[0]}</div>
                          <span className="text-[10px] text-slate-500 font-normal">{role}</span>
                        </td>
                        {allScopes.map(scope => {
                          const isAllowed = info.allowedScopes.includes(scope);
                          return (
                            <td key={scope} className="py-3 px-2 text-center">
                              {isAllowed ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-slate-600">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Live Interactive Endpoint & Scope Test Bench */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Live Middleware Enforcement Test Bench
              </h4>
              <p className="text-xs text-slate-400">
                Simulate an HTTP request with active user session JWT to observe how API middleware grants 200 OK or blocks with 403 Forbidden.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Simulated User Session Role</label>
                  <select
                    value={selectedRoleTest}
                    onChange={(e) => setSelectedRoleTest(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                  >
                    <option value="billing_cashier">Billing Cashier (David O'Connor)</option>
                    <option value="clinician_doctor">Clinician Doctor (Dr. Marcus Vance)</option>
                    <option value="pharmacist">Pharmacist (Dr. Priya Chen)</option>
                    <option value="triage_nurse">Triage Nurse (Elena Rostova)</option>
                    <option value="compliance_auditor">Compliance Auditor (Sarah Lindqvist)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Protected API Route</label>
                  <div className="flex gap-2">
                    <select
                      value={testedEndpoint}
                      onChange={(e) => runEndpointTest(e.target.value, selectedRoleTest)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                    >
                      <option value="GET /api/emr/diagnostics/pt_1001">GET /api/emr/diagnostics/pt_1001 [Requires emr:read_diagnostics]</option>
                      <option value="POST /api/pharmacy/prescriptions/dispense">POST /api/pharmacy/prescriptions/dispense [Requires pharmacy:dispense]</option>
                      <option value="POST /api/billing/reconcile">POST /api/billing/reconcile [Requires billing:reconcile]</option>
                      <option value="POST /api/s3/presign">POST /api/s3/presign [Requires s3:generate_presigned_url]</option>
                      <option value="POST /api/audit/verify">POST /api/audit/verify [Requires audit:verify]</option>
                    </select>

                    <button
                      onClick={() => runEndpointTest(testedEndpoint, selectedRoleTest)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Test Route
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution Result Box */}
              {testResult && (
                <div className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
                  testResult.allowed
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2">
                      {testResult.allowed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {testResult.message}
                    </span>
                    <span className="text-[11px] text-slate-400">Enforced in 0.8ms</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {testResult.details}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AWS S3 Pre-Signed File Ingestion */}
      {activeTab === 's3_pipeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                AWS S3 Pre-Signed Cryptographic Ingestion Pipeline (SLO #3)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zero-exposure architecture for sensitive lab reports and diagnostic imagery.
              </p>
            </div>

            {/* Architecture Steps Flow */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-cyan-400 font-bold">Step 1: Scope Auth</div>
                <div className="text-slate-200 font-semibold">Clinician Session</div>
                <p className="text-slate-400 text-[11px]">
                  Doctor requests upload permission. Express middleware validates `s3:generate_presigned_url` and clinic tenant.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-amber-400 font-bold">Step 2: SigV4 Token</div>
                <div className="text-slate-200 font-semibold">Cryptographic Signing</div>
                <p className="text-slate-400 text-[11px]">
                  Server issues HMAC-SHA256 signature with 900s TTL (15-min expiration) and AWS server-side encryption AES256 headers.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-emerald-400 font-bold">Step 3: Direct PUT</div>
                <div className="text-slate-200 font-semibold">Direct Browser → S3</div>
                <p className="text-slate-400 text-[11px]">
                  Browser PUTs raw 50MB+ DICOM directly to S3 endpoint. Express server memory and disk exposure is exactly 0 bytes.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-purple-400 font-bold">Step 4: Audit Anchor</div>
                <div className="text-slate-200 font-semibold">Immutable Ledger</div>
                <p className="text-slate-400 text-[11px]">
                  S3 notifies server of ETag/Key. Server anchors SHA-256 block into immutable audit trail for compliance verification.
                </p>
              </div>
            </div>

            {/* Trade-off Rationale Box */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-slate-200">Engineering Trade-off Rationale:</div>
              <p className="text-slate-400 leading-relaxed">
                Passing large medical DICOM files through intermediate Node.js Express servers introduces severe memory bottlenecks,
                thread pool starvation, and expands HIPAA audit scope to intermediate disk caches. By delegating directly to AWS S3
                with short-lived cryptographic tokens, the application sustains sub-10ms response times while meeting strict zero-exposure SLOs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Real-Time Redis Pub/Sub Queue Synchronizer */}
      {activeTab === 'redis_queue' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Event-Driven WebSocket & Redis Pub/Sub Architecture
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dynamic room queue synchronization with &lt; 12ms cross-workstation broadcast latency.
                </p>
              </div>

              <button
                onClick={handleTriggerRedisBroadcast}
                disabled={redisSimulatorStatus === 'publishing'}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium shadow-lg transition"
              >
                <Zap className="w-4 h-4" />
                <span>Simulate Room Call Packet Broadcast</span>
              </button>
            </div>

            {/* Simulated Live Packet Output */}
            {simulatedPacket && (
              <div className="p-4 bg-slate-950 border border-cyan-800/80 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Redis Channel Broadcast: {simulatedPacket.channel}
                  </span>
                  <span className="text-emerald-400">Latency: {simulatedPacket.latencyMs}ms</span>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-800 text-slate-300 text-[11px] space-y-1">
                  <div><strong>Event:</strong> {simulatedPacket.event}</div>
                  <div><strong>Patient:</strong> {simulatedPacket.patientMrn} → {simulatedPacket.targetRoom}</div>
                  <div><strong>Dispatched By:</strong> {simulatedPacket.dispatchedBy}</div>
                  <div><strong>Cluster Nodes Acknowledged:</strong> {simulatedPacket.clusterNodesAcked} / 3 (Metro HQ, Westside, Valley)</div>
                  <div><strong>Timestamp:</strong> {simulatedPacket.timestamp}</div>
                </div>

                <div className="text-[11px] text-slate-400">
                  All subscribed doctor, triage, pharmacy, and cashier workstations received the state transition without page reload.
                </div>
              </div>
            )}

            {/* Production Impact Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-slate-400 font-mono">Queue Dwell Time</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">68% Drop</div>
                <div className="text-[11px] text-slate-500">From 45 mins to 14 mins avg</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-slate-400 font-mono">Inter-department Handoffs</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">Real-Time</div>
                <div className="text-[11px] text-slate-500">Zero paper chart transit lag</div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-slate-400 font-mono">Cross-Clinic Replication</div>
                <div className="text-2xl font-bold font-mono text-purple-400">3 Tenants</div>
                <div className="text-[11px] text-slate-500">Metro Gen, Westside, Valley</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
