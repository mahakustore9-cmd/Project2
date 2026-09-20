import React, { useState } from 'react';
import { UserAccount, Student, TransitLog, TransitStage } from '../types';
import { Shield, QrCode, LogIn, LogOut, Clock, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

interface GuardDashboardProps {
  currentUser: UserAccount;
  students: Student[];
  transitLogs: TransitLog[];
  onOpenScanner: (stage: TransitStage) => void;
}

export const GuardDashboard: React.FC<GuardDashboardProps> = ({
  currentUser,
  students,
  transitLogs,
  onOpenScanner,
}) => {
  // Toggle between Gate In and Gate Out
  const [activeGateMode, setActiveGateMode] = useState<'ENTRY' | 'EXIT'>('ENTRY');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter gate logs for today
  const todayGateLogs = transitLogs.filter(
    (l) =>
      l.timestamp.startsWith(todayStr) &&
      (l.stage === 'REACHED_SCHOOL_GATE' || l.stage === 'EXIT_SCHOOL_GATE')
  );

  const totalGateInToday = todayGateLogs.filter((l) => l.stage === 'REACHED_SCHOOL_GATE').length;
  const totalGateOutToday = todayGateLogs.filter((l) => l.stage === 'EXIT_SCHOOL_GATE').length;

  const currentStageTarget: TransitStage =
    activeGateMode === 'ENTRY' ? 'REACHED_SCHOOL_GATE' : 'EXIT_SCHOOL_GATE';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Main Gate Security & Transit Control
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{currentUser.fullName}</h2>
          <p className="text-xs sm:text-sm text-amber-200 mt-1">
            Gate No. 1 Scanner Terminal • Fast Passage Camera Matrix
          </p>
        </div>

        {/* Big High-Contrast Action Button */}
        <button
          id="guard-scan-btn"
          onClick={() => onOpenScanner(currentStageTarget)}
          className={`flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-black text-white shadow-2xl transition active:scale-95 shrink-0 ${
            activeGateMode === 'ENTRY'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/40'
              : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-600/40'
          }`}
        >
          <QrCode className="w-6 h-6 stroke-[2.5] animate-pulse" />
          <span>
            {activeGateMode === 'ENTRY'
              ? 'Scan Student: GATE IN (School Arrival)'
              : 'Scan Student: GATE OUT (School Exit)'}
          </span>
        </button>
      </div>

      {/* Mode Selector Switcher */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Current Scanner Mode</h3>
          <p className="text-xs text-slate-500">
            Switch between morning arrivals and afternoon dismissals with 1-click
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1.5 border border-slate-200 gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveGateMode('ENTRY')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition ${
              activeGateMode === 'ENTRY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            1. Morning Arrival (Gate In)
          </button>

          <button
            onClick={() => setActiveGateMode('EXIT')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black transition ${
              activeGateMode === 'EXIT'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogOut className="w-4 h-4" />
            2. Afternoon Exit (Gate Out)
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gate In (Arrivals)</span>
            <LogIn className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-700 mt-2">{totalGateInToday}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Students entered school gate today</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gate Out (Departures)</span>
            <LogOut className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-purple-700 mt-2">{totalGateOutToday}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Students safely exited gate today</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currently on Campus</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {Math.max(0, totalGateInToday - totalGateOutToday)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Net active headcount inside campus</p>
        </div>
      </div>

      {/* Live Gate Transit Log */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm">Gate Passage Real-Time Feed (Today)</h3>
            <p className="text-xs text-slate-500">Live timestamped record of physical gate crossings</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/60 px-2.5 py-1 rounded-md">
            {todayGateLogs.length} Scans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Passage Time</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Gate Direction</th>
                <th className="px-4 py-3">Verified By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayGateLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(l.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{l.studentName}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{l.studentClass}</td>
                  <td className="px-4 py-3">
                    {l.stage === 'REACHED_SCHOOL_GATE' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                        <LogIn className="w-3 h-3" /> SCHOOL GATE IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                        <LogOut className="w-3 h-3" /> SCHOOL GATE OUT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{l.scannedByName}</td>
                </tr>
              ))}

              {todayGateLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No gate passage scans recorded yet today. Tap "Scan Student" above to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
