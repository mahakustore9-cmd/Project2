/**
 * Student Tracking System (Vidyarthi Suraksha Kawach)
 * Complete 5-Stage QR Transit Matrix with Voice Alerts, PWA, Supabase Integration & ID Generator
 */

import React, { useEffect, useState } from 'react';
import { UserAccount, School, Student, TransitLog, TransitStage, VoiceAlertPayload, StudentDailyMatrixRow } from './types';
import { repository } from './services/supabase';
import {
  startContinuousAlert,
  stopContinuousAlert,
  getHindiTransitMessage,
  playSuperTuneChime,
  speakHindiVoice,
} from './services/audio';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { IDCardModal } from './components/IDCardModal';
import { QRScannerModal } from './components/QRScannerModal';
import { VoiceAlertModal } from './components/VoiceAlertModal';
import { PRDAndSecurityModal } from './components/PRDAndSecurityModal';
import { MobileAppNavBar } from './components/MobileAppNavBar';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GuardDashboard } from './components/GuardDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import {
  ShieldCheck,
  Volume2,
  Sparkles,
  Users,
  Shield,
  GraduationCap,
  HeartHandshake,
  Crown,
  Database,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

export default function App() {
  // Core Entities
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [transitLogs, setTransitLogs] = useState<TransitLog[]>([]);
  const [dailyMatrixRows, setDailyMatrixRows] = useState<StudentDailyMatrixRow[]>([]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Mobile App Navigation Tab
  const [mobileActiveTab, setMobileActiveTab] = useState<'home' | 'matrix'>('home');

  // Modal States
  const [showPRDModal, setShowPRDModal] = useState(false);
  const [viewingIDCardStudent, setViewingIDCardStudent] = useState<Student | null>(null);
  const [activeVoiceAlert, setActiveVoiceAlert] = useState<VoiceAlertPayload | null>(null);

  // QR Scanner Modal State
  const [scannerState, setScannerState] = useState<{
    isOpen: boolean;
    stage: TransitStage;
    title: string;
    subtitle: string;
    filterClass?: string;
    enforceStudentId?: string;
  }>({
    isOpen: false,
    stage: 'REACHED_SCHOOL_GATE',
    title: '',
    subtitle: '',
  });

  // Supabase Connection Status
  const [supabaseStatus, setSupabaseStatus] = useState<{ online: boolean; message: string }>({
    online: false,
    message: 'Initializing Supabase connection...',
  });

  const refreshAllData = async () => {
    const [sList, uList, stList, lList, mList] = await Promise.all([
      repository.getSchools(),
      repository.getUsers(),
      repository.getStudents(),
      repository.getTransitLogs(),
      repository.getStudentDailyMatrixRows(),
    ]);

    setSchools(sList);
    setUsers(uList);
    setStudents(stList);
    setTransitLogs(lList);
    setDailyMatrixRows(mList);
    if (!activeSchool && sList.length > 0) setActiveSchool(sList[0]);
  };

  // Initial Data Load & Live Polling (Every 3.5s for Real-Time Live Sync)
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const [sList, uList, stList, lList, mList, health] = await Promise.all([
        repository.getSchools(),
        repository.getUsers(),
        repository.getStudents(),
        repository.getTransitLogs(),
        repository.getStudentDailyMatrixRows(),
        repository.checkSupabaseHealth(),
      ]);

      if (mounted) {
        setSchools(sList);
        setUsers(uList);
        setStudents(stList);
        setTransitLogs(lList);
        setDailyMatrixRows(mList);
        setActiveSchool(sList[0] || null);
        setSupabaseStatus(health);

        // Check for authenticated session (Production Security Mode)
        const rawSession =
          localStorage.getItem('vsk_auth_session') ||
          sessionStorage.getItem('vsk_auth_session');

        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            const matchedUser = uList.find(
              (u) =>
                u.id === parsed.userId ||
                u.username.toLowerCase() === parsed.username?.toLowerCase()
            );
            if (matchedUser) {
              setCurrentUser(matchedUser);
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
        } else {
          // Production Mode: Nobody is auto-logged in, credentials required!
          setCurrentUser(null);
        }
      }
    }

    loadData();

    // Live update poller
    const interval = setInterval(async () => {
      if (!mounted) return;
      try {
        const [lList, mList] = await Promise.all([
          repository.getTransitLogs(),
          repository.getStudentDailyMatrixRows(),
        ]);
        if (mounted) {
          setTransitLogs(lList);
          setDailyMatrixRows(mList);
        }
      } catch {
        // silent
      }
    }, 3500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Secure Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('vsk_auth_session');
    sessionStorage.removeItem('vsk_auth_session');
    setCurrentUser(null);
    setShowLoginModal(false);
  };

  // Trigger Scanner Modal Helper
  const openScanner = (
    stage: TransitStage,
    opts?: { filterClass?: string; enforceStudentId?: string; customTitle?: string; customSubtitle?: string }
  ) => {
    let title = 'Scan Student QR Code';
    let subtitle = 'Point camera at student identity card QR code';

    if (stage === 'LEFT_HOME') {
      title = 'Scan: Student Leaving Home (Ghar Se Nikla)';
      subtitle = 'Parent verification before school bus or commute departure';
    } else if (stage === 'REACHED_SCHOOL_GATE') {
      title = 'Scan: Reached School Gate (Gate In)';
      subtitle = 'Gate guard verification of student entering campus';
    } else if (stage === 'ENTERED_CLASS') {
      title = 'Scan: Entered Classroom (Class In)';
      subtitle = 'Class teacher verification of student seated in class';
    } else if (stage === 'EXIT_SCHOOL_GATE') {
      title = 'Scan: Exited School Gate (Gate Out)';
      subtitle = 'Gate guard verification of student departure after dismissal';
    } else if (stage === 'REACHED_HOME') {
      title = 'Scan: Reached Home Safely (Ghar Pahuncha)';
      subtitle = 'Parent verification of safe arrival back home';
    }

    setScannerState({
      isOpen: true,
      stage,
      title: opts?.customTitle || title,
      subtitle: opts?.customSubtitle || subtitle,
      filterClass: opts?.filterClass,
      enforceStudentId: opts?.enforceStudentId,
    });
  };

  // Handle Scan Completed Successfully
  const handleScanSuccess = async (student: Student, stage: TransitStage) => {
    if (!currentUser) return;

    const newLog: TransitLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      studentId: student.studentId,
      studentName: student.fullName,
      studentClass: student.studentClass,
      schoolId: student.schoolId,
      stage,
      timestamp: new Date().toISOString(),
      scannedByRole: currentUser.role,
      scannedByName: currentUser.fullName,
      scannedById: currentUser.id,
      locationLabel:
        stage === 'LEFT_HOME' || stage === 'REACHED_HOME'
          ? 'Home Residence'
          : stage === 'ENTERED_CLASS'
          ? `${student.studentClass} Classroom`
          : 'Campus Gate No. 1',
    };

    // 1. Save to Supabase repository
    await repository.addTransitLog(newLog);
    setTransitLogs((prev) => [newLog, ...prev]);
    const updatedMatrix = await repository.getStudentDailyMatrixRows();
    setDailyMatrixRows(updatedMatrix);

    // 2. Prepare Hindi Voice Notification & Trigger Continuous Alert Modal
    const hindiMessage = getHindiTransitMessage(student.fullName, stage);
    const alertPayload: VoiceAlertPayload = {
      id: 'alert_' + Date.now(),
      studentId: student.studentId,
      studentName: student.fullName,
      stage,
      messageHindi: hindiMessage,
      timestamp: new Date().toISOString(),
    };

    setActiveVoiceAlert(alertPayload);

    // 3. Start Continuous Melodic Chime & Hindi Speech loop until user hits OK
    startContinuousAlert(student.fullName, stage);
  };

  // Trigger manual test of the persistent voice alarm loop
  const handleTestVoiceAlert = () => {
    const sampleStudent = students[0] || {
      fullName: 'Aarav Kumar',
      studentId: 'STU-2026-001',
    };
    const alertPayload: VoiceAlertPayload = {
      id: 'alert_test_' + Date.now(),
      studentId: sampleStudent.studentId,
      studentName: sampleStudent.fullName,
      stage: 'REACHED_SCHOOL_GATE',
      messageHindi: `Dhyan dein, aapka bachcha ${sampleStudent.fullName} school pahunch gaya hai. Gate guard ne scan kar liya hai.`,
      timestamp: new Date().toISOString(),
    };
    setActiveVoiceAlert(alertPayload);
    startContinuousAlert(sampleStudent.fullName, 'REACHED_SCHOOL_GATE');
  };

  // Add Student Handler
  const handleAddStudent = async (newStudent: Student) => {
    await repository.createStudent(newStudent);
    setStudents((prev) => [newStudent, ...prev]);
    // Also refresh users list to include new parent account
    const uList = await repository.getUsers();
    setUsers(uList);
    // Open ID card automatically
    setViewingIDCardStudent(newStudent);
  };

  // Update Student Handler
  const handleUpdateStudent = async (updated: Student) => {
    await repository.updateStudent(updated);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  // Delete Student Handler
  const handleDeleteStudent = async (id: string) => {
    await repository.deleteStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id && s.studentId !== id));
  };

  // Create Staff User Handler
  const handleCreateStaffUser = async (newStaff: UserAccount) => {
    await repository.createUser(newStaff);
    setUsers((prev) => [newStaff, ...prev]);
  };

  // Manual Transit Log Handler
  const handleAddManualTransitLog = async (log: TransitLog) => {
    await repository.addTransitLog(log);
    setTransitLogs((prev) => [log, ...prev]);
    const updatedMatrix = await repository.getStudentDailyMatrixRows();
    setDailyMatrixRows(updatedMatrix);
  };

  // Find linked student if currentUser is parent
  const parentStudent =
    currentUser?.role === 'parent'
      ? students.find((s) => s.studentId === currentUser.studentId) || students[0]
      : null;

  const handleMobileScanClick = () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    if (currentUser.role === 'guard') {
      openScanner('REACHED_SCHOOL_GATE', {
        customTitle: 'Gate Entry Scan (School In)',
        customSubtitle: 'Scan student ID card at school gate passage',
      });
    } else if (currentUser.role === 'teacher') {
      openScanner('ENTERED_CLASS', {
        filterClass: currentUser.assignedClass || 'Class 5-A',
        customTitle: `Classroom Scan: ${currentUser.assignedClass || 'Class 5-A'}`,
        customSubtitle: 'Scan student ID to mark Class In',
      });
    } else if (currentUser.role === 'parent') {
      const pStudent = students.find((s) => s.studentId === currentUser.studentId) || students[0];
      openScanner('LEFT_HOME', {
        enforceStudentId: pStudent?.studentId,
        customTitle: 'Scan Departure: Leaving Home',
        customSubtitle: `Verified scanning for child: ${pStudent?.fullName}`,
      });
    } else {
      openScanner('REACHED_SCHOOL_GATE', {
        customTitle: 'Quick Admin Scanner',
        customSubtitle: 'Scan student QR card to mark transit event',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-20 md:pb-0">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        activeSchool={activeSchool}
        onLogout={handleLogout}
        onOpenPRD={() => setShowPRDModal(true)}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* Supabase Cloud Connection Notice Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-semibold text-slate-200">
              Supabase Endpoint: <code className="font-mono text-[11px] text-blue-400">aitlkrtkusnimlkchhye.supabase.co</code>
            </span>
            <span className="hidden md:inline text-slate-400">• {supabaseStatus.message}</span>
          </div>

          <button
            onClick={() => setShowPRDModal(true)}
            className="text-blue-400 hover:text-blue-300 underline font-bold text-[11px] shrink-0"
          >
            Copy 1-Click SQL Schema &rarr;
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {!currentUser ? (
          <div className="py-8 flex items-center justify-center">
            <LoginModal
              users={users}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                setShowLoginModal(false);
              }}
              isFullPage={false}
            />
          </div>
        ) : currentUser.role === 'super_admin' ? (
          <SuperAdminDashboard
            schools={schools}
            users={users}
            students={students}
            transitLogs={transitLogs}
            dailyMatrixRows={dailyMatrixRows}
            onRefreshData={refreshAllData}
            onCreateSchool={async (school, adminUser) => {
              await repository.createSchool(school);
              await repository.createUser(adminUser);
              setSchools((prev) => [school, ...prev]);
              setUsers((prev) => [adminUser, ...prev]);
            }}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard
            school={activeSchool || schools[0]}
            students={students}
            users={users}
            transitLogs={transitLogs}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onCreateStaffUser={handleCreateStaffUser}
            onAddManualTransitLog={handleAddManualTransitLog}
            onViewIDCard={(student) => setViewingIDCardStudent(student)}
            onRefreshData={refreshAllData}
          />
        ) : currentUser.role === 'teacher' ? (
          <TeacherDashboard
            currentUser={currentUser}
            students={students}
            transitLogs={transitLogs}
            onOpenScanner={(stage, filterClass) =>
              openScanner(stage, {
                filterClass,
                customTitle: `Classroom Scan: ${filterClass}`,
                customSubtitle: 'Scan student identity card to mark Class In arrival',
              })
            }
            onViewIDCard={(student) => setViewingIDCardStudent(student)}
          />
        ) : currentUser.role === 'guard' ? (
          <GuardDashboard
            currentUser={currentUser}
            students={students}
            transitLogs={transitLogs}
            onOpenScanner={(stage) =>
              openScanner(stage, {
                customTitle:
                  stage === 'REACHED_SCHOOL_GATE'
                    ? 'Gate Entry Scan (School In)'
                    : 'Gate Exit Scan (School Out)',
                customSubtitle: 'Scan student ID card at school gate passage',
              })
            }
          />
        ) : currentUser.role === 'parent' ? (
          parentStudent ? (
            <ParentDashboard
              currentUser={currentUser}
              student={parentStudent}
              transitLogs={transitLogs}
              onOpenScanner={(stage, enforceStudentId) =>
                openScanner(stage, {
                  enforceStudentId,
                  customTitle:
                    stage === 'LEFT_HOME'
                      ? 'Scan Departure: Leaving Home'
                      : 'Scan Arrival: Reached Home Safely',
                  customSubtitle: `Verified scanning for child: ${parentStudent.fullName}`,
                })
              }
              onViewIDCard={(student) => setViewingIDCardStudent(student)}
              onTriggerVoiceTest={handleTestVoiceAlert}
            />
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">No linked student record found for this parent ID.</p>
              <p className="text-xs text-slate-500 mt-1">
                Please contact school administrator or switch to School Admin view to link student.
              </p>
            </div>
          )
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Student Tracking System (Vidyarthi Suraksha Kawach) • PWA Enabled • Supabase Cloud Persistent • Voice Audio Active
        </p>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          users={users}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setShowLoginModal(false);
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* ID Card Generator & Print Modal */}
      {viewingIDCardStudent && (
        <IDCardModal
          student={viewingIDCardStudent}
          school={activeSchool || schools[0]}
          onClose={() => setViewingIDCardStudent(null)}
        />
      )}

      {/* QR Camera Scanner Modal */}
      {scannerState.isOpen && (
        <QRScannerModal
          currentStage={scannerState.stage}
          stageTitle={scannerState.title}
          stageSubtitle={scannerState.subtitle}
          currentUser={currentUser!}
          allStudents={students}
          filterClass={scannerState.filterClass}
          enforceStudentId={scannerState.enforceStudentId}
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Persistent Voice Alert Modal (rings until OK is pressed) */}
      {activeVoiceAlert && (
        <VoiceAlertModal
          alert={activeVoiceAlert}
          onAcknowledge={() => {
            stopContinuousAlert();
            setActiveVoiceAlert(null);
          }}
        />
      )}

      {/* PRD, System Prompt, Supabase SQL & Security Modal (Strictly Restricted to Super Admin) */}
      {showPRDModal && currentUser?.role === 'super_admin' && (
        <PRDAndSecurityModal onClose={() => setShowPRDModal(false)} />
      )}

      {/* Mobile Matrix Viewer (When user taps Matrix on mobile navigation) */}
      {mobileActiveTab === 'matrix' && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-xs flex flex-col justify-end md:hidden">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden pb-16">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Daily Transit Matrix (1 Row/Day)
                </h3>
                <p className="text-[11px] text-slate-500">Live updated across 5 stages</p>
              </div>
              <button
                onClick={() => setMobileActiveTab('home')}
                className="px-3 py-1 rounded-xl bg-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-300"
              >
                Close
              </button>
            </div>

            {/* Matrix Rows List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {dailyMatrixRows.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No daily matrix records generated yet.
                </div>
              ) : (
                dailyMatrixRows.slice(0, 15).map((row) => (
                  <div
                    key={row.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-900">{row.studentName}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {row.studentId} • {row.studentClass}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                          {row.date}
                        </span>
                      </div>
                    </div>

                    {/* 5-Stage Visual Pill Strip */}
                    <div className="grid grid-cols-5 gap-1 text-center text-[9px] font-medium pt-1 border-t border-slate-100">
                      <div
                        className={`p-1 rounded-lg ${
                          row.stage1LeftHomeTime
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <div className="text-[8px] uppercase">1. Home</div>
                        <div className="font-mono text-[9px]">{row.stage1LeftHomeTime || '-'}</div>
                      </div>

                      <div
                        className={`p-1 rounded-lg ${
                          row.stage2GateInTime
                            ? 'bg-blue-100 text-blue-900 font-bold'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <div className="text-[8px] uppercase">2. Gate In</div>
                        <div className="font-mono text-[9px]">{row.stage2GateInTime || '-'}</div>
                      </div>

                      <div
                        className={`p-1 rounded-lg ${
                          row.stage3ClassInTime
                            ? 'bg-indigo-100 text-indigo-900 font-bold'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <div className="text-[8px] uppercase">3. Class</div>
                        <div className="font-mono text-[9px]">{row.stage3ClassInTime || '-'}</div>
                      </div>

                      <div
                        className={`p-1 rounded-lg ${
                          row.stage4GateOutTime
                            ? 'bg-purple-100 text-purple-900 font-bold'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <div className="text-[8px] uppercase">4. Gate Out</div>
                        <div className="font-mono text-[9px]">{row.stage4GateOutTime || '-'}</div>
                      </div>

                      <div
                        className={`p-1 rounded-lg ${
                          row.stage5HomeArrivalTime
                            ? 'bg-emerald-100 text-emerald-900 font-bold'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        <div className="text-[8px] uppercase">5. Return</div>
                        <div className="font-mono text-[9px]">{row.stage5HomeArrivalTime || '-'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span className="font-bold text-slate-700">Status: {row.status}</span>
                      <span className="font-mono text-[9px]">
                        Updated: {new Date(row.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Native App-Style Bottom Navigation Bar (Mobile only, Authenticated Users) */}
      {currentUser && (
        <MobileAppNavBar
          currentUser={currentUser}
          activeTab={mobileActiveTab}
          onSelectTab={(tab) => setMobileActiveTab(tab as any)}
          onOpenScanner={handleMobileScanClick}
          onTriggerVoiceTest={handleTestVoiceAlert}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
