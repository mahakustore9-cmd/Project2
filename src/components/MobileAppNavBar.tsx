import React from 'react';
import { UserAccount, UserRole } from '../types';
import {
  Home,
  QrCode,
  Calendar,
  Volume2,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface MobileAppNavBarProps {
  currentUser: UserAccount | null;
  activeTab?: string;
  onSelectTab: (tab: string) => void;
  onOpenScanner: () => void;
  onTriggerVoiceTest: () => void;
  onLogout: () => void;
}

export const MobileAppNavBar: React.FC<MobileAppNavBarProps> = ({
  currentUser,
  activeTab = 'home',
  onSelectTab,
  onOpenScanner,
  onTriggerVoiceTest,
  onLogout,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1 pb-safe shadow-[0_-8px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home / Portal */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'home'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Home</span>
        </button>

        {/* 2. 1-Row-Per-Day Matrix */}
        <button
          onClick={() => onSelectTab('matrix')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            activeTab === 'matrix'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] tracking-tight mt-0.5">Matrix</span>
        </button>

        {/* 3. Center Elevated Floating QR Scanner Button */}
        <div className="-mt-5 flex flex-col items-center">
          <button
            id="mobile-center-scan-btn"
            onClick={onOpenScanner}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition-transform border-3 border-white ring-2 ring-blue-500/30"
            title="Scan Student QR Code"
          >
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-black text-blue-700 tracking-tight mt-1">Scan QR</span>
        </div>

        {/* 4. Voice Test Audio Alert */}
        <button
          onClick={onTriggerVoiceTest}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-amber-600 transition"
          title="Test Hindi Voice & Alarm Loop"
        >
          <div className="relative">
            <Volume2 className="w-5 h-5 stroke-[2.2] text-amber-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Voice</span>
        </button>

        {/* 5. Secure Logout */}
        <button
          onClick={() => {
            if (window.confirm('Kya aap logout karna chahte hain?')) {
              onLogout();
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-rose-600 transition"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-slate-400 hover:text-rose-600" />
          <span className="text-[10px] tracking-tight mt-0.5 font-medium text-slate-500">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
};
