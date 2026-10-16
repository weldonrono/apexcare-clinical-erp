import React, { useState } from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  Lock, 
  FileCode, 
  CheckCircle2, 
  Copy, 
  Clock, 
  Terminal, 
  X,
  Server,
  ArrowRight
} from 'lucide-react';
import { generateMockS3PresignedUrl } from '../utils/crypto';

interface S3UploadModalProps {
  patientId: string;
  patientName: string;
  patientMrn: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (order: {
    id: string;
    patientId: string;
    type: 'xray' | 'mri' | 'ct_scan';
    title: string;
    orderedBy: string;
    orderedAt: string;
    status: 'imaging_uploaded';
    modality: string;
    imagingS3Key: string;
    findings: string;
    s3Encryption: 'AES256';
  }) => void;
}

export const S3UploadModal: React.FC<S3UploadModalProps> = ({
  patientId,
  patientName,
  patientMrn,
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [selectedExamType, setSelectedExamType] = useState<'xray' | 'mri' | 'ct_scan'>('xray');
  const [fileName, setFileName] = useState('thoracic_spine_dx_01.dcm');
  const [fileSizeMb, setFileSizeMb] = useState(48.2);
  const [presignedData, setPresignedData] = useState<ReturnType<typeof generateMockS3PresignedUrl> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePresignedUrl = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateMockS3PresignedUrl(patientId, fileName, 'application/dicom');
      setPresignedData(result);
      setIsGenerating(false);
    }, 400);
  };

  const handleDirectS3Upload = () => {
    if (!presignedData) return;
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            onUploadSuccess({
              id: `img_${Date.now().toString().slice(-4)}`,
              patientId,
              type: selectedExamType,
              title: selectedExamType === 'xray' ? 'Thoracic Spine DX Radiograph' : selectedExamType === 'mri' ? 'Contrast Brain MRI T1/T2' : 'Abdominal CT Spiral Scan',
              orderedBy: 'Dr. Marcus Vance, MD',
              orderedAt: new Date().toISOString(),
              status: 'imaging_uploaded',
              modality: selectedExamType === 'xray' ? 'Digital Radiography (DX)' : selectedExamType === 'mri' ? 'Magnetic Resonance (MR)' : 'Computed Tomography (CT)',
              imagingS3Key: presignedData.objectKey,
              findings: 'Direct S3 encrypted payload ingestion verified. Integrity hash matched.',
              s3Encryption: 'AES256'
            });
            onClose();
          }, 400);
          return 100;
        }
        return prev + 18;
      });
    }, 200);
  };

  const copyCurl = () => {
    if (presignedData?.curlPreview) {
      navigator.clipboard.writeText(presignedData.curlPreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/70 border border-cyan-800/60 rounded-xl text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">AWS S3 Pre-Signed File Ingestion</h3>
              <p className="text-xs text-slate-400">
                Direct-to-S3 zero exposure architecture · {patientName} ({patientMrn})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Architectural Callout */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Zero-Intermediate-Server Ingestion (SLO #3)
              </span>
              <span className="text-slate-400 font-mono">15-Min TTL Enforced</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Medical DICOM imagery bypasses application servers completely. The clinician session requests a 
              cryptographically signed token via AWS SigV4, permitting browser-to-S3 direct PUT with server-side AES-256 encryption.
            </p>

            <div className="flex items-center justify-center gap-3 py-2 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-200">Clinician Workstation</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              <span className="px-2 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded font-semibold">
                Direct AWS S3 Bucket
              </span>
              <span className="text-rose-400 line-through">(No API Server Hop)</span>
            </div>
          </div>

          {/* Form Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Exam Modality</label>
              <select
                value={selectedExamType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSelectedExamType(val);
                  setFileName(val === 'xray' ? 'chest_dx_portable.dcm' : val === 'mri' ? 'brain_mri_flair.dcm' : 'ct_pelvis_contrast.dcm');
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500"
              >
                <option value="xray">DX - Digital Radiography (X-Ray)</option>
                <option value="mri">MR - Magnetic Resonance Imaging (MRI)</option>
                <option value="ct_scan">CT - Computed Tomography</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">DICOM Payload File</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Step 1: Generate Token */}
          {!presignedData ? (
            <div className="pt-2">
              <button
                onClick={handleGeneratePresignedUrl}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isGenerating ? 'Computing SigV4 HMAC Signature...' : 'Request AWS S3 Presigned PUT URL (15-Min TTL)'}
              </button>
            </div>
          ) : (
            /* Step 2: Token Details & Direct Upload */
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Cryptographic SigV4 Pre-Signed Token Generated
                  </span>
                  <span className="font-mono text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> TTL: 900s (15 min)
                  </span>
                </div>

                <div className="font-mono text-[11px] text-slate-400 break-all bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-cyan-400">PUT </span>
                  {presignedData.uploadUrl}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500">x-amz-server-side-encryption:</span>{' '}
                    <span className="text-emerald-300">AES256</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Region:</span>{' '}
                    <span className="text-slate-300">us-east-1</span>
                  </div>
                </div>

                {/* Curl inspection option */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">Direct CLI Upload Preview:</span>
                  <button
                    onClick={copyCurl}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copied to Clipboard' : 'Copy cURL Command'}
                  </button>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300">Streaming raw DICOM buffer to S3...</span>
                    <span className="text-slate-300">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-200 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Direct Upload Action Button */}
              <button
                onClick={handleDirectS3Upload}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                {isUploading ? 'Executing Direct Browser -> S3 Transfer...' : 'Execute Direct S3 Ingestion'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>AES-256 GCM Server-Side Encryption</span>
          <span>Zero Server Buffer</span>
        </div>
      </div>
    </div>
  );
};
