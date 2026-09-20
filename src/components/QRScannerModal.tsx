import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { Student, TransitStage, UserAccount } from '../types';
import { playSuperTuneChime } from '../services/audio';
import { X, Camera, CheckCircle2, AlertCircle, Scan, Sparkles, User, RefreshCw } from 'lucide-react';

interface QRScannerModalProps {
  currentStage: TransitStage;
  stageTitle: string;
  stageSubtitle: string;
  currentUser: UserAccount;
  allStudents: Student[];
  onScanSuccess: (student: Student, stage: TransitStage) => Promise<void>;
  onClose: () => void;
  filterClass?: string; // If teacher is scanning for their assigned class
  enforceStudentId?: string; // If parent is scanning only for their child
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  currentStage,
  stageTitle,
  stageSubtitle,
  currentUser,
  allStudents,
  onScanSuccess,
  onClose,
  filterClass,
  enforceStudentId,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInputId, setManualInputId] = useState('');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const eligibleStudents = allStudents.filter((s) => {
    if (enforceStudentId && s.studentId !== enforceStudentId) return false;
    if (filterClass && s.studentClass !== filterClass) return false;
    return true;
  });

  const startCamera = async () => {
    try {
      setCameraError(null);
      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleDecodedPayload(decodedText);
        },
        () => {
          // ignore silent frame misses
        }
      );
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Camera permission was denied. Please allow camera access in browser settings or use Quick Scan below.'
          : 'Could not access device camera. You can use the Quick Scan selector below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
      qrScannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleDecodedPayload = async (rawText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    let targetStudentId = rawText.trim();
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && parsed.id) {
        targetStudentId = parsed.id;
      }
    } catch {
      // plain text ID
    }

    const matched = allStudents.find(
      (s) =>
        s.studentId.toLowerCase() === targetStudentId.toLowerCase() ||
        s.id.toLowerCase() === targetStudentId.toLowerCase()
    );

    if (!matched) {
      setCameraError(`QR scanned: "${targetStudentId}" does not match any registered student.`);
      setIsProcessing(false);
      return;
    }

    if (enforceStudentId && matched.studentId !== enforceStudentId) {
      setCameraError(`This QR belongs to ${matched.fullName}. You can only scan for your registered child.`);
      setIsProcessing(false);
      return;
    }

    if (filterClass && matched.studentClass !== filterClass) {
      setCameraError(`Student ${matched.fullName} belongs to ${matched.studentClass}, not your class (${filterClass}).`);
      setIsProcessing(false);
      return;
    }

    // Success!
    setScannedStudent(matched);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    playSuperTuneChime();

    await onScanSuccess(matched, currentStage);
    setIsProcessing(false);
  };

  const handleManualSelect = (student: Student) => {
    handleDecodedPayload(student.studentId);
  };

  return (
    <div id="qr-scanner-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-600 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900">{stageTitle}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{stageSubtitle}</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Successful Scan Confirmation Card */}
        {scannedStudent ? (
          <div className="py-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-900">Scan Verified Successfully!</h4>
            <p className="text-sm text-emerald-700 font-semibold mt-1">
              {stageTitle} recorded at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-left">
              <img
                src={scannedStudent.photoUrl}
                alt={scannedStudent.fullName}
                className="w-14 h-14 object-cover rounded-xl border border-slate-300"
              />
              <div>
                <h5 className="font-bold text-slate-900">{scannedStudent.fullName}</h5>
                <p className="text-xs text-slate-500">
                  {scannedStudent.studentClass} • Roll No: {scannedStudent.rollNumber}
                </p>
                <p className="text-xs font-mono text-blue-600 font-medium mt-0.5">{scannedStudent.studentId}</p>
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-98"
            >
              Done / OK
            </button>
          </div>
        ) : (
          <div className="py-4">
            {/* Viewport for Camera */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-[340px] mx-auto flex items-center justify-center border-2 border-blue-500 shadow-inner">
              <div id="qr-reader-viewport" className="w-full h-full" />
              
              {/* Corner targeting reticle */}
              <div className="pointer-events-none absolute inset-6 border-2 border-dashed border-blue-400/60 rounded-xl flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500/80 absolute shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>

              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Camera initializing or paused</p>
                  <button
                    onClick={startCamera}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Restart Camera
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Scanner Note</p>
                  <p className="text-amber-800">{cameraError}</p>
                </div>
              </div>
            )}

            {/* Quick Test / Manual Scan Selector */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Quick Tap-Scan (Desktop / Demo)
                </span>
                <span className="text-[11px] text-slate-400">
                  {eligibleStudents.length} student{eligibleStudents.length !== 1 ? 's' : ''} eligible
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {eligibleStudents.map((stu) => (
                  <button
                    key={stu.id}
                    onClick={() => handleManualSelect(stu)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={stu.photoUrl}
                        alt={stu.fullName}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{stu.fullName}</p>
                        <p className="text-[10px] text-slate-500">
                          {stu.studentClass} • {stu.studentId}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-1 rounded-md group-hover:bg-blue-600 group-hover:text-white transition">
                      Simulate Scan →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
