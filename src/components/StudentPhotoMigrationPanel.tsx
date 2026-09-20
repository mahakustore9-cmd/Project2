import { useState } from 'react';
import { Student } from '../types';
import {
  isStoragePath,
  testMigrateOneStudent,
  runBatchMigration,
  ensureBucketExists,
  StudentPhoto,
  STUDENT_PHOTOS_BUCKET,
} from '../services/studentPhotoStorage';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FileCode2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StudentPhotoMigrationPanelProps {
  students: Student[];
  onRefreshStudents?: () => Promise<void> | void;
}

export function StudentPhotoMigrationPanel({
  students,
  onRefreshStudents,
}: StudentPhotoMigrationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    studentId: string;
    studentName: string;
    oldPhotoUrlType: string;
    newStoragePath?: string;
    signedUrl?: string;
    savedBytes?: number;
    message: string;
  } | null>(null);

  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [batchSummary, setBatchSummary] = useState<{
    total: number;
    migrated: number;
    skipped: number;
    failed: number;
    savedBytesTotal: number;
    details: Array<{ studentId: string; name: string; status: string; message: string }>;
  } | null>(null);

  const [bucketStatus, setBucketStatus] = useState<string | null>(null);

  // Categorize students
  const base64Students = students.filter(
    (s) => s.photoUrl && s.photoUrl.trim().startsWith('data:image/')
  );
  const storagePathStudents = students.filter(
    (s) => s.photoUrl && isStoragePath(s.photoUrl)
  );
  const externalUrlStudents = students.filter(
    (s) =>
      s.photoUrl &&
      (s.photoUrl.startsWith('http://') || s.photoUrl.startsWith('https://'))
  );
  const noPhotoStudents = students.filter((s) => !s.photoUrl);

  // Set default selected student for testing if empty
  const studentToTest =
    students.find((s) => s.studentId === selectedStudentId || s.id === selectedStudentId) ||
    base64Students[0] ||
    students[0];

  // Estimated database space used by Base64 photos
  const estimatedBase64Bytes = base64Students.reduce(
    (acc, s) => acc + (s.photoUrl?.length || 0),
    0
  );

  const handleCheckBucket = async () => {
    setBucketStatus('Checking bucket status...');
    const res = await ensureBucketExists();
    if (res.exists) {
      setBucketStatus(`✓ Bucket '${STUDENT_PHOTOS_BUCKET}' is ready in Supabase Storage!`);
    } else {
      setBucketStatus(
        `Bucket '${STUDENT_PHOTOS_BUCKET}' not auto-created (${res.error || 'requires SQL setup'}). Use the SQL script provided below in Supabase SQL editor.`
      );
    }
  };

  const handleRunSingleTest = async () => {
    if (!studentToTest) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testMigrateOneStudent(studentToTest);
      setTestResult(res);
      if (res.success && onRefreshStudents) {
        await onRefreshStudents();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        studentId: studentToTest.studentId,
        studentName: studentToTest.fullName,
        oldPhotoUrlType: 'base64',
        message: err.message || 'Unexpected test migration error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunBatch = async () => {
    if (base64Students.length === 0) {
      alert('No Base64 photos need migration. All students are already optimized!');
      return;
    }

    const confirmRun = window.confirm(
      `Safe Batch Migration:\n\nThis will safely migrate ${base64Students.length} student photos from database Base64 into Supabase Storage bucket '${STUDENT_PHOTOS_BUCKET}'.\n\n- Uploads actual image file first\n- Verifies signed URL access\n- Updates database photo_url to small path ONLY after upload succeeds\n- Never deletes original Base64 if upload fails\n\nProceed?`
    );
    if (!confirmRun) return;

    setIsBatchRunning(true);
    setBatchSummary(null);

    try {
      const summary = await runBatchMigration(students, (curr, tot, status) => {
        setBatchProgress({ current: curr, total: tot, status });
      });
      setBatchSummary(summary);
      if (onRefreshStudents) {
        await onRefreshStudents();
      }
    } catch (err: any) {
      alert('Batch migration error: ' + err.message);
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 via-white to-blue-50/70 p-4 sm:p-5 shadow-xs transition mb-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                Supabase Storage Photo Architecture
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                Safe Optimization
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Stores actual photo files in bucket <code className="font-mono text-indigo-700 font-bold">{STUDENT_PHOTOS_BUCKET}</code> & saves only compact storage paths in database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            {isExpanded ? (
              <>
                <span>Hide Controls</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Manage Storage & Migration</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200/80">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Students</p>
          <p className="text-sm font-black text-slate-800">{students.length}</p>
          <p className="text-[10px] text-slate-500">In database</p>
        </div>

        <div className={`p-2.5 rounded-xl border shadow-2xs ${
          base64Students.length > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-slate-200/80'
        }`}>
          <p className="text-[10px] uppercase font-bold text-amber-700">Base64 in DB</p>
          <p className="text-sm font-black text-amber-900">{base64Students.length}</p>
          <p className="text-[10px] text-amber-700 font-medium">
            ~{Math.round(estimatedBase64Bytes / 1024)} KB stored in DB
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-emerald-700">Storage Paths</p>
          <p className="text-sm font-black text-emerald-900">{storagePathStudents.length}</p>
          <p className="text-[10px] text-emerald-700 font-medium">Optimized (&le; 30 bytes)</p>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-slate-400">External / CDN</p>
          <p className="text-sm font-black text-slate-800">{externalUrlStudents.length}</p>
          <p className="text-[10px] text-slate-500">Unsplash seeds</p>
        </div>
      </div>

      {/* Expanded Controls Panel */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
          {/* Bucket Verification & SQL Help */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="font-bold">Supabase Storage Bucket: {STUDENT_PHOTOS_BUCKET}</span>
              </div>
              <button
                onClick={handleCheckBucket}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Check / Init Bucket
              </button>
            </div>
            {bucketStatus && (
              <p className="text-[11px] text-indigo-200 bg-indigo-950/60 p-2 rounded-lg border border-indigo-800 font-mono">
                {bucketStatus}
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              Required bucket configuration: <strong>Private bucket</strong> with authenticated/anon signed URL access.
            </p>
          </div>

          {/* STEP 1: Test Migration of ONE Student */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Migration of ONE Student (Safe Verification)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Verifies upload & signed URL before modifying DB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Student to Test:
                </label>
                <select
                  value={studentToTest?.studentId || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 outline-none"
                >
                  {students.map((s) => {
                    const isB64 = s.photoUrl?.startsWith('data:image/');
                    const isStorage = isStoragePath(s.photoUrl);
                    return (
                      <option key={s.id} value={s.studentId}>
                        {s.fullName} ({s.studentId}) —{' '}
                        {isB64 ? '⚠️ Base64 (~' + Math.round((s.photoUrl?.length || 0) / 1024) + ' KB)' : isStorage ? '✓ Supabase Storage' : 'External URL'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {studentToTest && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-4">
                  <StudentPhoto
                    photoUrl={studentToTest.photoUrl}
                    alt={studentToTest.fullName}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100"
                  />
                  <button
                    onClick={handleRunSingleTest}
                    disabled={isTesting || isBatchRunning}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Test Migrate Student
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Test Output Box */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  <span>
                    {testResult.success ? 'Migration Verified & Completed!' : 'Test Result / Notice:'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
                {testResult.newStoragePath && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold text-emerald-800">
                      New Path: {testResult.newStoragePath}
                    </span>
                    {testResult.signedUrl && (
                      <a
                        href={testResult.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 underline font-semibold"
                      >
                        Preview Signed Image ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Safe Batch Migration */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Safe Batch Migration
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {base64Students.length} student{base64Students.length !== 1 ? 's' : ''} eligible
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Processes students sequentially in small steps. For each student: decodes Base64, uploads to Supabase Storage, validates the signed URL, and updates the database record. If an upload fails, that student is skipped safely without modifying their database record.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunBatch}
                disabled={isBatchRunning || base64Students.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition shadow-xs"
              >
                {isBatchRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Migrating Batch...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Migrate All {base64Students.length} Base64 Students
                  </>
                )}
              </button>

              {base64Students.length === 0 && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  All students already optimized!
                </span>
              )}
            </div>

            {/* Batch Progress */}
            {isBatchRunning && batchProgress && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                  <span>{batchProgress.status}</span>
                  <span>
                    {batchProgress.current} / {batchProgress.total}
                  </span>
                </div>
                <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{
                      width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Batch Summary Report */}
            {batchSummary && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Batch Migration Finished</span>
                  <span className="text-emerald-700">
                    +{Math.round(batchSummary.savedBytesTotal / 1024)} KB Database Space Reclaimed!
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    ✓ {batchSummary.migrated} Migrated
                  </div>
                  <div className="p-1.5 rounded bg-slate-200 text-slate-700 font-bold">
                    {batchSummary.skipped} Already Done
                  </div>
                  <div className="p-1.5 rounded bg-rose-100 text-rose-800 font-bold">
                    ✕ {batchSummary.failed} Failed
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
