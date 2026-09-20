import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Student, School } from '../types';
import { X, Printer, Download, ShieldCheck, Phone, Heart, User, School as SchoolIcon } from 'lucide-react';

interface IDCardModalProps {
  student: Student;
  school?: School;
  onClose: () => void;
}

export const IDCardModal: React.FC<IDCardModalProps> = ({ student, school, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      // Encoded structured payload for instant scanning across roles
      const payload = JSON.stringify({
        t: 'STS',
        id: student.studentId,
        n: student.fullName,
        c: student.studentClass,
        r: student.rollNumber,
        s: student.schoolId,
      });

      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 140,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (err) => {
          if (!err) setQrGenerated(true);
        }
      );
    }
  }, [student]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="id-card-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Smart Student Transit ID Card
            </h3>
            <p className="text-xs text-slate-500">Official 5-Stage QR Tracking Pass</p>
          </div>
          <button
            id="close-id-card-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable ID Card Container */}
        <div className="py-6 flex justify-center">
          <div
            id="printable-id-card"
            ref={cardRef}
            className="w-80 rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-950 text-white select-none print:shadow-none print:border print:border-black"
          >
            {/* Top School Ribbon */}
            <div className="px-4 py-3 bg-blue-950/80 border-b border-blue-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-inner">
                  <SchoolIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs tracking-wide uppercase text-blue-100 line-clamp-1">
                    {school?.name || 'Delhi Public Academy'}
                  </h4>
                  <p className="text-[10px] text-blue-300 font-medium">Smart Safe Campus Pass</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                {student.studentClass}
              </span>
            </div>

            {/* Main Card Content */}
            <div className="p-4 flex flex-col items-center">
              {/* Student Photo */}
              <div className="relative mb-3">
                <img
                  src={student.photoUrl}
                  alt={student.fullName}
                  className="w-24 h-28 object-cover rounded-xl border-2 border-white shadow-md bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                {student.bloodGroup && (
                  <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black shadow-sm flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5 fill-current" /> {student.bloodGroup}
                  </span>
                )}
              </div>

              {/* Name & Roll */}
              <h2 className="text-lg font-black text-center text-white tracking-wide leading-tight">
                {student.fullName}
              </h2>
              <div className="flex items-center gap-2 mt-1 mb-3">
                <span className="text-[11px] font-semibold text-blue-200 bg-blue-800/80 px-2.5 py-0.5 rounded-full border border-blue-600/50">
                  Roll No: {student.rollNumber}
                </span>
                <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                  {student.studentId}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="p-2 rounded-xl bg-white shadow-inner border border-blue-200/40 flex flex-col items-center">
                <canvas ref={canvasRef} className="rounded" />
                <span className="text-[9px] font-bold text-slate-800 mt-1 uppercase tracking-wider">
                  Scan for Transit Safety
                </span>
              </div>

              {/* Contact Info Footer */}
              <div className="w-full mt-4 pt-3 border-t border-blue-700/60 text-[11px] text-blue-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-400" /> Parent:
                  </span>
                  <span className="font-semibold text-white truncate max-w-[140px]">{student.parentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-300 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-400" /> Phone:
                  </span>
                  <span className="font-mono font-medium text-white">{student.parentPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    Emergency:
                  </span>
                  <span className="font-mono font-bold text-amber-200">{student.emergencyContact}</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-blue-950 py-1.5 px-4 text-center text-[9px] text-blue-400 font-medium tracking-wide">
              Secure QR Transit Pass • Issued by {school?.name || 'Delhi Public Academy'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            id="print-id-card-btn"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print ID Card
          </button>
          <button
            id="done-id-card-btn"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
