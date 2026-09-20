export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'guard' | 'parent';

export type TransitStage = 
  | 'LEFT_HOME'            // Stage 1: Parent scans when leaving home
  | 'REACHED_SCHOOL_GATE' // Stage 2: Gate Guard scans when reaching school gate
  | 'ENTERED_CLASS'       // Stage 3: Class Teacher scans when student enters classroom
  | 'EXIT_SCHOOL_GATE'    // Stage 4: Gate Guard scans when exiting school gate
  | 'REACHED_HOME';       // Stage 5: Parent scans when reaching home safely

export type StudentClass = 
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10'
  | 'Class 11'
  | 'Class 12';

export const ALL_CLASSES: StudentClass[] = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4',
  'Class 5', 'Class 6', 'Class 7', 'Class 8',
  'Class 9', 'Class 10', 'Class 11', 'Class 12'
];

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  schoolId: string;
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
  phone: string;
  assignedClass?: StudentClass; // For teachers
  studentId?: string;           // For parents (linked student)
  createdAt: string;
}

export interface Student {
  id: string;
  schoolId: string;
  studentId: string;          // e.g. STU-2026-101
  fullName: string;
  studentClass: StudentClass;
  rollNumber: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  photoUrl: string;           // Compressed to <= 350KB
  address: string;
  
  // Parents details
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentLoginId: string;
  parentPassword: string;
  
  // Emergency
  emergencyContact: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface TransitLog {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: StudentClass;
  schoolId: string;
  stage: TransitStage;
  timestamp: string;          // ISO string
  scannedByRole: UserRole;
  scannedByName: string;
  scannedById: string;
  isManualEntry?: boolean;
  manualNotes?: string;
  locationLabel?: string;
}

export interface DailyMatrixRecord {
  date: string;               // YYYY-MM-DD
  leftHome?: { time: string; scannedBy: string };
  reachedSchoolGate?: { time: string; scannedBy: string };
  enteredClass?: { time: string; scannedBy: string };
  exitSchoolGate?: { time: string; scannedBy: string };
  reachedHome?: { time: string; scannedBy: string };
  currentStage: TransitStage | 'NOT_STARTED';
  isComplete: boolean;
}

/**
 * Exact 1 Row Per Student Per Day Matrix Database Table
 * Database Table: student_daily_matrix
 * Rule: 1 student ka per day 1 single row banti hai,
 * aur har stage scan par usi row me timestamp update hota hai!
 */
export interface StudentDailyMatrixRow {
  id: string;                         // Unique composite key: "matrix_{studentId}_{date}"
  date: string;                       // YYYY-MM-DD
  schoolId: string;
  studentId: string;
  studentName: string;
  studentClass: StudentClass;
  stage1LeftHomeTime?: string;        // e.g. "07:25 AM"
  stage1LeftHomeBy?: string;          // e.g. "Parent (Manoj Kumar)"
  stage2GateInTime?: string;          // e.g. "07:55 AM"
  stage2GateInBy?: string;            // e.g. "Gate Guard 1"
  stage3ClassInTime?: string;         // e.g. "08:10 AM"
  stage3ClassInBy?: string;           // e.g. "Teacher (Mrs. Sharma)"
  stage4GateOutTime?: string;         // e.g. "02:30 PM"
  stage4GateOutBy?: string;           // e.g. "Gate Guard 1"
  stage5HomeArrivalTime?: string;     // e.g. "03:05 PM"
  stage5HomeArrivalBy?: string;       // e.g. "Parent (Manoj Kumar)"
  currentStage: TransitStage | 'NOT_STARTED' | 'COMPLETED';
  status: 'PENDING' | 'IN_TRANSIT_TO_SCHOOL' | 'IN_CLASS' | 'IN_TRANSIT_TO_HOME' | 'SAFELY_HOME';
  updatedAt: string;
}

export interface VoiceAlertPayload {
  id: string;
  studentId: string;
  studentName: string;
  stage: TransitStage;
  messageHindi: string;
  timestamp: string;
}
