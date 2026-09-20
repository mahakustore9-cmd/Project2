import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface LoginModalProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLoginSuccess,
  onClose,
  isFullPage = false,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Kripya apna User ID aur Password dono darj karein.');
      setIsSubmitting(false);
      return;
    }

    // Strict authentication against database user accounts
    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUser &&
        u.password === cleanPass
    );

    if (matched) {
      // Save authenticated session if rememberMe is enabled
      if (rememberMe) {
        localStorage.setItem(
          'vsk_auth_session',
          JSON.stringify({
            userId: matched.id,
            username: matched.username,
            role: matched.role,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        sessionStorage.setItem(
          'vsk_auth_session',
          JSON.stringify({
            userId: matched.id,
            username: matched.username,
            role: matched.role,
            timestamp: new Date().toISOString(),
          })
        );
      }

      onLoginSuccess(matched);
      if (onClose) onClose();
    } else {
      setErrorMessage(
        'Galat User ID ya Password! Sirf authorized school admin, teachers, guards ya registered parents hi login kar sakte hain.'
      );
    }
    setIsSubmitting(false);
  };

  const formContent = (
    <div className="relative w-full max-w-md rounded-3xl bg-white p-7 sm:p-9 shadow-2xl border border-slate-100 transition-all">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-800 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-3 border border-white/20">
          <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Vidyarthi Suraksha Kawach
        </h2>
        <p className="text-xs font-semibold text-blue-700 mt-1 uppercase tracking-wider">
          Authorized Secure Login Portal
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Kripya apna official school / parent credentials darj karein
        </p>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Real Production Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            User ID / Login Username
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="login-username-input"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. schooladmin, teacher5, parentaarav"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-sm transition font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            Secret Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your confidential password"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-sm transition font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Remember login on this device</span>
          </label>
        </div>

        <button
          id="submit-login-btn"
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 hover:from-blue-800 hover:to-indigo-800 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Authenticating...' : 'Secure Login'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Security & Access Protection Notice */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multi-Role Access Control • 256-bit Encrypted</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Confidential Portal: Sirf Supabase database me registered authorized users hi login kar sakte hain.
        </p>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4">
        {formContent}
      </div>
    );
  }

  return (
    <div
      id="login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      {formContent}
    </div>
  );
};
