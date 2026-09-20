import React, { useState } from 'react';
import { Student, UserAccount, TransitLog, ALL_CLASSES, StudentClass, TransitStage } from '../types';
import { StudentPhoto } from '../services/studentPhotoStorage';
import { GraduationCap, QrCode, Search, CheckCircle2, Clock, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: UserAccount;
  students: Student[];
  transitLogs: TransitLog[];
  onOpenScanner: (stage: TransitStage, filterClass: string) => void;
  onViewIDCard: (student: Student) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  students,
  transitLogs,
  onOpenScanner,
  onViewIDCard,
}) => {
  // Class teacher selects class (Class 1 to 12, no sections)
  const [selectedClass, setSelectedClass] = useState<StudentClass>(
    currentUser.assignedClass || 'Class 5'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter students strictly by selected class
  const classStudents = students.filter(
    (s) =>
      s.studentClass === selectedClass &&
      (s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute today's status for each student in this class
  const studentStatusList = classStudents.map((stu) => {
    const todayLogs = transitLogs.filter(
      (l) => l.studentId === stu.studentId && l.timestamp.startsWith(todayStr)
    );

    const leftHome = todayLogs.find((l) => l.stage === 'LEFT_HOME');
    const gateIn = todayLogs.find((l) => l.stage === 'REACHED_SCHOOL_GATE');
    const classIn = todayLogs.find((l) => l.stage === 'ENTERED_CLASS');
    const gateOut = todayLogs.find((l) => l.stage === 'EXIT_SCHOOL_GATE');
    const homeIn = todayLogs.find((l) => l.stage === 'REACHED_HOME');

    let currentStage = 'NOT_ARRIVED';
    if (homeIn) currentStage = 'REACHED_HOME';
    else if (gateOut) currentStage = 'EXIT_SCHOOL_GATE';
    else if (classIn) currentStage = 'ENTERED_CLASS';
    else if (gateIn) currentStage = 'REACHED_SCHOOL_GATE';
    else if (leftHome) currentStage = 'LEFT_HOME';

    return {
      student: stu,
      leftHome,
      gateIn,
      classIn,
      gateOut,
      homeIn,
      currentStage,
    };
  });

  const presentInClassCount = studentStatusList.filter((s) => s.classIn).length;
  const inSchoolCampusCount = studentStatusList.filter((s) => s.gateIn && !s.gateOut).length;

  return (
    <div className="space-y-6">
      {/* Teacher Ribbon */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Classroom Attendance & Transit Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{currentUser.fullName}</h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1">
            Assigned Class: <span className="font-bold text-amber-300">{selectedClass}</span> • Section-Free Unified Curriculum
          </p>
        </div>

        <button
          onClick={() => onOpenScanner('ENTERED_CLASS', selectedClass)}
          className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-indigo-600/30 transition active:scale-95 shrink-0"
        >
          <QrCode className="w-5 h-5 stroke-[2.5]" />
          Scan Student for Class Entry
        </button>
      </div>

      {/* Class Selector & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Class Selector Dropdown */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs md:col-span-2 flex flex-col justify-center">
          <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
            Select Class (Class 1 to 12)
          </label>
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as StudentClass)}
              className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-950 font-black text-sm outline-none cursor-pointer hover:border-indigo-400 transition"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} Roster
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Selecting a class automatically displays only students registered in that class.
          </p>
        </div>

        {/* Present in Class */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present In Class</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {presentInClassCount} / {classStudents.length}
            </p>
            <p className="text-[10px] text-slate-400">Class In QR Scanned</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Reached School Gate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inside Campus</span>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {inSchoolCampusCount} / {classStudents.length}
            </p>
            <p className="text-[10px] text-slate-400">Gate In Verified</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Class Students Roster & Today's Transit Matrix */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm">
              {selectedClass} Student Transit & Class Matrix (Today)
            </h3>
            <p className="text-xs text-slate-500">Live stage updates across home, gate, and classroom</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3 text-center">Stage 1: Left Home</th>
                <th className="px-4 py-3 text-center">Stage 2: School Gate In</th>
                <th className="px-4 py-3 text-center bg-indigo-50/50 text-indigo-900">
                  Stage 3: Class In (Teacher)
                </th>
                <th className="px-4 py-3 text-center">Stage 4: School Gate Out</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentStatusList.map(({ student, leftHome, gateIn, classIn, gateOut }) => (
                <tr key={student.id} className="hover:bg-indigo-50/20 transition">
                  {/* Photo & Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <StudentPhoto
                        photoUrl={student.photoUrl}
                        alt={student.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs bg-slate-100"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{student.fullName}</p>
                        <p className="font-mono text-[10px] text-slate-400">{student.studentId}</p>
                      </div>
                    </div>
                  </td>

                  {/* Roll No */}
                  <td className="px-4 py-3.5 font-bold text-slate-700">{student.rollNumber}</td>

                  {/* Stage 1: Left Home */}
                  <td className="px-4 py-3.5 text-center">
                    {leftHome ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(leftHome.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Stage 2: Gate In */}
                  <td className="px-4 py-3.5 text-center">
                    {gateIn ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(gateIn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Stage 3: Class In */}
                  <td className="px-4 py-3.5 text-center bg-indigo-50/30">
                    {classIn ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-extrabold shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {new Date(classIn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold">
                        Not Scanned
                      </span>
                    )}
                  </td>

                  {/* Stage 4: Gate Out */}
                  <td className="px-4 py-3.5 text-center">
                    {gateOut ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                        <Clock className="w-3 h-3" />
                        {new Date(gateOut.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onViewIDCard(student)}
                      title="View Student QR ID Card"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {studentStatusList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found in {selectedClass}.
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
