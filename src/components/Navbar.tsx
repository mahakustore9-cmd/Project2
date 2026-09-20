import React from 'react';
import { UserAccount, School } from '../types';
import { usePWAInstall } from './usePWAInstall';
import { playSuperTuneChime, speakHindiVoice } from '../services/audio';
import {
  ShieldCheck,
  LogOut,
  Download,
  Volume2,
  FileCode2,
  UserCheck,
  GraduationCap,
  Shield,
  HeartHandshake,
  Crown,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount | null;
  activeSchool: School | null;
  onLogout: () => void;
  onOpenPRD: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeSchool,
  onLogout,
  onOpenPRD,
  onOpenLoginModal,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();

  const handleTestSound = async () => {
    await playSuperTuneChime();
    await speakHindiVoice('Dhyan dein, aapka bachcha school pahunch gaya hai.');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: Crown };
      case 'admin':
        return { label: 'School Admin', bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: ShieldCheck };
      case 'teacher':
        return { label: 'Class Teacher', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: GraduationCap };
      case 'guard':
        return { label: 'Gate Guard', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Shield };
      case 'parent':
        return { label: 'Parent Portal', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: HeartHandshake };
      default:
        return { label: 'Guest', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: UserCheck };
    }
  };

  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null;
  const RoleIcon = roleInfo?.icon || UserCheck;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                Student Tracking System
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                PWA Active
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
              {activeSchool?.name || 'Smart Safe Campus Pass'} • 5-Stage Transit Matrix
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound & Voice Test Button */}
          <button
            id="test-sound-btn"
            onClick={handleTestSound}
            title="Test Melodic Tune & Hindi Voice"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition text-xs font-semibold"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span className="hidden md:inline">Test Tune & Voice</span>
          </button>

          {/* PRD & SQL Modal Button */}
          <button
            id="open-prd-btn"
            onClick={onOpenPRD}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition text-xs font-semibold"
          >
            <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">PRD & SQL</span>
          </button>

          {/* In-App PWA Install Button */}
          {isInstallable && (
            <button
              id="install-pwa-btn"
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* User Profile / Login state */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {currentUser.fullName}
                </span>
                <span className={`inline-flex items-center gap-1 self-end px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo?.bg}`}>
                  <RoleIcon className="w-3 h-3" />
                  {roleInfo?.label}
                </span>
              </div>
              <button
                id="logout-btn"
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="login-btn"
              onClick={onOpenLoginModal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition"
            >
              Login Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
