import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA, SUPABASE_URL, SUPABASE_ANON_KEY } from '../services/supabase';
import { X, Copy, Check, ShieldCheck, FileText, Terminal, Lock, Rocket, Database, HelpCircle } from 'lucide-react';

interface PRDAndSecurityModalProps {
  onClose: () => void;
}

export const PRDAndSecurityModal: React.FC<PRDAndSecurityModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'prd' | 'prompt' | 'sql' | 'security' | 'deploy'>('prd');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MASTER_PROMPT = `Build a high-precision, production-grade PWA "Student Tracking System (Vidyarthi Suraksha Kawach)" with Supabase persistence, multi-role single login form, printable QR ID cards, client-side <=350KB photo compression, 5-stage transit matrix, and continuous Hindi voice alerts with a Web Audio API melodic chime that repeats until acknowledged with OK.

Architecture Requirements:
1. Roles (Single Login Form):
   - Super Admin: Multi-school provisioning and global oversight.
   - School Admin: Student CRUD, Photo upload <=350KB, Auto QR ID Card, WhatsApp credential sharing, Manual transit logs fallback.
   - Class Teacher: Selects assigned Class (Class 1 to 12), views class roster, scans Class Entry.
   - Gate Guard: Fast toggling between Gate Entry In and Gate Exit Out with live camera scanner.
   - Parent: Restricted view of own child only, 5-day transit matrix table, Departure & Arrival home scan, real-time voice alarm with OK dismiss.

2. 5-Stage Transit Lifecycle:
   - Stage 1 (Parent): LEFT_HOME ("Ghar se nikal chuka hai")
   - Stage 2 (Guard): REACHED_SCHOOL_GATE ("School gate pahunch gaya")
   - Stage 3 (Teacher): ENTERED_CLASS ("Class me pahunch gaya")
   - Stage 4 (Guard): EXIT_SCHOOL_GATE ("School gate se nikal chuka hai")
   - Stage 5 (Parent): REACHED_HOME ("Ghar pahunch gaya")

3. Voice & Audio Engine:
   - Web Audio API crystal-clear 4-tone chime
   - Web Speech Synthesis in Hindi ("Aapka bachcha {Name} school pahunch gaya hai")
   - Persistent alarm loop until parent taps OK.`;

  return (
    <div id="prd-security-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-base font-bold">System PRD, Prompt, Database & Security Guide</h2>
              <p className="text-xs text-slate-400">Complete documentation requested by client</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('prd')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'prd'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" /> 1. Complete PRD
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'prompt'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" /> 2. Master Prompt
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" /> 3. Supabase SQL Schema
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" /> 4. Security Hardening
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'deploy'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Rocket className="w-4 h-4" /> 5. Deployment Guide
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-sm leading-relaxed space-y-4">
          {activeTab === 'prd' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="text-base font-bold text-blue-900">Project Name: Smart Student Transit Safety System</h3>
                <p className="text-xs text-blue-700 mt-1">
                  PWA-enabled, 5-stage QR transit lifecycle tracker with automated WhatsApp communication, audio synthesis, and cloud persistence.
                </p>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">1. Target Personas & Unified Authentication</h4>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Super Admin:</strong> Manages school onboarding, global administrative settings.</li>
                <li><strong>School Admin:</strong> Manages students, creates ID cards, creates login credentials for teachers/guards/parents, WhatsApp delivery, manual overrides.</li>
                <li><strong>Gate Guard:</strong> High-throughput camera scanner toggled between Gate-In and Gate-Out.</li>
                <li><strong>Class Teacher:</strong> Class-filtered roster (Classes 1–12), class attendance scanner.</li>
                <li><strong>Parent:</strong> Strictly isolated view of own child's status, 5-day transit matrix, voice alert with persistent OK dismissal.</li>
              </ul>

              <h4 className="font-bold text-slate-900 text-sm">2. Five-Stage Transit State Machine</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="font-bold text-amber-800">Stage 1: Left Home</p>
                  <p className="text-slate-600 mt-1">Actor: Parent</p>
                  <p className="text-[11px] text-slate-500">Scanned before bus/commute</p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="font-bold text-blue-800">Stage 2: School Gate In</p>
                  <p className="text-slate-600 mt-1">Actor: Guard</p>
                  <p className="text-[11px] text-slate-500">Physical gate crossing verification</p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                  <p className="font-bold text-indigo-800">Stage 3: Class In</p>
                  <p className="text-slate-600 mt-1">Actor: Teacher</p>
                  <p className="text-[11px] text-slate-500">Classroom seated attendance</p>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="font-bold text-purple-800">Stage 4: School Gate Out</p>
                  <p className="text-slate-600 mt-1">Actor: Guard</p>
                  <p className="text-[11px] text-slate-500">School dismissal gate exit</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="font-bold text-emerald-800">Stage 5: Reached Home</p>
                  <p className="text-slate-600 mt-1">Actor: Parent</p>
                  <p className="text-[11px] text-slate-500">Safe arrival verification</p>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">3. Key Constraints Enforced</h4>
              <ul className="list-disc pl-5 text-xs space-y-1">
                <li><strong>Max Photo Size:</strong> Strictly compressed to &le; 350KB on client-side canvas before transmission.</li>
                <li><strong>Continuous Alarm:</strong> Web Audio chime & Hindi speech repeat until parent presses "OK / Acknowledge".</li>
                <li><strong>Manual Entry Control:</strong> Only Admin can record manual logs; Guards & Teachers restricted to QR scanning.</li>
                <li><strong>Privacy:</strong> Parents cannot see other students' records or school rosters.</li>
              </ul>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700">Master Prompt for Exact Reproduction:</p>
                <button
                  onClick={() => copyToClipboard(MASTER_PROMPT, setCopiedPrompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
                {MASTER_PROMPT}
              </pre>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Supabase SQL Migration Script</p>
                  <p className="text-[11px] text-slate-500">
                    Project URL: <span className="font-mono text-blue-600">{SUPABASE_URL}</span>
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA, setCopiedSQL)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSQL ? 'Copied SQL!' : 'Copy SQL Schema'}
                </button>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                👉 <strong>How to run:</strong> Open your Supabase Dashboard at{' '}
                <a
                  href="https://supabase.com/dashboard/project/aitlkrtkusnimlkchhye/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold text-blue-700"
                >
                  Supabase SQL Editor
                </a>
                , click "New Query", paste this SQL, and click "Run".
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  Production Security Recommendations (Secure Kese Bnaye)
                </h4>
                <p className="text-emerald-800 mt-1">
                  Follow these 5 core security controls to protect student data and prevent unauthorized attendance tampering.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">1. Row Level Security (RLS) on Supabase</h5>
                  <p className="text-slate-600 mt-1">
                    Ensure RLS is enabled on all tables (`students`, `transit_logs`, `user_accounts`). Replace anon-key demo policies with authenticated JWT policies matching `auth.uid() = student_id` or `role = 'admin'` for production.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">2. Anti-Tamper Signed QR Codes</h5>
                  <p className="text-slate-600 mt-1">
                    Instead of plain student IDs, embed an HMAC-SHA256 signature in the QR payload using a secret school key:
                    <code className="block bg-slate-100 p-1.5 mt-1 rounded font-mono text-[11px]">
                      hash = HMAC(studentId + schoolId + issueTimestamp, SECRET_KEY)
                    </code>
                    This prevents parents or students from generating duplicate QR codes.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">3. Camera Frame Rate & Scan De-bouncing</h5>
                  <p className="text-slate-600 mt-1">
                    The camera scanner enforces a 3-second debounce cooldown per student ID to prevent accidental double-logging when students queue up at the gate.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">4. HTTPS & PWA Security Headers</h5>
                  <p className="text-slate-600 mt-1">
                    Ensure Content-Security-Policy (CSP) allows camera access only on origin domain (`camera 'self'`), and require strict SSL/TLS certificates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-blue-700" />
                  Deployment Steps (Kaise Deploy Karein)
                </h4>
                <p className="text-blue-800 mt-1">
                  Your application is pre-configured with Vite PWA, service workers, and Cloud Run production readiness.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">Step 1: One-Click Cloud Run Deploy</h5>
                  <p className="text-slate-600 mt-1">
                    In Google AI Studio, click the <strong>Deploy</strong> button at the top right. The container will automatically build with `NODE_ENV=production` and launch with instant global HTTPS.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">Step 2: Install as Native App on Android / iOS</h5>
                  <p className="text-slate-600 mt-1">
                    - <strong>Android (Chrome):</strong> Tap the in-app "Install App" button or tap Chrome menu (3 dots) &rarr; "Add to Home screen".<br />
                    - <strong>iPhone (Safari):</strong> Tap the Share button &rarr; "Add to Home Screen". The app will launch standalone without browser bars.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <h5 className="font-bold text-slate-900">Step 3: Connect Live Supabase Tables</h5>
                  <p className="text-slate-600 mt-1">
                    Execute the SQL Schema from Tab #3 in your Supabase SQL editor so all transit logs persist permanently in the cloud.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
