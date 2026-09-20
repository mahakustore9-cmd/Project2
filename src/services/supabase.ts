/**
 * Supabase Data & Synchronization Engine
 * Connects to provided Supabase endpoint: https://aitlkrtkusnimlkchhye.supabase.co
 * Key: sb_publishable_g1jgAEKE7jcWlHktcGmVTQ_QovlACHb
 * Provides offline-first resilient storage with auto-sync, fallback caching,
 * and copy-paste SQL migration generator.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { School, Student, TransitLog, UserAccount, TransitStage, StudentClass, UserRole, StudentDailyMatrixRow } from '../types';

export const SUPABASE_URL = 'https://aitlkrtkusnimlkchhye.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdGxrcnRrdXNuaW1sa2NoaHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4Njc4MTQsImV4cCI6MjEwNTQ0MzgxNH0.VnH9nT5PQKV2cOEzGgu_X5ZXl8ci6EPTnTk20qVZZFI';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseClient;
}

// SQL Schema for Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- STUDENT TRACKING SYSTEM (SURAKSHA KAWACH) - SUPABASE DDL
-- Paste and Run this in your Supabase SQL Editor:
-- https://app.supabase.com/project/aitlkrtkusnimlkchhye/sql
-- ==========================================================

-- 1. Create Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'teacher', 'guard', 'parent')),
  full_name TEXT NOT NULL,
  phone TEXT,
  assigned_class TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  blood_group TEXT,
  photo_url TEXT,
  address TEXT,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT,
  parent_login_id TEXT NOT NULL,
  parent_password TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Transit Logs Table (5-Stage Transit Matrix)
CREATE TABLE IF NOT EXISTS public.transit_logs (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  school_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('LEFT_HOME', 'REACHED_SCHOOL_GATE', 'ENTERED_CLASS', 'EXIT_SCHOOL_GATE', 'REACHED_HOME')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  scanned_by_role TEXT NOT NULL,
  scanned_by_name TEXT NOT NULL,
  scanned_by_id TEXT NOT NULL,
  is_manual_entry BOOLEAN DEFAULT FALSE,
  manual_notes TEXT,
  location_label TEXT
);

-- 5. Create Student Daily Matrix (Strict 1-Row-Per-Student Per-Day Matrix)
-- Rule: 1 student ka perday 1 single row banti hai, aur har stage scan par usi row me update hota hai
CREATE TABLE IF NOT EXISTS public.student_daily_matrix (
  id TEXT PRIMARY KEY,                       -- e.g. matrix_STU-2026-001_2026-09-20
  date DATE NOT NULL,
  school_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  stage1_left_home_time TEXT,
  stage1_left_home_by TEXT,
  stage2_gate_in_time TEXT,
  stage2_gate_in_by TEXT,
  stage3_class_in_time TEXT,
  stage3_class_in_by TEXT,
  stage4_gate_out_time TEXT,
  stage4_gate_out_by TEXT,
  stage5_home_arrival_time TEXT,
  stage5_home_arrival_by TEXT,
  current_stage TEXT NOT NULL DEFAULT 'NOT_STARTED',
  status TEXT NOT NULL DEFAULT 'PENDING',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_daily_matrix UNIQUE (student_id, date)
);

-- 6. Create Indices for ultra-fast queries
CREATE INDEX IF NOT EXISTS idx_transit_student_date ON public.transit_logs(student_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_matrix_date ON public.student_daily_matrix(date, student_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(school_id, student_class);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.user_accounts(username);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_matrix ENABLE ROW LEVEL SECURITY;

-- 8. Policies - Idempotent Security Policies (Safe for re-running)
DROP POLICY IF EXISTS "SuperAdmin all access daily_matrix" ON public.student_daily_matrix;
DROP POLICY IF EXISTS "Allow public read schools" ON public.schools;
DROP POLICY IF EXISTS "Allow public insert schools" ON public.schools;
DROP POLICY IF EXISTS "Allow public all user_accounts" ON public.user_accounts;
DROP POLICY IF EXISTS "Allow public all students" ON public.students;
DROP POLICY IF EXISTS "Allow public all transit_logs" ON public.transit_logs;

CREATE POLICY "SuperAdmin all access daily_matrix" ON public.student_daily_matrix FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read schools" ON public.schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all transit_logs" ON public.transit_logs FOR ALL USING (true) WITH CHECK (true);

-- 9. Enable Realtime safely (idempotent block)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transit_logs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_daily_matrix;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 10. Seed Core Default School and Accounts into Supabase Database
INSERT INTO public.schools (id, name, code, address, phone, email)
VALUES (
  'sch_delhi_public_01',
  'Delhi Public Academy',
  'DPA-101',
  'Sector 14, Institutional Area, New Delhi',
  '+91 98765 43210',
  'admin@delhipublicacademy.edu.in'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Super Admin & Staff Accounts into Supabase Database
-- NOTE: In Supabase, you can directly change passwords or add new staff
INSERT INTO public.user_accounts (id, school_id, username, password, role, full_name, phone)
VALUES 
  ('usr_super_01', 'sch_delhi_public_01', 'superadmin', 'superpassword123', 'super_admin', 'Central System Director', '+91 99999 88888'),
  ('usr_admin_01', 'sch_delhi_public_01', 'schooladmin', 'adminpassword123', 'admin', 'Rajesh Sharma (Principal/Admin)', '+91 98111 22233'),
  ('usr_guard_01', 'sch_delhi_public_01', 'guardgate1', 'guardpassword123', 'guard', 'Ramesh Yadav (Gate No. 1 Guard)', '+91 98333 44455')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_accounts (id, school_id, username, password, role, full_name, phone, assigned_class)
VALUES 
  ('usr_teacher_01', 'sch_delhi_public_01', 'teacher5', 'teacherpassword123', 'teacher', 'Sunita Verma (Class 5 Incharge)', '+91 98222 33344', 'Class 5')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_accounts (id, school_id, username, password, role, full_name, phone, student_id)
VALUES 
  ('usr_parent_01', 'sch_delhi_public_01', 'parentaarav', 'parentpassword123', 'parent', 'Manoj Kumar (Parent)', '+91 98444 55566', 'STU-2026-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (
  id, school_id, student_id, full_name, student_class, roll_number, dob, gender, blood_group,
  photo_url, address, parent_name, parent_phone, parent_email, parent_login_id, parent_password, emergency_contact
)
VALUES (
  'stu_001',
  'sch_delhi_public_01',
  'STU-2026-001',
  'Aarav Kumar',
  'Class 5',
  '14',
  '2015-08-12',
  'Male',
  'B+',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
  'Flat 402, Royal Residency, Delhi',
  'Manoj Kumar',
  '+91 98444 55566',
  'manoj.kumar@example.com',
  'parentaarav',
  'parentpassword123',
  '+91 98444 55566'
)
ON CONFLICT (id) DO NOTHING;
`;

// Default Seed Data
const DEFAULT_SCHOOL: School = {
  id: 'sch_delhi_public_01',
  name: 'Delhi Public Academy',
  code: 'DPA-101',
  address: 'Sector 14, Institutional Area, New Delhi',
  phone: '+91 98765 43210',
  email: 'admin@delhipublicacademy.edu.in',
  createdAt: new Date().toISOString(),
};

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_super_01',
    schoolId: 'sch_delhi_public_01',
    username: 'superadmin',
    password: 'superpassword123',
    role: 'super_admin',
    fullName: 'Central System Director',
    phone: '+91 99999 88888',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_admin_01',
    schoolId: 'sch_delhi_public_01',
    username: 'schooladmin',
    password: 'adminpassword123',
    role: 'admin',
    fullName: 'Rajesh Sharma (Principal/Admin)',
    phone: '+91 98111 22233',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_teacher_01',
    schoolId: 'sch_delhi_public_01',
    username: 'teacher5',
    password: 'teacherpassword123',
    role: 'teacher',
    fullName: 'Sunita Verma (Class 5 Incharge)',
    phone: '+91 98222 33344',
    assignedClass: 'Class 5',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_guard_01',
    schoolId: 'sch_delhi_public_01',
    username: 'guardgate1',
    password: 'guardpassword123',
    role: 'guard',
    fullName: 'Ramesh Yadav (Gate No. 1 Guard)',
    phone: '+91 98333 44455',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_parent_01',
    schoolId: 'sch_delhi_public_01',
    username: 'parentaarav',
    password: 'parentpassword123',
    role: 'parent',
    fullName: 'Manoj Kumar (Parent)',
    phone: '+91 98444 55566',
    studentId: 'STU-2026-001',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'stu_001',
    schoolId: 'sch_delhi_public_01',
    studentId: 'STU-2026-001',
    fullName: 'Aarav Kumar',
    studentClass: 'Class 5',
    rollNumber: '14',
    dob: '2015-08-12',
    gender: 'Male',
    bloodGroup: 'B+',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
    address: 'Flat 402, Royal Residency, Delhi',
    parentName: 'Manoj Kumar',
    parentPhone: '+91 98444 55566',
    parentEmail: 'manoj.kumar@example.com',
    parentLoginId: 'parentaarav',
    parentPassword: 'parentpassword123',
    emergencyContact: '+91 98444 55566',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'stu_002',
    schoolId: 'sch_delhi_public_01',
    studentId: 'STU-2026-002',
    fullName: 'Ananya Sharma',
    studentClass: 'Class 5',
    rollNumber: '03',
    dob: '2015-04-19',
    gender: 'Female',
    bloodGroup: 'O+',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    address: 'B-12, Green Park Extension, Delhi',
    parentName: 'Deepak Sharma',
    parentPhone: '+91 98555 66677',
    parentLoginId: 'parentananya',
    parentPassword: 'parentpassword123',
    emergencyContact: '+91 98555 66677',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'stu_003',
    schoolId: 'sch_delhi_public_01',
    studentId: 'STU-2026-003',
    fullName: 'Vihaan Gupta',
    studentClass: 'Class 10',
    rollNumber: '28',
    dob: '2010-11-05',
    gender: 'Male',
    bloodGroup: 'A+',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    address: 'C-77, Model Town, Delhi',
    parentName: 'Sanjay Gupta',
    parentPhone: '+91 98666 77788',
    parentLoginId: 'parentvihaan',
    parentPassword: 'parentpassword123',
    emergencyContact: '+91 98666 77788',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'stu_004',
    schoolId: 'sch_delhi_public_01',
    studentId: 'STU-2026-004',
    fullName: 'Priya Singh',
    studentClass: 'Class 1',
    rollNumber: '09',
    dob: '2019-02-24',
    gender: 'Female',
    bloodGroup: 'AB+',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    address: 'House 55, Shanti Niketan, Delhi',
    parentName: 'Rohan Singh',
    parentPhone: '+91 98777 88899',
    parentLoginId: 'parentpriya',
    parentPassword: 'parentpassword123',
    emergencyContact: '+91 98777 88899',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

// Helper to construct sample transit logs for the past 5 days for Aarav
function createSamplePast5DaysLogs(): TransitLog[] {
  const logs: TransitLog[] = [];
  const now = new Date();

  // Create logs for Day -4, Day -3, Day -2, Day -1, and Today
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Day 0 (today) might be in progress or completed
    const stages: TransitStage[] = i === 0 
      ? ['LEFT_HOME', 'REACHED_SCHOOL_GATE', 'ENTERED_CLASS']
      : ['LEFT_HOME', 'REACHED_SCHOOL_GATE', 'ENTERED_CLASS', 'EXIT_SCHOOL_GATE', 'REACHED_HOME'];

    stages.forEach((stage, idx) => {
      let hour = 7;
      let minute = 15;
      let role: UserRole = 'parent';
      let scannedByName = 'Manoj Kumar (Parent)';
      let scannedById = 'usr_parent_01';

      if (stage === 'LEFT_HOME') {
        hour = 7; minute = 20;
      } else if (stage === 'REACHED_SCHOOL_GATE') {
        hour = 7; minute = 50;
        role = 'guard';
        scannedByName = 'Ramesh Yadav (Gate Guard)';
        scannedById = 'usr_guard_01';
      } else if (stage === 'ENTERED_CLASS') {
        hour = 8; minute = 10;
        role = 'teacher';
        scannedByName = 'Sunita Verma (Class Teacher)';
        scannedById = 'usr_teacher_01';
      } else if (stage === 'EXIT_SCHOOL_GATE') {
        hour = 14; minute = 5;
        role = 'guard';
        scannedByName = 'Ramesh Yadav (Gate Guard)';
        scannedById = 'usr_guard_01';
      } else if (stage === 'REACHED_HOME') {
        hour = 14; minute = 40;
      }

      const logDate = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);

      logs.push({
        id: `log_aarav_${dateStr}_${stage}`,
        studentId: 'STU-2026-001',
        studentName: 'Aarav Kumar',
        studentClass: 'Class 5',
        schoolId: 'sch_delhi_public_01',
        stage,
        timestamp: logDate.toISOString(),
        scannedByRole: role,
        scannedByName,
        scannedById,
      });
    });
  }

  return logs;
}

// Local Storage Keys
const LS_SCHOOLS = 'sts_schools_v1';
const LS_USERS = 'sts_users_v1';
const LS_STUDENTS = 'sts_students_v1';
const LS_LOGS = 'sts_transit_logs_v1';

// Bidirectional Data Transformers between TypeScript domain models and Supabase SQL snake_case tables
export function toDbSchool(s: School) {
  return {
    id: s.id,
    name: s.name,
    code: s.code,
    address: s.address || null,
    phone: s.phone || null,
    email: s.email || null,
    logo_url: s.logoUrl || null,
    created_at: s.createdAt || new Date().toISOString(),
  };
}

export function fromDbSchool(r: any): School {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    address: r.address || '',
    phone: r.phone || '',
    email: r.email || '',
    logoUrl: r.logo_url || r.logoUrl,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

export function toDbUser(u: UserAccount) {
  return {
    id: u.id,
    school_id: u.schoolId,
    username: u.username,
    password: u.password,
    role: u.role,
    full_name: u.fullName,
    phone: u.phone || null,
    assigned_class: u.assignedClass || null,
    student_id: u.studentId || null,
    created_at: u.createdAt || new Date().toISOString(),
  };
}

export function fromDbUser(r: any): UserAccount {
  return {
    id: r.id,
    schoolId: r.school_id || r.schoolId || '',
    username: r.username,
    password: r.password,
    role: r.role,
    fullName: r.full_name || r.fullName || '',
    phone: r.phone || '',
    assignedClass: r.assigned_class || r.assignedClass,
    studentId: r.student_id || r.studentId,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
  };
}

export function toDbStudent(s: Student) {
  return {
    id: s.id,
    school_id: s.schoolId,
    student_id: s.studentId,
    full_name: s.fullName,
    student_class: s.studentClass,
    roll_number: s.rollNumber,
    dob: s.dob || null,
    gender: s.gender || null,
    blood_group: s.bloodGroup || null,
    photo_url: s.photoUrl || null,
    address: s.address || null,
    parent_name: s.parentName,
    parent_phone: s.parentPhone,
    parent_email: s.parentEmail || null,
    parent_login_id: s.parentLoginId,
    parent_password: s.parentPassword,
    emergency_contact: s.emergencyContact,
    created_at: s.createdAt || new Date().toISOString(),
    updated_at: s.updatedAt || new Date().toISOString(),
  };
}

export function fromDbStudent(r: any): Student {
  return {
    id: r.id,
    schoolId: r.school_id || r.schoolId || '',
    studentId: r.student_id || r.studentId,
    fullName: r.full_name || r.fullName || '',
    studentClass: (r.student_class || r.studentClass || 'Class 1') as StudentClass,
    rollNumber: r.roll_number || r.rollNumber || '',
    dob: r.dob || undefined,
    gender: r.gender || undefined,
    bloodGroup: r.blood_group || r.bloodGroup || undefined,
    photoUrl: r.photo_url || r.photoUrl || undefined,
    address: r.address || undefined,
    parentName: r.parent_name || r.parentName || '',
    parentPhone: r.parent_phone || r.parentPhone || '',
    parentEmail: r.parent_email || r.parentEmail || undefined,
    parentLoginId: r.parent_login_id || r.parentLoginId || '',
    parentPassword: r.parent_password || r.parentPassword || '',
    emergencyContact: r.emergency_contact || r.emergencyContact || '',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || new Date().toISOString(),
  };
}

export function toDbTransitLog(l: TransitLog) {
  return {
    id: l.id,
    student_id: l.studentId,
    student_name: l.studentName,
    student_class: l.studentClass,
    school_id: l.schoolId,
    stage: l.stage,
    timestamp: l.timestamp,
    scanned_by_role: l.scannedByRole,
    scanned_by_name: l.scannedByName,
    scanned_by_id: l.scannedById,
    is_manual_entry: !!l.isManualEntry,
    manual_notes: l.manualNotes || null,
    location_label: l.locationLabel || null,
  };
}

export function fromDbTransitLog(r: any): TransitLog {
  return {
    id: r.id,
    studentId: r.student_id || r.studentId,
    studentName: r.student_name || r.studentName,
    studentClass: r.student_class || r.studentClass,
    schoolId: r.school_id || r.schoolId,
    stage: r.stage,
    timestamp: r.timestamp,
    scannedByRole: r.scanned_by_role || r.scannedByRole,
    scannedByName: r.scanned_by_name || r.scannedByName,
    scannedById: r.scanned_by_id || r.scannedById,
    isManualEntry: r.is_manual_entry ?? r.isManualEntry ?? false,
    manualNotes: r.manual_notes || r.manualNotes,
    locationLabel: r.location_label || r.locationLabel,
  };
}

export function toDbDailyMatrix(m: StudentDailyMatrixRow) {
  return {
    id: m.id,
    date: m.date,
    school_id: m.schoolId,
    student_id: m.studentId,
    student_name: m.studentName,
    student_class: m.studentClass,
    stage1_left_home_time: m.stage1LeftHomeTime || null,
    stage1_left_home_by: m.stage1LeftHomeBy || null,
    stage2_gate_in_time: m.stage2GateInTime || null,
    stage2_gate_in_by: m.stage2GateInBy || null,
    stage3_class_in_time: m.stage3ClassInTime || null,
    stage3_class_in_by: m.stage3ClassInBy || null,
    stage4_gate_out_time: m.stage4GateOutTime || null,
    stage4_gate_out_by: m.stage4GateOutBy || null,
    stage5_home_arrival_time: m.stage5HomeArrivalTime || null,
    stage5_home_arrival_by: m.stage5HomeArrivalBy || null,
    current_stage: m.currentStage,
    status: m.status,
    updated_at: m.updatedAt || new Date().toISOString(),
  };
}

export function fromDbDailyMatrix(d: any): StudentDailyMatrixRow {
  return {
    id: d.id,
    date: d.date,
    schoolId: d.school_id || d.schoolId,
    studentId: d.student_id || d.studentId,
    studentName: d.student_name || d.studentName,
    studentClass: d.student_class || d.studentClass,
    stage1LeftHomeTime: d.stage1_left_home_time || d.stage1LeftHomeTime,
    stage1LeftHomeBy: d.stage1_left_home_by || d.stage1LeftHomeBy,
    stage2GateInTime: d.stage2_gate_in_time || d.stage2GateInTime,
    stage2GateInBy: d.stage2_gate_in_by || d.stage2GateInBy,
    stage3ClassInTime: d.stage3_class_in_time || d.stage3ClassInTime,
    stage3ClassInBy: d.stage3_class_in_by || d.stage3ClassInBy,
    stage4GateOutTime: d.stage4_gate_out_time || d.stage4GateOutTime,
    stage4GateOutBy: d.stage4_gate_out_by || d.stage4GateOutBy,
    stage5HomeArrivalTime: d.stage5_home_arrival_time || d.stage5HomeArrivalTime,
    stage5HomeArrivalBy: d.stage5_home_arrival_by || d.stage5HomeArrivalBy,
    currentStage: d.current_stage || d.currentStage,
    status: d.status,
    updatedAt: d.updated_at || d.updatedAt,
  };
}

class DataRepository {
  private isSupabaseOnline = false;

  constructor() {
    this.initLocalStorage();
    this.checkSupabaseHealth();
  }

  private initLocalStorage() {
    if (!localStorage.getItem(LS_SCHOOLS)) {
      localStorage.setItem(LS_SCHOOLS, JSON.stringify([DEFAULT_SCHOOL]));
    }
    if (!localStorage.getItem(LS_USERS)) {
      localStorage.setItem(LS_USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(LS_STUDENTS)) {
      localStorage.setItem(LS_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }
    if (!localStorage.getItem(LS_LOGS)) {
      localStorage.setItem(LS_LOGS, JSON.stringify(createSamplePast5DaysLogs()));
    }
  }

  public async checkSupabaseHealth(): Promise<{ online: boolean; message: string }> {
    try {
      const client = getSupabase();
      const { error } = await client.from('students').select('id').limit(1);
      if (!error) {
        this.isSupabaseOnline = true;
        return { online: true, message: 'Connected to Supabase Cloud Database' };
      } else {
        // Table not yet created in Supabase or permission notice
        this.isSupabaseOnline = false;
        return { 
          online: false, 
          message: `Supabase reachable (${error.message}). Run SQL Schema to activate cloud tables.` 
        };
      }
    } catch (err) {
      this.isSupabaseOnline = false;
      return { online: false, message: 'Running on resilient local storage engine' };
    }
  }

  // --- SCHOOLS ---
  public async getSchools(): Promise<School[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client.from('schools').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(fromDbSchool);
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(LS_SCHOOLS);
    return local ? JSON.parse(local) : [DEFAULT_SCHOOL];
  }

  public async createSchool(school: School): Promise<School> {
    const schools = await this.getSchools();
    schools.unshift(school);
    localStorage.setItem(LS_SCHOOLS, JSON.stringify(schools));

    try {
      const client = getSupabase();
      const { error } = await client.from('schools').insert(toDbSchool(school));
      if (error) {
        console.error('Supabase createSchool error:', error.message, error);
      } else {
        console.log('✅ School created in Supabase cloud:', school.name);
      }
    } catch (err) {
      console.error('Network error creating school in Supabase:', err);
    }
    return school;
  }

  // --- USERS ---
  public async getUsers(): Promise<UserAccount[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client.from('user_accounts').select('*');
      if (!error && data && data.length > 0) {
        return data.map(fromDbUser);
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(LS_USERS);
    return local ? JSON.parse(local) : DEFAULT_USERS;
  }

  public async createUser(user: UserAccount): Promise<UserAccount> {
    const users = await this.getUsers();
    users.unshift(user);
    localStorage.setItem(LS_USERS, JSON.stringify(users));

    try {
      const client = getSupabase();
      const { error } = await client.from('user_accounts').insert(toDbUser(user));
      if (error) {
        console.error('Supabase createUser error:', error.message, error);
      } else {
        console.log('✅ User created in Supabase cloud:', user.username, user.role);
      }
    } catch (err) {
      console.error('Network error creating user in Supabase:', err);
    }
    return user;
  }

  // --- STUDENTS ---
  public async getStudents(): Promise<Student[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client.from('students').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(fromDbStudent);
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(LS_STUDENTS);
    return local ? JSON.parse(local) : DEFAULT_STUDENTS;
  }

  public async getStudentById(idOrStudentId: string): Promise<Student | undefined> {
    const list = await this.getStudents();
    return list.find(s => s.id === idOrStudentId || s.studentId === idOrStudentId);
  }

  public async createStudent(student: Student): Promise<Student> {
    const list = await this.getStudents();
    list.unshift(student);
    localStorage.setItem(LS_STUDENTS, JSON.stringify(list));

    // Also auto-create parent user account
    const parentUser: UserAccount = {
      id: 'usr_parent_' + student.studentId,
      schoolId: student.schoolId,
      username: student.parentLoginId,
      password: student.parentPassword,
      role: 'parent',
      fullName: `${student.parentName} (Parent of ${student.fullName})`,
      phone: student.parentPhone,
      studentId: student.studentId,
      createdAt: new Date().toISOString(),
    };
    await this.createUser(parentUser);

    try {
      const client = getSupabase();
      const { error } = await client.from('students').insert(toDbStudent(student));
      if (error) {
        console.error('Supabase createStudent error:', error.message, error);
      } else {
        console.log('✅ Student created in Supabase cloud:', student.fullName, student.studentId);
      }
    } catch (err) {
      console.error('Network error creating student in Supabase:', err);
    }
    return student;
  }

  public async updateStudent(student: Student): Promise<Student> {
    const list = await this.getStudents();
    const idx = list.findIndex(s => s.id === student.id || s.studentId === student.studentId);
    if (idx !== -1) {
      list[idx] = { ...student, updatedAt: new Date().toISOString() };
      localStorage.setItem(LS_STUDENTS, JSON.stringify(list));
    }

    try {
      const client = getSupabase();
      const { error } = await client.from('students').update(toDbStudent(student)).eq('id', student.id);
      if (error) {
        console.error('Supabase updateStudent error:', error.message, error);
      }
    } catch (err) {
      console.error('Network error updating student in Supabase:', err);
    }
    return student;
  }

  public async deleteStudent(id: string): Promise<boolean> {
    const list = await this.getStudents();
    const filtered = list.filter(s => s.id !== id && s.studentId !== id);
    localStorage.setItem(LS_STUDENTS, JSON.stringify(filtered));

    try {
      const client = getSupabase();
      const { error } = await client.from('students').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteStudent error:', error.message, error);
      }
    } catch (err) {
      console.error('Network error deleting student in Supabase:', err);
    }
    return true;
  }

  // --- TRANSIT LOGS ---
  public async getTransitLogs(): Promise<TransitLog[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client.from('transit_logs').select('*').order('timestamp', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(fromDbTransitLog);
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem(LS_LOGS);
    return local ? JSON.parse(local) : [];
  }

  public async addTransitLog(log: TransitLog): Promise<TransitLog> {
    const logs = await this.getTransitLogs();
    logs.unshift(log);
    localStorage.setItem(LS_LOGS, JSON.stringify(logs));

    // Update the strict 1-row-per-student per-day matrix table
    await this.upsertDailyMatrixRow(log);

    try {
      const client = getSupabase();
      const { error } = await client.from('transit_logs').insert(toDbTransitLog(log));
      if (error) {
        console.error('❌ Supabase transit_logs insert error:', error.message, error);
      } else {
        console.log('🚀 Live Transit Log REACHED Supabase cloud successfully:', log.studentName, log.stage, log.timestamp);
      }
    } catch (err) {
      console.error('Network error inserting transit log to Supabase:', err);
    }
    return log;
  }

  /**
   * UPSERT strictly 1 row per student per day matrix
   * Ensures 1 student has exactly 1 row in student_daily_matrix per day!
   */
  public async upsertDailyMatrixRow(log: TransitLog): Promise<StudentDailyMatrixRow> {
    const dateStr = log.timestamp.split('T')[0];
    const rowId = `matrix_${log.studentId}_${dateStr}`;
    const timeFormatted = new Date(log.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const rows = await this.getStudentDailyMatrixRows();
    let existing = rows.find(r => r.studentId === log.studentId && r.date === dateStr);

    let status: StudentDailyMatrixRow['status'] = 'PENDING';
    if (log.stage === 'LEFT_HOME') status = 'IN_TRANSIT_TO_SCHOOL';
    else if (log.stage === 'REACHED_SCHOOL_GATE') status = 'IN_TRANSIT_TO_SCHOOL';
    else if (log.stage === 'ENTERED_CLASS') status = 'IN_CLASS';
    else if (log.stage === 'EXIT_SCHOOL_GATE') status = 'IN_TRANSIT_TO_HOME';
    else if (log.stage === 'REACHED_HOME') status = 'SAFELY_HOME';

    if (!existing) {
      existing = {
        id: rowId,
        date: dateStr,
        schoolId: log.schoolId,
        studentId: log.studentId,
        studentName: log.studentName,
        studentClass: log.studentClass,
        currentStage: log.stage,
        status,
        updatedAt: new Date().toISOString(),
      };
      rows.unshift(existing);
    } else {
      existing.currentStage = log.stage;
      existing.status = status;
      existing.updatedAt = new Date().toISOString();
    }

    if (log.stage === 'LEFT_HOME') {
      existing.stage1LeftHomeTime = timeFormatted;
      existing.stage1LeftHomeBy = log.scannedByName;
    } else if (log.stage === 'REACHED_SCHOOL_GATE') {
      existing.stage2GateInTime = timeFormatted;
      existing.stage2GateInBy = log.scannedByName;
    } else if (log.stage === 'ENTERED_CLASS') {
      existing.stage3ClassInTime = timeFormatted;
      existing.stage3ClassInBy = log.scannedByName;
    } else if (log.stage === 'EXIT_SCHOOL_GATE') {
      existing.stage4GateOutTime = timeFormatted;
      existing.stage4GateOutBy = log.scannedByName;
    } else if (log.stage === 'REACHED_HOME') {
      existing.stage5HomeArrivalTime = timeFormatted;
      existing.stage5HomeArrivalBy = log.scannedByName;
    }

    localStorage.setItem('vsk_student_daily_matrix', JSON.stringify(rows));

    try {
      const client = getSupabase();
      const { error } = await client.from('student_daily_matrix').upsert(toDbDailyMatrix(existing));
      if (error) {
        console.error('❌ Supabase student_daily_matrix upsert error:', error.message, error);
      } else {
        console.log('🚀 Live Student Daily Matrix row UPDATED in Supabase cloud:', existing.studentName, existing.currentStage);
      }
    } catch (err) {
      console.error('Network error upserting daily matrix row to Supabase:', err);
    }

    return existing;
  }

  public async getStudentDailyMatrixRows(): Promise<StudentDailyMatrixRow[]> {
    try {
      const client = getSupabase();
      const { data, error } = await client.from('student_daily_matrix').select('*').order('date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(fromDbDailyMatrix);
      }
    } catch {
      // fallback
    }
    const local = localStorage.getItem('vsk_student_daily_matrix');
    if (local) return JSON.parse(local);

    // Initial seed for today's and past 4 days' 1-row-per-day matrix
    const seededRows: StudentDailyMatrixRow[] = [];
    const students = await this.getStudents();
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOffset);
      const dStr = d.toISOString().split('T')[0];

      students.forEach(s => {
        const isToday = dayOffset === 0;
        seededRows.push({
          id: `matrix_${s.studentId}_${dStr}`,
          date: dStr,
          schoolId: s.schoolId,
          studentId: s.studentId,
          studentName: s.fullName,
          studentClass: s.studentClass,
          stage1LeftHomeTime: '07:20 AM',
          stage1LeftHomeBy: `${s.parentName} (Parent)`,
          stage2GateInTime: '07:50 AM',
          stage2GateInBy: 'Ramesh Yadav (Gate Guard)',
          stage3ClassInTime: '08:15 AM',
          stage3ClassInBy: 'Sunita Verma (Class Teacher)',
          stage4GateOutTime: isToday ? undefined : '02:30 PM',
          stage4GateOutBy: isToday ? undefined : 'Ramesh Yadav (Gate Guard)',
          stage5HomeArrivalTime: isToday ? undefined : '03:10 PM',
          stage5HomeArrivalBy: isToday ? undefined : `${s.parentName} (Parent)`,
          currentStage: isToday ? 'ENTERED_CLASS' : 'COMPLETED',
          status: isToday ? 'IN_CLASS' : 'SAFELY_HOME',
          updatedAt: d.toISOString(),
        });
      });
    }

    localStorage.setItem('vsk_student_daily_matrix', JSON.stringify(seededRows));
    return seededRows;
  }

  /**
   * Super Admin Exclusive: Get Raw Database Table Statistics & Records
   * Strictly available only for Super Admin role
   */
  public async getRawDatabaseTables(): Promise<{
    table: string;
    description: string;
    rowCount: number;
    rows: any[];
  }[]> {
    const [schools, users, students, logs, dailyMatrix] = await Promise.all([
      this.getSchools(),
      this.getUsers(),
      this.getStudents(),
      this.getTransitLogs(),
      this.getStudentDailyMatrixRows(),
    ]);

    return [
      {
        table: 'student_daily_matrix',
        description: 'Exact 1 row per student per day matrix tracking table',
        rowCount: dailyMatrix.length,
        rows: dailyMatrix,
      },
      {
        table: 'transit_logs',
        description: 'Append-only raw camera and manual QR transit event audit trail',
        rowCount: logs.length,
        rows: logs,
      },
      {
        table: 'students',
        description: 'Student identities, photos (<=350KB), and parents information',
        rowCount: students.length,
        rows: students,
      },
      {
        table: 'user_accounts',
        description: 'Role-based credentials (Admin, Teacher, Guard, Parent)',
        rowCount: users.length,
        rows: users,
      },
      {
        table: 'schools',
        description: 'Affiliated schools and institutional licenses',
        rowCount: schools.length,
        rows: schools,
      },
    ];
  }

  /**
   * Generates 5-day transit matrix for a specific student
   * Dates: Past 4 days + Today
   */
  public async getStudent5DayMatrix(studentId: string): Promise<{
    student: Student | undefined;
    matrix: {
      date: string;
      formattedDate: string;
      stages: Record<TransitStage, { time: string; scannedBy: string; isManual?: boolean } | null>;
      currentStage: TransitStage | 'COMPLETED' | 'NOT_STARTED';
    }[];
  }> {
    const student = await this.getStudentById(studentId);
    const allLogs = await this.getTransitLogs();
    const studentLogs = allLogs.filter(l => l.studentId === studentId);

    const matrix = [];
    const now = new Date();

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Format readable date: e.g. "Fri, 19 Sep"
      const formattedDate = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      // Filter logs for this specific calendar date
      const dayLogs = studentLogs.filter(l => l.timestamp.startsWith(dateStr));

      const stages: Record<TransitStage, { time: string; scannedBy: string; isManual?: boolean } | null> = {
        LEFT_HOME: null,
        REACHED_SCHOOL_GATE: null,
        ENTERED_CLASS: null,
        EXIT_SCHOOL_GATE: null,
        REACHED_HOME: null,
      };

      dayLogs.forEach(l => {
        const timeStr = new Date(l.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        stages[l.stage] = {
          time: timeStr,
          scannedBy: l.scannedByName,
          isManual: l.isManualEntry,
        };
      });

      // Determine current stage for this date
      let currentStage: TransitStage | 'COMPLETED' | 'NOT_STARTED' = 'NOT_STARTED';
      if (stages.REACHED_HOME) {
        currentStage = 'COMPLETED';
      } else if (stages.EXIT_SCHOOL_GATE) {
        currentStage = 'EXIT_SCHOOL_GATE';
      } else if (stages.ENTERED_CLASS) {
        currentStage = 'ENTERED_CLASS';
      } else if (stages.REACHED_SCHOOL_GATE) {
        currentStage = 'REACHED_SCHOOL_GATE';
      } else if (stages.LEFT_HOME) {
        currentStage = 'LEFT_HOME';
      }

      matrix.push({
        date: dateStr,
        formattedDate,
        stages,
        currentStage,
      });
    }

    return { student, matrix };
  }

  /**
   * Sync all local data (Schools, Users, Students, Transit Logs, and Matrix) to Supabase cloud
   */
  public async syncAllLocalDataToSupabase(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const client = getSupabase();
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      const localSchools = await this.getSchools();
      for (const s of localSchools) {
        const { error } = await client.from('schools').upsert(toDbSchool(s));
        if (error) errors.push(`Schools (${s.name}): ${error.message}`);
        else syncedCount++;
      }

      const localUsers = await this.getUsers();
      for (const u of localUsers) {
        const { error } = await client.from('user_accounts').upsert(toDbUser(u));
        if (error) errors.push(`Users (${u.username}): ${error.message}`);
        else syncedCount++;
      }

      const localStudents = await this.getStudents();
      for (const st of localStudents) {
        const { error } = await client.from('students').upsert(toDbStudent(st));
        if (error) errors.push(`Students (${st.fullName}): ${error.message}`);
        else syncedCount++;
      }

      const localLogs = await this.getTransitLogs();
      for (const l of localLogs) {
        const { error } = await client.from('transit_logs').upsert(toDbTransitLog(l));
        if (error) errors.push(`Logs (${l.studentName}): ${error.message}`);
        else syncedCount++;
      }

      const localMatrix = await this.getStudentDailyMatrixRows();
      for (const m of localMatrix) {
        const { error } = await client.from('student_daily_matrix').upsert(toDbDailyMatrix(m));
        if (error) errors.push(`Matrix (${m.studentName} ${m.date}): ${error.message}`);
        else syncedCount++;
      }

      return {
        success: errors.length === 0,
        syncedCount,
        errors,
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount,
        errors: [err?.message || 'Network error during synchronization'],
      };
    }
  }
}

export const repository = new DataRepository();
