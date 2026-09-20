import React, { useEffect, useState } from 'react';
import { UserAccount, Student, TransitLog, TransitStage } from '../types';
import { repository } from '../services/supabase';
import { StudentPhoto } from '../services/studentPhotoStorage';
import {
  HeartHandshake,
  QrCode,
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Volume2,
  Calendar,
  AlertCircle,
  Phone,
  ArrowRight,
  School as SchoolIcon,
} from 'lucide-react';

interface ParentDashboardProps {
  currentUser: UserAccount;
  student: Student;
  transitLogs: TransitLog[];
  onOpenScanner: (stage: TransitStage, enforceStudentId: string) => void;
  onViewIDCard: (student: Student) => void;
  onTriggerVoiceTest: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  currentUser,
  student,
  transitLogs,
  onOpenScanner,
  onViewIDCard,
  onTriggerVoiceTest,
}) => {
  const [matrixData, setMatrixData] = useState<
    {
      date: string;
      formattedDate: string;
      stages: Record<TransitStage, { time: string; scannedBy: string; isManual?: boolean } | null>;
      currentStage: TransitStage | 'COMPLETED' | 'NOT_STARTED';
    }[]
  >([]);

  // Fetch 5-day matrix on load and whenever transitLogs change
  useEffect(() => {
    let mounted = true;
    const loadMatrix = async () => {
      const res = await repository.getStudent5DayMatrix(student.studentId);
      if (mounted) {
        setMatrixData(res.matrix);
      }
    };
    loadMatrix();
    return () => {
      mounted = false;
    };
  }, [student, transitLogs]);

  // Today's record is the last item in the 5-day matrix
  const todayRecord = matrixData.length > 0 ? matrixData[matrixData.length - 1] : null;

  // Stages definition for the visual stepper
  const stagesStepList: { stage: TransitStage; label: string; hindiLabel: string; icon: React.ElementType }[] = [
    { stage: 'LEFT_HOME', label: '1. Left Home', hindiLabel: 'Ghar Se Nikla', icon: Home },
    { stage: 'REACHED_SCHOOL_GATE', label: '2. School Gate In', hindiLabel: 'Gate Par Pahuncha', icon: ShieldCheck },
    { stage: 'ENTERED_CLASS', label: '3. Class In', hindiLabel: 'Class Me Pahuncha', icon: GraduationCap },
    { stage: 'EXIT_SCHOOL_GATE', label: '4. School Gate Out', hindiLabel: 'School Se Nikla', icon: SchoolIcon },
    { stage: 'REACHED_HOME', label: '5. Reached Home', hindiLabel: 'Surakshit Ghar Pahuncha', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Child Info */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <StudentPhoto
            photoUrl={student.photoUrl}
            alt={student.fullName}
            className="w-18 h-22 sm:w-20 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-lg bg-slate-800 shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              Verified Parent Safety Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{student.fullName}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-emerald-200">
              <span className="font-bold bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-600/50">
                {student.studentClass}
              </span>
              <span>• Roll No: <strong>{student.rollNumber}</strong></span>
              <span>• ID: <strong className="font-mono text-amber-300">{student.studentId}</strong></span>
            </div>
          </div>
        </div>

        {/* Parent QR Scan Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Scan: Leaving Home */}
          <button
            id="parent-scan-depart-btn"
            onClick={() => onOpenScanner('LEFT_HOME', student.studentId)}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-3 text-xs font-bold text-white shadow-md transition active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan: Ghar Se Nikal Raha Hai</span>
          </button>

          {/* Scan: Reached Home */}
          <button
            id="parent-scan-arrival-btn"
            onClick={() => onOpenScanner('REACHED_HOME', student.studentId)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Scan: Ghar Pahunch Gaya</span>
          </button>

          {/* View Digital ID Card */}
          <button
            onClick={() => onViewIDCard(student)}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-3 text-xs font-bold text-slate-200 border border-slate-700 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>View ID Pass</span>
          </button>
        </div>
      </div>

      {/* Voice Notification Real-Time Alert Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-300/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Volume2 className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>Automatic Hindi Voice Notification & Melodic Alarm Active</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              School gate ya class me scan hote hi aapke phone par super tune ke sath voice bolegi:
              <span className="italic font-semibold text-slate-900 block mt-0.5">
                "Aapka bachcha {student.fullName} school pahunch gaya hai"
              </span>
              Aur alarm tab tak bajta rahega jab tak aap "OK" nahi kar dete.
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerVoiceTest}
          className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs shrink-0 self-end sm:self-auto"
        >
          Test Alert & Alarm Loop
        </button>
      </div>

      {/* Today's 5-Stage Live Visual Transit Timeline */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Today's Live 5-Stage Transit Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time progression from departure at home to school gate, classroom, dismissal, and safe return.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* 5-Stage Stepper Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {stagesStepList.map(({ stage, label, hindiLabel, icon: Icon }, index) => {
            const stageData = todayRecord?.stages[stage];
            const isCompleted = !!stageData;

            return (
              <div
                key={stage}
                className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                        isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Pending</span>
                    )}
                  </div>

                  <p className="font-bold text-xs leading-tight">{label}</p>
                  <p className={`text-[11px] font-semibold mt-0.5 ${isCompleted ? 'text-emerald-800' : 'text-slate-400'}`}>
                    {hindiLabel}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200/60">
                  {stageData ? (
                    <div>
                      <p className="text-xs font-mono font-black text-emerald-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {stageData.time}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">By: {stageData.scannedBy}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium">Awaiting Scan</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-Day Transit Matrix Table (perants dashboard me pichle 5 din ka matrix dikhe) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Past 5 Days Transit Matrix (5 Din Ka Matrix)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily comparative audit of all 5 transit milestones
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            Isolated Privacy Mode Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-4 py-3 text-center">1. Left Home</th>
                <th className="px-4 py-3 text-center">2. School Gate In</th>
                <th className="px-4 py-3 text-center">3. Class In</th>
                <th className="px-4 py-3 text-center">4. School Gate Out</th>
                <th className="px-4 py-3 text-center">5. Reached Home</th>
                <th className="px-5 py-3 text-center">Day Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.map((row, idx) => (
                <tr key={row.date} className="hover:bg-slate-50/80 transition">
                  {/* Formatted Date */}
                  <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {row.formattedDate}
                    {idx === matrixData.length - 1 && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        Today
                      </span>
                    )}
                  </td>

                  {/* Left Home */}
                  <td className="px-4 py-3.5 text-center">
                    {row.stages.LEFT_HOME ? (
                      <span className="inline-block font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        {row.stages.LEFT_HOME.time}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Gate In */}
                  <td className="px-4 py-3.5 text-center">
                    {row.stages.REACHED_SCHOOL_GATE ? (
                      <span className="inline-block font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                        {row.stages.REACHED_SCHOOL_GATE.time}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Class In */}
                  <td className="px-4 py-3.5 text-center">
                    {row.stages.ENTERED_CLASS ? (
                      <span className="inline-block font-mono text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        {row.stages.ENTERED_CLASS.time}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Gate Out */}
                  <td className="px-4 py-3.5 text-center">
                    {row.stages.EXIT_SCHOOL_GATE ? (
                      <span className="inline-block font-mono text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                        {row.stages.EXIT_SCHOOL_GATE.time}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Reached Home */}
                  <td className="px-4 py-3.5 text-center">
                    {row.stages.REACHED_HOME ? (
                      <span className="inline-block font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        {row.stages.REACHED_HOME.time}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Overall Day Status */}
                  <td className="px-5 py-3.5 text-center">
                    {row.stages.REACHED_HOME ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Safely Completed
                      </span>
                    ) : row.stages.EXIT_SCHOOL_GATE ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                        <ArrowRight className="w-3 h-3" /> In Transit Home
                      </span>
                    ) : row.stages.ENTERED_CLASS ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                        <GraduationCap className="w-3 h-3" /> In Class
                      </span>
                    ) : row.stages.REACHED_SCHOOL_GATE ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        <ShieldCheck className="w-3 h-3" /> At School Gate
                      </span>
                    ) : row.stages.LEFT_HOME ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" /> Left Home
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">No Records</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
