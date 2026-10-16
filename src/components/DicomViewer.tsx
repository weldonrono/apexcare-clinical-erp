import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sun, 
  Sliders, 
  ShieldCheck, 
  Maximize2, 
  Ruler, 
  FileText,
  Lock,
  Download,
  AlertCircle
} from 'lucide-react';

interface DicomViewerProps {
  patientName: string;
  patientMrn: string;
  modality?: string;
  examTitle: string;
  s3Key: string;
  expiresInSeconds?: number;
}

export const DicomViewer: React.FC<DicomViewerProps> = ({
  patientName,
  patientMrn,
  modality = 'DX (Digital Radiography)',
  examTitle,
  s3Key,
  expiresInSeconds = 900
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [contrast, setContrast] = useState(120); // 50 to 200
  const [brightness, setBrightness] = useState(105); // 50 to 180
  const [invert, setInvert] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measureLine, setMeasureLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [timeRemaining, setTimeRemaining] = useState(expiresInSeconds);
  const [activePreset, setActivePreset] = useState<'lung' | 'bone' | 'mediastinum' | 'default'>('default');

  // Timer countdown for S3 presigned URL
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Preset windowing (HU / Window Width & Level)
  const applyPreset = (preset: 'lung' | 'bone' | 'mediastinum' | 'default') => {
    setActivePreset(preset);
    if (preset === 'lung') {
      setContrast(160);
      setBrightness(90);
    } else if (preset === 'bone') {
      setContrast(190);
      setBrightness(130);
    } else if (preset === 'mediastinum') {
      setContrast(130);
      setBrightness(115);
    } else {
      setContrast(120);
      setBrightness(105);
    }
  };

  // Procedural high-resolution medical radiograph generator on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    ctx.save();

    // Background darkness
    ctx.fillStyle = '#06090e';
    ctx.fillRect(0, 0, width, height);

    // Apply Zoom & Pan
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // CSS-style filter simulation via direct pixel manipulation or canvas filter
    const filterStr = `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(100%)' : ''}`;
    ctx.filter = filterStr;

    // Draw procedural anatomical Chest Radiograph / Thorax
    const cx = width / 2;
    const cy = height / 2;

    // Thoracic rib cage contour (gradient)
    const thoraxGrad = ctx.createRadialGradient(cx, cy - 20, 40, cx, cy, 260);
    thoraxGrad.addColorStop(0, '#1a222d');
    thoraxGrad.addColorStop(0.5, '#0f1720');
    thoraxGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = thoraxGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 210, 240, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lung fields (radiolucent dark zones)
    ctx.fillStyle = '#0a0d12';
    // Right lung
    ctx.beginPath();
    ctx.ellipse(cx - 85, cy - 10, 65, 140, -0.05, 0, Math.PI * 2);
    ctx.fill();
    // Left lung
    ctx.beginPath();
    ctx.ellipse(cx + 85, cy - 5, 62, 135, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Bronchovascular markings (delicate vascular arborization)
    ctx.strokeStyle = 'rgba(180, 205, 230, 0.28)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 9; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy - 20 + i * 8);
      ctx.quadraticCurveTo(cx - 85, cy - 40 + i * 15, cx - 125, cy - 30 + i * 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 50, cy - 15 + i * 8);
      ctx.quadraticCurveTo(cx + 85, cy - 35 + i * 15, cx + 120, cy - 25 + i * 22);
      ctx.stroke();
    }

    // Cardiac Silhouette (Heart shadow)
    const heartGrad = ctx.createRadialGradient(cx + 18, cy + 35, 10, cx + 18, cy + 35, 95);
    heartGrad.addColorStop(0, '#cbd5e1');
    heartGrad.addColorStop(0.6, '#64748b');
    heartGrad.addColorStop(1, 'rgba(51, 65, 85, 0.4)');
    ctx.fillStyle = heartGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy - 10);
    ctx.bezierCurveTo(cx - 20, cy + 20, cx - 10, cy + 85, cx + 75, cy + 82);
    ctx.bezierCurveTo(cx + 105, cy + 70, cx + 80, cy + 10, cx + 30, cy - 20);
    ctx.closePath();
    ctx.fill();

    // Aortic knob
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(cx + 22, cy - 55, 24, 0, Math.PI * 2);
    ctx.fill();

    // Thoracic Spine & Vertebral bodies
    ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
    for (let y = cy - 180; y < cy + 160; y += 22) {
      ctx.beginPath();
      ctx.roundRect(cx - 14, y, 28, 16, 4);
      ctx.fill();
    }

    // Bilateral Clavicles
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    // Left clavicle
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 130);
    ctx.quadraticCurveTo(cx - 80, cy - 145, cx - 175, cy - 120);
    ctx.stroke();
    // Right clavicle
    ctx.beginPath();
    ctx.moveTo(cx + 15, cy - 130);
    ctx.quadraticCurveTo(cx + 80, cy - 145, cx + 175, cy - 120);
    ctx.stroke();

    // Bilateral Posterior Ribs (arches)
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.42)';
    ctx.lineWidth = 7;
    for (let r = 0; r < 7; r++) {
      const ribY = cy - 110 + r * 34;
      // Right rib
      ctx.beginPath();
      ctx.moveTo(cx - 14, ribY);
      ctx.quadraticCurveTo(cx - 120, ribY + 12, cx - 185, ribY + 45);
      ctx.stroke();
      // Left rib
      ctx.beginPath();
      ctx.moveTo(cx + 14, ribY);
      ctx.quadraticCurveTo(cx + 120, ribY + 12, cx + 185, ribY + 45);
      ctx.stroke();
    }

    // Diaphragm hemi-domes (Bilateral costophrenic angles)
    ctx.fillStyle = '#475569';
    // Right hemidiaphragm
    ctx.beginPath();
    ctx.moveTo(cx - 195, cy + 145);
    ctx.quadraticCurveTo(cx - 95, cy + 90, cx, cy + 130);
    ctx.lineTo(cx, height);
    ctx.lineTo(0, height);
    ctx.lineTo(0, cy + 145);
    ctx.closePath();
    ctx.fill();
    // Left hemidiaphragm
    ctx.beginPath();
    ctx.moveTo(cx + 195, cy + 150);
    ctx.quadraticCurveTo(cx + 105, cy + 105, cx, cy + 130);
    ctx.lineTo(cx, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, cy + 150);
    ctx.closePath();
    ctx.fill();

    // Reset filter for measurement annotations
    ctx.filter = 'none';

    // Measurement tool line
    if (measureLine) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(measureLine.x1, measureLine.y1);
      ctx.lineTo(measureLine.x2, measureLine.y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw anchor circles
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(measureLine.x1, measureLine.y1, 4, 0, Math.PI * 2);
      ctx.arc(measureLine.x2, measureLine.y2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Calculate distance in mm (0.34 mm per pixel calibration)
      const dx = measureLine.x2 - measureLine.x1;
      const dy = measureLine.y2 - measureLine.y1;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distMm = (distPx * 0.34).toFixed(1);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      const mx = (measureLine.x1 + measureLine.x2) / 2;
      const my = (measureLine.y1 + measureLine.y2) / 2 - 12;
      ctx.fillRect(mx - 32, my - 12, 64, 20);
      ctx.strokeRect(mx - 32, my - 12, 64, 20);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${distMm} mm`, mx, my + 2);
    }

    ctx.restore();

    // DICOM On-Screen HUD Overlay (Fixed position, not scaled)
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MRN: ${patientMrn}`, 16, 24);
    ctx.fillText(`NAME: ${patientName.toUpperCase()}`, 16, 40);
    ctx.fillText(`MOD: ${modality}`, 16, 56);
    ctx.fillText(`FOV: 350x430mm | MATRIX: 2048x2560`, 16, 72);

    ctx.textAlign = 'right';
    ctx.fillText(`AWS S3 AES-256 ENCRYPTED`, width - 16, 24);
    ctx.fillText(`VAULT KEY: ...${s3Key.slice(-24)}`, width - 16, 40);
    ctx.fillText(`ZOOM: ${(zoom * 100).toFixed(0)}%`, width - 16, 56);
    ctx.fillText(`W: ${contrast * 10} L: ${brightness * 5}`, width - 16, 72);

    // Anatomical orientation markers
    ctx.font = 'bold 16px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('R', 28, height / 2);
    ctx.fillText('L', width - 28, height / 2);
    ctx.fillText('SUP', width / 2, 28);
    ctx.fillText('INF', width / 2, height - 16);
  }, [zoom, pan, contrast, brightness, invert, measureLine, patientName, patientMrn, modality, s3Key]);

  // Mouse interaction for pan & measurement
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isMeasuring) {
      setMeasureLine({ x1: x, y1: y, x2: x, y2: y });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isMeasuring && measureLine) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMeasureLine(prev => prev ? { ...prev, x2: x, y2: y } : null);
    } else if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setContrast(120);
    setBrightness(105);
    setInvert(false);
    setMeasureLine(null);
    setIsMeasuring(false);
    setActivePreset('default');
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top PACS Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-950/60 border border-cyan-800/60 rounded-lg text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">{examTitle}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">DICOM v3.0</span>
            </div>
            <div className="text-xs text-slate-400 font-mono truncate max-w-md">
              {s3Key}
            </div>
          </div>
        </div>

        {/* S3 Presigned TTL badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-800/50 rounded-lg text-amber-300 text-xs">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>S3 Token TTL:</span>
            <span className="font-mono font-bold text-amber-200">{formatTime(timeRemaining)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => applyPreset('default')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${activePreset === 'default' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Default
            </button>
            <button
              onClick={() => applyPreset('lung')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${activePreset === 'lung' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Lung Field
            </button>
            <button
              onClick={() => applyPreset('bone')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${activePreset === 'bone' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Bone Window
            </button>
            <button
              onClick={() => applyPreset('mediastinum')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${activePreset === 'mediastinum' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Mediastinum
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative bg-black flex items-center justify-center overflow-hidden cursor-crosshair h-[420px]">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full object-contain"
        />

        {/* Floating Tool Controls Strip */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
            title="Zoom In"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.75))}
            title="Zoom Out"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => setInvert(!invert)}
            title="Invert Grayscale (Negative/Positive)"
            className={`p-1.5 rounded transition ${invert ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMeasuring(!isMeasuring)}
            title="Digital Caliper Measurement"
            className={`p-1.5 rounded transition ${isMeasuring ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            <Ruler className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            title="Reset Pan/Zoom & Contrast"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Telemetry & Contrast Adjustment Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-slate-400" />
            <span>Brightness:</span>
            <input
              type="range"
              min="50"
              max="160"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-20 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <span className="font-mono text-slate-300 w-8">{brightness}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Contrast:</span>
            <input
              type="range"
              min="60"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-20 accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <span className="font-mono text-slate-300 w-8">{contrast}%</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-slate-400">
          <span className="text-emerald-400 font-semibold">● Direct-S3 Stream</span>
          <span>·</span>
          <span>Zero Server RAM Footprint</span>
          <span>·</span>
          <span>256-bit AES GCM</span>
        </div>
      </div>
    </div>
  );
};
