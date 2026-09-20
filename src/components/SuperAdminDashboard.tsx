import React, { useState } from 'react';
import { School, UserAccount, Student, TransitLog, StudentDailyMatrixRow } from '../types';
import { repository } from '../services/supabase';
import { StudentPhotoMigrationPanel } from './StudentPhotoMigrationPanel';
import { isStoragePath, StudentPhoto } from '../services/studentPhotoStorage';
import {
  Crown,
  Building2,
  Plus,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Database,
  Table,
  Search,
  Download,
  RefreshCw,
  Eye,
  Lock,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  CloudUpload,
  AlertCircle,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  schools: School[];
  users: UserAccount[];
  students: Student[];
  transitLogs: TransitLog[];
  dailyMatrixRows: StudentDailyMatrixRow[];
  onRefreshData: () => Promise<void>;
  onCreateSchool: (school: School, adminUser: UserAccount) => Promise<void>;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  schools,
  users,
  students,
  transitLogs,
  dailyMatrixRows,
  onRefreshData,
  onCreateSchool,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'database'>('overview');
  const [activeDbTable, setActiveDbTable] = useState<
    'student_daily_matrix' | 'students' | 'user_accounts' | 'schools'
  >('student_daily_matrix');
  const [dbSearch, setDbSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncState, setSyncState] = useState<{
    syncing: boolean;
    result?: { success: boolean; syncedCount: number; errors: string[] };
  }>({ syncing: false });

  const handleSyncToCloud = async () => {
    setSyncState({ syncing: true });
    try {
      const res = await repository.syncAllLocalDataToSupabase();
      setSyncState({ syncing: false, result: res });
      await onRefreshData();
    } catch (e: any) {
      setSyncState({
        syncing: false,
        result: { success: false, syncedCount: 0, errors: [e?.message || 'Sync failed'] },
      });
    }
  };

  // School creation form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const schoolId = 'sch_' + Date.now();
    const newSchool: School = {
      id: schoolId,
      name: schoolName,
      code: schoolCode.toUpperCase(),
      address,
      phone,
      email,
      createdAt: new Date().toISOString(),
    };

    const newAdmin: UserAccount = {
      id: 'usr_admin_' + Date.now(),
      schoolId: schoolId,
      username: adminUsername,
      password: adminPassword,
      role: 'admin',
      fullName: adminFullName,
      phone: phone,
      createdAt: new Date().toISOString(),
    };

    await onCreateSchool(newSchool, newAdmin);
    setIsSubmitting(false);
    setShowCreateModal(false);

    setSchoolName('');
    setSchoolCode('');
    setAddress('');
    setPhone('');
    setEmail('');
    setAdminUsername('');
    setAdminPassword('');
    setAdminFullName('');
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // CSV Export for Database Tables
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeDbTable === 'student_daily_matrix') {
      csvContent += 'ID,Date,Student_ID,Student_Name,Class,Stage1_LeftHome,Stage2_GateIn,Stage3_ClassIn,Stage4_GateOut,Stage5_HomeArrival,Status,UpdatedAt\n';
      dailyMatrixRows.forEach((r) => {
        csvContent += `"${r.id}","${r.date}","${r.studentId}","${r.studentName}","${r.studentClass}","${r.stage1LeftHomeTime || ''}","${r.stage2GateInTime || ''}","${r.stage3ClassInTime || ''}","${r.stage4GateOutTime || ''}","${r.stage5HomeArrivalTime || ''}","${r.status}","${r.updatedAt}"\n`;
      });
    } else if (activeDbTable === 'students') {
      csvContent += 'ID,Student_ID,Full_Name,Class,Roll,Parent_Name,Parent_Phone,Emergency\n';
      students.forEach((s) => {
        csvContent += `"${s.id}","${s.studentId}","${s.fullName}","${s.studentClass}","${s.rollNumber}","${s.parentName}","${s.parentPhone}","${s.emergencyContact}"\n`;
      });
    } else if (activeDbTable === 'user_accounts') {
      csvContent += 'ID,Username,Full_Name,Role,School_ID\n';
      users.forEach((u) => {
        csvContent += `"${u.id}","${u.username}","${u.fullName}","${u.role}","${u.schoolId}"\n`;
      });
    } else if (activeDbTable === 'schools') {
      csvContent += 'ID,Name,Code,Address,Phone,Email\n';
      schools.forEach((sc) => {
        csvContent += `"${sc.id}","${sc.name}","${sc.code}","${sc.address}","${sc.phone}","${sc.email}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeDbTable}_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter daily matrix rows
  const filteredMatrixRows = dailyMatrixRows.filter(
    (r) =>
      r.studentName.toLowerCase().includes(dbSearch.toLowerCase()) ||
      r.studentId.toLowerCase().includes(dbSearch.toLowerCase()) ||
      r.date.includes(dbSearch) ||
      r.studentClass.toLowerCase().includes(dbSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 mb-3">
            <Crown className="w-3.5 h-3.5 text-purple-300" />
            Central Super Admin Governance
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Institutional Network & Database Control
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-2 leading-relaxed">
            Multi-school onboarding, raw database tables access (1-Row-Per-Day Matrix), and system-wide security matrix oversight.
          </p>
        </div>

        <div className="relative z-10 mt-5 sm:mt-0 sm:absolute sm:right-8 sm:top-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add School & Admin
          </button>

          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 px-3 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 gap-2 pt-2 shadow-xs">
        <button
          onClick={() => setActiveMainTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeMainTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Schools & Institutional Overview
        </button>

        <button
          id="superadmin-db-tab"
          onClick={() => setActiveMainTab('database')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeMainTab === 'database'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-purple-600" />
          <span>Live Database Tables (Super Admin Only)</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black">
            Exclusive
          </span>
        </button>
      </div>

      {/* VIEW 1: OVERVIEW & SCHOOLS */}
      {activeMainTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Schools</span>
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{schools.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Active licensed institutions</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{students.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Under live 5-stage tracking</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Matrix Rows</span>
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-indigo-600 mt-2">{dailyMatrixRows.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">1 row per student per day</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database Status</span>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 mt-2">Live Cloud Synced</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supabase PostgreSQL Online</p>
            </div>
          </div>

          {/* Schools List */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Registered Schools Directory
              </h3>
              <span className="text-xs text-slate-500">{schools.length} Active</span>
            </div>

            <div className="divide-y divide-slate-100">
              {schools.map((school) => {
                const schoolAdmins = users.filter((u) => u.schoolId === school.id && u.role === 'admin');
                const schoolStudentCount = students.filter((s) => s.schoolId === school.id).length;

                return (
                  <div
                    key={school.id}
                    className="p-6 hover:bg-slate-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-slate-900">{school.name}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-mono font-bold">
                          {school.code}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {school.address || 'Address registered'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {school.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {school.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <p className="font-bold text-slate-800">
                          Admin: {schoolAdmins[0]?.fullName || 'Assigned'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">
                          {schoolStudentCount} Students Enrolled
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Licensed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EXCLUSIVE SUPER ADMIN DATABASE EXPLORER */}
      {activeMainTab === 'database' && (
        <div className="space-y-4">
          {/* Security & Access Restriction Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-black uppercase tracking-wider block">
                  Database Visibility: Restricted to Super Admin Only
                </span>
                <span className="text-[11px] text-amber-800">
                  "database kebal super admin hi dekh ske" — Parents, guards, and teachers only view their respective functional dashboards; only Super Admin has authority to inspect raw database tables.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSyncToCloud}
                disabled={syncState.syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${syncState.syncing ? 'animate-bounce' : ''}`} />
                {syncState.syncing ? 'Syncing to Cloud...' : 'Sync All to Supabase Cloud'}
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export Table to CSV
              </button>
            </div>
          </div>

          {syncState.result && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
                syncState.result.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {syncState.result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {syncState.result.success
                    ? `Successfully synchronized ${syncState.result.syncedCount} records across all 5 tables to Supabase Cloud!`
                    : `Sync completed with warnings (${syncState.result.syncedCount} records synced).`}
                  {syncState.result.errors.length > 0 && (
                    <span className="block font-mono text-[11px] mt-0.5 text-rose-700">
                      {syncState.result.errors.slice(0, 2).join(' | ')}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={() => setSyncState({ syncing: false })}
                className="text-[11px] font-bold px-2 py-0.5 rounded-md hover:bg-black/5"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Table Selector & Search Toolbar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Table Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setActiveDbTable('student_daily_matrix')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeDbTable === 'student_daily_matrix'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>student_daily_matrix (1 Row/Day)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-800/50">
                  {dailyMatrixRows.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDbTable('students')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeDbTable === 'students'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>students</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-800/50">
                  {students.length}
                </span>
              </button>

              <button
                onClick={() => setActiveDbTable('user_accounts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeDbTable === 'user_accounts'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>user_accounts</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-800/50">
                  {users.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                placeholder="Search raw records..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          {/* TABLE: student_daily_matrix (1 Row Per Student Per Day) */}
          {activeDbTable === 'student_daily_matrix' && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-200 bg-purple-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-600" />
                    Table: public.student_daily_matrix
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1 student ka per-day strictly 1 single row matrix banti hai; har scan par isi row me timestamps live update hote hain.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                  {filteredMatrixRows.length} Rows
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Student Name / ID</th>
                      <th className="px-3 py-3">Class</th>
                      <th className="px-3 py-3 text-center">1. Left Home</th>
                      <th className="px-3 py-3 text-center">2. Gate In</th>
                      <th className="px-3 py-3 text-center">3. Class In</th>
                      <th className="px-3 py-3 text-center">4. Gate Out</th>
                      <th className="px-3 py-3 text-center">5. Home Arrival</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-4 py-3 font-mono text-right text-[10px]">Updated At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMatrixRows.map((r) => (
                      <tr key={r.id} className="hover:bg-purple-50/30 transition">
                        {/* Date */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {r.date}
                        </td>

                        {/* Student Name */}
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{r.studentName}</p>
                          <p className="font-mono text-[10px] text-purple-600">{r.studentId}</p>
                        </td>

                        {/* Class */}
                        <td className="px-3 py-3 font-semibold text-blue-700">{r.studentClass}</td>

                        {/* Stage 1 */}
                        <td className="px-3 py-3 text-center">
                          {r.stage1LeftHomeTime ? (
                            <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                              {r.stage1LeftHomeTime}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Stage 2 */}
                        <td className="px-3 py-3 text-center">
                          {r.stage2GateInTime ? (
                            <span className="font-mono text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                              {r.stage2GateInTime}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Stage 3 */}
                        <td className="px-3 py-3 text-center">
                          {r.stage3ClassInTime ? (
                            <span className="font-mono text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                              {r.stage3ClassInTime}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Stage 4 */}
                        <td className="px-3 py-3 text-center">
                          {r.stage4GateOutTime ? (
                            <span className="font-mono text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                              {r.stage4GateOutTime}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Stage 5 */}
                        <td className="px-3 py-3 text-center">
                          {r.stage5HomeArrivalTime ? (
                            <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {r.stage5HomeArrivalTime}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              r.status === 'SAFELY_HOME'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'IN_CLASS'
                                ? 'bg-indigo-100 text-indigo-800'
                                : r.status === 'IN_TRANSIT_TO_HOME'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

                        {/* Updated At */}
                        <td className="px-4 py-3 font-mono text-right text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(r.updatedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE: students */}
          {activeDbTable === 'students' && (
            <div className="space-y-4">
              <StudentPhotoMigrationPanel students={students} onRefreshStudents={onRefreshData} />

              <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Table: public.students (Master Student Registry)
                  </h4>
                  <span className="text-xs font-mono text-slate-600">{students.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase text-[11px]">
                      <tr>
                        <th className="px-3 py-3">Photo</th>
                        <th className="px-3 py-3">ID</th>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-3 py-3">Class</th>
                        <th className="px-3 py-3">Roll No</th>
                        <th className="px-4 py-3">Storage Architecture (photo_url)</th>
                        <th className="px-4 py-3">Parent Name</th>
                        <th className="px-4 py-3">Parent Phone</th>
                        <th className="px-4 py-3">Parent Login ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s) => {
                        const isB64 = s.photoUrl?.startsWith('data:image/');
                        const isStorage = isStoragePath(s.photoUrl);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 font-mono text-[11px]">
                            <td className="px-3 py-2">
                              <StudentPhoto
                                photoUrl={s.photoUrl}
                                alt={s.fullName}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 bg-slate-100"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-blue-600 font-bold">{s.studentId}</td>
                            <td className="px-4 py-2.5 font-sans font-bold text-slate-900">{s.fullName}</td>
                            <td className="px-3 py-2.5">{s.studentClass}</td>
                            <td className="px-3 py-2.5">{s.rollNumber}</td>
                            <td className="px-4 py-2.5">
                              {isStorage ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  ✓ Storage: {s.photoUrl}
                                </span>
                              ) : isB64 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  ⚠️ Base64 ({Math.round((s.photoUrl.length * 3) / 4096)} KB in DB)
                                </span>
                              ) : (
                                <span className="text-slate-500 font-sans text-[10px] truncate max-w-xs block">
                                  {s.photoUrl || 'No Photo'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-sans">{s.parentName}</td>
                            <td className="px-4 py-2.5">{s.parentPhone}</td>
                            <td className="px-4 py-2.5 text-purple-700 font-bold">{s.parentLoginId}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TABLE: user_accounts */}
          {activeDbTable === 'user_accounts' && (
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Table: public.user_accounts (Authentication Credentials)
                </h4>
                <span className="text-xs font-mono text-slate-600">{users.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Username / ID</th>
                      <th className="px-4 py-3">Password</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Assigned Class / Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 font-mono text-[11px]">
                        <td className="px-4 py-2.5 font-sans font-bold text-slate-900">{u.fullName}</td>
                        <td className="px-4 py-2.5 text-blue-600 font-bold">{u.username}</td>
                        <td className="px-4 py-2.5 text-slate-500">{u.password}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold uppercase text-[10px]">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {u.assignedClass || u.studentId || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE SCHOOL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              Onboard New School & Create Admin Login
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. St. Xavier International School"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">School Code</label>
                  <input
                    type="text"
                    required
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder="e.g. SXIS-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-purple-700 mb-2">School Principal / Admin Credentials</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    placeholder="Admin Full Name (e.g. Dr. A. P. Sharma)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Admin User ID"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                    />
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-xs font-bold text-white shadow hover:bg-purple-700 transition"
                >
                  {isSubmitting ? 'Registering...' : 'Create School & Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
