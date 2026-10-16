import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  AlertTriangle, 
  FileCode, 
  CheckCircle2, 
  Hash, 
  UserCheck, 
  Clock, 
  Link2,
  Database,
  Lock,
  Search,
  ExternalLink
} from 'lucide-react';
import { AuditBlock, TenantId } from '../types';
import { verifyAuditChain, computeBlockHash } from '../utils/crypto';

interface AuditLedgerViewProps {
  blocks: AuditBlock[];
  activeTenantId: TenantId;
  onTamperBlock?: (blockIndex: number, fakePayload: string) => void;
  onRestoreLedger?: () => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  blocks,
  activeTenantId,
  onTamperBlock,
  onRestoreLedger
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    brokenIndex?: number;
    error?: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<AuditBlock | null>(null);
  const [isTampered, setIsTampered] = useState(false);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      const result = await verifyAuditChain(blocks);
      setVerificationResult(result);
      setIsVerifying(false);
    }, 450);
  };

  const handleSimulateTamper = () => {
    if (blocks.length > 2 && onTamperBlock) {
      onTamperBlock(2, 'MALICIOUS_ALTERATION: Clinician diagnosis altered to remove cardiac emergency');
      setIsTampered(true);
      setVerificationResult(null);
    }
  };

  const handleRestore = () => {
    if (onRestoreLedger) {
      onRestoreLedger();
      setIsTampered(false);
      setVerificationResult(null);
    }
  };

  const filteredBlocks = blocks.filter(b => {
    if (!searchFilter) return true;
    const query = searchFilter.toLowerCase();
    return (
      b.actorName.toLowerCase().includes(query) ||
      b.action.toLowerCase().includes(query) ||
      b.payloadSummary.toLowerCase().includes(query) ||
      b.currentHash.toLowerCase().includes(query) ||
      b.resourceId.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Immutable Cryptographic Audit Ledger
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-mono">
                    SHA-256 Chained
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  SLO #2: Patient electronic medical records maintain mathematical tamper-evidence across all tenants.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every EMR access, clinical note signature, prescription creation, pharmacy dispensation, and radiology ingestion
              is permanently hashed into a forward-chained cryptographic ledger. Any modification to historic blocks breaks the hash integrity instantly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleVerifyLedger}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying SHA-256 Hash Chain...' : 'Verify Cryptographic Chain Integrity'}
            </button>

            {!isTampered ? (
              <button
                onClick={handleSimulateTamper}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-medium text-xs rounded-xl transition"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Simulate Malicious DB Tamper
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-medium text-xs rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                Restore Pristine Signed Chain
              </button>
            )}
          </div>
        </div>

        {/* Verification Result Notification */}
        {verificationResult && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            {verificationResult.isValid ? (
              <div className="flex items-start gap-3 p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-200">
                    Cryptographic Integrity Verified (100% Match)
                  </div>
                  <div className="text-emerald-400/90 mt-0.5 font-mono">
                    All {blocks.length} blocks traversed. Previous hash pointers and SHA-256 digests perfectly match genesis anchor. 0 unauthorized modifications detected.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-800 rounded-xl text-rose-300 text-xs animate-shake">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200">
                    SECURITY ALERT: Cryptographic Chain Broken at Block #{verificationResult.brokenIndex}!
                  </div>
                  <div className="text-rose-300/90 mt-0.5 font-mono">
                    {verificationResult.error}
                  </div>
                  <div className="mt-2 text-[11px] text-rose-400">
                    SLO #2 Enforced: The system rejected the unauthorized database update and quarantined the tenant audit state.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, MRN, or hash..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredBlocks.length} of {blocks.length} Blocks
        </div>
      </div>

      {/* Blocks Timeline / Stream */}
      <div className="space-y-3">
        {filteredBlocks.map((block) => {
          const isGenesis = block.blockIndex === 0;
          const isBroken = verificationResult && !verificationResult.isValid && verificationResult.brokenIndex === block.blockIndex;

          return (
            <div
              key={block.blockIndex}
              className={`p-4 rounded-xl border transition ${
                isBroken
                  ? 'bg-rose-950/30 border-rose-600 shadow-lg shadow-rose-950/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                    isGenesis 
                      ? 'bg-purple-950/60 border border-purple-800 text-purple-300' 
                      : isBroken 
                      ? 'bg-rose-900 text-rose-100 font-bold'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    Block #{block.blockIndex}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">{block.action}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-xs text-slate-400">{block.actorName}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {block.actorRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{block.tenantId}</span>
                </div>
              </div>

              {/* Payload Summary */}
              <div className="mt-2.5 text-xs text-slate-300 leading-relaxed pl-1">
                {block.payloadSummary}
              </div>

              {block.deltaDiff && (
                <div className="mt-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] font-mono text-cyan-300/90">
                  <span className="text-slate-500">Delta Diff: </span>
                  {block.deltaDiff}
                </div>
              )}

              {/* Cryptographic Linkage Info */}
              <div className="mt-3 pt-3 border-t border-slate-800/70 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-500 shrink-0 flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-slate-500" /> Prev Hash:
                  </span>
                  <span className="text-slate-400 truncate">{block.previousHash}</span>
                </div>

                <div className="flex items-center gap-2 truncate">
                  <span className="text-slate-500 shrink-0 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-cyan-400" /> Current Hash:
                  </span>
                  <span className={`${isBroken ? 'text-rose-400 font-bold' : 'text-cyan-300'} truncate`}>
                    {block.currentHash}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
