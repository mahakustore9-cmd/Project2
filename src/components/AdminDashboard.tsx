import React, { useState } from 'react';
import { Student, School, UserAccount, TransitLog, ALL_CLASSES, StudentClass, TransitStage } from '../types';
import { compressImageToMax350KB } from '../services/imageCompression';
import { openWhatsAppShare } from '../services/whatsapp';
import { StudentPhoto, uploadStudentPhotoToStorage } from '../services/studentPhotoStorage';
import { StudentPhotoMigrationPanel } from './StudentPhotoMigrationPanel';
import {
  UserPlus,
  Search,
  QrCode,
  Edit,
  Trash2,
  Share2,
  Users,
  Shield,
  GraduationCap,
  Sparkles,
  Upload,
  AlertCircle,
  CheckCircle2,
  ClipboardPen,
  Calendar,
  Filter,
} from 'lucide-react';

interface AdminDashboardProps {
  school: School;
  students: Student[];
  users: UserAccount[];
  transitLogs: TransitLog[];
  onAddStudent: (student: Student) => Promise<void>;
  onUpdateStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onCreateStaffUser: (user: UserAccount) => Promise<void>;
  onAddManualTransitLog: (log: TransitLog) => Promise<void>;
  onViewIDCard: (student: Student) => void;
  onRefreshData?: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  school,
  students,
  users,
  transitLogs,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onCreateStaffUser,
  onAddManualTransitLog,
  onViewIDCard,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'manual_entry' | 'logs'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Student Form Modal State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Form Inputs
  const [fullName, setFullName] = useState('');
  const [studentClass, setStudentClass] = useState<StudentClass>('Class 5');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('2015-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [parentLoginId, setParentLoginId] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [pendingPhotoBlob, setPendingPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>('');
  const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Staff Form Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffRole, setStaffRole] = useState<'teacher' | 'guard'>('teacher');
  const [staffFullName, setStaffFullName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffAssignedClass, setStaffAssignedClass] = useState<StudentClass>('Class 1');

