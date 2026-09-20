import React, { useEffect, useState } from 'react';
import { VoiceAlertPayload, TransitStage } from '../types';
import { stopContinuousAlert, playSuperTuneChime, speakHindiVoice } from '../services/audio';
import { Volume2, Check, AlertTriangle, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface VoiceAlertModalProps {
  alert: VoiceAlertPayload;
  onAcknowledge: () => void;
}

export const VoiceAlertModal: React.FC<VoiceAlertModalProps> = ({ alert, onAcknowledge }) => {
  const [pulseRings, setPulseRings] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseRings((prev) => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    stopContinuousAlert();
    onAcknowledge();
  };

  const handleReplay = async () => {
    await playSuperTuneChime();
    await speakHindiVoice(alert.messageHindi);
  };

  const getStageHeader = (stage: TransitStage) => {
    switch (stage) {
      case 'LEFT_HOME':
        return { label: 'Ghar Se Nikla (Departed Home)', color: 'bg-amber-600', text: 'text-amber-600' };
      case 'REACHED_SCHOOL_GATE':
        return { label: 'School Pahunch Gaya (Gate In)', color: 'bg-blue-600', text: 'text-blue-600' };
      case 'ENTERED_CLASS':
        return { label: 'Class Me Pahunch Gaya (Class In)', color: 'bg-indigo-600', text: 'text-indigo-600' };
      case 'EXIT_SCHOOL_GATE':
        return { label: 'School Se Nikal Chuka Hai (Gate Out)', color: 'bg-purple-600', text: 'text-purple-600' };
      case 'REACHED_HOME':
        return { label: 'Surakshit Ghar Pahunch Gaya', color: 'bg-emerald-600', text: 'text-emerald-600' };
      default:
        return { label: 'Live Transit Update', color: 'bg-blue-600', text: 'text-blue-600' };
    }
  };

  const stageInfo = getStageHeader(alert.stage);

  return (
    <div
      id="voice-alert-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border-4 border-amber-400 text-center overflow-hidden">
        {/* Pulsing Alert Waves */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

        {/* Alarm Bell & Soundwave Icon */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
          <Volume2 className="w-10 h-10 animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600"></span>
          </span>
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-100 text-amber-900 mb-2 border border-amber-300">
          Continuous Audio Notification
        </span>

        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Transit Alert for {alert.studentName}
        </h3>

        {/* Stage Badge */}
        <div className="my-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-white text-xs font-extrabold shadow-sm ${stageInfo.color}">
          <span className={`w-2 h-2 rounded-full bg-white animate-ping`} />
          {stageInfo.label}
        </div>

        {/* Hindi Speech Quotation Card */}
        <div className="my-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-slate-800 text-sm font-medium leading-relaxed text-left relative">
          <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Voice Announcement (Hindi):
          </p>
          <p className="italic text-slate-900 font-semibold text-sm">
            "{alert.messageHindi}"
          </p>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        <p className="text-xs text-rose-700 font-bold mb-5 flex items-center justify-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          Alarm & Tune will continue ringing until you tap "OK"!
        </p>

        {/* Primary OK Button */}
        <button
          id="acknowledge-alarm-btn"
          onClick={handleDismiss}
          className="w-full rounded-2xl bg-emerald-600 py-3.5 px-6 text-base font-black text-white shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          OK / Maine Dekh Liya (Acknowledge)
        </button>

        <button
          onClick={handleReplay}
          className="mt-3 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
        >
          Replay Melodic Tune & Voice
        </button>
      </div>
    </div>
  );
};