  // Manual Transit Entry Form State
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStage, setManualStage] = useState<TransitStage>('REACHED_SCHOOL_GATE');
  const [manualReason, setManualReason] = useState('Student forgot physical card / Camera scanner retry');
  const [manualSuccessMsg, setManualSuccessMsg] = useState<string | null>(null);

  // Open modal for Create Student
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    const newStudentId = `STU-2026-${String(students.length + 1).padStart(3, '0')}`;
    setFullName('');
    setStudentClass('Class 5');
    setRollNumber(String(students.length + 1));
    setDob('2015-05-15');
    setGender('Male');
    setBloodGroup('B+');
    setAddress('Delhi, India');
    setParentName('');
    setParentPhone('+91 ');
    setEmergencyContact('+91 ');
    setParentLoginId(`parent_${newStudentId.toLowerCase().replace('-', '_')}`);
    setParentPassword('pass123');
    setPhotoUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400');
    setPendingPhotoBlob(null);
    setPhotoPreviewUrl('');
    setPhotoSizeKb(45);
    setShowStudentModal(true);
  };

  // Open modal for Edit Student
  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setFullName(s.fullName);
    setStudentClass(s.studentClass);
    setRollNumber(s.rollNumber);
    setDob(s.dob);
    setGender(s.gender);
    setBloodGroup(s.bloodGroup || 'B+');
    setAddress(s.address);
    setParentName(s.parentName);
    setParentPhone(s.parentPhone);
    setEmergencyContact(s.emergencyContact);
    setParentLoginId(s.parentLoginId);
    setParentPassword(s.parentPassword);
    setPhotoUrl(s.photoUrl);
    setPendingPhotoBlob(null);
    setPhotoPreviewUrl('');
    setPhotoSizeKb(null);
    setShowStudentModal(true);
  };

  // Handle Photo File Upload with Auto-compression and staged Blob for Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const res = await compressImageToMax350KB(file);
      setPendingPhotoBlob(res.blob);
      setPhotoPreviewUrl(res.dataUrl);
      setPhotoSizeKb(res.sizeKb);
    } catch (err) {
      alert('Photo compression error: ' + err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Save Student (Add or Edit) - Uploads photo to Supabase Storage first, then stores only storage path
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalPhotoUrl = photoUrl;

    // If new photo was uploaded, save it to Supabase Storage first
    if (pendingPhotoBlob) {
      try {
        setIsUploadingPhoto(true);
        const targetStudentId = editingStudent
          ? editingStudent.studentId
          : `STU-2026-${String(students.length + 101)}`;

        const uploadRes = await uploadStudentPhotoToStorage(targetStudentId, pendingPhotoBlob);
        if (uploadRes.error) {
          alert(`Photo upload to Supabase Storage failed: ${uploadRes.error}\n\nStudent record was NOT updated to prevent data corruption.`);
          setIsUploadingPhoto(false);
          return;
        }

        finalPhotoUrl = uploadRes.storagePath; // e.g. "students/STU-2026-101.jpg"
      } catch (err: any) {
        alert('Photo upload error: ' + (err.message || err));
        setIsUploadingPhoto(false);
        return;
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        fullName,
        studentClass,
        rollNumber,
        dob,
        gender,
        bloodGroup,
        address,
        parentName,
        parentPhone,
        emergencyContact,
        parentLoginId,
        parentPassword,
        photoUrl: finalPhotoUrl,
      };
      await onUpdateStudent(updated);
    } else {
      const newStudentId = `STU-2026-${String(students.length + 101)}`;
      const newStu: Student = {
        id: 'stu_' + Date.now(),
        schoolId: school.id,
        studentId: newStudentId,
        fullName,
        studentClass,
        rollNumber,
        dob,
        gender,
        bloodGroup,
        address,
        parentName,
        parentPhone,
        emergencyContact,
        parentLoginId,
        parentPassword,
        photoUrl: finalPhotoUrl,
        createdAt: new Date().toISOString(),
      };
      await onAddStudent(newStu);
    }

    setPendingPhotoBlob(null);
    setPhotoPreviewUrl('');
    setShowStudentModal(false);
  };

  // Create Staff User (Teacher or Guard)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: UserAccount = {
      id: 'usr_staff_' + Date.now(),
      schoolId: school.id,
      username: staffUsername.trim().toLowerCase(),
      password: staffPassword.trim(),
      role: staffRole,
      fullName: staffFullName,
      phone: staffPhone,
      assignedClass: staffRole === 'teacher' ? staffAssignedClass : undefined,
      createdAt: new Date().toISOString(),
    };
    await onCreateStaffUser(newStaff);
    setShowStaffModal(false);
    setStaffFullName('');
    setStaffUsername('');
    setStaffPassword('');
    setStaffPhone('');
  };

  // Submit Manual Transit Log (Admin only authority)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) return;

    const student = students.find((s) => s.studentId === manualStudentId || s.id === manualStudentId);
    if (!student) return;

    const log: TransitLog = {
      id: 'log_manual_' + Date.now(),
      studentId: student.studentId,
      studentName: student.fullName,
      studentClass: student.studentClass,
      schoolId: school.id,
      stage: manualStage,
      timestamp: new Date().toISOString(),
      scannedByRole: 'admin',
      scannedByName: 'School Administrator (Manual Override)',
      scannedById: 'admin_manual',
      isManualEntry: true,
      manualNotes: manualReason,
    };

    await onAddManualTransitLog(log);
    setManualSuccessMsg(`Manual entry for ${student.fullName} (${manualStage}) recorded successfully!`);
    setTimeout(() => setManualSuccessMsg(null), 3500);
  };

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'ALL' || s.studentClass === filterClass;
    return matchesSearch && matchesClass;
  });

  const teachers = users.filter((u) => u.role === 'teacher');
  const guards = users.filter((u) => u.role === 'guard');

  return (
    <div className="space-y-6">
      {/* School Header Ribbon */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            School Administration Control Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">{school.name}</h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Affiliation Code: <span className="font-mono font-bold text-amber-300">{school.code}</span> • Class 1 to 12 Roster Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="add-student-btn"
            onClick={handleOpenAddStudent}
            className="flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Student
          </button>
          <button
            id="add-staff-btn"
            onClick={() => setShowStaffModal(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white border border-slate-700 transition active:scale-95"
          >
            <Users className="w-4 h-4" /> Add Teacher / Guard
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 gap-2 pt-2 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" /> Student Roster & ID Cards ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" /> Staff Logins (Guard & Teacher)
        </button>

        <button
          onClick={() => setActiveTab('manual_entry')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'manual_entry'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardPen className="w-4 h-4 text-amber-600" /> Admin Manual Transit Override
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Live Transit Logs ({transitLogs.length})
        </button>
      </div>

      {/* TAB 1: STUDENT ROSTER */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Supabase Storage Optimization & Migration Panel */}
          <StudentPhotoMigrationPanel students={students} onRefreshStudents={onRefreshData} />

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, parent..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none cursor-pointer"
              >
                <option value="ALL">All Classes (1 to 12)</option>
                {ALL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Student Info</th>
                    <th className="px-4 py-3">Class / Roll</th>
                    <th className="px-4 py-3">Parent Details & Login</th>
                    <th className="px-4 py-3">Emergency Contact</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition">
                      {/* Photo & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <StudentPhoto
                            photoUrl={s.photoUrl}
                            alt={s.fullName}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs bg-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{s.fullName}</p>
                            <p className="font-mono text-[11px] text-blue-600 font-semibold">{s.studentId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Class / Roll */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                          {s.studentClass}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1">Roll No: {s.rollNumber}</p>
                      </td>

                      {/* Parent & Login */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{s.parentName}</p>
                        <p className="font-mono text-slate-500 text-[11px]">{s.parentPhone}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Login: <span className="font-mono font-medium text-slate-700">{s.parentLoginId}</span>
                        </p>
                      </td>

                      {/* Emergency */}
                      <td className="px-4 py-3.5 font-mono text-amber-700 font-bold">
                        {s.emergencyContact}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View & Print ID Card */}
                          <button
                            onClick={() => onViewIDCard(s)}
                            title="Generate & Print ID Card with QR"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Credential Share */}
                          <button
                            onClick={() => openWhatsAppShare(s)}
                            title="Send ID & Credentials via WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Edit Student */}
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            title="Edit Student"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete student ${s.fullName} (${s.studentId})?`)) {
                                onDeleteStudent(s.id);
                              }
                            }}
                            title="Delete Student"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No students found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF LOGINS */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gate Guards */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Gate Guards ({guards.length})
                </h3>
                <span className="text-[11px] text-slate-400">Scans Gate-In & Gate-Out</span>
              </div>
              <div className="mt-4 space-y-2">
                {guards.map((g) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{g.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Username: <span className="font-semibold text-slate-700">{g.username}</span> • Phone: {g.phone}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      Pass: {g.password}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Teachers */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Class Teachers ({teachers.length})
                </h3>
                <span className="text-[11px] text-slate-400">Scans Class Entry</span>
              </div>
              <div className="mt-4 space-y-2">
                {teachers.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{t.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        Username: <span className="font-semibold text-slate-700">{t.username}</span> • {t.assignedClass || 'Class 1'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                      Pass: {t.password}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN MANUAL TRANSIT OVERRIDE */}
      {activeTab === 'manual_entry' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
              <ClipboardPen className="w-3.5 h-3.5" />
              Restricted Administrative Authority
            </div>
            <h3 className="text-xl font-black text-slate-900">Manual Transit Log Override</h3>
            <p className="text-xs text-slate-500 mt-1">
              "perants guard teacher kebal scan krse koi diktat ati hi to kebal admin menual entry krske"
            </p>
          </div>

          {manualSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {manualSuccessMsg}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Student</label>
              <select
                required
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
              >
                <option value="">-- Choose Student to Record --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.studentId}>
                    {s.fullName} ({s.studentClass} • {s.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transit Stage</label>
              <select
                value={manualStage}
                onChange={(e) => setManualStage(e.target.value as TransitStage)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
              >
                <option value="LEFT_HOME">Stage 1: Left Home (Ghar Se Nikla)</option>
                <option value="REACHED_SCHOOL_GATE">Stage 2: Reached School Gate (Gate In)</option>
                <option value="ENTERED_CLASS">Stage 3: Entered Class (Class In)</option>
                <option value="EXIT_SCHOOL_GATE">Stage 4: Exit School Gate (Gate Out)</option>
                <option value="REACHED_HOME">Stage 5: Reached Home (Ghar Pahuncha)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason / Audit Note (Required for Security Audit)
              </label>
              <textarea
                rows={2}
                required
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="e.g. Student forgot physical card, verified with parent call"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition active:scale-98"
            >
              Record Official Manual Transit Entry
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: LIVE TRANSIT LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">School-Wide Transit Audit Trail</h3>
            <span className="text-xs text-slate-500">{transitLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Stage Recorded</th>
                  <th className="px-4 py-3">Scanned By / Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transitLogs.slice(0, 50).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{l.studentName}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{l.studentClass}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          l.stage === 'REACHED_HOME'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.stage === 'EXIT_SCHOOL_GATE'
                            ? 'bg-purple-100 text-purple-800'
                            : l.stage === 'ENTERED_CLASS'
                            ? 'bg-indigo-100 text-indigo-800'
                            : l.stage === 'REACHED_SCHOOL_GATE'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-medium">{l.scannedByName}</p>
                      {l.isManualEntry && (
                        <span className="inline-block mt-0.5 text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                          MANUAL OVERRIDE: {l.manualNotes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT STUDENT MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                {editingStudent ? 'Edit Student Details' : 'Register New Student with Auto ID & QR'}
              </h3>
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Photo Upload with <=350KB Compression Badge & Storage Upload */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-center gap-4">
                <StudentPhoto
                  photoUrl={photoPreviewUrl || photoUrl}
                  alt="Preview"
                  className="w-20 h-24 rounded-xl object-cover border-2 border-white shadow-md bg-slate-200 shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase">
                    Student Photo (Supabase Storage Auto-Optimization)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Compressed to ~100–200 KB and uploaded to Supabase Storage (<code className="font-mono text-indigo-700">student-photos</code>). Only the small storage path is saved in the database.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {isCompressing && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Compressing image...
                    </span>
                  )}
                  {isUploadingPhoto && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Uploading to Supabase Storage bucket...
                    </span>
                  )}
                  {!isCompressing && photoSizeKb !== null && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      ✓ Ready for Storage: {photoSizeKb} KB (&le; 250 KB optimized)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Class (1 to 12)</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value as StudentClass)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold outline-none cursor-pointer"
                  >
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  >
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Parent Details & Login ID */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <p className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Parents Information & Portal Credentials
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent Name</label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Manoj Kumar"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent Phone (for WhatsApp)</label>
                    <input
                      type="text"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+91 98444 55566"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      required
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+91 98444 55566"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent Login ID</label>
                    <input
                      type="text"
                      required
                      value={parentLoginId}
                      onChange={(e) => setParentLoginId(e.target.value)}
                      placeholder="parentaarav"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parent Password</label>
                    <input
                      type="text"
                      required
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      placeholder="pass123"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Sector, City"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 font-bold text-white shadow-md hover:bg-blue-700 transition"
                >
                  {editingStudent ? 'Update Student Record' : 'Save & Generate ID Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Create Staff Login ID & Password
            </h3>
            <form onSubmit={handleSaveStaff} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Staff Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStaffRole('teacher')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      staffRole === 'teacher'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    👩‍🏫 Class Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffRole('guard')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      staffRole === 'guard'
                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    🛡️ Gate Guard
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  placeholder="e.g. Ramesh Yadav"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              {staffRole === 'teacher' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Class</label>
                  <select
                    value={staffAssignedClass}
                    onChange={(e) => setStaffAssignedClass(e.target.value as StudentClass)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold outline-none"
                  >
                    {ALL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Login Username / ID</label>
                <input
                  type="text"
                  required
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="e.g. guardgate2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="e.g. guard123"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+91 98333 44455"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 font-bold text-white shadow hover:bg-blue-700 transition"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
